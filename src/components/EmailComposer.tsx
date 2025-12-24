"use client"

import { useState, useRef, useEffect } from "react"
import { X, Mail, Paperclip, Smile, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Trash2, Minimize2, Maximize2, Upload, Type, List, ListOrdered } from "lucide-react"
import EmojiPicker from 'emoji-picker-react'
import { toast } from 'sonner'
import { validateFileSize, validateFileType, formatFileSize, ALLOWED_IMAGE_TYPES } from '../utils/fileUtils'
import '../styles/editor.css'

interface EmailComposerProps {
  onClose: () => void
  onSend: (data: EmailData) => Promise<void>
  categories: string[]
  cities: string[]
  countries: string[]
  selectedLeads?: string[]
  defaultType?: 'bulk' | 'category' | 'city' | 'country' | 'selected'
}

export interface EmailData {
  subject: string
  message: string
  type: 'bulk' | 'category' | 'city' | 'country' | 'selected'
  category?: string
  city?: string
  country?: string
  leadIds?: string[]
  cc?: string
  bcc?: string
  attachments?: File[]
}

export default function EmailComposer({ onClose, onSend, categories, cities, countries, selectedLeads = [], defaultType = 'bulk' }: EmailComposerProps) {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [type, setType] = useState<EmailData['type']>(defaultType)
  const [category, setCategory] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [cc, setCc] = useState("")
  const [bcc, setBcc] = useState("")
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isRichText, setIsRichText] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return

    setSending(true)
    try {
      await onSend({
        subject,
        message,
        type,
        category: type === 'category' ? category : undefined,
        city: type === 'city' ? city : undefined,
        country: type === 'country' ? country : undefined,
        leadIds: type === 'selected' ? selectedLeads : undefined,
        cc: cc || undefined,
        bcc: bcc || undefined,
        attachments: attachments.length > 0 ? attachments : undefined
      })
      onClose()
    } catch (error: any) {
      console.error('Email send error:', error)
      // Error is already handled in the parent component
    } finally {
      setSending(false)
    }
  }

  const handleEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji
    
    if (isRichText && editorRef.current) {
      // Get current cursor position
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        const emojiNode = document.createTextNode(emoji)
        range.insertNode(emojiNode)
        range.setStartAfter(emojiNode)
        range.setEndAfter(emojiNode)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        editorRef.current.innerHTML += emoji
      }
      setMessage(editorRef.current.innerHTML)
    } else {
      setMessage(prev => prev + emoji)
    }
    setShowEmojiPicker(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach(file => {
        if (!validateFileSize(file)) {
          toast.error(`Image "${file.name}" is too large. Maximum size is 5MB.`)
          return
        }
        
        if (!validateFileType(file, ALLOWED_IMAGE_TYPES)) {
          toast.error(`"${file.name}" is not a valid image format.`)
          return
        }
        
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string
          setUploadedImages(prev => [...prev, imageUrl])
          
          // Create properly formatted image HTML
          const imgHtml = `<div style="margin: 10px 0; text-align: center;"><img src="${imageUrl}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" alt="${file.name}" /></div>`
          
          if (isRichText && editorRef.current) {
            // Insert at cursor position or at the end
            const selection = window.getSelection()
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0)
              const div = document.createElement('div')
              div.innerHTML = imgHtml
              range.insertNode(div.firstChild!)
            } else {
              editorRef.current.innerHTML += imgHtml
            }
            setMessage(editorRef.current.innerHTML)
          } else {
            // For plain text mode, just add image reference
            setMessage(prev => prev + `\n[Image: ${file.name}]\n`)
          }
          
          toast.success(`Image "${file.name}" uploaded successfully.`)
        }
        reader.readAsDataURL(file)
      })
    }
    
    // Reset input
    if (e.target) {
      e.target.value = ''
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const validFiles: File[] = []
      
      Array.from(files).forEach(file => {
        if (!validateFileSize(file)) {
          toast.error(`File "${file.name}" is too large. Maximum size is 5MB.`)
          return
        }
        
        if (!validateFileType(file)) {
          toast.error(`File "${file.name}" type is not supported.`)
          return
        }
        
        validFiles.push(file)
      })
      
      if (validFiles.length > 0) {
        setAttachments([...attachments, ...validFiles])
        toast.success(`${validFiles.length} file(s) attached successfully.`)
      }
    }
    
    // Reset input
    if (e.target) {
      e.target.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const insertFormatting = (format: string) => {
    if (!isRichText || !editorRef.current) return

    editorRef.current.focus()
    
    try {
      switch(format) {
        case 'bold':
          document.execCommand('bold', false)
          break
        case 'italic':
          document.execCommand('italic', false)
          break
        case 'underline':
          document.execCommand('underline', false)
          break
        case 'align-left':
          document.execCommand('justifyLeft', false)
          break
        case 'align-center':
          document.execCommand('justifyCenter', false)
          break
        case 'align-right':
          document.execCommand('justifyRight', false)
          break
        case 'list':
          document.execCommand('insertUnorderedList', false)
          break
        case 'ordered-list':
          document.execCommand('insertOrderedList', false)
          break
      }
      setMessage(editorRef.current.innerHTML)
    } catch (error) {
      console.warn('Formatting command not supported:', format)
    }
  }

  const handleEditorInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      // Clean up empty paragraphs and normalize content while preserving images
      const cleanContent = content
        .replace(/<div><br><\/div>/g, '<br>')
        .replace(/<div>/g, '<br>')
        .replace(/<\/div>/g, '')
        .replace(/^<br>/, '')
        .replace(/<br>\s*<br>/g, '<br>') // Remove multiple consecutive breaks
      setMessage(cleanContent)
    }
  }

  // Initialize editor content when switching to rich text mode
  useEffect(() => {
    if (isRichText && editorRef.current && message) {
      editorRef.current.innerHTML = message
    }
  }, [isRichText])

  const toggleRichText = () => {
    if (isRichText) {
      // Convert HTML to plain text
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = message
      setMessage(tempDiv.textContent || tempDiv.innerText || '')
    } else {
      // Convert plain text to HTML with line breaks
      const htmlContent = message.replace(/\n/g, '<br>')
      setMessage(htmlContent)
    }
    setIsRichText(!isRichText)
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-4 bg-white border-2 border-gray-900 rounded-t-lg shadow-2xl w-80 z-50">
        <div className="flex items-center justify-between p-3 bg-gray-900 text-white rounded-t-lg cursor-pointer" onClick={() => setIsMinimized(false)}>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span className="text-sm font-medium truncate">{subject || "New Message"}</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="hover:bg-gray-800 rounded p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed ${isFullscreen ? 'inset-0' : 'bottom-0 right-4 max-w-3xl w-full'} bg-white border-2 border-gray-900 ${isFullscreen ? '' : 'rounded-t-lg'} shadow-2xl z-50 flex flex-col ${isFullscreen ? 'h-screen' : 'max-h-[90vh]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          <h3 className="font-semibold">New Message</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsMinimized(true)} className="hover:bg-gray-800 rounded p-1.5 transition">
            <Minimize2 className="w-4 h-4" />
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="hover:bg-gray-800 rounded p-1.5 transition">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="hover:bg-gray-800 rounded p-1.5 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Recipient Type */}
        <div className="flex items-center gap-2 pb-2 border-b">
          <label className="text-sm font-medium text-gray-900 w-16">To:</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'bulk', label: 'All Accessed' },
              { value: 'selected', label: `Selected (${selectedLeads.length})` },
              { value: 'category', label: 'Category' },
              { value: 'city', label: 'City' },
              { value: 'country', label: 'Country' }
            ].map(option => (
              <label key={option.value} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  value={option.value}
                  checked={type === option.value}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-900">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Filter Selectors */}
        {type === 'category' && (
          <div className="flex items-center gap-2 pb-2 border-b">
            <label className="text-sm font-medium text-gray-900 w-16">Category:</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900">
              <option value="">Select category</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        )}

        {type === 'city' && (
          <div className="flex items-center gap-2 pb-2 border-b">
            <label className="text-sm font-medium text-gray-900 w-16">City:</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900">
              <option value="">Select city</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {type === 'country' && (
          <div className="flex items-center gap-2 pb-2 border-b">
            <label className="text-sm font-medium text-gray-900 w-16">Country:</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900">
              <option value="">Select country</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {showCc && (
          <div className="flex items-center gap-2 pb-2 border-b">
            <label className="text-sm font-medium text-gray-900 w-16">Cc:</label>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="email@example.com, email2@example.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
            />
            <button onClick={() => { setShowCc(false); setCc(""); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {showBcc && (
          <div className="flex items-center gap-2 pb-2 border-b">
            <label className="text-sm font-medium text-gray-900 w-16">Bcc:</label>
            <input
              type="text"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              placeholder="email@example.com, email2@example.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
            />
            <button onClick={() => { setShowBcc(false); setBcc(""); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Subject */}
        <div className="flex items-center gap-2 pb-2 border-b">
          <label className="text-sm font-medium text-gray-900 w-16">Subject:</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            className="flex-1 px-3 py-2 border-0 focus:outline-none text-sm text-gray-900"
          />
        </div>

        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 pb-2 border-b bg-gray-50 p-2 rounded relative">
          <button 
            onClick={toggleRichText} 
            className={`p-2 hover:bg-gray-200 rounded transition-colors ${isRichText ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`} 
            title="Toggle Rich Text"
          >
            <Type className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          {isRichText && (
            <>
              <button onClick={() => insertFormatting('bold')} className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Bold">
                <Bold className="w-4 h-4" />
              </button>
              <button onClick={() => insertFormatting('italic')} className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Italic">
                <Italic className="w-4 h-4" />
              </button>
              <button onClick={() => insertFormatting('underline')} className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Underline">
                <Underline className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <button onClick={() => insertFormatting('align-left')} className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Align Left">
                <AlignLeft className="w-4 h-4" />
              </button>
              <button onClick={() => insertFormatting('align-center')} className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Align Center">
                <AlignCenter className="w-4 h-4" />
              </button>
              <button onClick={() => insertFormatting('align-right')} className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Align Right">
                <AlignRight className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <button onClick={() => insertFormatting('list')} className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Bullet List">
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => insertFormatting('ordered-list')} className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Numbered List">
                <ListOrdered className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
            </>
          )}
          
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
            className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors relative" 
            title="Insert Emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
          <button onClick={() => imageInputRef.current?.click()} className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Upload Image">
            <Upload className="w-4 h-4" />
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Attach File">
            <Paperclip className="w-4 h-4" />
          </button>
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="emoji-picker-container">
              <EmojiPicker 
                onEmojiClick={handleEmojiClick}
                width={350}
                height={400}
                previewConfig={{
                  showPreview: false
                }}
              />
            </div>
          )}
        </div>

        {/* Message Body */}
        <div className="border rounded-lg overflow-hidden bg-white">
          {isRichText ? (
            <div
              ref={editorRef}
              contentEditable
              onInput={handleEditorInput}
              onPaste={(e) => {
                e.preventDefault()
                const text = e.clipboardData.getData('text/plain')
                const selection = window.getSelection()
                if (selection && selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0)
                  range.deleteContents()
                  const textNode = document.createTextNode(text)
                  range.insertNode(textNode)
                  range.setStartAfter(textNode)
                  range.setEndAfter(textNode)
                }
                handleEditorInput()
              }}
              className="email-editor w-full p-4 border-0 focus:outline-none text-sm text-gray-900 bg-white leading-relaxed"
              style={{ 
                minHeight: '250px',
                height: isFullscreen ? 'calc(100vh - 500px)' : '250px',
                overflowY: 'auto',
                wordWrap: 'break-word'
              }}
              suppressContentEditableWarning={true}
              data-placeholder="Compose your email..."
            >

            </div>
          ) : (
            <textarea
              value={message.replace(/<[^>]*>/g, '')} // Strip HTML for plain text mode
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Compose your email..."
              className="w-full p-4 border-0 focus:outline-none text-sm text-gray-900 bg-white leading-relaxed resize-none"
              style={{ 
                minHeight: '250px',
                height: isFullscreen ? 'calc(100vh - 500px)' : '250px'
              }}
            />
          )}
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">Attachments ({attachments.length})</p>
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                  <Paperclip className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-900">{file.name}</span>
                  <span className="text-xs text-gray-600">({formatFileSize(file.size)})</span>
                  <button onClick={() => removeAttachment(index)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !message.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Send
              </>
            )}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCc(!showCc)} className="text-sm text-blue-600 hover:underline">
              Cc
            </button>
            <button onClick={() => setShowBcc(!showBcc)} className="text-sm text-blue-600 hover:underline">
              Bcc
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-200 rounded" title="Attach files">
              <Paperclip className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        <button onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900">
          Discard
        </button>
      </div>
    </div>
  )
}