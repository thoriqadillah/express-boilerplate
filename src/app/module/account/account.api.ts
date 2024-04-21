import express, { Express, Request, Response } from "express";
import { Service } from "@/app";
import { auth, validate } from "@/app/middleware";
import { AccountStore } from "./account.store";
import Validator, { type Login, type UpdateProfile, type ChangePassword, type Register, type NewPassword, type ChangeEmail, AuthToken } from "./account.model";
import { env } from "@/lib/env";
import { BrokerName, Priority, broker } from "@/lib/broker";
import { ResetPasswordStore } from "./reset-password/reset-password.store";
import ResetPasswordValidator, { type CreateResetPassword } from "./reset-password/reset-password.model";
import { google } from 'googleapis'
import { StorageName, storage } from "@/lib/storage";
import axios from 'axios'
import mime from 'mime-db'
import bcrypt from 'bcrypt'
import { SendEmail } from "@/lib/notifier";
import { imageupload } from "@/app/middleware/file-upload";
import path from "path";
import { Log } from "@/lib/logger";
import fs from "fs";
import { JwtToken, FastJwt } from "@/lib/jwt";
import ms from "ms";
import { Initable } from "@/lib/graceful";

export class AccountService implements Service, Initable {

    private REFRESH_TOKEN_EXP = env.get('JWT_REFRESH_TOKEN_EXPIRATION')
    private BROKER_DRIVER = env.get('BROKER_DRIVER').toUnion<BrokerName>('event')
    private STORAGE_DRIVER = env.get('STORAGE_DRIVER').toUnion<StorageName>('s3')
    private OAUTH_GOOGLE_ID = env.get('OAUTH_GOOGLE_ID').toString()
    private OAUTH_GOOGLE_SECRET = env.get('OAUTH_GOOGLE_SECRET').toString()
    private BASE_URL = env.get('BASE_URL').toString()
    
    private store = new AccountStore()
    private resetPass = new ResetPasswordStore()

    private event = broker.create('event')
    private broker = broker.create(this.BROKER_DRIVER)
    private storage = storage.create(this.STORAGE_DRIVER)

    private goauth = new google.auth.OAuth2({
        clientId: this.OAUTH_GOOGLE_ID,
        clientSecret: this.OAUTH_GOOGLE_SECRET,
    })

    constructor(private app: Express) {}

    init(): void {
        FastJwt.create('email', { maxAge: ms('1h') })
        FastJwt.create('refresh-token', { maxAge: this.REFRESH_TOKEN_EXP.toDuration('1d') })
    }

    generateToken(userId: string): AuthToken {
        const payload = {
            user: userId
        }

        const token = FastJwt.sign(payload)
        const refreshToken = FastJwt.use('refresh-token').sign(payload)

        return {
            token,
            refreshToken
        }
    }

