export interface LoginSchema {
    login: string;
    /**
     * @minLength 1
     * @maxLength 72
     */
    password: string;
    undelete?: boolean;
    captcha_key?: string;
    login_source?: string;
    gift_code_sku_id?: string;
}
