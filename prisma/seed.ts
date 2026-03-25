import { PrismaClient, Person } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedUsersAndSettings() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: hashedPassword, role: 'ADMIN' },
  })
  console.log('Created admin user')

  await prisma.user.upsert({
    where: { username: 'contributor' },
    update: {},
    create: { username: 'contributor', password: hashedPassword, role: 'CONTRIBUTOR' },
  })
  console.log('Created contributor user')

  const publicPassword = await bcrypt.hash('public123', 10)
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default', familyName: 'Keluarga Besar', publicPassword },
  })
  console.log('Created default settings')
}

async function createPerson(
  fullname: string,
  gender: 'MALE' | 'FEMALE',
  opts: { callName?: string; birthYear?: number; deathYear?: number; occupation?: string; hometown?: string; phone?: string } = {}
): Promise<Person> {
  return prisma.person.create({
    data: {
      fullname,
      callName: opts.callName,
      gender,
      dateOfBirth: opts.birthYear ? new Date(`${opts.birthYear}-01-01`) : null,
      dateOfDeath: opts.deathYear ? new Date(`${opts.deathYear}-06-15`) : null,
      occupation: opts.occupation,
      hometown: opts.hometown,
      phone: opts.phone,
    },
  })
}

async function linkCouple(husband: Person, wife: Person, urutan = 1) {
  await prisma.personRelation.create({
    data: { fromPersonId: husband.id, toPersonId: wife.id, relationType: 'PASANGAN', relationSubType: 'BIOLOGICAL', urutan },
  })
}

async function linkChild(child: Person, parent: Person, subtype: 'BIOLOGICAL' | 'ADOPTED' = 'BIOLOGICAL') {
  await prisma.personRelation.create({
    data: { fromPersonId: child.id, toPersonId: parent.id, relationType: 'ORANGTUA_ANAK', relationSubType: subtype },
  })
}

// ─── SEED SMALL: 10 people, single root, no sibling marriages ─────────
//
// With a single root couple, all children are siblings and cannot marry.
// The small seed uses single-parent children to create branches, then
// allows cousin marriages at deeper generations.
//
// Family tree:
//   Gen 0 (ROOT): Budi ♂ + Siti ♀
//   Gen 1: Ahmad ♂, Dewi ♀  (siblings, children of root)
//   Gen 2: Ahmad→Maya ♀, Budianto ♂  (single-parent branch A)
//          Dewi→Putri ♀, Rian ♂       (single-parent branch B)
//   Gen 3: Budianto(branch A) + Putri(branch B) → Aldi ♂, Kevin ♂
//          (cousins from different parent units — not siblings)

async function seedSmall() {
  console.log('Seeding small family (10 people, single root)...')

  // Gen 0 — ROOT ancestral couple
  const budi = await createPerson('Budi Santoso', 'MALE', { callName: 'Kakek Budi', birthYear: 1940, deathYear: 2018, occupation: 'Petani', hometown: 'Solo' })
  const siti = await createPerson('Siti Aminah', 'FEMALE', { callName: 'Nenek Siti', birthYear: 1943, occupation: 'Ibu Rumah Tangga', hometown: 'Solo' })
  await linkCouple(budi, siti)

  // Gen 1 — 2 children of root
  const ahmad = await createPerson('Ahmad Santoso', 'MALE', { callName: 'Pak Ahmad', birthYear: 1965, occupation: 'Wiraswasta', hometown: 'Jakarta' })
  const dewi = await createPerson('Dewi Santoso', 'FEMALE', { callName: 'Bu Dewi', birthYear: 1968, occupation: 'Guru', hometown: 'Jakarta' })
  await linkChild(ahmad, budi); await linkChild(ahmad, siti)
  await linkChild(dewi, budi); await linkChild(dewi, siti)

  // Gen 2 — Branch A: children of Ahmad (single parent)
  const maya = await createPerson('Maya Santoso', 'FEMALE', { callName: 'Maya', birthYear: 1990, occupation: 'Dokter', hometown: 'Jakarta' })
  const budianto = await createPerson('Budianto Santoso', 'MALE', { callName: 'Budi Kecil', birthYear: 1992, occupation: 'PNS', hometown: 'Jakarta' })
  await linkChild(maya, ahmad)
  await linkChild(budianto, ahmad)

  // Gen 2 — Branch B: children of Dewi (single parent)
  const putri = await createPerson('Putri Santoso', 'FEMALE', { callName: 'Putri', birthYear: 1993, occupation: 'Mahasiswa', hometown: 'Surabaya' })
  const rian = await createPerson('Rian Santoso', 'MALE', { callName: 'Rian', birthYear: 1995, occupation: 'Pelajar', hometown: 'Surabaya' })
  await linkChild(putri, dewi)
  await linkChild(rian, dewi)

  // Gen 3 — Cousin marriage: Budianto (from Ahmad) + Putri (from Dewi)
  // They share grandparents (Budi, Siti) but have different parents — not siblings
  await linkCouple(budianto, putri)

  // Gen 4 — children of Budianto+Putri
  const aldi = await createPerson('Aldionto Santoso', 'MALE', { callName: 'Aldi', birthYear: 2018, hometown: 'Jakarta' })
  const kevin = await createPerson('Kevin Santoso', 'MALE', { callName: 'Kevin', birthYear: 2020, hometown: 'Jakarta' })
  await linkChild(aldi, budianto); await linkChild(aldi, putri)
  await linkChild(kevin, budianto); await linkChild(kevin, putri)

  console.log('Small seed complete: 10 people, single root (Budi + Siti)')
}

