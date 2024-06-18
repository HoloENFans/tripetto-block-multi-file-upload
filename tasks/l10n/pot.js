const fs = require("fs");
const tripetto = require("@tripetto/builder");
const package = require("../../package.json");
let pot = fs.readFileSync("./translations/template.pot", "utf-8");

pot = tripetto.Str.replace(
    pot,
    `# SOME DESCRIPTIVE TITLE.`,
    `# ${package.title}`
);
pot = tripetto.Str.replace(
    pot,
    `# Copyright (C) YEAR THE PACKAGE'S COPYRIGHT HOLDER`,
    `# Copyright (C) ${new Date().getFullYear()} Tripetto B.V.`
);
pot = tripetto.Str.replace(
    pot,
    `# This file is distributed under the same license as the PACKAGE package.\n`,
    ""
);
pot = tripetto.Str.replace(pot, `# FIRST AUTHOR <EMAIL@ADDRESS>, YEAR.\n`, "");
pot = tripetto.Str.replace(
    pot,
    `"Report-Msgid-Bugs-To: \\n"`,
    `"Report-Msgid-Bugs-To: support@tripetto.com\\n"`
);
pot = tripetto.Str.replace(
    pot,
    `"Language-Team: LANGUAGE <LL@li.org>\\n"\n`,
    ""
);
pot = tripetto.Str.replace(pot, `"Language: \\n"`, `"Language: en\\n"`);
pot = tripetto.Str.replace(
    pot,
    `"Project-Id-Version: PACKAGE VERSION\\n"`,
    `"Project-Id-Version: ${package.name} ${package.version}\\n"`
);
pot = tripetto.Str.replace(
    pot,
    `"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n"`,
    `"Last-Translator: ${package.author.name} <${package.author.email}>\\n"`
);
pot = tripetto.Str.replace(
    pot,
    `"Content-Type: text/plain; charset=CHARSET\\n"`,
    `"Content-Type: text/plain; charset=UTF-8\\n"`
);

fs.writeFileSync("./translations/template.pot", pot, "utf8");
