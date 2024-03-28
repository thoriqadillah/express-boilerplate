import Validator from "@/app/module/setting/setting.model";
import { expect, test } from "@jest/globals";

test('update setting should be validated', () => {
    let payload: Record<string, any> = {
        push_notif: true
    }

    let v = Validator.updateSetting(payload)
    let messages = v.validate()
    
    expect(messages.length).toBe(0)

    payload = {}

    v = Validator.updateSetting(payload)
    messages = v.validate()
    
    expect(messages.length).toBe(0)
})

test('update setting should not be validated', () => {
    let payload: Record<string, any> = {
        push_notif: 'true'
    }

    let v = Validator.updateSetting(payload)
    let messages = v.validate()
    
    expect(messages.length).toBeGreaterThan(0)
})