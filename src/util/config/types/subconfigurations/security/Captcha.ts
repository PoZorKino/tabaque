export class CaptchaConfiguration {
    capMode: "core" | "standalone" = "core";
    enabled: boolean = false;
    service: "recaptcha" | "hcaptcha" | "cap" | null = "cap";
    sitekey: string | null = null;
    secret: string | null = null;
    instance: string | null = null;
}
