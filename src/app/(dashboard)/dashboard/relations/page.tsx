'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Plus, 
  Trash2, 
  ChevronLeft,
  ChevronRight,
  Heart,
  Users,
  Search,
  X
} from 'lucide-react'
import { Dialog, ConfirmDialog } from '@/components/dialog'

type Person = {
  id: string
  fullname: string
  callName: string | null
  gender: 'MALE' | 'FEMALE'
}

type Relation = {
  id: string
  fromPersonId: string
  toPersonId: string
  relationType: string
  relationSubType: string
  urutan: number
  fromPerson: Person
  toPerson: Person
}

const relationTypes = [
  { value: 'PASANGAN', label: 'Pasangan (Suami/Istri)' },
  { value: 'ORANGTUA_ANAK', label: 'Orang Tua - Anak' },
]

const relationSubTypes = [
  { value: 'BIOLOGICAL', label: 'Biologis' },
  { value: 'ADOPTED', label: 'Adopsi' },
  { value: 'DIVORCED', label: 'Bercerai' },
]

const subTypeOptions: Record<string, string[]> = {
  PASANGAN: ['BIOLOGICAL', 'DIVORCED'],
  ORANGTUA_ANAK: ['BIOLOGICAL', 'ADOPTED'],
}

function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  label: string
  value: string
  onChange: (id: string) => void
  options: { id: string; label: string }[]
  placeholder: string
  required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.id === value)

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref}>
      <label className="label">{label}</label>
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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama..."
                  className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/30"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">
                Tidak ditemukan
              </div>
            ) : (
              <div>
                {!value && (
                  <button
                    type="button"
                    onClick={() => { onChange(''); setOpen(false); setSearch('') }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-50"
                  >
                    {placeholder}
                  </button>
                )}
                {filtered.map(o => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => { onChange(o.id); setOpen(false); setSearch('') }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#F4F1DE] transition-colors ${
                      o.id === value ? 'bg-[#F4F1DE] font-medium' : ''
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {required && !value && (
        <input
          tabIndex={-1}
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
          value={value}
          onChange={() => {}}
          required
        />
      )}
    </div>
  )
}

export default function RelationsPage() {
  const [relations, setRelations] = useState<Relation[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [formData, setFormData] = useState({
    fromPersonId: '',
    toPersonId: '',
    relationType: 'ORANGTUA_ANAK',
    relationSubType: 'BIOLOGICAL',
    urutan: ''
  })

  useEffect(() => {
    fetchData()
  }, [page])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [relationsRes, peopleRes] = await Promise.all([
        fetch(`/api/relations?page=${page}&limit=20`),
        fetch('/api/people?limit=1000')
      ])
      const relationsData = await relationsRes.json()
      const peopleData = await peopleRes.json()
      setRelations(relationsData.data || [])
      setTotalPages(relationsData.pagination?.totalPages || 1)
      setPeople(peopleData.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const submitData = {
      ...formData,
      urutan: formData.urutan ? parseInt(formData.urutan.toString()) : 1
    }
    
    try {
      const res = await fetch('/api/relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (res.ok) {
        setShowModal(false)
        resetForm()
        fetchData()
      } else {
        const data = await res.json()
        setError(data.error || 'Terjadi kesalahan')
      }
    } catch (err) {
      console.error('Error creating relation:', err)
      setError('Terjadi kesalahan')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    
    try {
      const res = await fetch(`/api/relations/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting relation:', error)
    } finally {
      setDeleteId(null)
    }
  }

  const resetForm = () => {
    setFormData({
      fromPersonId: '',
      toPersonId: '',
      relationType: 'ORANGTUA_ANAK',
      relationSubType: 'BIOLOGICAL',
      urutan: ''
    })
    setError('')
  }

  const getRelationLabel = (type: string) => {
    return relationTypes.find(r => r.value === type)?.label || type
  }

  const getSubTypeLabel = (subType: string) => {
    return relationSubTypes.find(r => r.value === subType)?.label || subType
  }

  const getRelationDescription = (relation: Relation) => {
    if (relation.relationType === 'PASANGAN') {
      return `${relation.fromPerson.fullname} dan ${relation.toPerson.fullname}`
    } else {
      return `${relation.fromPerson.fullname} → ${relation.toPerson.fullname}`
    }
  }

  const fromPerson = people.find(p => p.id === formData.fromPersonId)
  const toPerson = people.find(p => p.id === formData.toPersonId)

  const maleOptions = people
    .filter(p => p.gender === 'MALE')
    .map(p => ({ id: p.id, label: `${p.fullname}${p.callName ? ` (${p.callName})` : ''}` }))

  const femaleOptions = people
    .filter(p => p.gender === 'FEMALE' && p.id !== formData.fromPersonId)
    .map(p => ({ id: p.id, label: `${p.fullname}${p.callName ? ` (${p.callName})` : ''}` }))

  const husbandOptions = maleOptions
  const wifeOptions = femaleOptions

  const parentOptions = getCouples().map((c) => ({
    id: c.husband.id,
    label: `${c.husband.fullname} & ${c.wife.fullname}`
  })).concat(
    people
      .filter(p => {
        const hasSpouse = relations.some(r =>
          r.relationType === 'PASANGAN' &&
          (r.fromPersonId === p.id || r.toPersonId === p.id)
        )
        return !hasSpouse
      })
      .map(p => ({ id: p.id, label: `${p.fullname} (Belum pasang)` }))
  )

  const childOptions = people
    .filter(p => p.id !== formData.fromPersonId)
    .map(p => ({
      id: p.id,
      label: `${p.fullname}${p.callName ? ` (${p.callName})` : ''} — ${p.gender === 'MALE' ? 'Laki-laki' : 'Perempuan'}`
    }))

  function getCouples() {
    const couples: { husband: Person; wife: Person }[] = []
    relations
      .filter(r => r.relationType === 'PASANGAN')
      .forEach(r => {
        if (r.fromPerson.gender === 'MALE' && r.toPerson.gender === 'FEMALE') {
          couples.push({ husband: r.fromPerson, wife: r.toPerson })
        } else if (r.fromPerson.gender === 'FEMALE' && r.toPerson.gender === 'MALE') {
          couples.push({ husband: r.toPerson, wife: r.fromPerson })
        }
      })
    return couples
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3142]">Kelola Relasi</h1>
          <p className="text-[#6B7280]">Atur hubungan keluarga antar anggota</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Tambah Relasi
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Jenis Hubungan</th>
              <th>Subtipe</th>
              <th>Detail</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8">Memuat...</td>
              </tr>
            ) : relations.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-[#6B7280]">
                  Belum ada relasi. Silakan tambah relasi terlebih dahulu.
                </td>
              </tr>
            ) : (
              relations.map((relation) => (
                <tr key={relation.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        relation.relationType === 'PASANGAN' 
                          ? 'bg-pink-100 text-pink-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {relation.relationType === 'PASANGAN' 
                          ? <Heart className="w-4 h-4" />
                          : <Users className="w-4 h-4" />
                        }
                      </div>
                      <span className="font-medium">{getRelationLabel(relation.relationType)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      relation.relationSubType === 'BIOLOGICAL' ? 'bg-green-100 text-green-700' :
                      relation.relationSubType === 'ADOPTED' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {getSubTypeLabel(relation.relationSubType)}
                    </span>
                  </td>
                  <td className="text-sm">
                    {getRelationDescription(relation)}
                  </td>
                  <td>
                    <button
                      onClick={() => setDeleteId(relation.id)}
                      className="p-2 text-[#6B7280] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-ghost disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-4 text-sm text-[#6B7280]">
            Halaman {page} dari {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-ghost disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      <Dialog
        open={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title="Tambah Relasi"
        footer={
          <>
            <button
              type="button"
              onClick={() => { setShowModal(false); resetForm(); }}
              className="btn btn-ghost flex-1"
            >
              Batal
            </button>
            <button
              type="submit"
              form="relation-form"
              className="btn btn-primary flex-1"
            >
              Simpan
            </button>
          </>
        }
      >
        <form id="relation-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="label">Jenis Hubungan</label>
            <select
              value={formData.relationType}
              onChange={(e) => setFormData({ ...formData, relationType: e.target.value, relationSubType: 'BIOLOGICAL', fromPersonId: '', toPersonId: '' })}
              className="input"
              required
            >
              {relationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Subtipe Hubungan</label>
            <select
              value={formData.relationSubType}
              onChange={(e) => setFormData({ ...formData, relationSubType: e.target.value })}
              className="input"
              required
            >
              {relationSubTypes
                .filter(st => (subTypeOptions[formData.relationType] || []).includes(st.value))
                .map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
            </select>
          </div>

          {formData.relationType === 'PASANGAN' ? (
            <>
              <SearchableSelect
                label="Suami"
                value={formData.fromPersonId}
                onChange={(id) => setFormData({ ...formData, fromPersonId: id, toPersonId: '' })}
                options={husbandOptions}
                placeholder="Pilih suami..."
                required
              />

              <SearchableSelect
                label="Istri"
                value={formData.toPersonId}
                onChange={(id) => setFormData({ ...formData, toPersonId: id })}
                options={wifeOptions}
                placeholder="Pilih istri..."
                required
              />

              <div>
                <label className="label">Urutan Pasangan (Opsional)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.urutan}
                  onChange={(e) => setFormData({ ...formData, urutan: e.target.value })}
                  className="input"
                  placeholder="1"
                />
                <p className="text-xs text-[#6B7280] mt-1">Contoh: 2 untuk istri kedua</p>
              </div>
            </>
          ) : (
            <>
              <SearchableSelect
                label="Orang Tua"
                value={formData.toPersonId}
                onChange={(id) => setFormData({ ...formData, toPersonId: id })}
                options={parentOptions}
                placeholder="Pilih orang tua..."
                required
              />

              <SearchableSelect
                label="Anak"
                value={formData.fromPersonId}
                onChange={(id) => setFormData({ ...formData, fromPersonId: id })}
                options={childOptions}
                placeholder="Pilih anak..."
                required
              />
            </>
          )}

          {formData.fromPersonId && formData.toPersonId && (
            <div className="p-4 bg-[#F4F1DE] rounded-xl">
              <p className="text-sm text-[#6B7280] mb-2">Preview:</p>
              <p className="text-[#2D3142]">
                {formData.relationType === 'PASANGAN' ? (
                  <>
                    <strong>{fromPerson?.fullname}</strong> (Suami) - <strong>{toPerson?.fullname}</strong> (Istri)
                  </>
                ) : (
                  <>
                    <strong>{toPerson?.fullname}</strong> adalah orang tua dari <strong>{fromPerson?.fullname}</strong>
                  </>
                )}
              </p>
            </div>
          )}
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Relasi"
        message="Apakah Anda yakin ingin menghapus relasi ini?"
        confirmText="Hapus"
        variant="danger"
      />
    </div>
  )
}
