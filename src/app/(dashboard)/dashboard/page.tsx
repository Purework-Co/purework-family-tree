'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Users, 
  User,
  UserPlus,
  Baby,
  Heart,
  Briefcase,
  Calendar,
  ExternalLink
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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/public/statistics')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E07A5F]"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3142]">Dashboard</h1>
          <p className="text-[#6B7280]">Ringkasan statistik {stats?.familyName || 'Keluarga'}</p>
        </div>
        <Link href="/family-tree" className="btn btn-outline text-sm">
          <ExternalLink className="w-4 h-4" />
          Lihat Pohon Keluarga
        </Link>
      </div>

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
    </div>
  )
}
