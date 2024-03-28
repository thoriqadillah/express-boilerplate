import { Validator, validateSchema } from "@/lib/validator";
import { Static, Type } from "@sinclair/typebox";

const exampleSchema = Type.Object({
    foo: Type.String({
        minLength: 2,
        title: 'foo'
    }),
    bar: Type.Number({
        minimum: 1,
        title: 'bar'
    })
})

export type Example = Static<typeof exampleSchema>

export function example(data: any): Validator {
    return {
        validate: () => validateSchema(exampleSchema, data)
    }
}

export default {
    example
}