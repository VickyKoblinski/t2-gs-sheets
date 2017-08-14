#!/usr/bin/env node --harmony
const fs = require("fs");
const Handlebars = require("handlebars");
const co = require("co");
const prompt = require("co-prompt");
const program = require("commander");
const chalk = require("chalk");
const pjson = require("./package.json");

program
  .version(pjson.version)
  .arguments("<file>")
  .action(file => {
    co(function*() {
      const magenta = chalk.bold.magenta;

      const wsdl = yield prompt(magenta("T2 WSDL: "));
      let version = yield prompt(magenta("T2 API Version (1.0): "));
      version = version.trim() === "" ? "1.0" : version;
      const username = yield prompt(magenta("T2 Username: "));
      const password = yield prompt.password(magenta("T2 Password: "));
      const sheetID = yield prompt(magenta("Google Spreadsheet ID: "));

      fs.readFile("./t2-template.js", "utf8", (err, data) => {
        if (err) {
          console.error(chalk.bold.red(err));
          console.error(chalk.bold.red(`Error opening template.`));
          process.exit(1);
        } else {
          const template = Handlebars.compile(data);
          const contents = template({
            wsdl,
            version,
            username,
            password,
            sheetID
          });

          fs.writeFile(file, contents, err => {
            if (err) {
              console.error(chalk.bold.red(err));
              console.error(chalk.bold.red(`Error writing to ${file}.`));
              process.exit(1);
            } else {
              console.log(chalk.bold.green(`Success! ${file} generated.`));
              process.exit();
            }
          });
        }
      });
    });
  })
  .parse(process.argv);
