export class SafetyConfiguration {
    harmfulLinkDomains: string[] = [];
    raidJoinThreshold: number = 15;
    raidJoinWindowSeconds: number = 120;
    dmRaidThreshold: number = 10;
    dmRaidWindowSeconds: number = 300;
    mentionRaidThreshold: number = 3;
    mentionRaidWindowSeconds: number = 300;
}
