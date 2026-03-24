'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Save,
  Eye,
  EyeOff,
  Users
} from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    familyName: '',
    publicPassword: ''
  })

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    fetchSettings()
  }, [session, router])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      setFormData({
        familyName: data.familyName || '',
        publicPassword: ''
      })
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess('')

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setSuccess('Pengaturan berhasil disimpan!')
        setFormData({ ...formData, publicPassword: '' })
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await res.json()
        alert(data.error || 'Terjadi kesalahan')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  if (session?.user?.role !== 'ADMIN' || loading) {
    return null
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2D3142]">Pengaturan</h1>
        <p className="text-[#6B7280]">Konfigurasi nama keluarga dan password publik</p>
      </div>

      <div className="max-w-2xl">
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label flex items-center gap-2">
                <Users className="w-4 h-4" />
                Nama Keluarga
              </label>
              <input
                type="text"
                value={formData.familyName}
                onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                className="input"
                placeholder="Contoh: Keluarga Besar Susanto"
              />
              <p className="text-xs text-[#6B7280] mt-1">
                Nama ini akan muncul di halaman visualisasi pohon keluarga
              </p>
            </div>

            <div>
              <label className="label">
                Password Publik
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.publicPassword}
                  onChange={(e) => setFormData({ ...formData, publicPassword: e.target.value })}
                  className="input pr-11"
                  placeholder={formData.publicPassword ? '••••••••' : 'Masukkan password baru (opsional)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#2D3142]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-[#6B7280] mt-1">
                Kosongkan jika tidak ingin mengubah password. Password ini diperlukan untuk mengakses halaman pohon keluarga dan statistik publik.
              </p>
            </div>

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary w-full"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
