export interface EmailDomainLookupSchema {
    allow_multiple_guilds: boolean;
    email: string;
    use_verification_code: boolean;
    guild_id?: string;
}
