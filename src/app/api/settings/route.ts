import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let settings = await prisma.settings.findUnique({
      where: { id: 'default' }
    })

    if (!settings) {
      const hashedPassword = await bcrypt.hash('public123', 10)
      settings = await prisma.settings.create({
        data: {
          id: 'default',
          familyName: 'Keluarga',
          publicPassword: hashedPassword
        }
      })
    }

    return NextResponse.json({
      familyName: settings.familyName,
      publicPassword: '' 
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { familyName, publicPassword } = body

    const updateData: Record<string, string> = {}
    if (familyName) updateData.familyName = familyName
    if (publicPassword) {
      updateData.publicPassword = await bcrypt.hash(publicPassword, 10)
    }

    let settings = await prisma.settings.findUnique({
      where: { id: 'default' }
    })

    if (!settings) {
      const hashedPassword = publicPassword 
        ? await bcrypt.hash(publicPassword, 10)
        : await bcrypt.hash('public123', 10)
      settings = await prisma.settings.create({
        data: {
          id: 'default',
          familyName: familyName || 'Keluarga',
          publicPassword: hashedPassword
        }
      })
    } else {
      settings = await prisma.settings.update({
        where: { id: 'default' },
        data: updateData
      })
    }

    return NextResponse.json({
      familyName: settings.familyName,
      publicPassword: ''
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
