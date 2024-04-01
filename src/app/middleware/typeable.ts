import { Parser, parse } from "@/lib/parser";
import { Request, Response, NextFunction } from "express";

declare global {
    namespace Express {
        interface Request {
            Query: (key: string) => Parser;
            Param: (key: string) => Parser;
        }
    
        interface Response {
            Success: (code: number, message: string, data?: any) => void;
            Error: (code: number, message: string) => void;
            Ok: (data?: any, message?: string,) => void;
            Created: (data?: any, message?: string,) => void;
            NoContent: () => void;
            BadRequest: (message?: string) => void;
            InternalError: (message?: string) => void;
            Forbidden: (message?: string) => void;
            Unauthorized: (message?: string) => void;
        }
    }
}

  
export function typeable(req: Request, res: Response, next: NextFunction) {
    req.Query = (key) => parse(req.query[key] as string);
    req.Param = (key) => parse(req.params[key]);

    res.Success = (code, message, data) => {
        res.status(code).send({ message, data });
    };

    res.Ok = (data, message = 'Ok') => {
        res.status(200).send({ message, data });
    };

    res.NoContent = () => {
        res.sendStatus(204);
    };

    res.Created = (data, message = 'Created') => {
        res.status(201).send({ message, data });
    };

    res.Error = (code, message) => {
        res.status(code).send({ message });
    };

    res.BadRequest = (message = 'Bad request') => {
        res.status(400).send({ message });
    };

    res.InternalError = (message) => {
        res.status(500).send({ message });
    };

    res.Forbidden = (message = 'Forbidden') => {
        res.status(403).send({ message });
    };

    res.Unauthorized = (message = 'Unauthorized') => {
        res.status(401).send({ message });
    };

    next()
}