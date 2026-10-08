import { Request, Response, Router } from "express";
import { route } from "@spacebar/api/middlewares";
import { PrivateCalls } from "@spacebar/database";
import { assertRecipient } from "./index";

const router: Router = Router({ mergeParams: true });

router.post("/", route({ responses: { 204: {}, 404: {} } }), async (req: Request, res: Response) => {
    await assertRecipient(req);
    const recipients = Array.isArray(req.body?.recipients) ? req.body.recipients.map(String) : [req.user_id];
    await PrivateCalls.stopRinging(req.params.channel_id as string, recipients);
    res.sendStatus(204);
});

export default router;
