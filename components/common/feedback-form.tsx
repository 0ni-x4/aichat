"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

interface FeedbackFormProps {
  userId?: string
  onClose: () => void
}

export function FeedbackForm({ userId, onClose }: FeedbackFormProps) {
  const [feedback, setFeedback] = useState("")
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      return
    }

    setSubmitting(true)

    try {
      // Mock feedback submission - just show success
      console.log(`Mock feedback submission from ${email || userId}: ${feedback}`)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert("Thank you for your feedback! (Note: This is a mock submission)")
      onClose()
    } catch (error) {
      console.error("Feedback submission error:", error)
      alert("Failed to submit feedback. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email (optional)
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
        />
      </div>
      
      <div>
        <label htmlFor="feedback" className="block text-sm font-medium mb-1">
          Feedback *
        </label>
        <Textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Tell us what you think..."
          rows={4}
          required
        />
      </div>
      
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={submitting || !feedback.trim()}>
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </div>
  )
}
