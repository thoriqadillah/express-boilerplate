import { afterAll, beforeAll, expect, jest, test } from "@jest/globals";
import { Application } from "@/app";
import express from 'express'
import request from 'supertest'
import dotenv from "dotenv";
import { AccountStore, Store } from "@/app/module/account/account.store";
import { user as dummyUser } from '../account/dummy'
import { setting } from './dummy'
import jwt, { JsonWebTokenError } from 'jsonwebtoken'
import { v4 } from "uuid";
import { SettingStore } from "@/app/module/setting/setting.store";

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

test('PUT /setting endpoint should return ok', async () => {
    jest.spyOn(jwt, 'verify').mockImplementationOnce(() => ({ user: v4() }))
    jest.spyOn(AccountStore.prototype, 'get').mockImplementationOnce(async () => dummyUser)
    jest.spyOn(SettingStore.prototype, 'update').mockImplementationOnce(async () => setting)

    const res = await request(app)
        .put('/api/v1/setting')
        .set('Authorization', 'token')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
            mail_assigned_notif: true
        })

    expect(res.statusCode).toBe(200)
})

test('PUT /setting endpoint should return bad request', async () => {
    jest.spyOn(jwt, 'verify').mockImplementationOnce(() => ({ user: v4() }))
    jest.spyOn(AccountStore.prototype, 'get').mockImplementationOnce(async () => dummyUser)
    jest.spyOn(SettingStore.prototype, 'update').mockImplementationOnce(async () => setting)

    const res = await request(app)
        .put('/api/v1/setting')
        .set('Authorization', 'token')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
            mail_assigned_notif: 'true'
        })

    expect(res.statusCode).toBe(400)
})

test('PUT /setting endpoint should return unauthorized', async () => {
    jest.spyOn(jwt, 'verify').mockImplementation((token, secret, option, callback) => {
        if (callback) callback(new JsonWebTokenError('Invalid token'), undefined)
    })

    const res = await request(app)
        .put('/api/v1/setting')
        .set('Authorization', 'token')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

    expect(res.statusCode).toBe(401)
})

test('GET /setting endpoint should return ok', async () => {
    jest.spyOn(jwt, 'verify').mockImplementationOnce(() => ({ user: v4() }))
    jest.spyOn(AccountStore.prototype, 'get').mockImplementationOnce(async () => dummyUser)
    jest.spyOn(SettingStore.prototype, 'get').mockImplementationOnce(async () => setting)

    const res = await request(app)
        .get('/api/v1/setting')
        .set('Authorization', 'token')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

    expect(res.statusCode).toBe(200)
})

test('GET /setting endpoint should return unauthorized', async () => {
    jest.spyOn(jwt, 'verify').mockImplementation((token, secret, option, callback) => {
        if (callback) callback(new JsonWebTokenError('Invalid token'), undefined)
    })

    const res = await request(app)
        .get('/api/v1/setting')
        .set('Authorization', 'token')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

    expect(res.statusCode).toBe(401)
})
