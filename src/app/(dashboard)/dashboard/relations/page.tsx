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
  X,
  Edit2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter
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

const COUPLE_PREFIX = 'couple:'

function makeCoupleId(husbandId: string, wifeId: string) {
  return `${COUPLE_PREFIX}${husbandId}:${wifeId}`
}

function parseCoupleId(id: string): { husbandId: string; wifeId: string } | null {
  if (!id.startsWith(COUPLE_PREFIX)) return null
  const parts = id.slice(COUPLE_PREFIX.length).split(':')
  if (parts.length !== 2) return null
  return { husbandId: parts[0], wifeId: parts[1] }
}

function extractParentId(optionId: string): string {
  const couple = parseCoupleId(optionId)
  return couple ? couple.husbandId : optionId
}

function SortHeader({
  label,
  field,
  currentField,
  order,
  onSort,
}: {
  label: string
  field: string
  currentField: string
  order: 'asc' | 'desc'
  onSort: (field: string) => void
}) {
  const active = currentField === field
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-[#E07A5F] transition-colors"
    >
      {label}
      {active ? (
        order === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
      ) : (
        <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
      )}
    </button>
  )
}

function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string
  value: string
  onChange: (id: string) => void
  options: { id: string; label: string }[]
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.id === value)

  const filtered = searchText
    ? options.filter(o => o.label.toLowerCase().includes(searchText.toLowerCase()))
    : options

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

            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">
                Tidak ditemukan
              </div>
            ) : (
              <div>
                {filtered.map(o => (
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function RelationsPage() {
  const [relations, setRelations] = useState<Relation[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRelation, setEditingRelation] = useState<Relation | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortField, setSortField] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [formData, setFormData] = useState({
    fromPersonId: '',
    toPersonId: '',
    relationType: 'ORANGTUA_ANAK',
    relationSubType: 'BIOLOGICAL',
    urutan: ''
  })

  useEffect(() => {
    fetchData()
  }, [page, search, typeFilter, sortField, sortOrder])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(typeFilter && { type: typeFilter }),
        sort: sortField,
        order: sortOrder,
      })
      const [relationsRes, peopleRes] = await Promise.all([
        fetch(`/api/relations?${params}`),
        fetch('/api/people?limit=1000')
      ])
      const relationsData = await relationsRes.json()
      const peopleData = await peopleRes.json()
      setRelations(relationsData.data || [])
      setTotalPages(relationsData.pagination?.totalPages || 1)
      setTotal(relationsData.pagination?.total || 0)
      setPeople(peopleData.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const submitFromId = formData.fromPersonId
    const submitToId = extractParentId(formData.toPersonId)

    if (!submitFromId || !submitToId) {
      setError('Pilih orang yang valid')
      return
    }

    const submitData = {
      fromPersonId: submitFromId,
      toPersonId: submitToId,
      relationType: formData.relationType,
      relationSubType: formData.relationSubType,
      urutan: formData.urutan ? parseInt(formData.urutan.toString()) : 1
    }

    try {
      const url = editingRelation
        ? `/api/relations/${editingRelation.id}`
        : '/api/relations'
      const method = editingRelation ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (res.ok) {
        setShowModal(false)
        setEditingRelation(null)
        resetForm()
        fetchData()
      } else {
        const data = await res.json()
        setError(data.error || 'Terjadi kesalahan')
      }
    } catch (err) {
      console.error('Error saving relation:', err)
      setError('Terjadi kesalahan')
    }
  }

  const handleEdit = (relation: Relation) => {
    setEditingRelation(relation)

    let parentOptionId = relation.toPersonId
    if (relation.relationType === 'ORANGTUA_ANAK') {
      const coupleOption = parentOptions.find(o => {
        const couple = parseCoupleId(o.id)
        return couple && (couple.husbandId === relation.toPersonId || couple.wifeId === relation.toPersonId)
      })
      if (coupleOption) {
        parentOptionId = coupleOption.id
      }
    }

    setFormData({
      fromPersonId: relation.fromPersonId,
      toPersonId: parentOptionId,
      relationType: relation.relationType,
      relationSubType: relation.relationSubType,
      urutan: relation.urutan > 0 ? relation.urutan.toString() : ''
    })
    setShowModal(true)
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

  const openModal = () => {
    setEditingRelation(null)
    resetForm()
    setShowModal(true)
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
      return `${relation.fromPerson.fullname} \u2192 ${relation.toPerson.fullname}`
    }
  }

  const fromPerson = people.find(p => p.id === formData.fromPersonId)
  const toPersonRaw = formData.toPersonId
  const toPersonIdForPreview = extractParentId(toPersonRaw)
  const toPerson = people.find(p => p.id === toPersonIdForPreview)

  function getCouples() {
    const couples: { husband: Person; wife: Person }[] = []
    const seen = new Set<string>()
    relations
      .filter(r => r.relationType === 'PASANGAN')
      .forEach(r => {
        const key = [r.fromPersonId, r.toPersonId].sort().join('-')
        if (seen.has(key)) return
        seen.add(key)
        if (r.fromPerson.gender === 'MALE' && r.toPerson.gender === 'FEMALE') {
          couples.push({ husband: r.fromPerson, wife: r.toPerson })
        } else if (r.fromPerson.gender === 'FEMALE' && r.toPerson.gender === 'MALE') {
          couples.push({ husband: r.toPerson, wife: r.fromPerson })
        }
      })
    return couples
  }

  const husbandOptions = people
    .filter(p => p.gender === 'MALE')
    .map(p => ({ id: p.id, label: `${p.fullname}${p.callName ? ` (${p.callName})` : ''}` }))

  const wifeOptions = people
    .filter(p => p.gender === 'FEMALE' && p.id !== formData.fromPersonId)
    .map(p => ({ id: p.id, label: `${p.fullname}${p.callName ? ` (${p.callName})` : ''}` }))

  const parentOptions = getCouples().map((c) => ({
    id: makeCoupleId(c.husband.id, c.wife.id),
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
    .map(p => ({
      id: p.id,
      label: `${p.fullname}${p.callName ? ` (${p.callName})` : ''} \u2014 ${p.gender === 'MALE' ? 'Laki-laki' : 'Perempuan'}`
    }))

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3142]">Kelola Relasi</h1>
          <p className="text-[#6B7280]">{total} relasi terdaftar</p>
        </div>
        <button onClick={openModal} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Tambah Relasi
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama anggota..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-11"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="input pl-9 pr-8 min-w-[180px]"
            >
              <option value="">Semua Jenis</option>
              <option value="PASANGAN">Pasangan</option>
              <option value="ORANGTUA_ANAK">Orang Tua - Anak</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="w-12">No.</th>
              <th>
                <SortHeader label="Jenis Hubungan" field="relationType" currentField={sortField} order={sortOrder} onSort={handleSort} />
              </th>
              <th>Subtipe</th>
              <th>
                <SortHeader label="Detail" field="fromPersonId" currentField={sortField} order={sortOrder} onSort={handleSort} />
              </th>
              <th className="w-24">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8">Memuat...</td>
              </tr>
            ) : relations.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-[#6B7280]">
                  {search || typeFilter ? 'Tidak ada hasil yang cocok' : 'Belum ada relasi. Silakan tambah relasi terlebih dahulu.'}
                </td>
              </tr>
            ) : (
              relations.map((relation, idx) => (
                <tr key={relation.id}>
                  <td className="text-[#6B7280] text-sm">{(page - 1) * 10 + idx + 1}</td>
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(relation)}
                        className="p-2 text-[#6B7280] hover:text-[#E07A5F] hover:bg-[#F4F1DE] rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(relation.id)}
                        className="p-2 text-[#6B7280] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
        onClose={() => { setShowModal(false); setEditingRelation(null); resetForm(); }}
        title={editingRelation ? 'Edit Relasi' : 'Tambah Relasi'}
        footer={
          <>
            <button
              type="button"
              onClick={() => { setShowModal(false); setEditingRelation(null); resetForm(); }}
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
              />

              <SearchableSelect
                label="Istri"
                value={formData.toPersonId}
                onChange={(id) => setFormData({ ...formData, toPersonId: id })}
                options={wifeOptions}
                placeholder="Pilih istri..."
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
              />

              <SearchableSelect
                label="Anak"
                value={formData.fromPersonId}
                onChange={(id) => setFormData({ ...formData, fromPersonId: id })}
                options={childOptions}
                placeholder="Pilih anak..."
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
