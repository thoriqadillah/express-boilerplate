import { Login, Register, UpdateProfile } from "./account.model";
import { KyselyDatabase, Redis } from "@/db/connection";
import uuid from 'uuid';
import { User } from "./account.model";
import bcrypt from 'bcrypt'

export interface CreateUser extends Omit<Register, 'password'> {
    password?: string
    title?: string,
    phone?: string,
    picture?: string,
    verified_at?: Date
}

export interface Store {
    create(user: CreateUser): Promise<User>
    login(user: Login): Promise<User | undefined>
    get(id: string): Promise<User | undefined>
    getByEmail(email: string): Promise<User | undefined>
    updateProfile(id: string, payload: UpdateProfile): Promise<User>
    verifyEmail(id: string): Promise<void>
    changePassword(email: string, password: string, option?: { newPassword?: boolean }): Promise<void>
    deactivate(id: string): Promise<string>
}

export class AccountStore implements Store {

    private db = KyselyDatabase.instance()
    private memstore = Redis.instance()
    private salt = 10
    private _1HOUR = 60 * 60

    async create(u: CreateUser): Promise<User> {
        let password: string | undefined
        if (u.password) password = await bcrypt.hash(u.password, this.salt)

        return await this.db.insertInto('users').values({
                id: uuid.v4(),
                role_id: 2,
                first_name: u.first_name,
                last_name: u.last_name,
                email: u.email,
                password: password,
                title: u.title,
                phone: u.phone,
                picture: u.picture,
                created_at: new Date(),
                verified_at: u.verified_at
            })
            .returningAll()
            .executeTakeFirstOrThrow()
    }

    async login(u: Login): Promise<User | undefined> {
        const user = await this.db.selectFrom('users')
            .where('email', '=', u.email)
            .where('deleted_at', 'is', null)
            .selectAll()
            .executeTakeFirst()
        
        if (!user) return

        const same = await bcrypt.compare(u.password, user.password!)
        if (same) {
            await this.memstore.set(`user:${user.id}`, JSON.stringify(user), { EX: this._1HOUR })
            return user
        }
    }

    async get(id: string): Promise<User | undefined> {
        const user = await this.memstore.get(`user:${id}`)
        if (user) return JSON.parse(user)

        const u = await this.db.selectFrom('users')
            .where('id', '=', id)
            .where('deleted_at', 'is', null)
            .selectAll()
            .executeTakeFirst()

        if (!u) return

        await this.memstore.set(`user:${id}`, JSON.stringify(u), { EX: this._1HOUR })
        return u
    }

    async getByEmail(email: string): Promise<User | undefined> {
        const u = await this.db.selectFrom('users')
            .where('email', '=', email)
            .where('deleted_at', 'is', null)
            .selectAll()
            .executeTakeFirst()

        if (!u) return

        await this.memstore.set(`user:${u.id}`, JSON.stringify(u), { EX: this._1HOUR })
        return u
    }

    async updateProfile(id: string, payload: UpdateProfile): Promise<User> {
        let query = this.db.updateTable('users')
            .where('id', '=', id)
            .where('deleted_at', 'is', null)

        if (payload.first_name) query = query.set('first_name', payload.first_name)
        if (payload.last_name) query = query.set('last_name', payload.last_name)
        if (payload.email) query = query.set('email', payload.email)
        if (payload.title) query = query.set('title', payload.title)
        if (payload.phone) query = query.set('phone', payload.phone)
        if (payload.picture) query = query.set('picture', payload.picture)

        const user = await query.set('updated_at', new Date())
            .returningAll()
            .executeTakeFirstOrThrow()

        await this.memstore.set(`user:${id}`, JSON.stringify(user), { EX: this._1HOUR })
        return user
    }
    
    async changePassword(email: string, pass: string): Promise<void> {
        const password = await bcrypt.hash(pass, this.salt)
        const user = await this.db.updateTable('users')
            .where('email', '=', email)
            .where('deleted_at', 'is', null)
            .set('password', password)
            .set('password_last_updated', new Date())
            .returningAll()
            .executeTakeFirstOrThrow()

        await this.memstore.set(`user:${user.id}`, JSON.stringify(user), { EX: this._1HOUR })
    }

    async deactivate(id: string): Promise<string> {
        const user = await this.db.updateTable('users')
            .where('id', '=', id)
            .where('deleted_at', 'is', null)
            .set('deleted_at', new Date())
            .returning('id')
            .executeTakeFirstOrThrow()

        await this.memstore.del(`user:${id}`)
        return user.id
    }

    async verifyEmail(id: string): Promise<void> {
        const user = await this.db.updateTable('users')
            .where('id', '=', id)
            .where('deleted_at', 'is', null)
            .set('verified_at', new Date())
            .returningAll()
            .executeTakeFirstOrThrow()

        await this.memstore.set(`user:${user.id}`, JSON.stringify(user), { EX: this._1HOUR })
    }
}