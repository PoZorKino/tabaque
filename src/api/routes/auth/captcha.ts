import { route } from "@spacebar/api/middlewares";
import { capEndpoint, captchaEnabled, registrationCapEndpoint } from "@spacebar/api/util";
import { Config } from "@spacebar/util";
import { Request, Response, Router } from "express";
const router = Router({ mergeParams: true });

router.get(
    "/",
    route({
        responses: {
            200: {
                body: "CaptchaConfigResponse",
            },
        },
        spacebarOnly: true,
        authentication: "never",
    }),
    (req: Request, res: Response) => {
        const { security, register, login, passwordReset } = Config.get();
        if (register.requireCaptcha)
            return res.json({
                service: "cap",
                sitekey: registrationCapEndpoint() === "/api/v9/auth/cap/" ? "fosscord" : security.captcha.sitekey,
                endpoint: registrationCapEndpoint(),
                register: true,
                login: login.requireCaptcha && captchaEnabled(),
                password_reset: passwordReset.requireCaptcha && captchaEnabled(),
            });
        if (!captchaEnabled())
            return res.json({
                service: null,
                sitekey: null,
                endpoint: null,
                register: false,
                login: false,
                password_reset: false,
            });
        res.json({
            service: security.captcha.service,
            sitekey: security.captcha.sitekey,
            endpoint: capEndpoint(),
            register: register.requireCaptcha,
            login: login.requireCaptcha,
            password_reset: passwordReset.requireCaptcha,
        });
    },
);

export default router;
