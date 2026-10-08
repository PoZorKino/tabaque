import { PartialEmoji } from "@spacebar/schemas";

export interface Poll {
    question: PollMedia;
    answers: PollAnswer[];
    expiry: Date;
    allow_multiselect: boolean;
    layout_type?: number;
    results?: PollResult;
}

export interface PollMedia {
    text?: string;
    emoji?: PartialEmoji;
}

export interface PollAnswer {
    answer_id?: number;
    poll_media: PollMedia;
}

export interface PollResult {
    is_finalized: boolean;
    answer_counts: PollAnswerCount[];
}

export interface PollAnswerCount {
    id: string;
    count: number;
    me_voted: boolean;
}

export interface PollUserAnswersSchema {
    answer_ids: string[];
}
