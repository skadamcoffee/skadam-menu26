"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"
import { toast } from "sonner"

const emojis = [
  { rating: 1, emoji: "😞", label: "Poor" },
  { rating: 2, emoji: "😕", label: "Fair" },
  { rating: 3, emoji: "😐", label: "Good" },
  { rating: 4, emoji: "😊", label: "Very Good" },
  { rating: 5, emoji: "🤩", label: "Excellent" },
]

interface FeedbackFormProps {
  orderId: string
  onFeedbackSubmitted: (feedback: any) => void
}

export function FeedbackForm({ orderId, onFeedbackSubmitted }: FeedbackFormProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!selectedRating) {
      toast.error("Please select a rating")
      return
    }

    setIsSubmitting(true)
    console.log(`Submitting feedback for order: ${orderId}`)

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.error("Error fetching user:", authError)
        toast.error("Could not verify user. Please try again.")
        return
      }

      console.log("Current user:", user)

      const feedbackData = {
        order_id: orderId,
        user_id: user?.id, // Can be null for anonymous users
        rating: selectedRating,
        comment: comment || null,
      }

      console.log("Submitting data:", feedbackData)

      const { data: insertedFeedback, error } = await supabase
        .from("feedback")
        .insert(feedbackData)
        .select()
        .single()

      if (error) {
        console.error("Supabase insert error:", error)
        throw error
      }

      console.log("Feedback submitted successfully:", insertedFeedback)
      toast.success("Thank you for your feedback! 🎉")
      onFeedbackSubmitted(insertedFeedback)
      setSelectedRating(null)
      setComment("")
    } catch (err: any) {
      console.error("Error submitting feedback:", err)
      if (err.message.includes("violates row-level security policy")) {
        toast.error("Submission failed. You may not have permission to leave feedback for this order.")
      } else {
        toast.error(`Failed to submit feedback: ${err.message}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>How was your experience?</CardTitle>
        <CardDescription>Your feedback helps us improve</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Emoji Rating Selection */}
        <div className="flex justify-center gap-4">
          {emojis.map((item) => (
            <motion.button
              key={item.rating}
              onClick={() => setSelectedRating(item.rating)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                selectedRating === item.rating
                  ? "bg-primary text-primary-foreground scale-110"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <span className="text-3xl mb-1">{item.emoji}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Comment Section */}
        {selectedRating && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <Textarea
              placeholder="Tell us more about your experience (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
              className="resize-none"
              rows={3}
            />
          </motion.div>
        )}

        {/* Submit Button */}
        {selectedRating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="w-full">
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
