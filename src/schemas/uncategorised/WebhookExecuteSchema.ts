import { AllowedMentions, BaseMessageComponents, Embed } from "@spacebar/schemas";
import { MessageCreateAttachment, MessageCreateCloudAttachment, PollCreationSchema } from "./MessageCreateSchema";

export interface WebhookExecuteSchema {
    content?: string;
    username?: string;
    avatar_url?: string;
    tts?: boolean;
    embeds?: Embed[];
    allowed_mentions?: AllowedMentions;
    components?: BaseMessageComponents[];
    file?: { filename: string };
    payload_json?: string;
    // TODO: we should create an interface for attachments
    attachments?: (MessageCreateAttachment | MessageCreateCloudAttachment)[];
    flags?: number;
    thread_name?: string;
    applied_tags?: string[];
    message_reference?: {
        message_id: string;
        channel_id?: string;
        guild_id?: string;
        fail_if_not_exists?: boolean;
    };
    sticker_ids?: string[];
    /**
     * @maxLength 25
     */
    nonce?: string;
    enforce_nonce?: boolean; // For Discord compatibility, it's the default behavior here
    poll?: PollCreationSchema;
}

export type WebhookMessageEditSchema = Omit<WebhookExecuteSchema, "content" | "embeds" | "components"> & {
    content?: string | null;
    embeds?: Embed[] | null;
    components?: BaseMessageComponents[] | null;
};
