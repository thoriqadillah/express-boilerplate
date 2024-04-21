import { createSigner, createVerifier } from "fast-jwt"
import { env } from "./env"
import ms from "ms"

export interface JwtOption {
    key?: string
    maxAge?: number
}

export interface JwtToken extends Record<string, any> {
    user: string
}

export interface Jwt {
    sign(payload: Record<string, any>): string
    verify<T = any>(token: string | Buffer): T
}

export class FastJwt implements Jwt {

    private static instances: Record<string, Jwt> = {}
    private static key = 'default'
    
    private option: JwtOption
    private signToken
    private verifyToken
    
    constructor(option?: JwtOption) {
        this.option = {
            key: env.get('JWT_SIGNING_KEY').toString(),
            maxAge: ms(env.get('JWT_EXPIRATION').toString()),
            ...option
        }

        this.signToken = createSigner({ key: this.option.key })
        this.verifyToken = createVerifier({ 
            key: this.option.key,
            cache: true,
            cacheTTL: ms('1h'),
            maxAge: this.option.maxAge
        })
    }

    sign(payload: Record<string, any>): string {
        return this.signToken(payload)
    }

    /**
     * Sign is a function to create a new token based on given payload
     */
    static sign(payload: Record<string, any>): string {
        const token = this.instances[this.key].sign(payload)
        this.key = 'default'

        return token
    }

    verify<T = any>(token: string): T {
        return this.verifyToken(token) as T
    }

    /**
     * Verify is a function to verify a token and return its content
     */
    static verify<T = any>(token: string): T {
        const payload = this.instances[this.key].verify<T>(token)
        this.key = 'default'

        return payload
    }

    /**
     * Create is a function to create new singleton instance for specific topic
     */
    static create(topic: string, option?: JwtOption): typeof FastJwt {
        if (this.instances[topic]) return this
        
        this.instances[topic] = new FastJwt(option)
        return this
    }

    /**
     * Use is a fcuntion to use created topic
     */
    static use(topic: string): typeof FastJwt {
        this.key = topic
        return this
    }

}