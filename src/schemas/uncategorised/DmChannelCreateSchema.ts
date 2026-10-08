export interface DmChannelCreateSchema {
    name?: string;
    recipients?: string[];
    recipient_id?: string;
    access_tokens?: string[]; //Ignored in Spacebar for now, but makes bots happy
}
