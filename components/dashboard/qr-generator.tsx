"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { QRCodeSVG } from "qrcode.react"
import { Download, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface TableQR {
  id: string
  table_number: string
  qr_data: string
  created_at: string
}

export function QRGenerator() {
  const [tableNumber, setTableNumber] = useState("")
  const [qrCodes, setQrCodes] = useState<TableQR[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchQRCodes()
  }, [])

  const fetchQRCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("table_qr_codes")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setQrCodes(data || [])
    } catch (err) {
      console.error("Error fetching QR codes:", err)
      setError("Failed to fetch QR codes")
    }
  }

  const generateQR = async () => {
    if (!tableNumber.trim()) {
      setError("Please enter a table number")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const qrUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/welcome?table=${encodeURIComponent(tableNumber.trim())}`

      const { error: dbError } = await supabase.from("table_qr_codes").insert([
        {
          table_number: tableNumber.trim(),
          qr_data: qrUrl,
        },
      ])

      if (dbError) {
        if (dbError.message.includes("duplicate")) {
          setError(`QR code for table ${tableNumber} already exists`)
        } else {
          throw dbError
        }
      } else {
        setTableNumber("")
        await fetchQRCodes()
      }
    } catch (err) {
      console.error("Error generating QR code:", err)
      setError("Failed to generate QR code")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteQR = async (id: string) => {
    try {
      const { error } = await supabase.from("table_qr_codes").delete().eq("id", id)

      if (error) throw error
      setDeleteConfirm(null)
      await fetchQRCodes()
    } catch (err) {
      console.error("Error deleting QR code:", err)
      setError("Failed to delete QR code")
    }
  }

  const downloadQR = (tableNum: string) => {
    const element = document.getElementById(`qr-${tableNum}`)
    if (element) {
      const canvas = element.querySelector("canvas")
      if (canvas) {
        const link = document.createElement("a")
        link.href = canvas.toDataURL("image/png")
        link.download = `table-${tableNum}-qr.png`
        link.click()
      }
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Table QR Code</CardTitle>
          <CardDescription>
            Create QR codes for your tables that customers can scan to access the menu and view promotions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-destructive/10 text-destructive text-sm rounded border border-destructive/20"
            >
              {error}
            </motion.div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="e.g., 1, 2, A1, Window"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateQR()}
              disabled={isLoading}
            />
            <Button onClick={generateQR} disabled={isLoading || !tableNumber.trim()}>
              {isLoading ? "Generating..." : "Generate"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {qrCodes.map((qr, index) => (
            <motion.div
              key={qr.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="flex flex-col items-center p-4">
                <h3 className="font-bold text-lg mb-3">Table {qr.table_number}</h3>

                <div id={`qr-${qr.table_number}`} className="mb-4 p-2 bg-white rounded">
                  <QRCodeSVG value={qr.qr_data} size={200} level="H" includeMargin={true} />
                </div>

                <div className="flex gap-2 w-full">
                  <Button size="sm" variant="outline" onClick={() => downloadQR(qr.table_number)} className="flex-1">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleteConfirm(qr.id)} className="flex-1">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {qrCodes.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-muted-foreground"
        >
          <div className="text-4xl mb-2">📱</div>
          <p>No QR codes generated yet. Create one above to get started!</p>
        </motion.div>
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete QR Code?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The QR code for this table will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deleteQR(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