// ─── SEED BIG: 100 people, single root, no sibling marriages ───────────

const firstNamesMale = ['Budi','Ahmad','Rian','Kevin','Aldi','Hendra','Rizki','Dedi','Fajar','Yoga','Andi','Rizal','Bayu','Dimas','Iqbal','Farhan','Reza','Raka','Gilang','Eko','Agus','Hadi','Tono','Wawan','Arif','Nanda','Irwan','Dian','Rendi','Budianto']
const firstNamesFemale = ['Siti','Dewi','Putri','Maya','Rina','Sari','Lina','Ani','Nina','Yuni','Fitri','Tari','Wulan','Indah','Citra','Ayu','Mega','Lestari','Ratna','Sri','Lilis','Tuti','Eva','Ita','Nia','Yuli','Dina','Tina','Ani','Wati']
const lastNames = ['Santoso','Wijaya','Pratama','Kusuma','Hidayat','Nugroho','Saputra','Wibowo','Setiawan','Hakim','Gunawan','Susanto','Raharjo','Utomo','Purnomo']
const occupations = ['Dokter','Guru','Wiraswasta','PNS','Petani','Pegawai Swasta','Mahasiswa','Pelajar','Pengacara','Insinyur','Perawat','Arsitek','Desainer','Programmer','Pedagang','Ibu Rumah Tangga','Pensiunan']
const cities = ['Jakarta','Bandung','Surabaya','Semarang','Solo','Yogyakarta','Malang','Medan','Makassar','Denpasar']

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min }
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function seedBig() {
  console.log('Seeding big family (100 people, single root)...')

  let count = 0

  async function makePerson(gender: 'MALE' | 'FEMALE', gen: number): Promise<Person> {
    const names = gender === 'MALE' ? firstNamesMale : firstNamesFemale
    const fullname = `${pick(names)} ${pick(lastNames)}`
    const birthYear = 1920 + gen * 25 + rand(0, 10)
    count++
    return createPerson(fullname, gender, {
      callName: fullname.split(' ')[0],
      birthYear,
      deathYear: gen <= 1 && Math.random() > 0.6 ? birthYear + rand(55, 85) : undefined,
      occupation: pick(occupations),
      hometown: pick(cities),
      phone: Math.random() > 0.4 ? `081${rand(10000000, 99999999)}` : undefined,
    })
  }

  // Group children by their parent couple, then pair across groups
  // This ensures siblings (same parents) never marry each other
  function pairAcrossGroups(groups: Person[][]): [Person, Person][] {
    const allMales = groups.flatMap(g => g.filter(p => p.gender === 'MALE'))
    const allFemales = groups.flatMap(g => g.filter(p => p.gender === 'FEMALE'))
    const maleGroup = new Map(allMales.map(m => [m.id, groups.findIndex(g => g.some(p => p.id === m.id))]))
    const femaleGroup = new Map(allFemales.map(f => [f.id, groups.findIndex(g => g.some(p => p.id === f.id))]))

    const couples: [Person, Person][] = []
    const usedM = new Set<string>()
    const usedF = new Set<string>()

    // Shuffle for randomness
    const sm = shuffle(allMales)
    const sf = shuffle(allFemales)

    for (const m of sm) {
      if (usedM.has(m.id)) continue
      const mGrp = maleGroup.get(m.id)!
      // Find a female from a DIFFERENT group
      const match = sf.find(f => !usedF.has(f.id) && femaleGroup.get(f.id) !== mGrp)
      if (match) {
        couples.push([m, match])
        usedM.add(m.id)
        usedF.add(match.id)
      }
    }
    return couples
  }

  // ── Gen 0: ROOT ancestral couple ──
  const rootH = await createPerson('Hendra Santoso', 'MALE', { callName: 'Kakek Hendra', birthYear: 1925, deathYear: 2010, occupation: 'Petani', hometown: 'Solo' })
  const rootW = await createPerson('Siti Rahayu', 'FEMALE', { callName: 'Nenek Siti', birthYear: 1928, deathYear: 2015, occupation: 'Ibu Rumah Tangga', hometown: 'Solo' })
  await linkCouple(rootH, rootW)
  count += 2

  // ── Gen 1: 6 children of root (NO marriages — they are all siblings) ──
  const gen1: Person[] = []
  for (let i = 0; i < 6; i++) {
    gen1.push(await makePerson(i % 2 === 0 ? 'MALE' : 'FEMALE', 1))
  }
  for (const child of gen1) {
    await linkChild(child, rootH)
    await linkChild(child, rootW)
  }

  // ── Gen 2: children of gen1 people (single-parent branches) ──
  // Each gen1 person has children independently, creating separate branches
  const gen2Groups: Person[][] = []
  for (const parent of gen1) {
    const kids: Person[] = []
    for (let i = 0; i < rand(3, 5); i++) {
      const child = await makePerson(Math.random() > 0.5 ? 'MALE' : 'FEMALE', 2)
      await linkChild(child, parent)
      kids.push(child)
    }
    gen2Groups.push(kids)
  }
  const gen2Couples = pairAcrossGroups(gen2Groups)
  for (const [h, w] of gen2Couples) await linkCouple(h, w)

  // ── Gen 3: children of gen 2 couples (grouped by parent couple) ──
  const gen3Groups: Person[][] = []
  for (const [h, w] of gen2Couples) {
    const kids: Person[] = []
    for (let i = 0; i < rand(2, 4); i++) {
      const child = await makePerson(Math.random() > 0.5 ? 'MALE' : 'FEMALE', 3)
      await linkChild(child, h)
      await linkChild(child, w)
      kids.push(child)
    }
    gen3Groups.push(kids)
  }

  // Adopted child
  if (gen2Couples.length > 0) {
    const adopted = await createPerson(pick(firstNamesMale) + ' ' + pick(lastNames), 'MALE', {
      callName: 'Adi', birthYear: 2005, occupation: pick(occupations), hometown: pick(cities),
    })
    count++
    const [ah, aw] = gen2Couples[0]
    await linkChild(adopted, ah, 'ADOPTED')
    await linkChild(adopted, aw, 'ADOPTED')
    gen3Groups[0]?.push(adopted)
  }

  const gen3Couples = pairAcrossGroups(gen3Groups)
  for (const [h, w] of gen3Couples) await linkCouple(h, w)

  // ── Gen 4: grandchildren (grouped by parent couple) ──
  for (const [h, w] of gen3Couples) {
    for (let i = 0; i < rand(1, 3); i++) {
      const child = await makePerson(Math.random() > 0.5 ? 'MALE' : 'FEMALE', 4)
      await linkChild(child, h)
      await linkChild(child, w)
    }
  }

  // ── Fill remaining to ~100: add more children to existing couples ──
  const allCouples = [...gen2Couples, ...gen3Couples]

  while (count < 100 && allCouples.length > 0) {
    const [h, w] = pick(allCouples)
    const gender = Math.random() > 0.5 ? 'MALE' : 'FEMALE'
    const child = await makePerson(gender, rand(2, 4))
    await linkChild(child, h)
    await linkChild(child, w)
  }

  console.log(`Big seed complete: ${count} people, single root (Hendra + Siti)`)
}

// ─── MAIN ──────────────────────────────────────────────────────────────

async function main() {
  const size = process.env.SEED_SIZE || 'small'

  // Clear existing data
  await prisma.personRelation.deleteMany()
  await prisma.person.deleteMany()

  await seedUsersAndSettings()

  if (size === 'big') {
    await seedBig()
  } else {
    await seedSmall()
  }

  console.log(`Seeding completed (${size})!`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
