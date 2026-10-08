import path from "node:path";
import fs from "node:fs";
import { Router, Response, Request } from "express";
import { route } from "@spacebar/api/middlewares";
import { PUBLIC_ASSETS_FOLDER, brandPage } from "@spacebar/util";

const router = Router({ mergeParams: true });

router.get(
    "/",
    route({
        spacebarOnly: true,
        authentication: "never",
    }),
    (req: Request, res: Response) => {
        res.set("Cache-Control", "no-cache");
        return res.type("html").send(brandPage(fs.readFileSync(path.join(PUBLIC_ASSETS_FOLDER, "index.html"), "utf8")));
    },
);

export default router;