    register = async (req: Request, res: Response) => {
        try {
            const payload = req.body as Register
            const user = await this.store.create(payload)

            this.event.publish('user-created', { data: user.id  })
            const { token, refreshToken } = this.generateToken(user.id)

            res.cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    sameSite: req.secure ? 'none' : 'lax',
                    secure: req.secure,
                    expires: this.REFRESH_TOKEN_EXP.toDate()
                })
                .Created({ token })
            
        } catch (error) {
            res.InternalError(`${error}`)
        }
    }

    login = async (req: Request, res: Response) => {
        try {
            const payload = req.body as Login
            const user = await this.store.login(payload)

            if (!user) return res.NoContent()

            const { token, refreshToken } = this.generateToken(user.id)
            res.cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    sameSite: req.secure ? 'none' : 'lax',
                    secure: req.secure,
                    expires: this.REFRESH_TOKEN_EXP.toDate()
                })
                .Ok({ token })

        } catch (error) {
            res.InternalError(`${error}`)
        }
    }

    async downloadImage(imgUrl: string, userId: string) {
        const img = await axios.get(imgUrl, { responseType: "arraybuffer" })

        const contentType = img.headers["content-type"]
        const mimetype = mime[contentType].extensions
        const ext = mimetype ? mimetype[0] : ''

        const path = await this.storage.upload(img.data, { 
            ext,
            mime: contentType,
        })

        await this.store.updateProfile(userId, { picture: path })
    }

    authGoogle = async (req: Request, res: Response) => {
        try {
            const token = req.Query('token').toString()
            this.goauth.setCredentials({ access_token: token })
    
            const oauth = google.oauth2({ auth: this.goauth, version: 'v2' })
    
            const { data } = await oauth.userinfo.get()
            const user = await this.store.getByEmail(data.email!)
            if (!user) {
                const name = data.name!.split(' ')
                const u = await this.store.create({
                    email: data.email!,
                    first_name: name[0],
                    last_name: name[1] ?? '',
                    verified_at: new Date(),
                })
                
                this.event.publish('user-created', { data: u.id })
                await this.downloadImage(data.picture!, u.id) // download the profile picture because google picture is guarded by refresh token. so for simplicity we just download the image and save it to our storage
    
                const { token, refreshToken } = this.generateToken(u.id)
                
                return res.cookie('refreshToken', refreshToken, {
                        httpOnly: true,
                        sameSite: req.secure ? 'none' : 'lax',
                        secure: req.secure,
                        expires: this.REFRESH_TOKEN_EXP.toDate()
                    })
                    .Ok({ token })
            }
            
            const { token: accessToken, refreshToken } = this.generateToken(user.id)

            res.cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    sameSite: req.secure ? 'none' : 'lax',
                    secure: req.secure,
                    expires: this.REFRESH_TOKEN_EXP.toDate()
                })
                .Ok({ token: accessToken })
            
        } catch (error) {
            res.InternalError(`${error}`)
        }
    }

    sendVerification = async (req: Request, res: Response) => {
        try {
            if (req.user!.verified_at) return res.Ok()
            
            const { redirect, errorRedirect } = req.query
            const param = {
                user: req.user?.id,
                url: redirect,
            }

            const token = FastJwt.use('email').sign(param)
            const callbackUrl = `${this.BASE_URL}/api/v1/auth/verify/callback?token=${token}&errorRedirect=${errorRedirect}`
    
            this.broker.publish<SendEmail>('notification', { 
                priority: Priority.VERY_HIGH,
                notifiers: ['email'],
                data: {
                    callbackUrl,
                    recipient: req.user!.email,
                    subject: 'Email Verification',
                    template: 'user-verify.html'
                },
            })
    
            res.Ok()
        } catch (error) {
            res.InternalError(`${error}`)
        }
    }

    verify = async (req: Request, res: Response) => {
        const token = req.Query('token').toString()
        const errorRedirect = req.Query('errorRedirect').toString()

        try {
            const decoded = FastJwt.use('email').verify<JwtToken>(token)
            await this.store.verifyEmail(decoded.user)
            res.redirect(302, decoded.url)
        } catch (error) {
            res.redirect(302, errorRedirect)
            Log.error(`${error}`)
        }
    }

    getUser = (req: Request, res: Response) => {
        res.Ok({ ...req.user, password: undefined })
    }

    refreshToken = async (req: Request, res: Response) => {
        const token = req.cookies['refreshToken']
        if (!token) return res.Unauthorized()

        try {
            const { user } = FastJwt.use('refresh-token').verify<JwtToken>(token)
            const { token: newToken, refreshToken } = this.generateToken(user)

            res.cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    sameSite: req.secure ? 'none' : 'lax',
                    secure: req.secure,
                    expires: this.REFRESH_TOKEN_EXP.toDate()
                })
                .Ok({ token: newToken })

        } catch (error) {
            res.Unauthorized()
        }
    }

    resetPassword = async (req: Request, res: Response) => {
        try {
            const payload = req.body as CreateResetPassword
            const token = await this.resetPass.create(payload.email)

            this.broker.publish<SendEmail>('notification', {
                priority: Priority.VERY_HIGH,
                notifiers: ['email'],
                data: {
                    recipient: payload.email,
                    redirect: `${payload.redirect}?token=${token}`,
                    subject: 'Forgot Password',
                    template: 'forgot-password.html'
                }
            })

            res.Ok()

        } catch (error) {
            res.InternalError(`${error}`)
        }
    }

    changePassword = async (req: Request, res: Response) => {
        try {
            const payload = req.body as ChangePassword
            const valid = await this.resetPass.verify(payload.email, payload.token)
            if (!valid) return res.BadRequest('Token invalid or expired')

            await this.store.changePassword(payload.email, payload.password)
            await this.resetPass.delete(payload.email)

            // TODO: add abort mechanism to prevent unwanted process
            this.broker.publish<SendEmail>('notification', {
                priority: Priority.VERY_HIGH,
                notifiers: ['email'],
                data: {
                    recipient: payload.email,
                    subject: 'Password Changed',
                    template: 'password-changed.html'
                },
            })

            res.Ok()

        } catch (error) {
            res.InternalError(`${error}`)
        }
    }

    newPassword = async (req: Request, res: Response) => {
        try {
            const payload = req.body as NewPassword
            if (!await bcrypt.compare(payload.current, req.user!.password!)) {
                return res.BadRequest('Wrong password')
            }

            await this.store.changePassword(req.user!.email, payload.new)

            // TODO: add abort mechanism to prevent unwanted process
            this.broker.publish<SendEmail>('notification', {
                priority: Priority.VERY_HIGH,
                notifiers: ['email'],
                data: {
                    recipient: req.user!.email,
                    subject: 'Password Changed',
                    template: 'password-changed.html'
                },
            })

            res.Ok()

        } catch (error) {
            res.InternalError(`${error}`)
        }
    }

    sendChangeEmail = async (req: Request, res: Response) => {
        try {
            const payload = req.body as ChangeEmail
            if (!await bcrypt.compare(payload.password, req.user!.password!)) {
                return res.BadRequest('Wrong password')
            }

            // TODO: add abort mechanism to prevent unwanted process
            this.broker.publish<SendEmail>('notification', {
                priority: Priority.VERY_HIGH,
                notifiers: ['email'],
                data: {
                    recipient: req.user!.email,
                    subject: 'Email changed',
                    template: 'email-changed.html',
                },
            })
    
            const data = {
                user: req.user!.id,
                email: payload.new,
                redirect: payload.redirect,
            }
    
            const token = FastJwt.use('email').sign(data)
            const callbackUrl = `${this.BASE_URL}/api/v1/user/change-email/callback?token=${token}&errorUrl=${payload.errorRedirect}`
    
            this.broker.publish<SendEmail>('notification', {
                priority: Priority.VERY_HIGH,
                notifiers: ['email'],
                data: {
                    callbackUrl,
                    recipient: payload.new,
                    subject: 'Change email',
                    template: 'change-email.html',
                },
            })
    
            res.Ok()
        } catch (error) {
            res.InternalError(`${error}`)
        }
    }

    changeEmail = async (req: Request, res: Response) => {
        const token = req.Query('token').toString()
        const errorUrl = req.Query('errorUrl').toString()
        
        try {
            const { user, email, redirect } = FastJwt.use('email').verify<JwtToken>(token)
            
            await this.store.updateProfile(user, { email })
            res.redirect(302, redirect)
            
        } catch (error) {
            res.redirect(302, errorUrl)
            Log.error(`${error}`);
        }
    }

    updateProfile = async (req: Request, res: Response) => {
        try {
            const payload = req.body as UpdateProfile
            await this.store.updateProfile(req.user!.id, payload)
            
            res.Ok()

        } catch (error) {
            res.InternalError(`${error}`)
        }
    }

    changePicture = async (req: Request, res: Response) => {
        try {
            if (!req.file) return res.BadRequest('No file provided')
            
            const fileUrl = await this.storage.upload(req.file.stream, {
                ext: path.extname(req.file.filename),
                replaceFile: req.user?.picture ?? undefined
            })

            fs.unlink(req.file.path, err => Log.error(`${err}`))
            
            await this.store.updateProfile(req.user!.id, { picture: fileUrl })
            res.Ok()

        } catch (error) {
            res.InternalError(`${error}`)
        }
    }

    deactivate = async (req: Request, res: Response) => {
        try {
            await this.store.deactivate(req.user!.id)
            res.Ok()
            
        } catch (error) {
            res.InternalError(`${error}`)
        }
    }

    createRoutes(): void {
        const v1 = express.Router()
        v1.post('/auth/register', validate(Validator.register), this.register)
        v1.post('/auth/login', validate(Validator.login), this.login)
        v1.get('/auth/google', this.authGoogle)
        v1.get('/auth/refresh-token', this.refreshToken)
        v1.post('/auth/reset-password', validate(ResetPasswordValidator.resetPassword), this.resetPassword)
        v1.put('/auth/change-password', validate(Validator.changePassword), this.changePassword)
        v1.put('/auth/new-password', auth, validate(Validator.newPassword), this.newPassword)
        v1.get('/auth/verify', auth, this.sendVerification)
        v1.get('/auth/verify/callback', this.verify)
        
        v1.get('/user', auth, this.getUser)
        v1.put('/user/change-email', auth, validate(Validator.changeEmail), this.sendChangeEmail)
        v1.get('/user/change-email/callback', this.changeEmail)
        v1.put('/user', auth, validate(Validator.updateProfile), this.updateProfile)
        v1.put('/user/picture', imageupload.single('file'), this.changePicture)
        v1.delete('/user', auth, this.deactivate)

        this.app.use('/api/v1', v1)
    }
}