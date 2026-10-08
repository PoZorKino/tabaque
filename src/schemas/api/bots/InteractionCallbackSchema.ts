import { MessageCreateAttachment, MessageCreateCloudAttachment, PollCreationSchema } from "@spacebar/schemas/uncategorised";
import { AllowedMentions, BaseMessageComponents, Embed } from "../messages";
import { InteractionCallbackType } from "./InteractionCallbackType";

export interface InteractionCallbackSchema {
    type: InteractionCallbackType;
    data?: unknown;
}
export interface PongCallback extends InteractionCallbackSchema {
    type: InteractionCallbackType.PONG;
}
export interface AckCallback extends InteractionCallbackSchema {
    type: InteractionCallbackType.ACKNOWLEDGE;
}
export interface MessageCallback extends InteractionCallbackSchema {
    type: InteractionCallbackType.CHANNEL_MESSAGE;
    data?: InteractionMessage;
}
export interface MessageWSourceCallback extends InteractionCallbackSchema {
    type: InteractionCallbackType.CHANNEL_MESSAGE_WITH_SOURCE;
    data: InteractionMessage;
}
export interface MessageDWSourceCallback extends InteractionCallbackSchema {
    type: InteractionCallbackType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE;
    data?: InteractionMessage;
}
export interface MessageUpdateCallback extends InteractionCallbackSchema {
    type: InteractionCallbackType.UPDATE_MESSAGE;
    data: InteractionMessage;
}
export interface MessageDUpdateCallback extends InteractionCallbackSchema {
    type: InteractionCallbackType.DEFERRED_UPDATE_MESSAGE;
    data?: InteractionMessage;
}
export interface AutocompleteResultCallback extends InteractionCallbackSchema {
    type: InteractionCallbackType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT;
    data: {
        choices: {
            name: string;
            name_localizations?: { [key: string]: string } | null;
            value: string | number;
        }[];
    };
}
export interface ModalCallback extends InteractionCallbackSchema {
    type: InteractionCallbackType.MODAL;
    data: {
        custom_id: string;
        title: string;
        components: object[];
    };
}
export interface PremiumRequiredCallback extends InteractionCallbackSchema {
    type: InteractionCallbackType.PREMIUM_REQUIRED;
}
export interface IframeModalCallback extends InteractionCallbackSchema {
    type: InteractionCallbackType.IFRAME_MODAL;
    data?: object;
}
export interface LaunchActivityCallback extends InteractionCallbackSchema {
    type: InteractionCallbackType.LAUNCH_ACTIVITY;
}
export type InteractionCallbacksSchema =
    | PongCallback
    | AckCallback
    | MessageCallback
    | MessageWSourceCallback
    | MessageDWSourceCallback
    | MessageUpdateCallback
    | MessageDUpdateCallback
    | AutocompleteResultCallback
    | ModalCallback
    | PremiumRequiredCallback
    | IframeModalCallback
    | LaunchActivityCallback;

export interface InteractionMessage {
    content?: string;
    tts?: boolean;
    embeds?: Embed[];
    allowed_mentions?: AllowedMentions;
    components?: BaseMessageComponents[];
    flags?: number;
    attachments?: (MessageCreateAttachment | MessageCreateCloudAttachment)[];
    poll?: PollCreationSchema;
}
