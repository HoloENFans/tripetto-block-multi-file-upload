import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import { visualizer } from "rollup-plugin-visualizer";
import replace from "@rollup/plugin-replace";
import pkg from "./package.json";
import imagemin from "imagemin";

const replacePlugin = replace({
    preventAssignment: true,
    values: {
        PACKAGE_NAME: JSON.stringify(pkg.name),
        PACKAGE_VERSION: JSON.stringify(pkg.version),
    },
});

const typescriptPlugin = typescript({
    target: "ES6",
    module: "ES6",
    removeComments: true,
});

const terserPlugin = terser({
    format: {
        preamble: `/*! ${require("./tasks/banner/banner.js")} */`,
        comments: false,
    },
});

const onwarn = (warning, rollupWarn) => {
    if (warning.code !== "CIRCULAR_DEPENDENCY") {
        rollupWarn(warning);
    }
};

export default [
    {
        input: ["./src/builder/index.ts"],
        output: [
            {
                file: "./builder/esm/index.mjs",
                format: "esm",
                exports: "named",
            },
        ],
        external: [
            "@tripetto/builder"
        ],
        plugins: [
            replacePlugin,
            typescriptPlugin,
            terserPlugin,
            visualizer({
                filename: "./reports/bundle-builder-esm.html",
            }),
            {
                name: "svg",
                transform: (code, id) =>
                    id.endsWith(".svg") &&
                    imagemin
                        .buffer(Buffer.from(code), {
                            plugins: [
                                require("imagemin-svgo")(),
                            ],
                        })
                        .then((data) => ({
                            map: { mappings: "" },
                            code: `export default "data:image/svg+xml;base64,${Buffer.from(data).toString("base64")}"`,
                        })),
            },
        ],
        onwarn,
    },
    {
        input: ["./src/runner/index.ts"],
        output: [
            {
                file: "./runner/esm/index.mjs",
                format: "esm",
                exports: "named",
            },
        ],
        external: [
            "@tripetto/runner"
        ],
        plugins: [
            replacePlugin,
            typescriptPlugin,
            terserPlugin,
            visualizer({
                filename: "./reports/bundle-runner-esm.html",
            }),
        ],
        onwarn,
    },
];
