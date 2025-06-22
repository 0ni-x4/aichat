import type { Provider } from "@/lib/providers"

export type { Provider } from "./openproviders/types"
export type ProviderWithoutOllama = Exclude<Provider, "ollama">

// Mock user keys - returns null since we're not storing API keys anymore
export async function getUserKey(
  userId: string,
  provider: Provider
): Promise<string | null> {
  // No API keys stored - return null
  console.log(`Mock: Would get API key for user ${userId}, provider ${provider}`)
  return null
}

export async function setUserKey(
  userId: string,
  provider: Provider,
  apiKey: string
): Promise<void> {
  // Mock function - do nothing
  console.log(`Mock: Would set API key for user ${userId}, provider ${provider}`)
}

export async function deleteUserKey(
  userId: string,
  provider: Provider
): Promise<void> {
  // Mock function - do nothing  
  console.log(`Mock: Would delete API key for user ${userId}, provider ${provider}`)
}

export async function getEffectiveApiKey(
  userId: string,
  provider: ProviderWithoutOllama
): Promise<string | null> {
  // Always return null - no stored keys
  return null
}
