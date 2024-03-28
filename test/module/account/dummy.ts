import { User } from "@/app/module/account/account.model";
import { v4 } from "uuid";

export const user: User = {
    id: v4(),
    first_name: 'John',
    last_name: 'Doe',
    title: 'Person',
    email: 'mock@mail.com',
    password: '',
    password_last_updated: null,
    phone: '089123456789',
    picture: null,
    updated_at: null,
    verified_at: null,
    remember_token: null,
    created_at: new Date(),
    deleted_at: null,
}