import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const people = await prisma.person.findMany()
    const relations = await prisma.personRelation.findMany()
    const settings = await prisma.settings.findUnique({ where: { id: 'default' } })

    const alive = people.filter(p => !p.dateOfDeath)
    const dead = people.filter(p => p.dateOfDeath)
    const males = people.filter(p => p.gender === 'MALE')
    const females = people.filter(p => p.gender === 'FEMALE')

    const now = new Date()
    const ages = alive.map(p => {
      if (!p.dateOfBirth) return null
      const birth = new Date(p.dateOfBirth)
      let age = now.getFullYear() - birth.getFullYear()
      const monthDiff = now.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
        age--
      }
      return age
    }).filter(a => a !== null && a >= 0) as number[]

    const averageAge = ages.length > 0 
      ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length)
      : 0
    
    const youngestAge = ages.length > 0 ? Math.min(...ages) : 0
    const oldestAge = ages.length > 0 ? Math.max(...ages) : 0

    const spouses = relations.filter(r => r.relationType === 'PASANGAN')
    const uniqueSpousePairs = new Set(
      spouses.map(r => [r.fromPersonId, r.toPersonId].sort().join('-'))
    )
    const totalCouples = uniqueSpousePairs.size

    const childrenCount: Record<string, number> = {}
    relations
      .filter(r => r.relationType === 'ORANGTUA_ANAK')
      .forEach(r => {
        childrenCount[r.toPersonId] = (childrenCount[r.toPersonId] || 0) + 1
      })

    const parentsWithChildren = Object.keys(childrenCount).length
    const totalChildren = Object.values(childrenCount).reduce((a, b) => a + b, 0)
    const averageChildren = parentsWithChildren > 0 
      ? Math.round((totalChildren / parentsWithChildren) * 10) / 10
      : 0

    const occupationCount: Record<string, number> = {}
    people
      .filter(p => p.occupation)
      .forEach(p => {
        occupationCount[p.occupation!] = (occupationCount[p.occupation!] || 0) + 1
      })

    return NextResponse.json({
      familyName: settings?.familyName || 'Keluarga',
      totalMembers: people.length,
      aliveMembers: alive.length,
      deceasedMembers: dead.length,
      maleMembers: males.length,
      femaleMembers: females.length,
      averageAge,
      youngestAge,
      oldestAge,
      totalCouples,
      averageChildren,
      occupationDistribution: occupationCount
    })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
