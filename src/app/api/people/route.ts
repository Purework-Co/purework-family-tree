import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    const where = search ? {
      OR: [
        { fullname: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { callName: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ]
    } : {}

    const [people, total] = await Promise.all([
      prisma.person.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { fullname: 'asc' },
      }),
      prisma.person.count({ where })
    ])

    return NextResponse.json({
      data: people,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching people:', error)
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
    const { fullname, callName, dateOfBirth, dateOfDeath, gender, occupation, hometown, domicile } = body

    if (!fullname || !gender) {
      return NextResponse.json({ error: 'Nama lengkap dan jenis kelamin wajib diisi' }, { status: 400 })
    }

    const person = await prisma.person.create({
      data: {
        fullname,
        callName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        dateOfDeath: dateOfDeath ? new Date(dateOfDeath) : null,
        gender,
        occupation,
        hometown,
        domicile,
      }
    })

    return NextResponse.json(person)
  } catch (error) {
    console.error('Error creating person:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
