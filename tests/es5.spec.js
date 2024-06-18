try {
    const lib = require("../runner/es5/index.js");

    if (typeof lib.MultiFileUpload === "undefined") {
        throw new Error();
    }
} catch (e) {
    throw new Error("ES5 runner library test failed!");
}

try {
    const lib = require("../builder/es5/index.js");

    if (typeof lib === "undefined") {
        throw new Error();
    }
} catch (e) {
    throw new Error("ES5 builder library test failed!");
}
