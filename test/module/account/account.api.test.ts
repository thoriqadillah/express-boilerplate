import { afterAll, beforeAll, expect, jest, test } from "@jest/globals";
import { Application } from "@/app";
import express from 'express'
import request from 'supertest'
import dotenv from "dotenv";
import { Login, Register } from "@/app/module/account/account.model";
import { AccountStore, Store } from "@/app/module/account/account.store";
import { user as dummyUser } from './dummy'
import jwt, { JsonWebTokenError } from 'jsonwebtoken'
import { v4 } from "uuid";

jest.mock('@/app/module/account/account.store')
jest.mock('@/app/module/setting/setting.store')

dotenv.config({ override: true, path: './.env.test' })
const app = express()
const vw = new Application(app)
let store: Store

beforeAll(() => {
    vw.start()
    store = new AccountStore()
})

afterAll(() => {
    vw.shutdown()
})

test('POST /auth/register endpoint should return created', async () => {
    jest.spyOn(AccountStore.prototype, 'create').mockImplementationOnce(async () => dummyUser)
    jest.spyOn(AccountStore.prototype, 'get').mockImplementationOnce(async () => dummyUser)

    const payload: Register = {
        email: dummyUser.email,
        first_name: dummyUser.first_name,
        last_name: dummyUser.last_name,
        password: '12345Abc'
    }

    const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send(payload)
    
    expect(res.statusCode).toBe(201)
    
    const user = await store.get(res.body.data.id)
    expect(user).toBeTruthy()
})

test('POST /auth/register endpoint should return bad request', async () => {
    const payload: Register = {
        email: ``,
        first_name: 'John',
        last_name: 'Doe',
        password: '12345Abc'
    }

    const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send(payload)

    expect(res.statusCode).toBe(400)
})

test('POST /auth/login endpoint should return ok', async () => {
    jest.spyOn(AccountStore.prototype, 'login').mockImplementationOnce(async () => dummyUser)

    const login: Login = {
        email: dummyUser.email,
        password: '12345Abc'
    }

    const res = await request(app)
        .post('/api/v1/auth/login')
        .send(login)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

    expect(res.statusCode).toBe(200)
})

test('POST /auth/login endpoint should return bad request', async () => {
    const login: Login = {
        email: ``,
        password: '12345Abc'
    }

    const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send(login)

    expect(res.statusCode).toBe(400)
})

test('GET /user endpoint should return ok', async () => {
    jest.spyOn(jwt, 'verify').mockImplementationOnce(() => ({ user: v4() }))
    jest.spyOn(AccountStore.prototype, 'get').mockImplementationOnce(async () => dummyUser)

    const login: Login = {
        email: dummyUser.email,
        password: '12345Abc'
    }

    const res = await request(app)
        .get('/api/v1/user')
        .send(login)
        .set('Authorization', 'token')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

    expect(res.statusCode).toBe(200)
})

test('GET /user endpoint should return unauthorized', async () => {
    jest.spyOn(jwt, 'verify').mockImplementation((token, secret, option, callback) => {
        if (callback) callback(new JsonWebTokenError('Invalid token'), undefined)
    })

    const login: Login = {
        email: dummyUser.email,
        password: '12345Abc'
    }

    const res = await request(app)
        .get('/api/v1/user')
        .send(login)
        .set('Authorization', 'token')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

    expect(res.statusCode).toBe(401)
})

// TODO:
// test('GET /auth/google endpoint should redirect', async () => {
//     const res = await request(app)
//         .get('/api/v1/auth/google')
//         .set('Content-Type', 'application/json')
//         .set('Accept', 'application/json')

//     expect(res.statusCode).toBe(200)
// })

test('DELETE /user endpoint should return ok', async () => {
    jest.spyOn(jwt, 'verify').mockImplementationOnce(() => ({ user: v4() }))
    jest.spyOn(AccountStore.prototype, 'get').mockImplementationOnce(async () => dummyUser)
    jest.spyOn(AccountStore.prototype, 'deactivate').mockImplementation(async () => v4())

    const res = await request(app)
        .delete('/api/v1/user')
        .set('Authorization', 'token')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

    expect(res.statusCode).toBe(200)
})

test('DELETE /user endpoint should return unauthorized', async () => {
    jest.spyOn(jwt, 'verify').mockImplementation((token, secret, option, callback) => {
        if (callback) callback(new JsonWebTokenError('Invalid token'), undefined)
    })

    const res = await request(app)
        .delete('/api/v1/user')
        .set('Authorization', 'token')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

    expect(res.statusCode).toBe(401)
})

test('PUT /user endpoint should return ok', async () => {
    jest.spyOn(jwt, 'verify').mockImplementationOnce(() => ({ user: v4() }))
    jest.spyOn(AccountStore.prototype, 'get').mockImplementationOnce(async () => dummyUser)
    jest.spyOn(AccountStore.prototype, 'updateProfile').mockImplementation(async () => dummyUser)

    const res = await request(app)
        .put('/api/v1/user')
        .set('Authorization', 'token')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
            phone: '089123456789'
        })

    expect(res.statusCode).toBe(200)
})

test('PUT /user endpoint should return bad request', async () => {
    jest.spyOn(jwt, 'verify').mockImplementationOnce(() => ({ user: v4() }))
    jest.spyOn(AccountStore.prototype, 'get').mockImplementationOnce(async () => dummyUser)
    jest.spyOn(AccountStore.prototype, 'updateProfile').mockImplementation(async () => dummyUser)

    const res = await request(app)
        .put('/api/v1/user')
        .set('Authorization', 'token')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
            phone: true
        })

    expect(res.statusCode).toBe(400)
})

test('PUT /user endpoint should return unauthorized', async () => {
    jest.spyOn(jwt, 'verify').mockImplementation((token, secret, option, callback) => {
        if (callback) callback(new JsonWebTokenError('Invalid token'), undefined)
    })

    const res = await request(app)
        .put('/api/v1/user')
        .set('Authorization', 'token')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

    expect(res.statusCode).toBe(401)
})
