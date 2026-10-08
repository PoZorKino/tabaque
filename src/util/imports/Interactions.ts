import { ApplicationCommandType, InteractionType } from "@spacebar/schemas";
import { Snowflake } from "@spacebar/util";
import { HTTPError } from "lambert-server/HTTPError";
import { ProcessLifecycle } from "../util/ProcessLifecycle";

export interface PendingInteraction {
    id: Snowflake;
    token: string;
    timeout?: NodeJS.Timeout;
    expires: NodeJS.Timeout;
    applicationId: string;
    userId: string;
    sessionId?: string;
    channelId: string;
    guildId?: string;
    nonce?: string;
    messageId?: string;
    messageEphemeral?: boolean;
    type: InteractionType;
    commandType?: ApplicationCommandType;
    commandName?: string;
    commandId?: string;
    commandOptions?: unknown[];
    targetId?: string;
    customId?: string;
    componentType?: number;
    authorizingOwners: Record<string, string>;
    forceEphemeral?: boolean;
    triggeringInteraction?: Omit<PendingInteraction, "expires" | "timeout" | "triggeringInteraction">;
    acknowledged: boolean;
    responseMessageId?: string;
    responseEphemeral?: boolean;
    responseLoading?: boolean;
    modalComponents?: unknown[];
}

export const INTERACTION_TOKEN_LIFETIME = 15 * 60 * 1000;

export const pendingInteractions = new Map<Snowflake, PendingInteraction>();
const interactionsByToken = new Map<string, Snowflake>();
let stopping = false;

ProcessLifecycle.eventEmitter.on("stopping", () => {
    stopping = true;
    for (const interaction of pendingInteractions.values()) {
        clearTimeout(interaction.expires);
        clearTimeout(interaction.timeout);
    }
    pendingInteractions.clear();
    interactionsByToken.clear();
});

export function storeInteraction(interaction: Omit<PendingInteraction, "expires" | "acknowledged">) {
    if (stopping) throw new HTTPError("Server is shutting down", 503);
    const previous = pendingInteractions.get(interaction.id);
    if (previous) {
        clearTimeout(previous.expires);
        clearTimeout(previous.timeout);
        interactionsByToken.delete(previous.token);
    }
    const stored: PendingInteraction = {
        ...interaction,
        acknowledged: false,
        expires: setTimeout(() => {
            pendingInteractions.delete(interaction.id);
            interactionsByToken.delete(interaction.token);
        }, INTERACTION_TOKEN_LIFETIME).unref(),
    };
    pendingInteractions.set(interaction.id, stored);
    interactionsByToken.set(interaction.token, interaction.id);
    return stored;
}

export function getInteractionByToken(applicationId: string, token: string) {
    const id = interactionsByToken.get(token);
    const interaction = id ? pendingInteractions.get(id) : undefined;
    if (!interaction || interaction.applicationId !== applicationId) return undefined;
    return interaction;
}
