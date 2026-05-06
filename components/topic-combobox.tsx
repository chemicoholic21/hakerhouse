"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Hash, X } from "lucide-react"

export interface TopicOption {
  value: string
  label: string
}

interface TopicComboboxProps {
  options: TopicOption[]
  selectedTopics: string[]
  onChange: (topics: string[]) => void
  placeholder?: string
}

export function TopicCombobox({
  options,
  selectedTopics,
  onChange,
  placeholder = "Filter by topics..."
}: TopicComboboxProps) {
  const [inputValue, setInputValue] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter options based on input and exclude already selected
  const filteredOptions = options.filter(option => {
    const matchesSearch = option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
                          option.value.toLowerCase().includes(inputValue.toLowerCase())
    const notSelected = !selectedTopics.includes(option.value)
    return matchesSearch && notSelected
  })

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

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [inputValue])

  const addTopic = useCallback((value: string) => {
    if (!selectedTopics.includes(value)) {
      onChange([...selectedTopics, value])
    }
    setInputValue("")
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
      if (filteredOptions.length > 0 && isOpen) {
        addTopic(filteredOptions[highlightedIndex].value)
      } else if (inputValue.trim()) {
        // Allow adding custom topics that aren't in the list
        addTopic(inputValue.trim().toLowerCase())
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setIsOpen(true)
      setHighlightedIndex(prev =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
    } else if (e.key === "Escape") {
      setIsOpen(false)
      setInputValue("")
    } else if (e.key === "Backspace" && inputValue === "" && selectedTopics.length > 0) {
      // Remove last topic when backspace is pressed on empty input
      removeTopic(selectedTopics[selectedTopics.length - 1])
    }
  }

  const getOptionLabel = (value: string) => {
    const option = options.find(o => o.value === value)
    return option?.label || value
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
            {getOptionLabel(topic)}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTopic(topic)
              }}
              className="hover:bg-background/20 rounded-sm p-0.5"
              aria-label={`Remove ${getOptionLabel(topic)}`}
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
      </div>

      {/* Dropdown suggestions */}
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 border-2 border-foreground bg-background z-50 max-h-48 overflow-y-auto">
          {filteredOptions.map((option, index) => (
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
      {isOpen && inputValue && filteredOptions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 border-2 border-foreground bg-background z-50 px-3 py-2 text-sm text-muted-foreground">
          Press Enter to add &quot;{inputValue}&quot;
        </div>
      )}
    </div>
  )
}
