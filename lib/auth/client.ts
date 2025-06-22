"use client"

import { createAuthClient } from "better-auth/react"
import type { User, Session } from "./config"

const baseURL = typeof window !== "undefined" 
  ? window.location.origin 
  : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export const authClient = createAuthClient({
  baseURL,
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient

export type { User, Session } 