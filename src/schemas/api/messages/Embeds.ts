export interface Embed {
    title?: string; //title of embed
    type?: EmbedType; // type of embed (always "rich" for webhook embeds)
    description?: string; // description of embed
    url?: string; // url of embed
    timestamp?: Date; // timestamp of embed content
    color?: number; // color code of the embed
    footer?: {
        text: string;
        icon_url?: string;
        proxy_icon_url?: string;
    }; // footer object	footer information
    image?: EmbedImage; // image object	image information
    thumbnail?: EmbedImage; // thumbnail object	thumbnail information
    video?: EmbedImage; // video object	video information
    provider?: {
        name?: string;
        url?: string;
    }; // provider object	provider information
    author?: {
        name?: string;
        url?: string;
        icon_url?: string;
        proxy_icon_url?: string;
    }; // author object	author information
    fields?: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
}

export enum EmbedType {
    rich = "rich",
    image = "image",
    video = "video",
    gifv = "gifv",
    article = "article",
    link = "link",
    poll_result = "poll_result",
    auto_moderation_message = "auto_moderation_message",
    auto_moderation_notification = "auto_moderation_notification",
    // the client draws its own safety cards for these, and only when the message has one embed
    safety_policy_notice = "safety_policy_notice",
    safety_system_notification = "safety_system_notification",
}

export interface EmbedImage {
    url?: string;
    proxy_url?: string;
    height?: number;
    width?: number;
    content_type?: string;
}
