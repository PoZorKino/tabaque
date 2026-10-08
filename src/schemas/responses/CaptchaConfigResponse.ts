export interface CaptchaConfigResponse {
    service: "recaptcha" | "hcaptcha" | "cap" | null;
    sitekey: string | null;
    endpoint: string | null;
    register: boolean;
    login: boolean;
    password_reset: boolean;
}
