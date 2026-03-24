'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Trash2, 
  X,
  User
} from 'lucide-react'

type UserData = {
  id: string
  username: string
  role: 'ADMIN' | 'CONTRIBUTOR'
  createdAt: string
}

export default function UsersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'CONTRIBUTOR' as 'ADMIN' | 'CONTRIBUTOR'
  })

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    fetchUsers()
  }, [session, router])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setShowModal(false)
        resetForm()
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || 'Terjadi kesalahan')
      }
    } catch (error) {
      console.error('Error creating user:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return
    
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || 'Terjadi kesalahan')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      role: 'CONTRIBUTOR'
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (session?.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3142]">Kelola User</h1>
          <p className="text-[#6B7280]">Tambah atau hapus user yang dapat mengelola keluarga</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Tambah User
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8">Memuat...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-[#6B7280]">
                  Belum ada user
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#3D405B] rounded-full flex items-center justify-center text-white">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="font-medium">{user.username}</span>
                      {user.id === session?.user?.id && (
                        <span className="text-xs text-[#6B7280]">(Anda)</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      user.role === 'ADMIN' 
                        ? 'bg-[#E07A5F] text-white' 
                        : 'bg-[#81B29A] text-white'
                    }`}>
                      {user.role === 'ADMIN' ? 'Admin' : 'Contributor'}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    {user.id !== session?.user?.id && (
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-[#6B7280] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#2D3142]">Tambah User</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[#F4F1DE] rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'CONTRIBUTOR' })}
                  className="input"
                >
                  <option value="CONTRIBUTOR">Contributor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

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
