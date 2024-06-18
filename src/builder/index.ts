/** Package information retrieved from `package.json` using webpack. */
declare const PACKAGE_NAME: string;
declare const PACKAGE_VERSION: string;

/** Dependencies */
import {
    affects,
    definition,
    editor,
    Forms,
    isNumberFinite,
    isString,
    NodeBlock,
    pgettext,
    Slots,
    slots,
    tripetto,
} from "@tripetto/builder";

/** Assets */
import ICON from "../../assets/icon.svg";

@tripetto({
    type: "node",
    identifier: PACKAGE_NAME,
    version: PACKAGE_VERSION,
    icon: ICON,
    label: "Multi file upload",
})
export class MultiFileUpload extends NodeBlock {
    @definition
    @affects('#slots')
    maxFiles!: number;

    @definition
    limit?: number;

    @definition
    extensions?: string;

    @slots
    defineSlots(): void {
        for (let i = this.maxFiles; i < this.slots.count; i++) {
            this.slots.delete(`file-${i}`);
        }

        for (let i = this.slots.count; i < this.maxFiles; i++) {
            this.slots.static({
                type: Slots.String,
                reference: `file-${i}`,
                label: 'File',
            });
        }
    }

    @editor
    defineEditor(): void {
        this.editor.name();
        this.editor.description();
        this.editor.explanation();

        this.editor.groups.settings();
        this.editor.option({
            name: 'File count',
            form: {
                title: 'Maximum file count',
                controls: [
                    new Forms.Numeric(Forms.Numeric.bind(this, 'maxFiles', 10, 10)),
                ],
            },
        });
        this.editor.option({
            name: pgettext("block:file-upload", "File size"),
            form: {
                title: pgettext("block:file-upload", "Maximum file size"),
                controls: [
                    new Forms.Numeric(
                        Forms.Numeric.bind(this, "limit", undefined, 1)
                    )
                        .min(1)
                        .suffix(" MiB"),
                ],
            },
            activated: isNumberFinite(this.limit),
        });
        this.editor.option({
            name: pgettext("block:file-upload", "File type"),
            form: {
                title: pgettext("block:file-upload", "Allowed file types"),
                controls: [
                    new Forms.Text(
                        "singleline",
                        Forms.Text.bind(this, "extensions", undefined)
                    ).placeholder(
                        pgettext(
                            "block:file-upload",
                            "Comma separated list, e.g. .png, .jpg"
                        )
                    ),
                ],
            },
            activated: isString(this.extensions),
        });
    }
}
