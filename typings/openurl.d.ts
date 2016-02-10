declare module "openurl" {
    export function open(url: string, callback?: (error: Error) => void);
}