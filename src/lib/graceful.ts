export interface Initable {
    init(...args: any[]): void
}

export interface Closable {
    close(...args: any[]): void
}

export function initable(obj: any): obj is Initable {
    return 'init' in obj
}

export function closable(obj: any): obj is Closable {
    return 'close' in obj
}