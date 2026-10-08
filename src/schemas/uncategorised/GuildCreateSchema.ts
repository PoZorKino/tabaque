import { ChannelCreateSchema } from "@spacebar/schemas";

export interface GuildCreateSchema {
    /**
     * @maxLength 100
     */
    name?: string;
    region?: string;
    icon?: string | null;
    channels?: ChannelCreateSchema[];
    system_channel_id?: string;
    rules_channel_id?: string;
    guild_template_code?: string;
    staff_only?: boolean;
}
