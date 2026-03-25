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

// ─── SEED SMALL: 10 people ─────────────────────────────────────────────

async function seedSmall() {
  console.log('Seeding small family (10 people)...')

  const kakek = await createPerson('Budi Santoso', 'MALE', { callName: 'Kakek Budi', birthYear: 1945, deathYear: 2020, occupation: 'Petani', hometown: 'Solo' })
  const nenek = await createPerson('Siti Aminah', 'FEMALE', { callName: 'Nenek Siti', birthYear: 1950, occupation: 'Ibu Rumah Tangga', hometown: 'Solo' })
  await linkCouple(kakek, nenek)

  const ayah = await createPerson('Ahmad Santoso', 'MALE', { callName: 'Pak Ahmad', birthYear: 1975, occupation: 'Wiraswasta', hometown: 'Jakarta' })
  const ibu = await createPerson('Dewi Lestari', 'FEMALE', { callName: 'Bu Dewi', birthYear: 1978, occupation: 'Guru', hometown: 'Bandung' })
  await linkChild(ayah, kakek); await linkChild(ayah, nenek)
  await linkCouple(ayah, ibu)

  const putri = await createPerson('Putri Santoso', 'FEMALE', { callName: 'Putri', birthYear: 2000, occupation: 'Mahasiswa' })
  const rian = await createPerson('Rian Santoso', 'MALE', { callName: 'Rian', birthYear: 2003, occupation: 'Pelajar' })
  await linkChild(putri, ayah); await linkChild(putri, ibu)
  await linkChild(rian, ayah); await linkChild(rian, ibu)

  const kevin = await createPerson('Kevin Santoso', 'MALE', { callName: 'Kevin', birthYear: 2022, hometown: 'Jakarta' })
  await linkChild(kevin, putri)

  const bibi = await createPerson('Maya Santoso', 'FEMALE', { callName: 'Maya', birthYear: 1980, occupation: 'Dokter', hometown: 'Surabaya' })
  await linkChild(bibi, kakek); await linkChild(bibi, nenek)
  const paman = await createPerson('Budianto', 'MALE', { callName: 'Pak Budi', birthYear: 1978, occupation: 'PNS', hometown: 'Surabaya' })
  await linkCouple(paman, bibi)

  const aldi = await createPerson('Aldionto', 'MALE', { callName: 'Aldi', birthYear: 2010, occupation: 'Pelajar', hometown: 'Surabaya' })
  await linkChild(aldi, paman); await linkChild(aldi, bibi)

  console.log('Small seed complete: 10 people')
}

// ─── SEED BIG: 100 people ──────────────────────────────────────────────

const firstNamesMale = ['Budi','Ahmad','Rian','Kevin','Aldi','Budianto','Hendra','Rizki','Dedi','Fajar','Yoga','Andi','Rizal','Bayu','Dimas','Iqbal','Farhan','Reza','Raka','Gilang','Eko','Agus','Hadi','Tono','Wawan','Arif','Nanda','Irwan','Dian','Rendi']
const firstNamesFemale = ['Siti','Dewi','Putri','Maya','Rina','Sari','Lina','Ani','Nina','Yuni','Dian','Rina','Fitri','Tari','Wulan','Indah','Citra','Ayu','Mega','Lestari','Dewi','Ratna','Sri','Lilis','Tuti','Eva','Ita','Nia','Yuli','Dina']
const lastNames = ['Santoso','Wijaya','Pratama','Kusuma','Hidayat','Nugroho','Saputra','Wibowo','Setiawan','Hakim','Gunawan','Susanto','Raharjo','Utomo','Purnomo','Adi','Budiman','Halim','Suryadi','Handoko']
const occupations = ['Dokter','Guru','Wiraswasta','PNS','Petani','Pegawai Swasta','Mahasiswa','Pelajar','Pengacara','Insinyur','Perawat','Arsitek','Desainer','Programmer','Pedagang','Buruh','Sopir','Ibu Rumah Tangga','Pensiunan']
const cities = ['Jakarta','Bandung','Surabaya','Semarang','Solo','Yogyakarta','Malang','Medan','Makassar','Denpasar']

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min }

