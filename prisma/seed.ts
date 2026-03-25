import { PrismaClient, Person } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedUsersAndSettings() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({ where: { username: 'admin' }, update: {}, create: { username: 'admin', password: hashedPassword, role: 'ADMIN' } })
  await prisma.user.upsert({ where: { username: 'contributor' }, update: {}, create: { username: 'contributor', password: hashedPassword, role: 'CONTRIBUTOR' } })
  const publicPassword = await bcrypt.hash('public123', 10)
  await prisma.settings.upsert({ where: { id: 'default' }, update: {}, create: { id: 'default', familyName: 'Keluarga Besar', publicPassword } })
  console.log('Users & settings ready')
}

// ─── HELPERS ───────────────────────────────────────────────────────────

const M = ['Budi','Ahmad','Rian','Kevin','Aldi','Hendra','Rizki','Dedi','Fajar','Yoga','Andi','Rizal','Bayu','Dimas','Iqbal','Farhan','Reza','Raka','Gilang','Eko','Agus','Hadi','Tono','Wawan','Arif','Nanda','Irwan','Dian','Rendi','Budianto','Firman','Dani','Teguh','Yusuf','Anton','Rudi','Surya','Imam','Wahyu','Ridwan']
const F = ['Siti','Dewi','Putri','Maya','Rina','Sari','Lina','Ani','Nina','Yuni','Fitri','Tari','Wulan','Indah','Citra','Ayu','Mega','Lestari','Ratna','Sri','Lilis','Tuti','Eva','Ita','Nia','Yuli','Dina','Tina','Wati','Kartini','Marlina','Erna','Diah','Wida','Intan','Astri','Bunga','Dewi','Rina','Sulastri']
const L = ['Santoso','Wijaya','Pratama','Kusuma','Hidayat','Nugroho','Saputra','Wibowo','Setiawan','Hakim','Gunawan','Susanto','Raharjo','Utomo','Purnomo','Adi','Budiman','Halim','Suryadi','Handoko']
const OC = ['Dokter','Guru','Wiraswasta','PNS','Petani','Pegawai Swasta','Mahasiswa','Pelajar','Pengacara','Insinyur','Perawat','Arsitek','Desainer','Programmer','Pedagang','Ibu Rumah Tangga','Pensiunan']
const CT = ['Jakarta','Bandung','Surabaya','Semarang','Solo','Yogyakarta','Malang','Medan','Makassar','Denpasar','Palembang','Balikpapan','Manado','Bogor']

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
const rand = (n: number, x: number) => Math.floor(Math.random() * (x - n + 1)) + n

let total = 0

async function mk(name: string, g: 'MALE'|'FEMALE', gen: number): Promise<Person> {
  total++
  const by = 1890 + gen * 28 + rand(0, 10)
  return prisma.person.create({
    data: {
      fullname: name,
      callName: name.split(' ')[0],
      gender: g,
      dateOfBirth: new Date(`${by}-01-01`),
      dateOfDeath: gen <= 1 && Math.random() > 0.5 ? new Date(`${by + rand(55, 85)}-06-15`) : null,
      occupation: pick(OC),
      hometown: pick(CT),
      phone: Math.random() > 0.4 ? `081${rand(10000000, 99999999)}` : null,
    }
  })
}

function rname(g: 'MALE'|'FEMALE') {
  return `${pick(g === 'MALE' ? M : F)} ${pick(L)}`
}

// Child count: weighted 0-8, mostly 2-4
function nKids(): number {
  const r = Math.random()
  if (r < 0.03) return 0
  if (r < 0.12) return 1
  if (r < 0.55) return rand(2, 3)
  if (r < 0.78) return 4
  if (r < 0.93) return rand(5, 6)
  return rand(7, 8)
}

// Spouse count: 1-2 for most, occasionally 3
function nSpouses(): number {
  const r = Math.random()
  if (r < 0.70) return 1
  if (r < 0.95) return 2
  return 3
}

// ─── RECURSIVE TREE GENERATION ─────────────────────────────────────────
//
// Each tree person (descended from root) has outside spouses + children.
// Outside spouses have no parents — they appear as leaf nodes.
// No two tree-descended people ever marry — trivially no sibling marriages.

const TARGETS: Record<string, number> = { medium: 100, large: 150, huge: 250 }
const MAX_GENS: Record<string, number> = { medium: 5, large: 7, huge: 8 }

