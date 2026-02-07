import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { runtimes } from "../config/runtimes.js";

let runningExecutions = 0;
const MAX_EXECUTIONS = 5;

export async function runCode(req, res) {
  const { language, code, input } = req.body;

  const runtime = runtimes[language];
  if (!runtime) return res.status(400).json({ error: "Unsupported language" });

  // Check capacity BEFORE creating any files -> avoid resource leak
  if (runningExecutions >= MAX_EXECUTIONS) {
    return res.status(503).json({
      error: "Execution capacity reached. Try again later.",
    });
  }

  const jobId = Date.now().toString();
  const jobDir = path.join("executions", jobId);

  const containerName = `job-${jobId}`;

  fs.mkdirSync("executions", { recursive: true }); //create the dir if it doesnt exist

  fs.mkdirSync(jobDir);
  fs.writeFileSync(path.join(jobDir, runtime.file), code);
  fs.writeFileSync(path.join(jobDir, "input.txt"), input || "");

  // --rm : runs a container and automatically removes it after execution
  // --cpus=1 : limits the container to use maximum 1 CPU core(prevents CPU exhaustion attacks)
  // --memory=256m : restricts memory to 256 MB (prevents memory bombs)
  // --pids-limit=64 : limits the number of processes to 64 (prevents fork bombs where a program spawns infinite processes)
  // -v ${process.cwd()}/${jobDir}:/app : mounts the job directory from the host into the container at /app, allowinf the container to access the user's code file
  // python-sandbox : the name of docker image to run(built from the dockerfile in the sandbox directory)

  //   const cmd = `
  // docker run --rm \
  // --cpus=1 \
  // --memory=256m \
  // --pids-limit=64 \
  // -v ${process.cwd()}/${jobDir}:/app \
  // python-sandbox
  // `;

  runningExecutions++;

  // Guard to prevent double-response errors 
  //(A double response error (ERR_HTTP_HEADERS_SENT) happens 
  // when two handlers both try to send an HTTP response to the same request.)
  let responded = false;

  const cleanup = () => {
    runningExecutions = Math.max(0, runningExecutions - 1);
  };

  const sendResponse = (statusCode, body) => {
    if (responded) return;
    responded = true;
    cleanup();
    clearTimeout(timer);
    fs.rmSync(jobDir, { recursive: true, force: true });
    res.status(statusCode).json(body);
  };

  //spawn doesnt take a single string, it takes command+array
  //   What spawn actually does?
  // Internally:
  // 1) Starts process directly (no shell)
  // 2) Streams stdout chunk-by-chunk
  // 3) Streams stderr chunk-by-chunk
  const child = spawn("docker", [
    "run",
    "--name",
    containerName,
    "--rm",
    "--cpus=1",
    "--memory=256m",
    "--pids-limit=64",
    "--network=none", // Disable network access
    "--cap-drop=ALL", // Drop all capabilities
    "--read-only", // Use a read-only filesystem
    "-v",
    `${process.cwd()}/${jobDir}:/app`,
    runtime.image,
  ]);

  child.on("error", () => {
    sendResponse(500, { error: "Failed to start execution container" });
  });

  let timedOut = false;
  const TIME_LIMIT = 2000; // ms
  //manual timeout kill - spawn doesnt have built-in timeout like exec
  const timer = setTimeout(() => {
    timedOut = true;
    spawn("docker", ["kill", containerName]); //docker kill <id>
  }, TIME_LIMIT);

  //exec - starts a shell
  //runs the command
  //buffers everything printed
  //returns err, stdout, stderr
  // exec(cmd, { timeout: 2000 }, (err, stdout, stderr) => {
  //   fs.rmSync(jobDir, { recursive: true, force: true });

  //   res.json({
  //     output: stdout,
  //     error: stderr,
  //   });
  // });

  let output = "";
  let error = "";

  child.stdout.on("data", (data) => {
    output += data.toString();
  });

  child.stderr.on("data", (data) => {
    error += data.toString();
  });

  child.on("close", () => {
    let status;

    if (timedOut) {
      status = "timeout";
    } else if (error.length > 0) {
      status = "runtime_error";
    } else {
      status = "success";
    }

    sendResponse(200, { status, stdout: output, stderr: error });
  });
}
