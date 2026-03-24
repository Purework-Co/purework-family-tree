'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Users, 
  BarChart3, 
  Lock, 
  ArrowLeft,
  User,
  UserPlus,
  Baby,
  Heart,
  Briefcase,
  Calendar
} from 'lucide-react'

type Stats = {
  familyName: string
  totalMembers: number
  aliveMembers: number
  deceasedMembers: number
  maleMembers: number
  femaleMembers: number
  averageAge: number
  youngestAge: number
  oldestAge: number
  totalCouples: number
  averageChildren: number
  occupationDistribution: Record<string, number>
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const savedAuth = localStorage.getItem('public_auth')
    if (savedAuth) {
      setAuthenticated(true)
      fetchStats()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/public/statistics')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setChecking(true)

    try {
      const res = await fetch('/api/public/validate-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await res.json()

      if (data.valid) {
        setAuthenticated(true)
        localStorage.setItem('public_auth', 'true')
        fetchStats()
      } else {
        setError('Password salah')
      }
    } catch {
      setError('Terjadi kesalahan')
    } finally {
      setChecking(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('public_auth')
    setAuthenticated(false)
    setStats(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F1DE] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E07A5F]"></div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#F4F1DE] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-[#6B7280] hover:text-[#2D3142] mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Beranda
          </Link>

          <div className="card text-center">
            <div className="w-16 h-16 bg-[#81B29A] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#2D3142] mb-2">
              Statistik Keluarga
            </h1>
            <p className="text-[#6B7280] mb-6">
              Masukkan password publik untuk melihat statistik keluarga
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Masukkan password"
                required
              />
              <button
                type="submit"
                disabled={checking}
                className="btn btn-primary w-full"
              >
                {checking ? 'Memuat...' : 'Lihat Statistik'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F1DE]">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#81B29A] rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#2D3142]">
              {stats?.familyName || 'Keluarga'} - Statistik
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/family-tree" className="btn btn-outline text-sm">
              Lihat Pohon
            </Link>
            <button onClick={handleLogout} className="btn btn-ghost text-sm">
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#E07A5F] rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Total Anggota</p>
                <p className="text-2xl font-bold text-[#2D3142]">{stats?.totalMembers || 0}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Laki-laki</p>
                <p className="text-2xl font-bold text-[#2D3142]">{stats?.maleMembers || 0}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Perempuan</p>
                <p className="text-2xl font-bold text-[#2D3142]">{stats?.femaleMembers || 0}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Masih Hidup</p>
                <p className="text-2xl font-bold text-[#2D3142]">{stats?.aliveMembers || 0}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Sudah Wafat</p>
                <p className="text-2xl font-bold text-[#2D3142]">{stats?.deceasedMembers || 0}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#81B29A] rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Total Pasangan</p>
                <p className="text-2xl font-bold text-[#2D3142]">{stats?.totalCouples || 0}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Rata-rata Usia</p>
                <p className="text-2xl font-bold text-[#2D3142]">{stats?.averageAge || 0} <span className="text-sm font-normal">tahun</span></p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Baby className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Usia Termuda</p>
                <p className="text-2xl font-bold text-[#2D3142]">{stats?.youngestAge || 0} <span className="text-sm font-normal">tahun</span></p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Usia Tertua</p>
                <p className="text-2xl font-bold text-[#2D3142]">{stats?.oldestAge || 0} <span className="text-sm font-normal">tahun</span></p>
              </div>
            </div>
          </div>

          <div className="card md:col-span-2 lg:col-span-3">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#3D405B] rounded-xl flex items-center justify-center">
                <Baby className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Rata-rata Anak per Orang Tua</p>
                <p className="text-2xl font-bold text-[#2D3142]">{stats?.averageChildren || 0} <span className="text-sm font-normal">anak</span></p>
              </div>
            </div>
          </div>

          {stats?.occupationDistribution && Object.keys(stats.occupationDistribution).length > 0 && (
            <div className="card md:col-span-2 lg:col-span-3">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#E07A5F] rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-[#2D3142]">Distribusi Pekerjaan</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(stats.occupationDistribution).map(([job, count]) => (
                  <div key={job} className="flex items-center justify-between p-3 bg-[#F4F1DE] rounded-xl">
                    <span className="text-[#2D3142]">{job}</span>
                    <span className="font-bold text-[#E07A5F]">{count} orang</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
