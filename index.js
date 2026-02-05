import express from "express";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const app = express();
app.use(express.json());

const runtimes = {
  python: {
    image: "python-sandbox",
    file: "main.py",
  },
};

app.post("/run", (req, res) => {
  const { language, code } = req.body;

  const runtime = runtimes[language];
  if (!runtime) return res.status(400).json({ error: "Unsupported language" });

  const jobId = Date.now().toString();
  const jobDir = path.join("executions", jobId);

  fs.mkdirSync(jobDir);
  fs.writeFileSync(path.join(jobDir, runtime.file), code);

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

  //spawn doesnt take a single string, it takes command+array
  //   What spawn actually does?
  // Internally:
  // 1) Starts process directly (no shell)
  // 2) Streams stdout chunk-by-chunk
  // 3) Streams stderr chunk-by-chunk
  const child = spawn("docker", [
    "run",
    "--rm",
    "--cpus=1",
    "--memory=256m",
    "--pids-limit=64",
    "-v",
    `${process.cwd()}/${jobDir}:/app`,
    runtime.image,
  ]);

  let timedOut = false;
  const TIME_LIMIT = 2000; // ms
  //manual timeout kill - spawn doesnt have built-in timeout like exec
  const timer = setTimeout(() => {
    timedOut = true;
    child.kill("SIGKILL");
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

    clearTimeout(timer);

    fs.rmSync(jobDir, { recursive: true, force: true });
    res.json({ status, output, error });
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
