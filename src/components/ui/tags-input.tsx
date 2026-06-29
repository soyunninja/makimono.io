import { X } from 'lucide-react'
import { useRef, useState, type InputHTMLAttributes, type KeyboardEvent } from 'react'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type TagsInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string[]
  onValueChange: (value: string[]) => void
  getRemoveTagLabel: (tag: string) => string
}

function normalizeTagKey(tag: string) {
  return tag.trim().toLocaleLowerCase()
}

export function TagsInput({
  className,
  disabled,
  getRemoveTagLabel,
  onBlur,
  onFocus,
  onKeyDown,
  onValueChange,
  placeholder,
  value,
  ...props
}: TagsInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [draft, setDraft] = useState('')

  function commitTag(rawTag: string) {
    const nextTag = rawTag.trim()

    if (nextTag.length === 0) {
      setDraft('')
      return
    }

    const alreadyExists = value.some((tag) => normalizeTagKey(tag) === normalizeTagKey(nextTag))

    if (alreadyExists) {
      setDraft(nextTag)
      return
    }

    onValueChange([...value, nextTag])
    setDraft('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if ((event.key === 'Enter' || event.key === ',') && !event.defaultPrevented) {
      event.preventDefault()
      commitTag(draft)
    }

    if (event.key === 'Backspace' && draft.length === 0 && value.length > 0 && !event.defaultPrevented) {
      event.preventDefault()
      onValueChange(value.slice(0, -1))
    }

    onKeyDown?.(event)
  }

  function removeTag(indexToRemove: number) {
    onValueChange(value.filter((_, index) => index !== indexToRemove))
    inputRef.current?.focus()
  }

  return (
    <div
      className={cn(
        'flex min-h-11 w-full flex-wrap items-center gap-2 rounded-xl border border-input bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      onClick={() => {
        if (!disabled) {
          inputRef.current?.focus()
        }
      }}
    >
      {value.map((tag, index) => (
        <Badge className="gap-1 rounded-full border-border/70 bg-secondary/30 py-1 pl-2 pr-1 text-foreground" key={`${tag}-${index}`} variant="outline">
          <span>{tag}</span>
          <button
            aria-label={getRemoveTagLabel(tag)}
            className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation()
              removeTag(index)
            }}
            type="button"
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        </Badge>
      ))}

      <Input
        {...props}
        className="h-auto min-w-24 flex-1 border-0 bg-transparent px-0 py-0 shadow-none focus-visible:border-0 focus-visible:ring-0"
        disabled={disabled}
        onBlur={onBlur}
        onChange={(event) => {
          setDraft(event.target.value)
        }}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={inputRef}
        value={draft}
      />
    </div>
  )
}
