import { StringStringDictionary } from "../../HelperTypes";

export interface ApplicationCommand {
    id: string;
    application_id: string;
    name: string;
    description: string;
    options?: ApplicationCommandOption[];
}

export interface ApplicationCommandOption {
    type: ApplicationCommandOptionType;
    name: string;
    name_localizations?: StringStringDictionary | null;
    description: string;
    description_localizations?: StringStringDictionary | null;
    required?: boolean;
    choices?: ApplicationCommandOptionChoice[];
    options?: ApplicationCommandOption[];
    channel_types?: number[];
    min_value?: number;
    max_value?: number;
    min_length?: number;
    max_length?: number;
    autocomplete?: boolean;
}

export interface ApplicationCommandOptionChoice {
    name: string;
    name_localizations?: StringStringDictionary | null;
    value: string | number;
}

export enum ApplicationCommandOptionType {
    SUB_COMMAND = 1,
    SUB_COMMAND_GROUP = 2,
    STRING = 3,
    INTEGER = 4,
    BOOLEAN = 5,
    USER = 6,
    CHANNEL = 7,
    ROLE = 8,
    MENTIONABLE = 9,
    NUMBER = 10,
    ATTACHMENT = 11,
}

export interface ApplicationCommandInteractionData {
    id: string;
    name: string;
    options?: ApplicationCommandInteractionDataOption[];
}

export interface ApplicationCommandInteractionDataOption {
    name: string;
    value?: unknown;
    options?: ApplicationCommandInteractionDataOption[];
}
