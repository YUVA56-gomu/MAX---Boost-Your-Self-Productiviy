import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MarkdownEditor } from './MarkdownEditor'

describe('MarkdownEditor Component Unit Tests', () => {
  it('renders in write mode with formatting toolbar and textarea', () => {
    const handleChange = vi.fn()
    render(
      <MarkdownEditor
        value="# Initial Markdown"
        onChange={handleChange}
        placeholder="Type here..."
      />
    )

    expect(screen.getByRole('button', { name: 'Write Mode' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Preview Mode' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('# Initial Markdown')).toBeInTheDocument()

    // Formatting toolbar buttons
    expect(screen.getByRole('button', { name: 'Format Bold' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Format Italic' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Format Heading' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Format Bullet List' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Format Checklist' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Format Code' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Format Quote' })).toBeInTheDocument()
  })

  it('switches to preview mode and renders parsed HTML', () => {
    render(
      <MarkdownEditor
        value="**Bold Text** and `inline code`"
        onChange={vi.fn()}
      />
    )

    // Switch to preview mode
    const previewBtn = screen.getByRole('button', { name: 'Preview Mode' })
    fireEvent.click(previewBtn)

    const previewArea = screen.getByLabelText('Markdown Preview')
    expect(previewArea).toBeInTheDocument()
    expect(previewArea.innerHTML).toContain('<strong>Bold Text</strong>')
    expect(previewArea.innerHTML).toContain('<code>inline code</code>')
  })

  it('inserts markdown syntax on toolbar button click', () => {
    const handleChange = vi.fn()
    render(
      <MarkdownEditor
        value=""
        onChange={handleChange}
      />
    )

    const boldBtn = screen.getByRole('button', { name: 'Format Bold' })
    fireEvent.click(boldBtn)

    expect(handleChange).toHaveBeenCalledWith('**bold text**')
  })

  it('handles empty value preview state gracefully', () => {
    render(
      <MarkdownEditor
        value=""
        onChange={vi.fn()}
      />
    )

    const previewBtn = screen.getByRole('button', { name: 'Preview Mode' })
    fireEvent.click(previewBtn)

    expect(screen.getByText(/Nothing to preview yet/i)).toBeInTheDocument()
  })
})
