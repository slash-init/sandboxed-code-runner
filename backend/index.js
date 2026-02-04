import express from "express";
import fs from "fs";
import { exec } from "child_process";

const app = express();
app.use(express.json());

const languageConfig = {
  python: {
    fileName: "main.py",
    run: "python3 main.py",
  },

  js: {
    fileName: "main.js",
    run: "node main.py",
  },

  java: {
    fileName: "Main.java",
    compile: "javac Main.java",
    run: "java Main",
  },

  cpp: {
    fileName: "main.cpp",
    compile: "g++ main.cpp -o main",
    run: "./main",
  },
};

app.post("/run", (req, res) => {
  const { language, code } = req.body;

  if (!languageConfig[language]) {
    return res.status(400).json({
      error: "Unsupported language",
    });
  }

  if (!code) {
    return res.status(400).json({
      error: "No code provided",
    });
  }

  const config = languageConfig[language];

  //Write code to file
  fs.writeFileSync(config.fileName, code); //use sync to block further code exec untill the code is fully written

  let command = ""; //Build command

  if (config.compile) {
    command = `${config.compile} && ${config.run}`;
  } else {
    command = config.run;
  }

  //exec - starts a shell
  //runs the command
  //buffers everything printed
  //returns err, stdout, stderr
  exec(command, (err, stdout, stderr) => {
    res.json({
      output: stdout,
      error: stderr,
    });
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
