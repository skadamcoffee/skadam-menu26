"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // auto-focus input when expanded
  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [expanded])

  return (
    <div className="relative flex items-center">
      {/* SEARCH ICON */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
      )}

      {/* EXPANDED SEARCH */}
      {expanded && (
        <div className="flex items-center w-full">
          <Input
            ref={inputRef}
            placeholder="Search coffee, pastries..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-10 pr-10 bg-white/20 text-white placeholder-white/80 border-none focus:ring-2 focus:ring-yellow-400 rounded-full transition-all w-full"
          />

          {/* CLOSE BUTTON */}
          <button
            onClick={() => setExpanded(false)}
            className="absolute right-3 text-white hover:text-yellow-400"
          >
            <X className="w-4 h-4" />
          </button>

          {/* SEARCH ICON INSIDE INPUT */}
          <Search className="absolute left-3 w-4 h-4 text-white/80" />
        </div>
      )}
    </div>
  )
}
