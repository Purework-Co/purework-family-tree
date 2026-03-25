import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const person = await prisma.person.findUnique({
      where: { id: params.id },
      include: {
        relationsFrom: {
          include: { toPerson: true }
        },
        relationsTo: {
          include: { fromPerson: true }
        }
      }
    })

    if (!person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 })
    }

    return NextResponse.json(person)
  } catch (error) {
    console.error('Error fetching person:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const { fullname, callName, dateOfBirth, dateOfDeath, gender, occupation, hometown, domicile, phone } = body

    const person = await prisma.person.update({
      where: { id: params.id },
      data: {
        fullname,
        callName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        dateOfDeath: dateOfDeath ? new Date(dateOfDeath) : null,
        gender,
        occupation,
        hometown,
        domicile,
        phone,
      }
    })

    return NextResponse.json(person)
  } catch (error) {
    console.error('Error updating person:', error)
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

    await prisma.person.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting person:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