async function seedBig() {
  console.log('Seeding big family (100 people)...')

  const all: Person[] = []
  let count = 0

  async function addPerson(gender: 'MALE' | 'FEMALE', gen: number): Promise<Person> {
    const names = gender === 'MALE' ? firstNamesMale : firstNamesFemale
    const fullname = `${pick(names)} ${pick(lastNames)}`
    const birthYear = 1930 + gen * 25 + rand(0, 10)
    const p = await createPerson(fullname, gender, {
      callName: fullname.split(' ')[0],
      birthYear,
      deathYear: gen <= 1 && Math.random() > 0.5 ? birthYear + rand(55, 85) : undefined,
      occupation: pick(occupations),
      hometown: pick(cities),
      phone: Math.random() > 0.4 ? `081${rand(10000000, 99999999)}` : undefined,
    })
    all.push(p)
    count++
    return p
  }

  // Gen 0: 2 grandparents
  const gp1 = await createPerson('Hendra Santoso', 'MALE', { callName: 'Kakek Hendra', birthYear: 1935, deathYear: 2015, occupation: 'Petani', hometown: 'Solo' })
  const gp2 = await createPerson('Siti Rahayu', 'FEMALE', { callName: 'Nenek Siti', birthYear: 1938, deathYear: 2022, occupation: 'Ibu Rumah Tangga', hometown: 'Solo' })
  all.push(gp1, gp2); count += 2
  await linkCouple(gp1, gp2)

  // Gen 1: 6 children of grandparents (3 couples + 3 singles)
  const gen1: Person[] = []
  for (let i = 0; i < 6; i++) {
    const gender = i % 2 === 0 ? 'MALE' : 'FEMALE'
    const child = await addPerson(gender, 1)
    await linkChild(child, gp1)
    await linkChild(child, gp2)
    gen1.push(child)
  }

  // Pair up first 4 as couples
  await linkCouple(gen1[0], gen1[1])
  await linkCouple(gen1[2], gen1[3])

  // Gen 2: children of gen 1 couples (target ~25 people)
  const gen2: Person[] = []
  for (const couple of [[gen1[0], gen1[1]], [gen1[2], gen1[3]]]) {
    const numKids = rand(3, 5)
    for (let i = 0; i < numKids; i++) {
      const gender = Math.random() > 0.5 ? 'MALE' : 'FEMALE'
      const child = await addPerson(gender, 2)
      await linkChild(child, couple[0])
      await linkChild(child, couple[1])
      gen2.push(child)
    }
  }
  // Add more gen2 from remaining gen1
  for (let i = 4; i < gen1.length; i++) {
    const numKids = rand(1, 3)
    for (let j = 0; j < numKids; j++) {
      const gender = Math.random() > 0.5 ? 'MALE' : 'FEMALE'
      const child = await addPerson(gender, 2)
      await linkChild(child, gen1[i])
      gen2.push(child)
    }
  }

  // Pair up gen2 as couples
  const gen2Couples: Person[][] = []
  for (let i = 0; i < gen2.length - 1; i += 2) {
    await linkCouple(gen2[i], gen2[i + 1])
    gen2Couples.push([gen2[i], gen2[i + 1]])
  }

  // Gen 3: children of gen2 couples (target ~35 people)
  const gen3: Person[] = []
  for (const couple of gen2Couples) {
    const numKids = rand(2, 4)
    for (let i = 0; i < numKids; i++) {
      const gender = Math.random() > 0.5 ? 'MALE' : 'FEMALE'
      const child = await addPerson(gender, 3)
      await linkChild(child, couple[0])
      await linkChild(child, couple[1])
      gen3.push(child)
    }
  }

  // Add some adoptions
  if (gen2.length > 3) {
    const adopted = await createPerson(pick(firstNamesMale) + ' ' + pick(lastNames), 'MALE', {
      callName: 'Adopsi', birthYear: 2000, occupation: pick(occupations), hometown: pick(cities),
    })
    all.push(adopted); count++
    await linkChild(adopted, gen2[0], 'ADOPTED')
    if (gen2[1]) await linkChild(adopted, gen2[1], 'ADOPTED')
    gen3.push(adopted)
  }

  // Pair up gen3
  const gen3Couples: Person[][] = []
  for (let i = 0; i < gen3.length - 1; i += 2) {
    await linkCouple(gen3[i], gen3[i + 1])
    gen3Couples.push([gen3[i], gen3[i + 1]])
  }

  // Gen 4: grandchildren (target ~20 people)
  for (const couple of gen3Couples) {
    const numKids = rand(1, 3)
    for (let i = 0; i < numKids; i++) {
      const gender = Math.random() > 0.5 ? 'MALE' : 'FEMALE'
      const child = await addPerson(gender, 4)
      await linkChild(child, couple[0])
      await linkChild(child, couple[1])
    }
  }

  // Fill remaining to reach ~100: add siblings, in-laws, extended family
  const target = 100
  while (count < target) {
    const gender = Math.random() > 0.5 ? 'MALE' : 'FEMALE'
    const p = await addPerson(gender, rand(1, 3))

    // Randomly link to an existing person as child or spouse
    if (all.length > 5 && Math.random() > 0.3) {
      const parent = pick(all.slice(0, Math.min(30, all.length)))
      await linkChild(p, parent)
    }
    if (all.length > 10 && Math.random() > 0.7) {
      const spouse = pick(all.slice(0, Math.min(40, all.length)))
      if (spouse.gender !== p.gender && !spouse.id.startsWith(p.id)) {
        try {
          await linkCouple(spouse.id < p.id ? spouse : p, spouse.id < p.id ? p : spouse)
        } catch { /* skip duplicate */ }
      }
    }
  }

  console.log(`Big seed complete: ${count} people`)
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
