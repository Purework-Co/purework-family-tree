import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fromPersonId, toPersonId, relationType, relationSubType, urutan } = body

    if (!fromPersonId || !toPersonId || !relationType) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    if (fromPersonId === toPersonId) {
      return NextResponse.json({ error: 'Tidak dapat membuat relasi dengan diri sendiri' }, { status: 400 })
    }

    const subType = relationSubType || 'BIOLOGICAL'

    const existing = await prisma.personRelation.findFirst({
      where: {
        fromPersonId,
        toPersonId,
        relationType,
        relationSubType: subType,
        NOT: { id: params.id }
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'Relasi sudah ada' }, { status: 400 })
    }

    const relation = await prisma.personRelation.update({
      where: { id: params.id },
      data: {
        fromPersonId,
        toPersonId,
        relationType,
        relationSubType: subType,
        urutan: urutan ? parseInt(urutan.toString()) : 1
      },
      include: {
        fromPerson: true,
        toPerson: true,
      }
    })

    return NextResponse.json(relation)
  } catch (error) {
    console.error('Error updating relation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.personRelation.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting relation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
