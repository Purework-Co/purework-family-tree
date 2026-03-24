'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Trash2, 
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Users
} from 'lucide-react'

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
  urutan: number
  status: string
  fromPerson: Person
  toPerson: Person
}

const relationTypes = [
  { value: 'PASANGAN', label: 'Pasangan (Suami/Istri)' },
  { value: 'ORANGTUA_ANAK', label: 'Orang Tua - Anak' },
]

export default function RelationsPage() {
  const [relations, setRelations] = useState<Relation[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [formData, setFormData] = useState({
    fromPersonId: '',
    toPersonId: '',
    relationType: 'ORANGTUA_ANAK',
    urutan: 1,
    status: 'ACTIVE'
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
    try {
      const res = await fetch('/api/relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setShowModal(false)
        resetForm()
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Terjadi kesalahan')
      }
    } catch (error) {
      console.error('Error creating relation:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus relasi ini?')) return
    
    try {
      const res = await fetch(`/api/relations/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting relation:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      fromPersonId: '',
      toPersonId: '',
      relationType: 'ORANGTUA_ANAK',
      urutan: 1,
      status: 'ACTIVE'
    })
  }

  const getRelationLabel = (type: string) => {
    return relationTypes.find(r => r.value === type)?.label || type
  }

  const getRelationDescription = (relation: Relation) => {
    if (relation.relationType === 'PASANGAN') {
      return `${relation.fromPerson.fullname} dan ${relation.toPerson.fullname}`
    } else {
      const child = people.find(p => p.id === relation.toPersonId)
      const parent = people.find(p => p.id === relation.fromPersonId)
      if (parent?.gender === 'MALE') {
        return `${parent.fullname} (Ayah) - ${child?.fullname}`
      } else if (parent?.gender === 'FEMALE') {
        return `${parent.fullname} (Ibu) - ${child?.fullname}`
      }
      return `${relation.fromPerson.fullname} - ${relation.toPerson.fullname}`
    }
  }

  const fromPerson = people.find(p => p.id === formData.fromPersonId)
  const toPerson = people.find(p => p.id === formData.toPersonId)

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
              <th>Detail</th>
              <th>Status</th>
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
                  <td className="text-sm">
                    {getRelationDescription(relation)}
                  </td>
                  <td>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      relation.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {relation.status === 'ACTIVE' ? 'Aktif' : 'Berakhir'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(relation.id)}
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#2D3142]">Tambah Relasi</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[#F4F1DE] rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Jenis Hubungan</label>
                <select
                  value={formData.relationType}
                  onChange={(e) => setFormData({ ...formData, relationType: e.target.value, fromPersonId: '', toPersonId: '' })}
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

              {formData.relationType === 'PASANGAN' ? (
                <>
                  <div>
                    <label className="label">Suami</label>
                    <select
                      value={formData.fromPersonId}
                      onChange={(e) => setFormData({ ...formData, fromPersonId: e.target.value })}
                      className="input"
                      required
                    >
                      <option value="">Pilih suami...</option>
                      {people.filter(p => p.gender === 'MALE').map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.fullname} ({person.callName || 'Laki-laki'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Istri</label>
                    <select
                      value={formData.toPersonId}
                      onChange={(e) => setFormData({ ...formData, toPersonId: e.target.value })}
                      className="input"
                      required
                    >
                      <option value="">Pilih istri...</option>
                      {people.filter(p => p.gender === 'FEMALE' && p.id !== formData.fromPersonId).map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.fullname} ({person.callName || 'Perempuan'})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="label">Orang Tua</label>
                    <select
                      value={formData.fromPersonId}
                      onChange={(e) => setFormData({ ...formData, fromPersonId: e.target.value })}
                      className="input"
                      required
                    >
                      <option value="">Pilih orang tua...</option>
                      {people.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.fullname} ({person.callName || person.gender === 'MALE' ? 'Laki-laki' : 'Perempuan'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Anak</label>
                    <select
                      value={formData.toPersonId}
                      onChange={(e) => setFormData({ ...formData, toPersonId: e.target.value })}
                      className="input"
                      required
                    >
                      <option value="">Pilih anak...</option>
                      {people.filter(p => p.id !== formData.fromPersonId).map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.fullname} ({person.callName || person.gender === 'MALE' ? 'Laki-laki' : 'Perempuan'})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="label">Urutan (untuk pasangan kedua/ketiga)</label>
                <select
                  value={formData.urutan}
                  onChange={(e) => setFormData({ ...formData, urutan: parseInt(e.target.value) })}
                  className="input"
                >
                  <option value={1}>Pertama</option>
                  <option value={2}>Kedua</option>
                  <option value={3}>Ketiga</option>
                </select>
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input"
                >
                  <option value="ACTIVE">Aktif</option>
                  <option value="ENDED">Berakhir (Cerai/Meninggal)</option>
                </select>
              </div>

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
                        <strong>{fromPerson?.fullname}</strong> adalah orang tua dari <strong>{toPerson?.fullname}</strong>
                      </>
                    )}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost flex-1">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
