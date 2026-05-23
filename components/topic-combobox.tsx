"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Hash, X, Loader2 } from "lucide-react"

export interface TopicOption {
  value: string
  label: string
  source?: string // 'skill' or 'repo'
}

interface TopicComboboxProps {
  selectedTopics: string[]
  onChange: (topics: string[]) => void
  placeholder?: string
}

export function TopicCombobox({
  selectedTopics,
  onChange,
  placeholder = "Filter by topics..."
}: TopicComboboxProps) {
  const [inputValue, setInputValue] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<TopicOption[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/topics?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      // Filter out already selected topics
      const filtered = (data.topics || []).filter(
        (t: TopicOption) => !selectedTopics.includes(t.value)
      )
      setSuggestions(filtered)
    } catch (error) {
      console.error("Failed to fetch topics:", error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedTopics])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (inputValue.length >= 1) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(inputValue)
      }, 200)
    } else {
      setSuggestions([])
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [inputValue, fetchSuggestions])

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [suggestions])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const addTopic = useCallback((value: string, label?: string) => {
    if (!selectedTopics.includes(value)) {
      onChange([...selectedTopics, value])
    }
    setInputValue("")
    setSuggestions([])
    setIsOpen(false)
    inputRef.current?.focus()
  }, [selectedTopics, onChange])

  const removeTopic = useCallback((value: string) => {
    onChange(selectedTopics.filter(t => t !== value))
    inputRef.current?.focus()
  }, [selectedTopics, onChange])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (suggestions.length > 0 && isOpen) {
        addTopic(suggestions[highlightedIndex].value)
      } else if (inputValue.trim().length >= 1) {
        // Allow adding custom topics
        addTopic(inputValue.trim().toLowerCase())
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setIsOpen(true)
      setHighlightedIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
    } else if (e.key === "Escape") {
      setIsOpen(false)
      setInputValue("")
      setSuggestions([])
    } else if (e.key === "Backspace" && inputValue === "" && selectedTopics.length > 0) {
      removeTopic(selectedTopics[selectedTopics.length - 1])
    }
  }

  return (
    <div className="relative flex-1 min-w-[280px]" ref={containerRef}>
      <div className="flex items-center gap-1 flex-wrap bg-background border-2 border-foreground px-2 py-1 min-h-[34px]">
        <Hash className="w-4 h-4 text-muted-foreground shrink-0" />

        {/* Selected topic tags */}
        {selectedTopics.map(topic => (
          <span
            key={topic}
            className="inline-flex items-center gap-1 bg-foreground text-background px-2 py-0.5 text-xs font-medium"
          >
            {topic}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTopic(topic)
              }}
              className="hover:bg-background/20 rounded-sm p-0.5"
              aria-label={`Remove ${topic}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTopics.length === 0 ? placeholder : "Add more..."}
          className="flex-1 min-w-[120px] bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
        />

        {/* Loading indicator */}
        {isLoading && (
          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
        )}
      </div>

      {/* Dropdown suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 border-2 border-foreground bg-background z-50 max-h-48 overflow-y-auto">
          {suggestions.map((option, index) => (
            <button
              key={option.value}
              type="button"
              onClick={() => addTopic(option.value)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-foreground hover:text-background ${
                index === highlightedIndex ? "bg-foreground/10" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && inputValue.length >= 1 && !isLoading && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 border-2 border-foreground bg-background z-50 px-3 py-2 text-sm text-muted-foreground">
          Press Enter to filter by &quot;{inputValue}&quot;
        </div>
      )}
    </div>
  )
}
