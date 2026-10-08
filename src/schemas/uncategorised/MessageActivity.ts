export interface MessageActivity {
    type: MessageActivityType;
    session_id?: string;
    party_id?: string;
    name_override?: string;
    icon_override?: string;
}

export enum MessageActivityType {
    JOIN = 1,
    // @deprecated
    SPECTATE = 2,
    LISTEN = 3,
    // @deprecated
    WATCH = 4,
    JOIN_REQUEST = 5,
}
