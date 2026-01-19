'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Trash2, MessageSquare, Calendar, Star } from 'lucide-react' // Added icons for better UX
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '../ui/badge'

interface Feedback {
  id: string
  rating: number
  comment: string | null
  created_at: string
  order_id: string
}

const emojiMap: { [key: number]: string } = {
  1: '😞',
  2: '😕',
  3: '😐',
  4: '😊',
  5: '🤩',
}

export function FeedbackManagement() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set()) // For mobile comment expansion
  const supabase = createClient()
  const { toast } = useToast()

  const fetchFeedback = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFeedback(data || [])
    } catch (error: any) {
      console.error('Error fetching feedback:', error)
      toast({
        title: 'Error',
        description: 'Could not fetch feedback data.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  const handleDelete = async (feedbackId: string) => {
    try {
      const { error } = await supabase.from('feedback').delete().eq('id', feedbackId)

      if (error) throw error

      setFeedback((prev) => prev.filter((f) => f.id !== feedbackId))
      toast({
        title: 'Success',
        description: 'Feedback has been deleted.',
      })
    } catch (error: any) {
      console.error('Error deleting feedback:', error)
      toast({
        title: 'Error',
        description: error.message || 'Could not delete feedback.',
        variant: 'destructive',
      })
    }
  }

  const toggleCommentExpansion = (id: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading feedback...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Customer Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedback.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{emojiMap[item.rating]}</span>
                      <span className="font-medium">{item.rating}/5</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {item.comment || <span className="text-muted-foreground">No comment</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {item.order_id.slice(0, 8)}...
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          aria-label="Delete feedback"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Feedback?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this feedback entry.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {feedback.map((item) => (
            <Card key={item.id} className="p-4 shadow-sm border">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{emojiMap[item.rating]}</span>
                    <span className="font-medium text-sm">{item.rating}/5</span>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 p-2"
                        aria-label="Delete feedback"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Feedback?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this feedback entry.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(item.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div>
                  <p className="text-sm font-medium flex items-center gap-1 mb-1">
                    <MessageSquare className="h-4 w-4" />
                    Comment
                  </p>
                  {item.comment ? (
                    <p className="text-sm text-muted-foreground">
                      {expandedComments.has(item.id)
                        ? item.comment
                        : item.comment.length > 100
                        ? `${item.comment.slice(0, 100)}...`
                        : item.comment}
                      {item.comment.length > 100 && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-primary"
                          onClick={() => toggleCommentExpansion(item.id)}
                        >
                          {expandedComments.has(item.id) ? 'Show less' : 'Read more'}
                        </Button>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No comment</p>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs font-mono">
                      {item.order_id.slice(0, 8)}...
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {feedback.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No feedback yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
