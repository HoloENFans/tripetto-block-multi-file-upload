const fs = require("fs");
const path = require("path");
const po2json = require("po2json");
const prettier = require("prettier");

fs.mkdirSync("./translations/", { recursive: true });

function convert(folder) {
    const files = fs.readdirSync(folder) || [];

    files.forEach(async function (file) {
        if (fs.statSync(folder + file).isFile()) {
            const isPO = file.lastIndexOf(".po") === file.length - 3;

            if (isPO) {
                fs.writeFileSync(
                    folder + path.basename(file, ".po") + ".json",
                    await prettier.format(
                        JSON.stringify(po2json.parseFileSync(folder + file)),
                        {
                            parser: "json",
                        }
                    ),
                    "utf8"
                );

                console.log(
                    `po2json: ${folder + file} -> ${
                        folder + path.basename(file, ".po") + ".json"
                    }`
                );
            }
        }
    });
}

convert("./translations/");
