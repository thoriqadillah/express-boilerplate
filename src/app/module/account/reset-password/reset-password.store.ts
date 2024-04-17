import { KyselyDatabase } from "@/db"
import crypto from 'crypto'
import bcrypt from 'bcrypt'

export interface Store {
    create(email: string): Promise<string>
    delete(email: string): void
    verify(email: string, token: string): Promise<boolean>
}

export class ResetPasswordStore implements Store {

    private db = KyselyDatabase.instance()
    private defaultSalt = 10

    async create(email: string): Promise<string> {
        const now = new Date()
        const _1hour = new Date(now.setHours(now.getHours() + 1))
        
        const rp = await this.db.selectFrom('reset_passwords')
            .where('email', '=', email)
            .select('id')
            .executeTakeFirst()

        if (rp) await this.delete(email)

        const token = crypto.randomBytes(32).toString('hex')
        const resetToken = await bcrypt.hash(token, this.defaultSalt)

        await this.db.insertInto('reset_passwords')
            .values({
                email,
                expired_at: _1hour,
                token: resetToken,
            })
            .returning('token')
            .executeTakeFirstOrThrow()

        return token
    }

    async delete(email: string): Promise<void> {
        await this.db.deleteFrom('reset_passwords')
            .where('email', '=', email)
            .execute()
    }

    async verify(email: string, token: string): Promise<boolean> {
        const resetPassword = await this.db.selectFrom('reset_passwords')
            .where('email', '=', email)
            .select(['expired_at', 'token'])
            .executeTakeFirst()

        if (!resetPassword) return false
        
        const isValid = await bcrypt.compare(token, resetPassword.token)
        if (!isValid) return false
        
        return new Date() < resetPassword.expired_at
    }
}