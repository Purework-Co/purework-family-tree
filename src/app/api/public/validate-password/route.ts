import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: 'Password diperlukan' }, { status: 400 })
    }

    const settings = await prisma.settings.findUnique({
      where: { id: 'default' }
    })

    if (!settings) {
      return NextResponse.json({ valid: false, error: 'Konfigurasi belum tersedia' }, { status: 404 })
    }

    const valid = await bcrypt.compare(password, settings.publicPassword)
    
    return NextResponse.json({ valid })
  } catch (error) {
    console.error('Error validating password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
