import { FormatRegistry, TObject } from "@sinclair/typebox";
import { Value } from '@sinclair/typebox/value'
import moment from "moment";
import { validate } from 'uuid'

FormatRegistry.Set('password', value => {
    if (value.length < 8 || value.length > 16) {
        return false
    }

    return /[0-9]/.test(value) && /[a-zA-Z]/.test(value) && /[A-Z]/.test(value)
})

FormatRegistry.Set('email', value => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
})

FormatRegistry.Set('domain', value => {
    return /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/.test(value)
})

FormatRegistry.Set('uuid', value => validate(value))

FormatRegistry.Set('uri', value => {
    return /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(value)
})

FormatRegistry.Set('date', value => {
    return moment(value, "DD-MM-YYYY hh:mm:ss").isValid()
})

export interface Validator {
    validate(): string[]
}

export function validateSchema<T extends TObject>(schema: T, data: any): string[] {
    return [...Value.Errors(schema, data)].map(el => `${el.message} of ${el.path}`)
}