"use client"

import { useState, useRef } from "react"
import { X, Mail, Paperclip, Image as ImageIcon, Smile, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Link2, Trash2, Minimize2, Maximize2 } from "lucide-react"

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    } finally {
      setSending(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const insertFormatting = (format: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = message.substring(start, end)
    
    let formattedText = ""
    switch(format) {
      case 'bold': formattedText = `**${selectedText}**`; break
      case 'italic': formattedText = `*${selectedText}*`; break
      case 'underline': formattedText = `__${selectedText}__`; break
      default: formattedText = selectedText
    }

    setMessage(message.substring(0, start) + formattedText + message.substring(end))
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

        {/* CC/BCC */}
        {/* <div className="flex items-center gap-2 pb-2 border-b">
          <label className="text-sm font-medium text-gray-900 w-16"></label>
          <div className="flex gap-3">
            {!showCc && <button onClick={() => setShowCc(true)} className="text-sm text-blue-600 hover:underline">Cc</button>}
            {!showBcc && <button onClick={() => setShowBcc(true)} className="text-sm text-blue-600 hover:underline">Bcc</button>}
          </div>
        </div> */}

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
        <div className="flex items-center gap-1 pb-2 border-b bg-gray-50 p-2 rounded">
          <button onClick={() => insertFormatting('bold')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Bold">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => insertFormatting('italic')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Italic">
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={() => insertFormatting('underline')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Underline">
            <Underline className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <button className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Align Left">
            <AlignLeft className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Align Center">
            <AlignCenter className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Align Right">
            <AlignRight className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <button className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Insert Link">
            <Link2 className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Insert Emoji">
            <Smile className="w-4 h-4" />
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Attach File">
            <Paperclip className="w-4 h-4" />
          </button>
        </div>

        {/* Message Body */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Compose your email..."
          className="w-full min-h-[200px] px-3 py-2 border-0 focus:outline-none text-sm resize-none text-gray-900"
          style={{ height: isFullscreen ? 'calc(100vh - 450px)' : '200px' }}
        />

        {/* Attachments */}
        {/* {attachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">Attachments ({attachments.length})</p>
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                  <Paperclip className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-900">{file.name}</span>
                  <span className="text-xs text-gray-600">({(file.size / 1024).toFixed(1)} KB)</span>
                  <button onClick={() => removeAttachment(index)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )} */}
{/* 
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        /> */}
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
          <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-200 rounded" title="Attach files">
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <button onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900">
          Discard
        </button>
      </div>
    </div>
  )
}
