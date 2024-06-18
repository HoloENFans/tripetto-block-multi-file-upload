const webpack = require("webpack");
const webpackTerser = require("terser-webpack-plugin");
const webpackShell = require("webpack-shell-plugin-next");
const webpackLiveReload = require("webpack-livereload-plugin");
const path = require("path");
const banner = require("./tasks/banner/banner.js");
const package = require("./package.json");
const analyzer = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

const config = (type, target, test) => {
    return {
        target: ["web", "es5"],
        entry: `./src/${type}/index.ts`,
        output: {
            filename: "index.js",
            path: path.resolve(
                __dirname,
                type,
                (target !== "umd" && target) || ""
            ),
            library:
                target === "umd"
                    ? {
                          name: (
                              package.name.substr(1).replace("/", "-") +
                              ((type === "builder" && "-builder") || "")
                          )
                              .split("-")
                              .map(
                                  (s) => s.charAt(0).toUpperCase() + s.substr(1)
                              )
                              .join(""),
                          type: "umd",
                          umdNamedDefine: true,
                      }
                    : {
                          type: "commonjs2",
                      },
            globalObject:
                (type === "runner" && target === "umd" && "this") || undefined,
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: "ts-loader",
                    options: {
                        compilerOptions: {
                            noEmit: false,
                            noUnusedLocals: false,
                            target: "ES5",
                            module: "CommonJS",
                        },
                        configFile:
                            type === "runner"
                                ? "tsconfig.runner.json"
                                : "tsconfig.json",
                    },
                },
                {
                    test: /\.svg$/,
                    use: ["url-loader", "image-webpack-loader"],
                },
            ],
        },
        resolve: {
            extensions: [".ts", ".js"],
        },
        externals: {
            "@tripetto/builder":
                target === "umd" ? "Tripetto" : "commonjs @tripetto/builder",
            "@tripetto/runner":
                target === "umd"
                    ? "TripettoRunner"
                    : "commonjs @tripetto/runner",
        },
        optimization: {
            minimizer: [
                new webpackTerser({
                    terserOptions: {
                        format: {
                            preamble: `/*! ${banner} */`,
                            comments: false,
                        },
                    },
                    extractComments: false,
                }),
            ],
        },
        plugins: [
            new webpack.DefinePlugin({
                PACKAGE_NAME: JSON.stringify(package.name),
                PACKAGE_VERSION: JSON.stringify(package.version),
            }),
            ...(type === "builder" && target === "umd"
                ? [
                      new webpackShell({
                          onBuildStart: {
                              scripts: ["npm run make:po2json"],
                              blocking: true,
                              parallel: false,
                          },
                          onBuildEnd: {
                              scripts: ["npm run pot"],
                              blocking: false,
                              parallel: true,
                          },
                          dev: false,
                      }),
                      new webpackLiveReload({
                          appendScriptTag: true,
                      }),
                  ]
                : []),
            ...(!test
                ? [
                      new analyzer({
                          analyzerMode: "static",
                          reportFilename: `../${
                              target !== "umd" ? "../" : ""
                          }reports/bundle-${type}-${target}.html`,
                          openAnalyzer: false,
                      }),
                  ]
                : []),
        ],
    };
};

module.exports = (env, argv) => {
    return [
        config("builder", "umd", argv.mode !== "production"),
        ...(argv.mode === "production"
            ? [
                  config("builder", "es5"),
                  config("runner", "umd"),
                  config("runner", "es5"),
              ]
            : []),
    ];
};
