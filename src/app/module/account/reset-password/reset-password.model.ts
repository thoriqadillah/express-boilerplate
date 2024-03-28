import { Validator, validateSchema } from "@/lib/validator"
import { Static, Type } from "@sinclair/typebox"
import { Selectable } from "kysely"
import { ResetPasswords } from 'kysely-codegen'

export type ResetPassword = Selectable<ResetPasswords>

const createResetPasswordSchema = Type.Object({
    email: Type.String({ format: 'email' }),
    redirect: Type.String(),
})

export type CreateResetPassword = Static<typeof createResetPasswordSchema>

export function resetPassword(data: any): Validator {
    return {
        validate: () => validateSchema(createResetPasswordSchema, data)
    }
}

export default {
    resetPassword
}