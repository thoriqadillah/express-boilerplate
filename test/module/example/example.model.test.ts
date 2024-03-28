import { expect, test } from "@jest/globals";
import Validator, { Example } from "@/app/module/example/example.model";

test('payload example should be validated', () => {
    const payload: Example = {
        foo: 'test',
        bar: 1
    }

    const v = Validator.example(payload)
    const messages = v.validate()
    expect(messages.length).toBe(0)
})

test('payload example should not be validated', () => {
    let payload: Example = {
        foo: '',
        bar: 1
    }

    let v = Validator.example(payload)
    let messages = v.validate()
    expect(messages.length).toBeGreaterThan(0)

    payload = {
        foo: '',
        bar: 0
    }

    v = Validator.example(payload)
    messages = v.validate()
    expect(messages.length).toBeGreaterThan(0)

    payload = {
        foo: 'test',
        bar: 0
    }

    v = Validator.example(payload)
    messages = v.validate()
    expect(messages.length).toBeGreaterThan(0)
})
