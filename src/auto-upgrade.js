import fs from "fs";
import path from "path";
import chalk from "chalk";
import sha1 from "sha1";
import updatePackage from "./update-package";

/**
 * Let the user know that we are updating the file and copy the contents over.
 *
 * @param {String} name the name of the file
 * @param {String} data the data for the new file
 */
function replaceFile (name, data) {
  const filePath = getCurrentFilePath(name);
  console.log(chalk.yellow(`${name} file out of date.`));
  console.log(chalk.green(`Updating ${filePath}`));

  fs.writeFileSync(filePath, data);
}

/**
 * Get the path to the file in the current project's config folder.
 *
 * @param {String} name the file name we are looking for
 */
function getCurrentFilePath (name) {
  return path.join(process.cwd(), "src", "config", name);
}

module.exports = async function () {
  await updatePackage();

  // Make sure we are in a gluestick project
  try {
    fs.statSync(path.join(process.cwd(), ".gluestick"))
  }
  catch (e) {
    console.log(chalk.red("This does not appear to be a valid GlueStick project. Please run this command inside of a gluestick project"));
    process.exit();
  }

  // Compare contents of our hidden files, if they do not match up then auto
  // update
  [".entry.js", ".store.js"].forEach((fileName) => {
    const currentFile = fs.readFileSync(getCurrentFilePath(fileName));
    const currentSha = sha1(currentFile);

    const newFile = fs.readFileSync(path.join(__dirname, "..", "new", "src", "config", fileName), "utf8");
    const newSha = sha1(newFile);

    if (currentSha !== newSha) {
      replaceFile(fileName, newFile);
    }
  });

  // If there is no src/config/application.js file make one now (This is to upgrade apps created prior to 0.1.6)
  try {
    fs.statSync(path.join(process.cwd(), "src/config/application.js"))
  }
  catch (e) {
    const newApplicationConfigFile = fs.readFileSync(path.join(__dirname, "..", "new", "src", "config", "application.js"), "utf8");
    replaceFile("application.js", newApplicationConfigFile);
  }
};

