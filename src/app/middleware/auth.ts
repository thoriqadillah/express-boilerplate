import { Request, Response, NextFunction } from "express";
import { AccountStore } from "../module/account/account.store";
import { User } from "../module/account/account.model";
import { FastJwt, JwtToken } from "@/lib/jwt";

declare global {
    namespace Express {
        interface Request {
            user?: User
        }
    }
}


export async function auth(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader) return res.Unauthorized()
        
        const token = authHeader.replace('Bearer ', '')
        const { user } = FastJwt.verify<JwtToken>(token)
        
        const store = new AccountStore()
        const u = await store.get(user)
        if (!u) return res.Unauthorized()

        req.user = u
        next()
        
    } catch (error) {
        return res.Unauthorized()
    }
}