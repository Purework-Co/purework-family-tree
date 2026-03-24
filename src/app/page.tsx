import Link from 'next/link'
import { Users, BarChart3, LogIn } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F4F1DE]">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E07A5F] rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#2D3142]">PureWork Family</h1>
          </div>
          <Link 
            href="/login" 
            className="btn btn-primary"
          >
            <LogIn className="w-5 h-5" />
            <span className="hidden sm:inline">Masuk</span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[#2D3142] mb-4">
            Pohon Keluarga Digital
          </h2>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
            Lihat dan jelajahi silsilah keluarga dengan mudah. 
            Dilengkapi dengan visualisasi pohon keluarga dan statistik anggota keluarga.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Link href="/family-tree" className="block">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="w-16 h-16 bg-[#E07A5F] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#2D3142] mb-2">
                Pohon Keluarga
              </h3>
              <p className="text-[#6B7280]">
                Lihat visualisasi pohon keluarga lengkap dengan hubungan antar anggota.
              </p>
            </div>
          </Link>

          <Link href="/statistics" className="block">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="w-16 h-16 bg-[#81B29A] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#2D3142] mb-2">
                Statistik Keluarga
              </h3>
              <p className="text-[#6B7280]">
                Lihat statistik umum keluarga termasuk jumlah anggota, usia, dan lainnya.
              </p>
            </div>
          </Link>
        </div>

        <div className="text-center mt-12">
          <p className="text-[#6B7280]">
            Ingin mengelola data keluarga?{' '}
            <Link href="/login" className="text-[#E07A5F] font-semibold hover:underline">
              Masuk sebagai Admin
            </Link>
          </p>
        </div>
      </main>

      <footer className="bg-white border-t border-[#E5E7EB] mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-[#6B7280]">
          <p>&copy; 2024 PureWork Family. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
