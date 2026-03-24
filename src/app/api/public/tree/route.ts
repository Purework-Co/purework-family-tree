import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface TreeNode {
  id: string
  fullname: string
  callName: string | null
  gender: string
  dateOfBirth: string | null
  dateOfDeath: string | null
  occupation: string | null
  age: number | null
  isAlive: boolean
  childrenCount: number
  parents: string[]
  spouses: { id: string; urutan: number; status: string }[]
  generation: number
}

interface TreeEdge {
  id: string
  source: string
  target: string
  type: string
}

function calculateAge(dateOfBirth: Date | null, dateOfDeath: Date | null): number | null {
  if (!dateOfBirth) return null
  
  const birth = new Date(dateOfBirth)
  const end = dateOfDeath ? new Date(dateOfDeath) : new Date()
  let age = end.getFullYear() - birth.getFullYear()
  const monthDiff = end.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    age--
  }
  return age >= 0 ? age : null
}

function determineGeneration(
  personId: string,
  relations: { fromPersonId: string; toPersonId: string; relationType: string }[],
  nodes: Map<string, TreeNode>,
  visited: Set<string> = new Set()
): number {
  if (visited.has(personId)) return 0
  visited.add(personId)
  
  const parents = relations.filter(
    r => r.toPersonId === personId && r.relationType === 'ORANGTUA_ANAK'
  )
  
  if (parents.length === 0) return 1
  
  let maxParentGen = 0
  for (const parent of parents) {
    const parentGen = determineGeneration(parent.fromPersonId, relations, nodes, visited)
    maxParentGen = Math.max(maxParentGen, parentGen)
  }
  
  return maxParentGen + 1
}

export async function GET() {
  try {
    const [people, relations, settings] = await Promise.all([
      prisma.person.findMany(),
      prisma.personRelation.findMany(),
      prisma.settings.findUnique({ where: { id: 'default' } })
    ])

    const nodes = new Map<string, TreeNode>()
    
    for (const person of people) {
      const parents = relations
        .filter(r => r.toPersonId === person.id && r.relationType === 'ORANGTUA_ANAK')
        .map(r => r.fromPersonId)
      
      const spouses = relations
        .filter(r => {
          const isCouple = r.relationType === 'PASANGAN'
          const involvesPerson = r.fromPersonId === person.id || r.toPersonId === person.id
          return isCouple && involvesPerson
        })
        .map(r => ({
          id: r.fromPersonId === person.id ? r.toPersonId : r.fromPersonId,
          urutan: r.urutan
        }))
      
      const childrenCount = relations.filter(
        r => r.fromPersonId === person.id && r.relationType === 'ORANGTUA_ANAK'
      ).length

      nodes.set(person.id, {
        id: person.id,
        fullname: person.fullname,
        callName: person.callName,
        gender: person.gender,
        dateOfBirth: person.dateOfBirth?.toISOString() || null,
        dateOfDeath: person.dateOfDeath?.toISOString() || null,
        occupation: person.occupation,
        age: calculateAge(person.dateOfBirth, person.dateOfDeath),
        isAlive: !person.dateOfDeath,
        childrenCount,
        parents,
        spouses,
        generation: 0
      })
    }

    const visited = new Set<string>()
    for (const person of people) {
      const gen = determineGeneration(person.id, relations, nodes, visited)
      const node = nodes.get(person.id)!
      node.generation = gen
    }

    const treeNodes = Array.from(nodes.values())
    const edges: TreeEdge[] = relations.map(r => ({
      id: r.id,
      source: r.fromPersonId,
      target: r.toPersonId,
      type: r.relationType
    }))

    return NextResponse.json({
      familyName: settings?.familyName || 'Keluarga',
      nodes: treeNodes,
      edges
    })
  } catch (error) {
    console.error('Error fetching tree:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
