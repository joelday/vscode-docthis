declare module SerializeError {
    export interface serializeError {
        (error: Error): string;
    }
}

declare module "serialize-error" {
    var serializeError: SerializeError.serializeError;
    export = serializeError;
}