async function growPerson(person: Person, gen: number, maxGen: number, target: number) {
  if (gen >= maxGen || total >= target) return

  const ns = nSpouses()
  for (let s = 1; s <= ns; s++) {
    if (total >= target) break

    const spGender: 'MALE' | 'FEMALE' = person.gender === 'MALE' ? 'FEMALE' : 'MALE'
    const spouse = await mk(rname(spGender), spGender, gen)
    await prisma.personRelation.create({
      data: { fromPersonId: person.id, toPersonId: spouse.id, relationType: 'PASANGAN', relationSubType: 'BIOLOGICAL', urutan: s }
    })

    const nk = Math.min(nKids(), target - total)
    for (let k = 0; k < nk; k++) {
      if (total >= target) break
      const kg = Math.random() > 0.5 ? 'MALE' : 'FEMALE'
      const child = await mk(rname(kg), kg, gen + 1)
      await prisma.personRelation.create({
        data: { fromPersonId: child.id, toPersonId: person.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' }
      })
      await prisma.personRelation.create({
        data: { fromPersonId: child.id, toPersonId: spouse.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' }
      })
      await growPerson(child, gen + 1, maxGen, target)
    }
  }
}

// ─── SEED FUNCTIONS ────────────────────────────────────────────────────

async function seedSmall() {
  console.log('Seeding small (10 people)...')
  total = 0

  const gp1 = await mk('Budi Santoso', 'MALE', 0)
  const gp2 = await mk('Siti Aminah', 'FEMALE', 0)
  await prisma.personRelation.create({ data: { fromPersonId: gp1.id, toPersonId: gp2.id, relationType: 'PASANGAN', relationSubType: 'BIOLOGICAL' } })

  const ahmad = await mk('Ahmad Santoso', 'MALE', 1)
  const dewi = await mk('Dewi Santoso', 'FEMALE', 1)
  await prisma.personRelation.create({ data: { fromPersonId: ahmad.id, toPersonId: gp1.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' } })
  await prisma.personRelation.create({ data: { fromPersonId: ahmad.id, toPersonId: gp2.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' } })
  await prisma.personRelation.create({ data: { fromPersonId: dewi.id, toPersonId: gp1.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' } })
  await prisma.personRelation.create({ data: { fromPersonId: dewi.id, toPersonId: gp2.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' } })

  const sp1 = await mk('Maya Santoso', 'FEMALE', 1)
  await prisma.personRelation.create({ data: { fromPersonId: ahmad.id, toPersonId: sp1.id, relationType: 'PASANGAN', relationSubType: 'BIOLOGICAL' } })
  const sp2 = await mk('Budianto Santoso', 'MALE', 1)
  await prisma.personRelation.create({ data: { fromPersonId: dewi.id, toPersonId: sp2.id, relationType: 'PASANGAN', relationSubType: 'BIOLOGICAL' } })

  const p1 = await mk('Putri Santoso', 'FEMALE', 2)
  const p2 = await mk('Rian Santoso', 'MALE', 2)
  await prisma.personRelation.create({ data: { fromPersonId: p1.id, toPersonId: ahmad.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' } })
  await prisma.personRelation.create({ data: { fromPersonId: p1.id, toPersonId: sp1.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' } })
  await prisma.personRelation.create({ data: { fromPersonId: p2.id, toPersonId: dewi.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' } })
  await prisma.personRelation.create({ data: { fromPersonId: p2.id, toPersonId: sp2.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' } })

  console.log('Small: 10 people')
}

async function seedGenerated(size: string) {
  const target = TARGETS[size]
  const maxGen = MAX_GENS[size]
  console.log(`Seeding ${size} (~${target} people, max ${maxGen} gen)...`)
  total = 0

  const rootH = await mk('Hendra Santoso', 'MALE', 0)
  const rootW = await mk('Siti Rahayu', 'FEMALE', 0)
  await prisma.personRelation.create({ data: { fromPersonId: rootH.id, toPersonId: rootW.id, relationType: 'PASANGAN', relationSubType: 'BIOLOGICAL' } })

  await growPerson(rootH, 0, maxGen, target)

  console.log(`${size}: ${total} people`)
}

// ─── MAIN ──────────────────────────────────────────────────────────────

async function main() {
  const size = process.env.SEED_SIZE || 'small'

  await prisma.personRelation.deleteMany()
  await prisma.person.deleteMany()
  await seedUsersAndSettings()

  if (size === 'small') {
    await seedSmall()
  } else {
    await seedGenerated(size)
  }

  console.log(`Done (${size})!`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
