import { UsageLimitError } from "@/lib/api"
import {
  AUTH_DAILY_MESSAGE_LIMIT,
  DAILY_LIMIT_PRO_MODELS,
  FREE_MODELS_IDS,
  NON_AUTH_DAILY_MESSAGE_LIMIT,
} from "@/lib/config"
import { prisma } from "@/lib/prisma"

const isFreeModel = (modelId: string) => FREE_MODELS_IDS.includes(modelId)
const isProModel = (modelId: string): boolean => !isFreeModel(modelId)

/**
 * Checks the user's daily usage to see if they've reached their limit.
 * Uses the `anonymous` flag from the user record to decide which daily limit applies.
 *
 * @param userId - The ID of the user.
 * @returns User data including message counts and reset date
 */
export async function checkUsage(userId: string) {
  try {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        messageCount: true,
        dailyMessageCount: true,
        dailyReset: true,
        anonymous: true,
        premium: true,
      },
    })

    if (!userData) {
      // User not found, return default data
      return getDefaultUsageData(false)
    }

    // Decide which daily limit to use.
    const isAnonymous = userData.anonymous
    const dailyLimit = isAnonymous
      ? NON_AUTH_DAILY_MESSAGE_LIMIT
      : AUTH_DAILY_MESSAGE_LIMIT

    // Reset the daily counter if the day has changed (using UTC).
    const now = new Date()
    let dailyCount = userData.dailyMessageCount || 0
    const lastReset = userData.dailyReset

    const isNewDay =
      !lastReset ||
      now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
      now.getUTCMonth() !== lastReset.getUTCMonth() ||
      now.getUTCDate() !== lastReset.getUTCDate()

    if (isNewDay) {
      dailyCount = 0
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { 
            dailyMessageCount: 0, 
            dailyReset: now 
          },
        })
      } catch (error) {
        console.log("Could not reset daily count, continuing with defaults")
      }
    }

    // Check if the daily limit is reached.
    if (dailyCount >= dailyLimit) {
      throw new UsageLimitError("Daily message limit reached.")
    }

    return {
      userData,
      dailyCount,
      dailyLimit,
    }
  } catch (error) {
    console.error("Error in checkUsage:", error)
    // Return default values if anything fails
    return getDefaultUsageData(false)
  }
}

function getDefaultUsageData(isAnonymous: boolean) {
  const dailyLimit = isAnonymous
    ? NON_AUTH_DAILY_MESSAGE_LIMIT
    : AUTH_DAILY_MESSAGE_LIMIT

  return {
    userData: {
      messageCount: 0,
      dailyMessageCount: 0,
      dailyReset: new Date(),
      anonymous: isAnonymous,
      premium: false,
    },
    dailyCount: 0,
    dailyLimit,
  }
}

/**
 * Increments both overall and daily message counters for a user.
 *
 * @param userId - The ID of the user.
 */
export async function incrementUsage(userId: string): Promise<void> {
  try {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        messageCount: true,
        dailyMessageCount: true,
      },
    })

    if (!userData) {
      console.log("User not found in incrementUsage, skipping")
      return
    }

    const messageCount = userData.messageCount || 0
    const dailyCount = userData.dailyMessageCount || 0

    // Increment both overall and daily message counts.
    const newOverallCount = messageCount + 1
    const newDailyCount = dailyCount + 1

    await prisma.user.update({
      where: { id: userId },
      data: {
        messageCount: newOverallCount,
        dailyMessageCount: newDailyCount,
        lastActiveAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Error in incrementUsage:", error)
  }
}

export async function checkProUsage(userId: string) {
  try {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        dailyProMessageCount: true,
        dailyProReset: true,
      },
    })

    if (!userData) {
      return {
        dailyProCount: 0,
        limit: DAILY_LIMIT_PRO_MODELS,
      }
    }

    let dailyProCount = userData.dailyProMessageCount || 0
    const now = new Date()
    const lastReset = userData.dailyProReset

    const isNewDay =
      !lastReset ||
      now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
      now.getUTCMonth() !== lastReset.getUTCMonth() ||
      now.getUTCDate() !== lastReset.getUTCDate()

    if (isNewDay) {
      dailyProCount = 0
      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            dailyProMessageCount: 0,
            dailyProReset: now,
          },
        })
      } catch (error) {
        console.log("Could not reset pro usage, continuing with defaults")
      }
    }

    if (dailyProCount >= DAILY_LIMIT_PRO_MODELS) {
      throw new UsageLimitError("Daily Pro model limit reached.")
    }

    return {
      dailyProCount,
      limit: DAILY_LIMIT_PRO_MODELS,
    }
  } catch (error) {
    console.error("Error in checkProUsage:", error)
    return {
      dailyProCount: 0,
      limit: DAILY_LIMIT_PRO_MODELS,
    }
  }
}

