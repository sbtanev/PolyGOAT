export const daysAgoIso = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
