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
  },
};

app.post("/run", (req, res) => {
  const { code } = req.body;
  fs.writeFileSync("main.py", code); //use sync to block further code exec untill the code is fully written
  //exec - starts a shell
  //runs the command
  //buffers everything printed
  //returns err, stdout, stderr
  exec("python3 main.py", (err, stdout, stderr) => {
    res.json({
      output: stdout,
      error: stderr,
    });
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
