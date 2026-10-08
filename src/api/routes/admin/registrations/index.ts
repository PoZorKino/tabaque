import { Request, Response, Router } from "express";
import { HTTPError } from "lambert-server/HTTPError";
import { route } from "@spacebar/api/middlewares";
import { Invite, RegistrationRequest, User } from "@spacebar/database";
import { Config } from "@spacebar/util";
import { page } from "../../../util/utility/registrationPage";

const router: Router = Router({ mergeParams: true });

// the page itself holds no data; it reads the signed-in token from this site and calls the endpoints below
router.get("/panel", route({ authentication: "never", spacebarOnly: true, description: "Approval page for pending signups" }), (req: Request, res: Response) => {
    res.type("html").send(page);
});

router.get(
    "/",
    route({ right: "OPERATOR", spacebarOnly: true, description: "Signups waiting for a decision, and the latest decided ones" }),
    async (req: Request, res: Response) => {
        const rows = await RegistrationRequest.find({ order: { created_at: "DESC" }, take: 200 });
        res.json({
            require_approval: Config.get().register.requireApproval,
            requests: rows.map(({ password: _password, ...rest }) => rest),
        });
    },
);

router.post("/:id/approve", route({ right: "OPERATOR", spacebarOnly: true, description: "Create the account for a pending signup" }), async (req: Request, res: Response) => {
    const request = await RegistrationRequest.findOneBy({ id: req.params.id as string });
    if (!request || request.status !== "pending") throw new HTTPError("No pending request with this id", 404);
    const user = await User.register({ username: request.username, password: request.password ?? undefined, email: request.email ?? undefined, req });
    if (request.invite) await Invite.joinGuild(user.id, request.invite).catch(() => {});
    await RegistrationRequest.update({ id: request.id }, { status: "approved", decided_at: new Date(), decided_by: req.user_id, user_id: user.id, password: null });
    res.json({ ok: true, user_id: user.id });
});

router.post("/:id/reject", route({ right: "OPERATOR", spacebarOnly: true, description: "Decline a pending signup" }), async (req: Request, res: Response) => {
    const request = await RegistrationRequest.findOneBy({ id: req.params.id as string });
    if (!request || request.status !== "pending") throw new HTTPError("No pending request with this id", 404);
    await RegistrationRequest.update({ id: request.id }, { status: "rejected", decided_at: new Date(), decided_by: req.user_id, password: null });
    res.json({ ok: true });
});

export default router;
