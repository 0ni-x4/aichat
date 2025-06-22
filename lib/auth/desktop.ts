"use client"

declare global {
  interface Window {
    __TAURI__: any
  }
}

export const isDesktop = () => {
  return typeof window !== "undefined" && 
         typeof window.__TAURI__ !== "undefined"
}

export const desktopOAuth = {
  async signInWithGoogle() {
    if (!isDesktop()) {
      throw new Error("Desktop OAuth can only be used in Tauri environment")
    }

    try {
      // Use Tauri shell API to open browser
      const tauriShell = await import("@tauri-apps/api/shell").catch(() => null)
      
      if (!tauriShell) {
        throw new Error("Tauri shell API not available")
      }
      
      // Open browser for OAuth
      const authUrl = `${window.location.origin}/api/auth/signin/google?callbackUrl=${encodeURIComponent(window.location.origin + '/auth/callback')}`
      
      await tauriShell.open(authUrl)
      
      // Return a promise that resolves when the user completes authentication
      return new Promise((resolve, reject) => {
        // Listen for OAuth completion
        const checkAuthStatus = async () => {
          try {
            const response = await fetch('/api/auth/session')
            const session = await response.json()
            
            if (session?.user) {
              resolve(session)
            } else {
              // Keep checking every 2 seconds
              setTimeout(checkAuthStatus, 2000)
            }
          } catch (error) {
            reject(error)
          }
        }
        
        // Start checking after a short delay
        setTimeout(checkAuthStatus, 1000)
        
        // Timeout after 5 minutes
        setTimeout(() => {
          reject(new Error("OAuth timeout"))
        }, 300000)
      })
    } catch (error) {
      console.error("Desktop OAuth error:", error)
      throw error
    }
  },

  async signInWithGitHub() {
    if (!isDesktop()) {
      throw new Error("Desktop OAuth can only be used in Tauri environment")
    }

    try {
      const tauriShell = await import("@tauri-apps/api/shell").catch(() => null)
      
      if (!tauriShell) {
        throw new Error("Tauri shell API not available")
      }
      
      const authUrl = `${window.location.origin}/api/auth/signin/github?callbackUrl=${encodeURIComponent(window.location.origin + '/auth/callback')}`
      
      await tauriShell.open(authUrl)
      
      return new Promise((resolve, reject) => {
        const checkAuthStatus = async () => {
          try {
            const response = await fetch('/api/auth/session')
            const session = await response.json()
            
            if (session?.user) {
              resolve(session)
            } else {
              setTimeout(checkAuthStatus, 2000)
            }
          } catch (error) {
            reject(error)
          }
        }
        
        setTimeout(checkAuthStatus, 1000)
        setTimeout(() => reject(new Error("OAuth timeout")), 300000)
      })
    } catch (error) {
      console.error("Desktop OAuth error:", error)
      throw error
    }
  }
} 