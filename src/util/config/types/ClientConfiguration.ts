export const DEFAULT_INSTANCE_NAME = "Meowcord";

export class ClientConfiguration {
    useTestClient: boolean = true;
    instanceName: string = DEFAULT_INSTANCE_NAME;
    icon: string | null = null;
    logo: string | null = null;
    helpUrl: string | null = null;
    activityApplicationHost: string | null = null;
    loadingTips: string[] | null = null;
    loadingSvg: string | null = null;
    experiments: Record<string, number> = {};
    // operator grants: id -> experiment name -> variant
    userExperiments: Record<string, Record<string, number>> = {};
    guildExperiments: Record<string, Record<string, number>> = {};
    // gradual rollouts: experiment name -> share of users (0-100, two decimals) who get the variant
    rolloutExperiments: Record<string, { percent: number; variant: number }> = {};
    // how many recent avatars each user keeps; 0 keeps them all
    recentAvatarsLimit: number = 0;
}
