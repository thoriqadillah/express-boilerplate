import { Validator, validateSchema } from "@/lib/validator";
import { Type, Static } from "@sinclair/typebox";
import { Selectable } from "kysely"
import { Users } from "kysely-codegen"

export type User = Selectable<Users>

export interface AuthToken {
    token: string
    refreshToken: string
}

const registerSchema = Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String({ format: 'password' }),
    first_name: Type.String({ minLength: 2 }),
    last_name: Type.String({ minLength: 2 }),
})

export type Register = Static<typeof registerSchema>

export function register(data: any): Validator {
    return {
        validate: () => validateSchema(registerSchema, data)
    }
}

const loginSchema = Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String({ format: 'password' }),
})

export type Login = Static<typeof loginSchema>

export function login(data: any): Validator {
    return {
        validate: () => validateSchema(loginSchema, data)
    }
}

const updateProfileSchema = Type.Object({
    first_name: Type.Optional(Type.String({ minLength: 2 })),
    last_name: Type.Optional(Type.String({ minLength: 2 })),
    email: Type.Optional(Type.String({ format: 'email' })),
    title: Type.Optional(Type.String()),
    phone: Type.Optional(Type.String()),
    picture: Type.Optional(Type.String()),
})

export type UpdateProfile = Static<typeof updateProfileSchema>

export function updateProfile(data: any): Validator {
    return {
        validate: () => validateSchema(updateProfileSchema, data)
    }
}

const changePasswordSchema = Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String({ format: 'password' }),
    token: Type.String(),
})

export type ChangePassword = Static<typeof changePasswordSchema>

export function changePassword(data: any): Validator {
    return {
        validate: () => validateSchema(changePasswordSchema, data)
    }
}

const newPasswordSchema = Type.Object({
    current: Type.String({ format: 'password' }),
    new: Type.String({ format: 'password' }),
})

export type NewPassword = Static<typeof newPasswordSchema>

export function newPassword(data: any): Validator {
    return {
        validate: () => validateSchema(newPasswordSchema, data)
    }
}

const changeEmailSchema = Type.Object({
    current: Type.String({ format: 'email' }),
    new: Type.String({ format: 'email' }),
    password: Type.String({ format: 'password' }),
    redirect: Type.String(),
    errorRedirect: Type.String(),
})

export type ChangeEmail = Static<typeof changeEmailSchema>

export function changeEmail(data: any): Validator {
    return {
        validate: () => validateSchema(changeEmailSchema, data)
    }
}

export default {
    register,
    login,
    updateProfile,
    changePassword,
    newPassword,
    changeEmail,
}