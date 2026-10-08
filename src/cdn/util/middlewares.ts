import { NextFunction, Response, Request } from "express";
import { Config } from "@spacebar/util";
import { HTTPError } from "lambert-server";

export function setCacheControl(req: Request, res: Response, next: NextFunction) {
    const cacheDuration = 21600; // 6 hours
    res.setHeader("Cache-Control", `public, max-age=${cacheDuration}, s-maxage=${cacheDuration}, immutable`);
    next();
}

export function setCacheControlNotFound(req: Request, res: Response) {
    const cacheDuration = 60; // 1 minute
    res.setHeader("Cache-Control", `public, max-age=${cacheDuration}, s-maxage=${cacheDuration}, immutable`);
    res.status(404).send(req.path + " not found");
}

export function validateServerAuth(req: Request, res: Response, next: NextFunction) {
    if (req.headers.signature !== Config.get().security.requestSignature) throw new HTTPError("Invalid request signature");
    next();
}
