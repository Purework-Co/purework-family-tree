'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { 
  Users, 
  Lock, 
  ArrowLeft,
  X,
  User
} from 'lucide-react'
import FamilyTree, { RawFamilyMember, RawFamilyRelation, buildFamilyAndRelations } from 'reactflow-family-tree'
import 'reactflow-family-tree/dist/style.css'

type PersonNode = {
  id: string
  fullname: string
  callName: string | null
  gender: 'MALE' | 'FEMALE'
  dateOfBirth: string | null
  dateOfDeath: string | null
  occupation: string | null
  age: number | null
  isAlive: boolean
  childrenCount: number
}

type TreeData = {
  familyName: string
  nodes: PersonNode[]
  edges: { id: string; source: string; target: string; type: string }[]
}

export default function FamilyTreePage() {
  const [data, setData] = useState<TreeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [checking, setChecking] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<PersonNode | null>(null)

  useEffect(() => {
    const savedAuth = localStorage.getItem('public_auth')
    if (savedAuth) {
      setAuthenticated(true)
      fetchTreeData()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchTreeData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/public/tree')
      if (res.ok) {
        const jsonData = await res.json()
        setData(jsonData)
      }
    } catch (error) {
      console.error('Error fetching tree:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setChecking(true)

    try {
      const res = await fetch('/api/public/validate-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const result = await res.json()

      if (result.valid) {
        setAuthenticated(true)
        localStorage.setItem('public_auth', 'true')
        fetchTreeData()
      } else {
        setErrorMsg('Password salah')
      }
    } catch {
      setErrorMsg('Terjadi kesalahan')
    } finally {
      setChecking(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('public_auth')
    setAuthenticated(false)
    setData(null)
  }

  const { familyMembersRecord, familyRelationsRecord, rootMemberId } = useMemo(() => {
    if (!data || !data.nodes.length) {
      return { familyMembersRecord: {}, familyRelationsRecord: {}, rootMemberId: '' }
    }

    const familyMembers: RawFamilyMember[] = data.nodes.map(node => ({
      id: node.id,
      data: {
        title: node.fullname,
        titleBgColor: node.gender === 'MALE' ? 'rgb(59, 130, 246)' : 'rgb(236, 72, 153)',
        titleTextColor: 'white',
        subtitles: [
          node.callName || (node.gender === 'MALE' ? 'Laki-laki' : 'Perempuan'),
          node.age !== null ? `${node.age} tahun` : '',
          node.occupation || '',
          !node.isAlive ? 'Almarhum' : ''
        ].filter(Boolean),
        sex: node.gender === 'MALE' ? 'M' as const : 'F' as const,
      }
    }))

    const familyRelations: RawFamilyRelation[] = data.edges.map(edge => ({
      relationType: edge.type === 'PASANGAN' ? 'Partner' as const : 'Child' as const,
      prettyType: edge.type === 'PASANGAN' ? 'Pasangan' as const : 'Anak' as const,
      fromId: edge.source,
      toId: edge.target
    }))

    const nodesWithNoParents = data.nodes.filter(node => {
      const hasParent = data.edges.some(e => e.type === 'ORANGTUA_ANAK' && e.target === node.id)
      return !hasParent
    })

    const [membersRecord, relationsRecord] = buildFamilyAndRelations(
      familyMembers as RawFamilyMember[],
      familyRelations as RawFamilyRelation[]
    )

    const rootId = nodesWithNoParents[0]?.id || data.nodes[0]?.id || ''

    return { 
      familyMembersRecord: membersRecord, 
      familyRelationsRecord: relationsRecord,
      rootMemberId: rootId
    }
  }, [data])

  const handleNodeClick = (nodeId: string) => {
    const person = data?.nodes.find(n => n.id === nodeId)
    if (person) {
      setSelectedPerson(person)
    }
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
          <Link href="/" className="flex items-center gap-2 text-[#6B7280] hover:text-[#2D3142] mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Beranda
          </Link>

          <div className="card text-center">
            <div className="w-16 h-16 bg-[#E07A5F] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#2D3142] mb-2">Pohon Keluarga</h1>
            <p className="text-[#6B7280] mb-6">Masukkan password publik untuk melihat pohon keluarga</p>

            <form onSubmit={handleLogin} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{errorMsg}</div>
              )}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Masukkan password"
                required
              />
              <button type="submit" disabled={checking} className="btn btn-primary w-full">
                {checking ? 'Memuat...' : 'Lihat Pohon Keluarga'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F1DE] flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E07A5F] rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#2D3142]">{data?.familyName || 'Keluarga'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/statistics" className="btn btn-outline text-sm">Statistik</Link>
            <button onClick={handleLogout} className="btn btn-ghost text-sm">Keluar</button>
          </div>
        </div>
      </header>

      <div className="flex-1 relative" style={{ height: 'calc(100vh - 80px)' }}>
        {!data || data.nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Users className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" />
              <h2 className="text-xl font-bold text-[#2D3142] mb-2">Belum Ada Data</h2>
              <p className="text-[#6B7280] mb-4">Silakan masuk ke dashboard untuk menambahkan anggota keluarga</p>
              <Link href="/login" className="btn btn-primary">Masuk ke Dashboard</Link>
            </div>
          </div>
        ) : (
          <FamilyTree
            familyMembers={familyMembersRecord}
            familyRelations={familyRelationsRecord}
            rootMember={familyMembersRecord[rootMemberId]}
            onNodeClick={handleNodeClick}
            chartOrientation="vertical"
          />
        )}
      </div>

      {selectedPerson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPerson(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#2D3142]">Detail</h2>
              <button onClick={() => setSelectedPerson(null)} className="p-2 hover:bg-[#F4F1DE] rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedPerson.gender === 'MALE' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-[#2D3142]">{selectedPerson.fullname}</p>
                  {selectedPerson.callName && <p className="text-[#6B7280]">{selectedPerson.callName}</p>}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Jenis Kelamin</span>
                  <span className="font-medium">{selectedPerson.gender === 'MALE' ? 'Laki-laki' : 'Perempuan'}</span>
                </div>
                {selectedPerson.age !== null && (
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Usia</span>
                    <span className="font-medium">{selectedPerson.age} tahun {!selectedPerson.isAlive && '(Almarhum)'}</span>
                  </div>
                )}
                {selectedPerson.occupation && (
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Pekerjaan</span>
                    <span className="font-medium">{selectedPerson.occupation}</span>
                  </div>
                )}
                {selectedPerson.childrenCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Jumlah Anak</span>
                    <span className="font-medium">{selectedPerson.childrenCount}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
