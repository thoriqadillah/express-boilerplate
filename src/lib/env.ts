import { Parser, parse } from "./utils"

export interface Env {
    get(key: string): Parser
}

export const env: Env = {
    get(key: string): Parser {
        const v = process.env[key]
        return parse(v)
    }
}