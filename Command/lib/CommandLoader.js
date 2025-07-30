import fs from "fs";
import path from "path";

export function loadCommands(dirPath = "./commands") {
  const commands = new Map();

  function readCommands(folder) {
    const files = fs.readdirSync(folder);

    for (const file of files) {
      const fullPath = path.join(folder, file);

      if (fs.statSync(fullPath).isDirectory()) {
        readCommands(fullPath); // recursive folder scan
      } else if (file.endsWith(".js")) {
        const cmd = require(`../${fullPath}`);
        const name = path.basename(file, ".js");
        commands.set(name, cmd);
      }
    }
  }

  readCommands(dirPath);
  return commands;
}
