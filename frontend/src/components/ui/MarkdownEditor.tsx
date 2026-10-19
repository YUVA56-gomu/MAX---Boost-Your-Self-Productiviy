import { useState, useRef, useId } from 'react'
import { marked } from 'marked'
import {
  Bold,
  Italic,
  Heading,
  List,
  CheckSquare,
  Code,
  Quote,
  Eye,
  Edit2,
} from 'lucide-react'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  disabled?: boolean
  label?: string
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write task notes, acceptance criteria, or context (Markdown supported)...',
  minHeight = '150px',
  disabled = false,
  label,
}) => {
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editorId = useId()

  // Format selection in textarea with markdown syntax
  const insertSyntax = (prefix: string, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end) || defaultText

    const replacement = `${prefix}${selectedText}${suffix}`
    const newValue = value.substring(0, start) + replacement + value.substring(end)
    onChange(newValue)

    // Restore focus and cursor
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + prefix.length + selectedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // Pre-parse markdown for preview mode
  const getRenderedMarkdown = () => {
    if (!value.trim()) {
      return '<p class="text-[#64748B] italic text-xs">Nothing to preview yet. Write some markdown!</p>'
    }
    try {
      return marked.parse(value, { gfm: true, breaks: true })
    } catch {
      return '<p class="text-rose-400 text-xs">Error parsing markdown.</p>'
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-[#0B0F17]/60 overflow-hidden focus-within:border-indigo-500/60 transition-colors">
      {/* Top Header / Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-[#111827]/80 select-none">
        {/* Left: Toolbar formatting buttons (active in Write mode) */}
        <div className="flex items-center gap-1">
          {label && (
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mr-2">
              {label}
            </span>
          )}

          {tab === 'write' && !disabled && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => insertSyntax('**', '**', 'bold text')}
                className="p-1 rounded text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors"
                title="Bold (Ctrl+B)"
                aria-label="Format Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSyntax('*', '*', 'italic text')}
                className="p-1 rounded text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors"
                title="Italic (Ctrl+I)"
                aria-label="Format Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSyntax('### ', '', 'Heading')}
                className="p-1 rounded text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors"
                title="Heading 3"
                aria-label="Format Heading"
              >
                <Heading className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-3.5 bg-white/10 mx-1" />
              <button
                type="button"
                onClick={() => insertSyntax('- ', '', 'List item')}
                className="p-1 rounded text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors"
                title="Bullet List"
                aria-label="Format Bullet List"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSyntax('- [ ] ', '', 'Checklist task')}
                className="p-1 rounded text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors"
                title="Task Checklist"
                aria-label="Format Checklist"
              >
                <CheckSquare className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSyntax('`', '`', 'code')}
                className="p-1 rounded text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors"
                title="Inline Code"
                aria-label="Format Code"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSyntax('> ', '', 'Quote')}
                className="p-1 rounded text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors"
                title="Blockquote"
                aria-label="Format Quote"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Tab switch (Write vs Preview) */}
        <div className="flex items-center gap-1 bg-[#1E293B]/70 p-0.5 rounded-lg border border-white/5">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
              tab === 'write'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
            aria-label="Write Mode"
          >
            <Edit2 className="w-3 h-3" />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
              tab === 'preview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
            aria-label="Preview Mode"
          >
            <Eye className="w-3 h-3" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {tab === 'write' ? (
        <textarea
          id={editorId}
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{ minHeight }}
          className="w-full p-3 bg-transparent text-xs text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none resize-y leading-relaxed font-mono"
          aria-label="Markdown content"
        />
      ) : (
        <div
          style={{ minHeight }}
          className="w-full p-3 text-xs text-[#F8FAFC] leading-relaxed prose prose-invert prose-xs max-w-none overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: getRenderedMarkdown() as string }}
          aria-label="Markdown Preview"
        />
      )}
    </div>
  )
}
