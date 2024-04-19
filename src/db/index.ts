import { Closable } from "@/lib/graceful"

export interface ConnectionOption {
    driver?: string
    database?: string
    host?: string
    user?: string
    password?: string
    port?: number
}

export interface Connection extends Closable {
    open(): void
}

export { KyselyDatabase } from "./kysely"
export { Redis } from './redis'