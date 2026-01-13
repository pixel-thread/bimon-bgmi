import { prisma } from "@/src/lib/db/prisma";

/**
 * Get an app setting value by key.
 * Returns null if setting doesn't exist.
 */
export async function getAppSetting(key: string): Promise<string | null> {
    const setting = await prisma.appSetting.findUnique({
        where: { key },
        select: { value: true },
    });
    return setting?.value ?? null;
}

/**
 * Check if merit ban system is enabled.
 * Defaults to true (enabled) if setting doesn't exist.
 */
export async function isMeritBanEnabled(): Promise<boolean> {
    const value = await getAppSetting("meritBanEnabled");
    // Default to true if not set
    if (value === null) return true;
    return value === "true";
}

/**
 * Set an app setting value.
 */
export async function setAppSetting(key: string, value: string): Promise<void> {
    await prisma.appSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
    });
}
