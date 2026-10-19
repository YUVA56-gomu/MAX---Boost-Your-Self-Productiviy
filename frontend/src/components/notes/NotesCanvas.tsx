import React, { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Save,
  Link2,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
  type Note,
} from '@/lib/api'

interface NotesCanvasProps {
  workspaceId: string
  onNoteMutated?: () => void
}

export const NotesCanvas: React.FC<NotesCanvasProps> = ({
  workspaceId,
  onNoteMutated,
}) => {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Editor state for selected note
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editIsPinned, setEditIsPinned] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // New Note Modal
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newIsPinned, setNewIsPinned] = useState(false)

  const loadNotes = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchNotes(workspaceId, searchQuery || undefined)
      setNotes(data)
      if (!selectedNoteId && data.length > 0) {
        setSelectedNoteId(data[0].id)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load notes'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, searchQuery, selectedNoteId])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  // Sync editor fields when selection changes
  useEffect(() => {
    const selected = notes.find((n) => n.id === selectedNoteId)
    if (selected) {
      setEditTitle(selected.title)
      setEditContent(selected.content_markdown || '')
      setEditIsPinned(selected.is_pinned)
      setHasUnsavedChanges(false)
    }
  }, [selectedNoteId, notes])

  const handleSelectNote = (noteId: string) => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes in this note. Switch anyway?')) {
        return
      }
    }
    setSelectedNoteId(noteId)
  }

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    try {
      setError(null)
      const created = await createNote(
        workspaceId,
        newTitle.trim(),
        newContent.trim(),
        newIsPinned
      )
      setNotes((prev) => [created, ...prev])
      setSelectedNoteId(created.id)
      setNewTitle('')
      setNewContent('')
      setNewIsPinned(false)
      setIsCreating(false)
      if (onNoteMutated) onNoteMutated()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create note'
      setError(msg)
    }
  }

  const handleSaveNote = async () => {
    if (!selectedNoteId || !editTitle.trim()) return

    setIsSaving(true)
    setError(null)
    try {
      const updated = await updateNote(selectedNoteId, {
        title: editTitle.trim(),
        content_markdown: editContent,
        is_pinned: editIsPinned,
      })
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
      setHasUnsavedChanges(false)
      if (onNoteMutated) onNoteMutated()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save note'
      setError(msg)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return

    try {
      setError(null)
      await deleteNote(noteId)
      const remaining = notes.filter((n) => n.id !== noteId)
      setNotes(remaining)
      if (selectedNoteId === noteId) {
        setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null)
      }
      if (onNoteMutated) onNoteMutated()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete note'
      setError(msg)
    }
  }

  const handleTogglePin = async () => {
    if (!selectedNoteId) return
    const nextPinned = !editIsPinned
    setEditIsPinned(nextPinned)
    try {
      const updated = await updateNote(selectedNoteId, { is_pinned: nextPinned })
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update pin status'
      setError(msg)
    }
  }

  const selectedNote = notes.find((n) => n.id === selectedNoteId)

  return (
    <div data-testid="notes-canvas" className="flex-1 flex flex-col h-full bg-[#0B0F17] text-slate-100 overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-5 border-b border-[#1F2937] flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Contextual Notes
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                SQLite & WikiLinks
              </Badge>
            </h1>
            <p className="text-sm text-slate-400">
              Knowledge base supporting tasks and goals with bidirectional [[WikiLink]] intelligence.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            New Note
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={loadNotes}
            disabled={isLoading}
            className="border-[#1F2937] hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl"
            title="Refresh notes"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="mx-6 mt-4 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2.5 flex-shrink-0">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Split View Layout: Sidebar list on left, Editor on right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Note Index */}
        <div className="w-80 md:w-96 border-r border-[#1F2937] flex flex-col bg-[#0E131F] flex-shrink-0">
          {/* Search bar */}
          <div className="p-4 border-b border-[#1F2937]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search notes or wiki concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#131B2A] border border-[#1F2937] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Note List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#1F2937]/50 p-2 space-y-1">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 text-xs">Loading notes...</div>
            ) : notes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No notes found. Create your first note to organize your knowledge.
              </div>
            ) : (
              notes.map((note) => {
                const isSelected = note.id === selectedNoteId
                const dateStr = new Date(note.updated_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
                return (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-white'
                        : 'hover:bg-slate-800/40 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-sm truncate flex-1 flex items-center gap-1.5">
                        {note.is_pinned && (
                          <Pin className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                        )}
                        {note.title}
                      </span>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">{dateStr}</span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {note.content_markdown || <span className="italic text-slate-600">Empty note</span>}
                    </p>

                    {note.outgoing_link_count > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-400/80">
                        <Link2 className="w-3 h-3" />
                        <span>{note.outgoing_link_count} linked references</span>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Editor Area */}
        <div className="flex-1 flex flex-col bg-[#0B0F17] overflow-hidden">
          {selectedNote ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Editor Header Bar */}
              <div className="px-6 py-4 border-b border-[#1F2937] flex items-center justify-between gap-4 flex-shrink-0 bg-[#0E131F]/40">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={handleTogglePin}
                    className={`p-2 rounded-lg border transition-all ${
                      editIsPinned
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'border-[#1F2937] text-slate-500 hover:text-slate-300'
                    }`}
                    title={editIsPinned ? 'Unpin Note' : 'Pin Note'}
                  >
                    <Pin className={`w-4 h-4 ${editIsPinned ? 'fill-amber-400' : ''}`} />
                  </button>

                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => {
                      setEditTitle(e.target.value)
                      setHasUnsavedChanges(true)
                    }}
                    placeholder="Note Title..."
                    className="flex-1 bg-transparent text-lg font-bold text-white focus:outline-none placeholder-slate-600"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {hasUnsavedChanges && (
                    <span className="text-xs text-amber-400 font-medium mr-2">
                      ● Unsaved edits
                    </span>
                  )}

                  <Button
                    onClick={handleSaveNote}
                    disabled={isSaving || !hasUnsavedChanges}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    className="border-[#1F2937] hover:bg-red-950/40 text-slate-500 hover:text-red-400 rounded-xl"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Editor Body */}
              <div className="flex-1 p-6 flex flex-col overflow-hidden">
                <textarea
                  value={editContent}
                  onChange={(e) => {
                    setEditContent(e.target.value)
                    setHasUnsavedChanges(true)
                  }}
                  placeholder="Write your note in Markdown. Use [[Other Note Title]] to create live bidirectional knowledge links..."
                  className="flex-1 w-full bg-transparent text-slate-200 placeholder-slate-600 focus:outline-none resize-none font-mono text-sm leading-relaxed"
                />

                {/* Footer Metadata */}
                <div className="pt-4 border-t border-[#1F2937] flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Updated {new Date(selectedNote.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400/80">
                      <Sparkles className="w-3.5 h-3.5" />
                      WikiLinks supported with [[Note Title]]
                    </span>
                  </div>
                  <span>{editContent.length} characters</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-700" />
              <p className="text-sm">Select a note from the left index or create a new note.</p>
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Create New Note
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Create Note Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#131B2A] border border-[#1F2937] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                New Contextual Note
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Q4 Engineering Objectives or System Design"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-[#1F2937] rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Content (Markdown)
                </label>
                <textarea
                  placeholder="Note body content... Use [[Note Title]] to link other concepts."
                  rows={5}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-[#1F2937] rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinNoteCheck"
                  checked={newIsPinned}
                  onChange={(e) => setNewIsPinned(e.target.checked)}
                  className="rounded bg-[#0B0F17] border-[#1F2937] text-emerald-500 focus:ring-0"
                />
                <label htmlFor="pinNoteCheck" className="text-xs text-slate-300 cursor-pointer">
                  Pin this note to the top of the index
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreating(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 rounded-xl text-xs"
                >
                  Create Note
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default NotesCanvas
