import { checkUsage, checkProUsage } from "@/lib/usage"

export async function getMessageUsage(
  userId: string,
  isAuthenticated: boolean
) {
  try {
    // Get actual usage data from the database
    const usage = await checkUsage(userId)
    const proUsage = await checkProUsage(userId)
    
    return {
      dailyCount: usage.dailyCount,
      dailyLimit: usage.dailyLimit,
      dailyProCount: proUsage.dailyProCount,
      dailyProLimit: proUsage.limit,
      totalMessages: usage.userData.messageCount || 0,
      remaining: Math.max(0, usage.dailyLimit - usage.dailyCount),
      remainingPro: Math.max(0, proUsage.limit - proUsage.dailyProCount),
      resetDate: usage.userData.dailyReset?.toISOString() || new Date().toISOString(),
      premium: usage.userData.premium || false,
    }
  } catch (error) {
    console.error("Error getting message usage:", error)
    // Return defaults on error
    return {
      dailyCount: 0,
      dailyLimit: 50,
      dailyProCount: 0,
      dailyProLimit: 10,
      totalMessages: 0,
      remaining: 50,
      remainingPro: 10,
      resetDate: new Date().toISOString(),
      premium: false,
    }
  }
}
