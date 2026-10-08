export interface ApplicationAuthorizeSchema {
    authorize: boolean;
    guild_id?: string;
    channel_id?: string;
    webhook_channel_id?: string;
    permissions?: string;
    integration_type?: number;
    location_context?: object;
    dm_settings?: object;
    captcha_key?: string;
    connected_account_provider?: string | null;
    /**
     * @minLength 6
     * @maxLength 6
     */
    code?: string; // 2fa code
}
