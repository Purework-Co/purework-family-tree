# PureWork Family

Aplikasi Pohon Keluarga Digital dengan Next.js, PostgreSQL, dan Prisma.

## Fitur

- **Dashboard Admin/Contributor**: CRUD data anggota keluarga dan relasi
- **Visualisasi Pohon Keluarga**: Tampilan tree interaktif dengan zoom/pan
- **Statistik Publik**: Statistik keluarga (usia, jumlah anggota, dll)
- **Autentikasi**: Login dengan username & password
- **Role-based Access**: Admin dan Contributor
- **Responsif**: Nyaman digunakan di HP
- **Bahasa Indonesia**: Seluruh interface dalam Bahasa Indonesia

## Requirements

- Node.js 18+
- PostgreSQL database

## Setup Instructions

### 1. Clone dan Install Dependencies

```bash
npm install
```

### 2. Setup Database PostgreSQL

Buat database PostgreSQL dengan nama `purework_family`:

```bash
# Jika menggunakan Docker
docker run --name postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=purework_family -p 5432:5432 -d postgres

# Jika menggunakan local PostgreSQL
createdb purework_family
```

### 3. Konfigurasi Environment

Edit file `.env` dan sesuaikan `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/purework_family?schema=public"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

Ganti:
- `postgres` → username PostgreSQL Anda
- `password` → password PostgreSQL Anda

### 4. Setup Database

Jalankan migration dan seed:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema ke database
npx prisma db push

# Seed data awal (membuat admin user)
npx prisma db seed
```

### 5. Jalankan Aplikasi

```bash
npm run dev
```

Buka http://localhost:3000

## Default Credentials

Setelah seed, Anda bisa login dengan:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Public (visualisasi/statistik) | - | public123 |

## Halaman

| Route | Akses | Deskripsi |
|-------|-------|-----------|
| `/` | Public | Landing page |
| `/login` | Public | Login dashboard |
| `/family-tree` | Public (password) | Visualisasi pohon keluarga |
| `/statistics` | Public (password) | Statistik keluarga |
| `/dashboard` | Admin/Contributor | Dashboard utama |
| `/dashboard/people` | Admin/Contributor | CRUD anggota keluarga |
| `/dashboard/relations` | Admin/Contributor | CRUD relasi |
| `/dashboard/users` | Admin only | Kelola user |
| `/dashboard/settings` | Admin only | Pengaturan (nama keluarga, password publik) |

## Data Fields

### Anggota Keluarga
- Nama Lengkap (wajib)
- Nama Panggilan
- Tanggal Lahir
- Tanggal Wafat
- Jenis Kelamin (Laki-laki/Perempuan)
- Pekerjaan
- Kampung Halaman
- Domisili

### Relasi
- Ayah
- Ibu
- Suami
- Istri
- Anak

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **UI**: Tailwind CSS + Custom Components
- **Icons**: Lucide React

## Deployment

Untuk production:

1. Set environment variables di hosting:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

2. Build aplikasi:
```bash
npm run build
npm start
```

## Lisensi

MIT
