"use client"

import { useEffect, useState } from "react"

export default function AuthCallback() {
  const [status, setStatus] = useState("Processing authentication...")

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if authentication was successful
        const response = await fetch('/api/auth/get-session')
        const session = await response.json()
        
        if (session?.user) {
          setStatus("Authentication successful! You can close this window.")
          
          // For desktop apps, try to close the browser window
          if (window.opener) {
            // This window was opened by another window (desktop app)
            setTimeout(() => {
              window.close()
            }, 2000)
          } else {
            // Redirect to main app
            setTimeout(() => {
              window.location.href = "/"
            }, 2000)
          }
        } else {
          setStatus("Authentication failed. Please try again.")
        }
      } catch (error) {
        console.error("Auth callback error:", error)
        setStatus("An error occurred during authentication. Please try again.")
      }
    }

    // Small delay to ensure the OAuth process completes
    setTimeout(handleCallback, 1000)
  }, [])

  return (
    <div className="bg-background flex h-dvh w-full flex-col items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <h1 className="text-2xl font-medium">{status}</h1>
        <p className="text-muted-foreground">
          {status.includes("successful") 
            ? "This window will close automatically."
            : "Please wait while we complete your authentication..."
          }
        </p>
      </div>
    </div>
  )
} 