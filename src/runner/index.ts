import { NodeBlock, Str, filter } from "@tripetto/runner";

export interface IMultiFileUpload {
    /** Maximum amount of files. */
    readonly maxFiles: number;

    /** Maximum file size in MiB. */
    readonly limit?: number;

    /** Comma separated list of allowed file extensions. */
    readonly extensions?: string;
}

export interface IFileUploadService {
    /** Fetch an attachment from the store. */
    readonly get: (file: string) => Promise<Blob>;

    /** Put an attachment in the store. */
    readonly put: (
        file: File,
        onProgress?: (percentage: number) => void
    ) => Promise<string>;

    /** Delete an attachment from the store. */
    readonly delete: (file: string) => Promise<void>;
}

export abstract class MultiFileUpload extends NodeBlock<IMultiFileUpload> {
    private cache: { [key: number]: string | undefined } = {};

    isUploading(i: number) {
        return (
            i > 0 &&
            i < this.props.maxFiles &&
            this.valueOf<string>(`file-${i}`)!.isAwaiting
        );
    }

    isImage(i: number) {
        if (i < 0 || i >= this.props.maxFiles) return false;

        const slot = this.valueOf<string>(`file-${i}`)!;

        return slot.hasValue && this.hasImageExtension(slot.value);
    }

    get maxFiles() {
        return this.props.maxFiles;
    }

    get limit() {
        return this.props.limit && this.props.limit > 0 ? this.props.limit : 50;
    }

    get allowedExtensions() {
        return filter(
            (this.props.extensions &&
                Str.replace(this.props.extensions.toLowerCase(), " ", "").split(
                    ","
                )) ||
                [],
            (extension) => extension.length >= 2 && extension.charAt(0) === "."
        );
    }

    private getExtension(fileName: string): string {
        const n = fileName.lastIndexOf(".");

        if (n !== -1 && n > 0) {
            return fileName.substr(n).toLowerCase();
        }

        return "";
    }

    private hasImageExtension(fileName: string): boolean {
        return (
            (fileName &&
                [".jpg", ".jpeg", ".png", ".gif", ".webp"].indexOf(
                    this.getExtension(fileName)
                ) > -1) ||
            false
        );
    }

    private hasValidFileSize(file: File): boolean {
        const maximumFileBytes = this.limit * 1024 * 1024;

        return file.size <= maximumFileBytes;

        return true;
    }

    private hasValidFileExtension(file: File): boolean {
        const fileExtension = this.getExtension(file.name);
        const allowedExtensions = this.allowedExtensions;

        if (allowedExtensions.length > 0) {
            return allowedExtensions.indexOf(fileExtension) > -1;
        }

        return true;
    }

    private convertToBase64(
        blob: Blob,
        done: (data: string) => void,
        progress?: (percentage: number) => void
    ): void {
        const reader = new FileReader();

        if (progress) {
            reader.onprogress = (event) =>
                progress((event.loaded / event.total) * 100);
        }

        reader.onload = () => {
            done(reader.result as string);
        };

        reader.readAsDataURL(blob);
    }

    async upload(
        files: FileList,
        service?: IFileUploadService,
        onProgress?: (percent: number) => void
    ): Promise<void> {
        const slots = Array.from(
            { length: this.props.maxFiles },
            (_, i) => this.valueOf<string>(`file-${i}`)!
        );
        const availableSlots = slots.filter((slot) => !slot.hasValue);

        if (files.length > availableSlots.length)
            return Promise.reject("invalid-amount");

        await Promise.all(
            Array.from({ length: files.length }, (_, i) => {
                return new Promise<void>(
                    (
                        resolve: () => void,
                        reject: (
                            error:
                                | "invalid-amount"
                                | "invalid-extension"
                                | "invalid-size"
                                | string
                        ) => void
                    ) => {
                        const file = files[i];

                        if (!this.hasValidFileExtension(file)) {
                            return reject("invalid-extension");
                        }

                        if (!this.hasValidFileSize(file)) {
                            return reject("invalid-size");
                        }

                        const slot = availableSlots[i];
                        slot.await();

                        if (service) {
                            service
                                .put(file, onProgress)
                                .then((id) => {
                                    slot.set(file.name, id);

                                    if (this.isImage(i)) {
                                        this.convertToBase64(file, (data) => {
                                            this.cache = data;

                                            resolve();
                                        });
                                    } else {
                                        resolve();
                                    }
                                })
                                .catch((error) => {
                                    slot.clear();

                                    reject(error);
                                });
                        } else {
                            this.convertToBase64(
                                file,
                                (data) => {
                                    slot.set(file.name, data);

                                    resolve();
                                },
                                onProgress
                            );
                        }
                    }
                );
            })
        );
    }

    download(i: number, service?: IFileUploadService): Promise<string> {
        return new Promise(
            (resolve: (data: string) => void, reject: () => void) => {
                if (this.cache && this.cache[i]) {
                    resolve(this.cache[i]!);
                }

                const slot = this.valueOf<string>(`file-${i}`)!;

                if (slot.reference) {
                    if (service) {
                        service
                            .get(slot.reference)
                            .then((blob) =>
                                this.convertToBase64(blob, (data) =>
                                    resolve(data)
                                )
                            )
                            .catch(() => {
                                slot.clear();

                                reject();
                            });
                    } else {
                        resolve(slot.reference);
                    }
                } else {
                    reject();
                }
            }
        );
    }

    delete(i: number, service?: IFileUploadService): Promise<void> {
        return new Promise((resolve: () => void, reject: () => void) => {
            const slot = this.valueOf<string>(`file-${i}`)!;

            if (slot.reference && service) {
                slot.await();

                service
                    .delete(slot.reference)
                    .then(() => {
                        delete this.cache[i];
                        slot.clear();

                        resolve();
                    })
                    .catch(() => {
                        slot.cancelAwait();

                        reject();
                    });
            } else {
                delete this.cache[i];
                slot.clear();

                resolve();
            }
        });
    }

    async clear(service?: IFileUploadService): Promise<void> {
        await Promise.all(
            Array.from({ length: this.props.maxFiles }, (_, i) =>
                this.delete(i, service)
            )
        );
    }
}
