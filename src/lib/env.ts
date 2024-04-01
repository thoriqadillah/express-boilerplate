import { Parser, parse } from "./parser"

export interface Env {
    get(key: string): Parser
}

export const env: Env = {
    get(key: string): Parser {
        const v = process.env[key]
        return parse(v)
    }
}