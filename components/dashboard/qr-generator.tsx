"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { QRCodeCanvas } from "qrcode.react"
import { Download, Trash2, QrCode, Search, Loader2, Printer } from "lucide-react"
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
  const [success, setSuccess] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

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
      console.error(err)
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
    setSuccess("")

    try {
      const qrUrl =
        `${window.location.origin}/welcome?table=` +
        encodeURIComponent(tableNumber.trim())

      const { error } = await supabase.from("table_qr_codes").insert([
        {
          table_number: tableNumber.trim(),
          qr_data: qrUrl,
        },
      ])

      if (error) {
        if (error.message.toLowerCase().includes("duplicate")) {
          setError(`QR code for table ${tableNumber} already exists`)
        } else {
          throw error
        }
      } else {
        setSuccess(`QR code for table ${tableNumber} generated successfully!`)
        setTableNumber("")
        fetchQRCodes()
      }
    } catch (err) {
      console.error(err)
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
      setSuccess("QR code deleted successfully!")
      fetchQRCodes()
    } catch (err) {
      console.error(err)
      setError("Failed to delete QR code")
    }
  }

  const downloadQR = (tableNum: string) => {
    const wrapper = document.getElementById(`qr-${tableNum}`)
    if (!wrapper) return

    const canvas = wrapper.querySelector("canvas")
    if (!canvas) return

    const link = document.createElement("a")
    link.href = canvas.toDataURL("image/png")
    link.download = `table-${tableNum}-qr-${new Date().toISOString().split('T')[0]}.png`
    link.click()
  }

  const printQR = (tableNum: string) => {
    const wrapper = document.getElementById(`qr-${tableNum}`)
    if (!wrapper) return

    const canvas = wrapper.querySelector("canvas")
    if (!canvas) return

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Print QR - Table ${tableNum}</title></head>
          <body style="text-align: center; margin: 20px;">
            <h2>Table ${tableNum} QR Code</h2>
            <img src="${canvas.toDataURL()}" style="max-width: 100%; height: auto;" />
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // Filtered QR codes based on search
  const filteredQRCodes = qrCodes.filter((qr) =>
    qr.table_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      {/* Generator */}
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl md:text-2xl">
            <QrCode className="h-6 w-6" />
            Generate Table QR Code
          </CardTitle>
          <CardDescription>
            Create QR codes for your tables that customers can scan to access the menu
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-3 bg-destructive/10 text-destructive rounded-md text-sm border border-destructive/20"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-3 bg-green-50 text-green-700 rounded-md text-sm border border-green-200"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="e.g., 1, 2, A1, Window"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateQR()}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={generateQR}
              disabled={isLoading || !tableNumber.trim()}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Bar */}
      {qrCodes.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by table number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* QR Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredQRCodes.map((qr, index) => (
            <motion.div
              key={qr.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="flex flex-col items-center p-4 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="font-bold text-lg md:text-xl mb-3 text-center">
                  Table {qr.table_number}
                </h3>

                <div
                  id={`qr-${qr.table_number}`}
                  className="bg-white p-2 rounded-lg border shadow-sm mb-4"
                >
                  <QRCodeCanvas
                    value={qr.qr_data}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => downloadQR(qr.table_number)}
                    aria-label={`Download QR for table ${qr.table_number}`}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => printQR(qr.table_number)}
                    aria-label={`Print QR for table ${qr.table_number}`}
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    Print
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setDeleteConfirm(qr.id)}
                    aria-label={`Delete QR for table ${qr.table_number}`}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredQRCodes.length === 0 && qrCodes.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-muted-foreground"
        >
          <Search className="h-12 w-12 mx-auto mb-4" />
          <p>No QR codes match your search.</p>
        </motion.div>
      )}

      {qrCodes.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-muted-foreground"
        >
          <QrCode className="h-12 w-12 mx-auto mb-4" />
          <p>No QR codes yet. Generate one above to get started!</p>
        </motion.div>
      )}

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete QR Code?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The QR code for this table will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirm && deleteQR(deleteConfirm)}
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
