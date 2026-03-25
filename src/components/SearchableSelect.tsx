'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchableSelectProps {
  value: string
  onChange: (id: string) => void
  options: { id: string; label: string }[]
  placeholder: string
  label?: string
  className?: string
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  label,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.id === value)

  const filtered = searchText
    ? options.filter(o => o.label.toLowerCase().includes(searchText.toLowerCase()))
    : options

  const showMax = 50
  const visible = filtered.slice(0, showMax)
  const hasMore = filtered.length > showMax

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearchText('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = (id: string) => {
    onChange(id)
    setOpen(false)
    setSearchText('')
  }

  return (
    <div ref={ref} className={className}>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`input w-full text-left flex items-center justify-between ${!selected ? 'text-gray-400' : ''}`}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
            <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Cari nama..."
                  className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/30"
                  onMouseDown={(e) => e.stopPropagation()}
                />
                {searchText && (
                  <button
                    type="button"
                    onClick={() => setSearchText('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">
                Tidak ditemukan
              </div>
            ) : (
              <div>
                {visible.map(o => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => handleSelect(o.id)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#F4F1DE] transition-colors ${
                      o.id === value ? 'bg-[#F4F1DE] font-medium' : ''
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
                {hasMore && (
                  <div className="px-4 py-2 text-xs text-gray-400 text-center border-t border-gray-100">
                    Menampilkan {showMax} dari {filtered.length} hasil
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
