import { MultiFileUpload } from "../runner/esm/index.mjs";
import "../builder/esm/index.mjs";

try {
    if (typeof MultiFileUpload === "undefined") {
        throw new Error();
    }
} catch(e) {
    throw new Error("ESM module failed!");
}
