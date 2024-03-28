import { Service } from "@/app";
import express, { Express, Request, Response } from "express";
import { validate } from "@/app/middleware/validator";
import { example } from "./example.model";

export class ExampleService implements Service {

    constructor(private app: Express) {}

    // === ATTENTION ===
    // You need to use arrow function, or bind the method with `this`
    // If we use regular method, then you should bind the method with `this` 
    // When registering the handler to the route
    // Example -> v1.get('/example', this.hello.bind(this))
    // This is because if we use regular method, and then pass it as an argument to the route
    // Then the method will lose the context of `this` instance
    // You can test this by creating a property for this class
    // And then console.log it in the regular method. See if it has any value other than `undefined`

    hello = (req: Request, res: Response) => {
        res.send('hello world')
    }

    post = (req: Request, res: Response) => {
        res.Ok(req.body)
    }

    createRoutes(): void {
        const v1 = express.Router()
        v1.get('/example', this.hello)
        v1.post('/example', validate(example), this.post)

        this.app.use('/api/v1', v1)
    }
}