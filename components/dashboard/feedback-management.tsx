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
import { Trash2 } from 'lucide-react'
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

  if (isLoading) {
    return <div>Loading feedback...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rating</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedback.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <span className="text-xl">{emojiMap[item.rating]}</span>
                  <span className="ml-2">({item.rating})</span>
                </TableCell>
                <TableCell className="max-w-sm">{item.comment || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{item.order_id.slice(0, 8)}...</Badge>
                </TableCell>
                <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this feedback.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id)}>
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
        {feedback.length === 0 && <p className="text-center p-4">No feedback yet.</p>}
      </CardContent>
    </Card>
  )
}
