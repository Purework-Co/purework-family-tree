'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react'
import { Dialog, ConfirmDialog } from '@/components/dialog'

type Person = {
  id: string
  fullname: string
  callName: string | null
  dateOfBirth: string | null
  dateOfDeath: string | null
  gender: 'MALE' | 'FEMALE'
  occupation: string | null
  hometown: string | null
  domicile: string | null
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [formData, setFormData] = useState({
    fullname: '',
    callName: '',
    dateOfBirth: '',
    dateOfDeath: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    occupation: '',
    hometown: '',
    domicile: ''
  })

  useEffect(() => {
    fetchPeople()
  }, [page, search])

  const fetchPeople = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search })
      })
      const res = await fetch(`/api/people?${params}`)
      const data = await res.json()
      setPeople(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching people:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const url = editingPerson ? `/api/people/${editingPerson.id}` : '/api/people'
      const method = editingPerson ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setShowModal(false)
        setEditingPerson(null)
        resetForm()
        fetchPeople()
      } else {
        const data = await res.json()
        setError(data.error || 'Terjadi kesalahan')
      }
    } catch (error) {
      console.error('Error saving person:', error)
      setError('Terjadi kesalahan')
    }
  }

  const handleEdit = (person: Person) => {
    setEditingPerson(person)
    setFormData({
      fullname: person.fullname,
      callName: person.callName || '',
      dateOfBirth: person.dateOfBirth ? person.dateOfBirth.split('T')[0] : '',
      dateOfDeath: person.dateOfDeath ? person.dateOfDeath.split('T')[0] : '',
      gender: person.gender,
      occupation: person.occupation || '',
      hometown: person.hometown || '',
      domicile: person.domicile || ''
    })
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    
    try {
      const res = await fetch(`/api/people/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchPeople()
      }
    } catch (error) {
      console.error('Error deleting person:', error)
    } finally {
      setDeleteId(null)
    }
  }

  const resetForm = () => {
    setFormData({
      fullname: '',
      callName: '',
      dateOfBirth: '',
      dateOfDeath: '',
      gender: 'MALE',
      occupation: '',
      hometown: '',
      domicile: ''
    })
    setError('')
  }

  const openModal = () => {
    setEditingPerson(null)
    resetForm()
    setShowModal(true)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3142]">Kelola Anggota Keluarga</h1>
          <p className="text-[#6B7280]">Tambah, edit, atau hapus data anggota keluarga</p>
        </div>
        <button onClick={openModal} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Tambah Anggota
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-11"
          />
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nama Lengkap</th>
              <th>Nama Panggilan</th>
              <th>Jenis Kelamin</th>
              <th>Tanggal Lahir</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8">Memuat...</td>
              </tr>
            ) : people.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-[#6B7280]">
                  Belum ada data anggota keluarga
                </td>
              </tr>
            ) : (
              people.map((person) => (
                <tr key={person.id}>
                  <td className="font-medium">{person.fullname}</td>
                  <td>{person.callName || '-'}</td>
                  <td>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      person.gender === 'MALE' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-pink-100 text-pink-700'
                    }`}>
                      {person.gender === 'MALE' ? 'Laki-laki' : 'Perempuan'}
                    </span>
                  </td>
                  <td>{formatDate(person.dateOfBirth)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(person)}
                        className="p-2 text-[#6B7280] hover:text-[#E07A5F] hover:bg-[#F4F1DE] rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(person.id)}
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
        onClose={() => { setShowModal(false); setEditingPerson(null); resetForm(); }}
        title={editingPerson ? 'Edit Anggota' : 'Tambah Anggota'}
        footer={
          <>
            <button
              type="button"
              onClick={() => { setShowModal(false); setEditingPerson(null); resetForm(); }}
              className="btn btn-ghost flex-1"
            >
              Batal
            </button>
            <button
              type="submit"
              form="person-form"
              className="btn btn-primary flex-1"
            >
              Simpan
            </button>
          </>
        }
      >
        <form id="person-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nama Lengkap *</label>
              <input
                type="text"
                value={formData.fullname}
                onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Nama Panggilan</label>
              <input
                type="text"
                value={formData.callName}
                onChange={(e) => setFormData({ ...formData, callName: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Jenis Kelamin *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' })}
                className="input"
                required
              >
                <option value="MALE">Laki-laki</option>
                <option value="FEMALE">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="label">Pekerjaan</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Tanggal Lahir</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Tanggal Wafat</label>
              <input
                type="date"
                value={formData.dateOfDeath}
                onChange={(e) => setFormData({ ...formData, dateOfDeath: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Kampung Halaman</label>
            <input
              type="text"
              value={formData.hometown}
              onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">Domisili</label>
            <input
              type="text"
              value={formData.domicile}
              onChange={(e) => setFormData({ ...formData, domicile: e.target.value })}
              className="input"
            />
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Anggota"
        message="Apakah Anda yakin ingin menghapus anggota keluarga ini? Semua relasi juga akan dihapus."
        confirmText="Hapus"
        variant="danger"
      />
    </div>
  )
}
