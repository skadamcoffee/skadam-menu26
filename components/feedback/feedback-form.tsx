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
}

export function FeedbackForm({ orderId }: FeedbackFormProps) {
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

    try {
      const { data: userData } = await supabase.auth.getUser()

      const { error } = await supabase.from("feedback").insert([
        {
          order_id: orderId,
          user_id: userData?.user?.id,
          rating: selectedRating,
          comment: comment || null,
        },
      ])

      if (error) throw error

      toast.success("Thank you for your feedback! 🎉")
      setSelectedRating(null)
      setComment("")
    } catch (err) {
      console.error("Error submitting feedback:", err)
      toast.error("Failed to submit feedback")
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