export async function incrementProUsage(userId: string) {
  try {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        dailyProMessageCount: true,
      },
    })

    if (!userData) {
      console.log("User not found in incrementProUsage, skipping")
      return
    }

    const count = userData.dailyProMessageCount || 0

    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyProMessageCount: count + 1,
        lastActiveAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Error in incrementProUsage:", error)
  }
}

export async function checkUsageByModel(
  userId: string,
  modelId: string,
  isAuthenticated: boolean
) {
  if (isProModel(modelId)) {
    if (!isAuthenticated) {
      throw new UsageLimitError("You must log in to use this model.")
    }
    return await checkProUsage(userId)
  }

  return await checkUsage(userId)
}

export async function incrementUsageByModel(
  userId: string,
  modelId: string,
  isAuthenticated: boolean
) {
  if (isProModel(modelId)) {
    if (!isAuthenticated) return
    return await incrementProUsage(userId)
  }

  return await incrementUsage(userId)
}

/**
 * Checks the user's daily memory usage to see if they've reached their limit.
 *
 * @param userId - The ID of the user.
 * @returns User data including memory counts and reset date
 */
export async function checkMemoryUsage(userId: string) {
  try {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        memoryCount: true,
        dailyMemoryCount: true,
        dailyMemoryReset: true,
        anonymous: true,
        premium: true,
      },
    })

    if (!userData) {
      // User not found, return default data
      return {
        memoryCount: 0,
        dailyMemoryCount: 0,
        dailyMemoryLimit: 999999, // Unlimited for now
      }
    }

    // Reset the daily counter if the day has changed (using UTC).
    const now = new Date()
    let dailyCount = userData.dailyMemoryCount || 0
    const lastReset = userData.dailyMemoryReset

    const isNewDay =
      !lastReset ||
      now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
      now.getUTCMonth() !== lastReset.getUTCMonth() ||
      now.getUTCDate() !== lastReset.getUTCDate()

    if (isNewDay) {
      dailyCount = 0
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { 
            dailyMemoryCount: 0, 
            dailyMemoryReset: now 
          },
        })
      } catch (error) {
        console.log("Could not reset daily memory count, continuing with defaults")
      }
    }

    return {
      memoryCount: userData.memoryCount || 0,
      dailyMemoryCount: dailyCount,
      dailyMemoryLimit: 999999, // Unlimited for now
    }
  } catch (error) {
    console.error("Error in checkMemoryUsage:", error)
    return {
      memoryCount: 0,
      dailyMemoryCount: 0,
      dailyMemoryLimit: 999999,
    }
  }
}

/**
 * Increments both overall and daily memory counters for a user.
 *
 * @param userId - The ID of the user.
 */
export async function incrementMemoryUsage(userId: string): Promise<void> {
  try {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        memoryCount: true,
        dailyMemoryCount: true,
      },
    })

    if (!userData) {
      console.log("User not found in incrementMemoryUsage, skipping")
      return
    }

    const memoryCount = userData.memoryCount || 0
    const dailyCount = userData.dailyMemoryCount || 0

    // Increment both overall and daily memory counts.
    const newOverallCount = memoryCount + 1
    const newDailyCount = dailyCount + 1

    await prisma.user.update({
      where: { id: userId },
      data: {
        memoryCount: newOverallCount,
        dailyMemoryCount: newDailyCount,
        lastActiveAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Error in incrementMemoryUsage:", error)
  }
}
