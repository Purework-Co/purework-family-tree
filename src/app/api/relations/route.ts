import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const [relations, total] = await Promise.all([
      prisma.personRelation.findMany({
        include: {
          fromPerson: true,
          toPerson: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.personRelation.count()
    ])

    return NextResponse.json({
      data: relations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching relations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fromPersonId, toPersonId, relationType, urutan, status } = body

    if (!fromPersonId || !toPersonId || !relationType) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    if (fromPersonId === toPersonId) {
      return NextResponse.json({ error: 'Tidak dapat membuat relasi dengan diri sendiri' }, { status: 400 })
    }

    const existing = await prisma.personRelation.findFirst({
      where: {
        fromPersonId,
        toPersonId,
        relationType
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'Relasi sudah ada' }, { status: 400 })
    }

    const relation = await prisma.personRelation.create({
      data: {
        fromPersonId,
        toPersonId,
        relationType,
        urutan: urutan || 1,
        status: status || 'ACTIVE'
      },
      include: {
        fromPerson: true,
        toPerson: true,
      }
    })

    return NextResponse.json(relation)
  } catch (error) {
    console.error('Error creating relation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
