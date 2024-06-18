const fs = require("fs");
const tripetto = require("@tripetto/builder");
const ignore = [];

fs.mkdirSync("./translations/", { recursive: true });

function sources(path) {
    const files = fs.readdirSync(path) || [];
    let r = "";

    files.forEach(function (file) {
        if (fs.statSync(path + file).isDirectory()) {
            r += sources(path + file + "/");
        } else if (fs.statSync(path + file).isFile()) {
            const isSource =
                file.lastIndexOf(".ts") === file.length - 3 ||
                file.lastIndexOf(".tsx") === file.length - 4;
            const isDefinition = file.lastIndexOf(".d.ts") === file.length - 5;

            if (
                isSource &&
                !isDefinition &&
                !tripetto.findFirst(
                    ignore,
                    (i) => (path + file).indexOf(i) === 0
                )
            ) {
                r += path + file + "\n";
            }
        }
    });

    return r;
}

fs.writeFileSync("./translations/sources", sources("./src/"), "utf8");
