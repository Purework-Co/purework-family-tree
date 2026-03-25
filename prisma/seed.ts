import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('Created admin user: admin')

  await prisma.user.upsert({
    where: { username: 'contributor' },
    update: {},
    create: {
      username: 'contributor',
      password: hashedPassword,
      role: 'CONTRIBUTOR',
    },
  })

  console.log('Created contributor user: contributor')

  const publicPassword = await bcrypt.hash('public123', 10)
  
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      familyName: 'Keluarga Besar',
      publicPassword: publicPassword,
    },
  })

  console.log('Created default settings')

  console.log('Creating family tree example...')

  const kakek = await prisma.person.create({
    data: {
      fullname: 'Budi Santoso',
      callName: 'Kakek Budi',
      gender: 'MALE',
      dateOfBirth: new Date('1945-03-15'),
      dateOfDeath: new Date('2020-08-10'),
      occupation: 'Petani',
      hometown: 'Solo, Jawa Tengah',
    },
  })

  const nenek = await prisma.person.create({
    data: {
      fullname: 'Siti Aminah',
      callName: 'Nenek Siti',
      gender: 'FEMALE',
      dateOfBirth: new Date('1950-06-20'),
      occupation: 'Ibu Rumah Tangga',
      hometown: 'Solo, Jawa Tengah',
    },
  })

  await prisma.personRelation.create({
    data: {
      fromPersonId: kakek.id,
      toPersonId: nenek.id,
      relationType: 'PASANGAN',
      relationSubType: 'BIOLOGICAL',
      urutan: 1,
    },
  })

  const ayah = await prisma.person.create({
    data: {
      fullname: 'Ahmad Santoso',
      callName: 'Pak Ahmad',
      gender: 'MALE',
      dateOfBirth: new Date('1975-01-10'),
      occupation: 'Wiraswasta',
      hometown: 'Jakarta',
      domicile: 'Jakarta Selatan',
    },
  })

  const ibu = await prisma.person.create({
    data: {
      fullname: 'Dewi Lestari',
      callName: 'Bu Dewi',
      gender: 'FEMALE',
      dateOfBirth: new Date('1978-09-25'),
      occupation: 'Guru',
      hometown: 'Bandung',
      domicile: 'Jakarta Selatan',
    },
  })

  await prisma.personRelation.create({
    data: { fromPersonId: ayah.id, toPersonId: kakek.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' },
  })

  await prisma.personRelation.create({
    data: { fromPersonId: ayah.id, toPersonId: nenek.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' },
  })

  await prisma.personRelation.create({
    data: {
      fromPersonId: ayah.id,
      toPersonId: ibu.id,
      relationType: 'PASANGAN',
      relationSubType: 'BIOLOGICAL',
      urutan: 1,
    },
  })

  const anak1 = await prisma.person.create({
    data: {
      fullname: 'Putri Santoso',
      callName: 'Putri',
      gender: 'FEMALE',
      dateOfBirth: new Date('2000-05-12'),
      occupation: 'Mahasiswa',
      domicile: 'Jakarta Selatan',
    },
  })

  const anak2 = await prisma.person.create({
    data: {
      fullname: 'Rian Santoso',
      callName: 'Rian',
      gender: 'MALE',
      dateOfBirth: new Date('2003-11-08'),
      occupation: 'Pelajar',
      domicile: 'Jakarta Selatan',
    },
  })

  const anak3 = await prisma.person.create({
    data: {
      fullname: 'Siti Rahayu',
      callName: 'Rahayu',
      gender: 'FEMALE',
      dateOfBirth: new Date('2005-02-28'),
      occupation: 'Pelajar',
      hometown: 'Jakarta',
      domicile: 'Jakarta Selatan',
    },
  })

  await prisma.personRelation.create({ data: { fromPersonId: anak1.id, toPersonId: ayah.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' } })
  await prisma.personRelation.create({ data: { fromPersonId: anak1.id, toPersonId: ibu.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' } })
  await prisma.personRelation.create({ data: { fromPersonId: anak2.id, toPersonId: ayah.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' } })
  await prisma.personRelation.create({ data: { fromPersonId: anak2.id, toPersonId: ibu.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' } })
  await prisma.personRelation.create({ data: { fromPersonId: anak3.id, toPersonId: ayah.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' } })
  await prisma.personRelation.create({ data: { fromPersonId: anak3.id, toPersonId: ibu.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' } })

  const cucu1 = await prisma.person.create({
    data: {
      fullname: 'Kevin Santoso',
      callName: 'Kevin',
      gender: 'MALE',
      dateOfBirth: new Date('2022-07-15'),
      hometown: 'Jakarta',
      domicile: 'Jakarta Selatan',
    },
  })

  await prisma.personRelation.create({ data: { fromPersonId: cucu1.id, toPersonId: anak1.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' },
  })

  const bibi = await prisma.person.create({
    data: {
      fullname: 'Maya Santoso',
      callName: 'Maya',
      gender: 'FEMALE',
      dateOfBirth: new Date('1980-12-05'),
      occupation: 'Dokter',
      hometown: 'Surabaya',
      domicile: 'Surabaya',
    },
  })

  await prisma.personRelation.create({ data: { fromPersonId: bibi.id, toPersonId: kakek.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' } })
  await prisma.personRelation.create({ data: { fromPersonId: bibi.id, toPersonId: nenek.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' } })

  const suamiBibi = await prisma.person.create({
    data: {
      fullname: 'Budianto',
      callName: 'Pak Budi',
      gender: 'MALE',
      dateOfBirth: new Date('1978-04-18'),
      occupation: 'Pegawai Negeri',
      hometown: 'Surabaya',
      domicile: 'Surabaya',
    },
  })

  await prisma.personRelation.create({
    data: {
      fromPersonId: bibi.id,
      toPersonId: suamiBibi.id,
      relationType: 'PASANGAN',
      relationSubType: 'BIOLOGICAL',
      urutan: 1,
    },
  })

  const keponakan = await prisma.person.create({
    data: {
      fullname: 'Aldionto',
      callName: 'Aldi',
      gender: 'MALE',
      dateOfBirth: new Date('2010-09-10'),
      occupation: 'Pelajar',
      hometown: 'Surabaya',
      domicile: 'Surabaya',
    },
  })

  await prisma.personRelation.create({ data: { fromPersonId: keponakan.id, toPersonId: bibi.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' } })
  await prisma.personRelation.create({ data: { fromPersonId: keponakan.id, toPersonId: suamiBibi.id, relationType: 'ORANGTUA_ANAK', relationSubType: 'BIOLOGICAL' } })

  console.log('Created family tree with:')
  console.log('- 1 Kakek & 1 Nenek')
  console.log('- 2 Orang Tua (Ayah & Ibu)')
  console.log('- 3 Anak')
  console.log('- 1 Cucu')
  console.log('- 1 Bibi & 1 Paman (Suami Bibi)')
  console.log('- 1 Keponakan')

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
