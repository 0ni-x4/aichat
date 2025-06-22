"use client"

import { API_ROUTE_CSRF } from "@/lib/routes"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"

export function LayoutClient() {
  useQuery({
    queryKey: ["csrf-init"],
    queryFn: async () => {
      await fetch(API_ROUTE_CSRF)
      return true
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  })

  // Detect if running in Tauri and apply appropriate CSS classes
  useEffect(() => {
    const isTauri = typeof window !== 'undefined' && 
      (window as any).__TAURI__ !== undefined

    if (isTauri) {
      document.documentElement.classList.add('tauri')
      document.body.classList.add('tauri')
    }
  }, [])

  return null
}
