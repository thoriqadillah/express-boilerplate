import { afterAll, beforeAll, expect, test } from "@jest/globals";
import { Application } from "@/app";
import express from 'express'
import request from 'supertest'
import dotenv from "dotenv";

dotenv.config({ override: true, path: './.env.test' })
const app = express()
const vw = new Application(app)

beforeAll(() => {
    vw.start()
})

afterAll(() => {
    vw.shutdown()
})

test('GET /example endpoint should return ok', async () => {
    const res = await request(app).get('/api/v1/example')
    expect(res.statusCode).toBe(200)
})

test('POST /example endpoint should return bad request', async () => {
    const payload = {
        foo: '',
        bar: 1
    }

    const res = await request(app)
        .post('/api/v1/example')
        .send(payload)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

    expect(res.statusCode).toBe(400)
})
