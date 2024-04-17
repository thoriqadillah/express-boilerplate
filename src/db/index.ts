export interface ConnectionOption {
    driver?: string
    database?: string
    host?: string
    user?: string
    password?: string
    port?: number
}

export interface Connection {
    open(): void
    close(): void
}

export { KyselyDatabase } from "./kysely"
export { Redis } from './redis'