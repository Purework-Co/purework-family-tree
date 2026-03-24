'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { 
  Users, 
  GitBranch, 
  Settings, 
  UserCog, 
  LogOut, 
  Menu,
  X
} from 'lucide-react'

const navigation = [
  { name: 'Anggota Keluarga', href: '/dashboard/people', icon: Users },
  { name: 'Relasi', href: '/dashboard/relations', icon: GitBranch },
  { name: 'Kelola User', href: '/dashboard/users', icon: UserCog, adminOnly: true },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings, adminOnly: true },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F1DE]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E07A5F]"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const filteredNav = navigation.filter(
    item => !item.adminOnly || session.user.role === 'ADMIN'
  )

  return (
    <div className="min-h-screen bg-[#F4F1DE]">
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-[#2D3142]">PureWork Family</span>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-[#E5E7EB] z-50
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E07A5F] rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-[#2D3142]">PureWork</h1>
              <p className="text-xs text-[#6B7280]">Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                  ${isActive 
                    ? 'bg-[#E07A5F] text-white' 
                    : 'text-[#6B7280] hover:bg-[#F4F1DE]'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 bg-[#3D405B] rounded-full flex items-center justify-center text-white text-sm font-medium">
              {session.user.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#2D3142] truncate">{session.user.username}</p>
              <p className="text-xs text-[#6B7280]">{session.user.role === 'ADMIN' ? 'Admin' : 'Contributor'}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[#EF4444] hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Keluar</span>
          </button>
        </div>
      </aside>

      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        {children}
      </main>
    </div>
  )
}
