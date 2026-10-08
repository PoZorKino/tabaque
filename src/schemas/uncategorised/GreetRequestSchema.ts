import { AllowedMentions } from "@spacebar/schemas";

export interface GreetRequestSchema {
    sticker_ids: string[];
    allowed_mentions?: AllowedMentions;
    message_reference?: {
        message_id: string;
        channel_id?: string;
        guild_id?: string;
        fail_if_not_exists?: boolean;
    };
}
