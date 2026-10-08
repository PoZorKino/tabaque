export interface WebhookUpdateSchema {
    name?: string;
    avatar?: string | null;
    channel_id?: string;
    id?: string;
    type?: number;
    guild_id?: string | null;
    application_id?: string | null;
    user?: object | null;
    token?: string;
    url?: string;
    source_guild?: object | null;
    source_channel?: object | null;
}
