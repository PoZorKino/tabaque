import { Router, Response, Request } from "express";
import crypto from "node:crypto";
import { route } from "@spacebar/api/middlewares";
import { Snowflake } from "@spacebar/util";

const router = Router({ mergeParams: true });

router.get(
    "/",
    route({
        authentication: "optional",
    }),
    (req: Request, res: Response) => {
        // TODO:
        const header = req.headers["x-fingerprint"];
        const fingerprint = req.user_id ? undefined : typeof header === "string" && header ? header : `${Snowflake.generate()}.${crypto.randomBytes(20).toString("base64url")}`;
        res.send({ fingerprint, assignments: [], guild_experiments: [] });
    },
);

export default router;
