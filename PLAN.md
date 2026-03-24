# PureWork Family - Technical Specification

## 1. Konfigurasi & Identitas

| Aspek | Value |
|-------|-------|
| **Nama Aplikasi** | PureWork Family |
| **Web Icon** | Lucide React `Users` icon |
| **Theme Color** | Warm Terracotta (#E07A5F) + Cream (#F4F1DE) |
| **Font** | Nunito (family-friendly, readable untuk orang tua) |
| **Responsive** | Mobile-first, touch-friendly (min 44px touch targets) |

---

## 2. Database Schema (Prisma)

```prisma
// Settings: nama family & password
model Settings {
  id            String  @id @default("default")
  familyName    String  @default("Keluarga")
  publicPassword String
  updatedAt     DateTime @updatedAt
}

// User: admin & contributor
model User {
  id        String   @id @default(cuid())
  username  String   @unique
  password  String   // hashed bcrypt
  role      Role     @default(CONTRIBUTOR)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role { ADMIN, CONTRIBUTOR }

// Person: anggota keluarga
model Person {
  id          String    @id @default(cuid())
  fullname    String
  callName    String?
  dateOfBirth DateTime?
  dateOfDeath DateTime?
  gender      Gender
  occupation  String?
  hometown    String?
  domicile    String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  relationsFrom PersonRelation[] @relation("FromPerson")
  relationsTo   PersonRelation[] @relation("ToPerson")
}

enum Gender { MALE, FEMALE }

// Relations: father, mother, wife, husband, child
model PersonRelation {
  id           String       @id @default(cuid())
  fromPersonId String
  toPersonId   String
  relationType RelationType
  
  fromPerson   Person       @relation("FromPerson", fields: [fromPersonId], references: [id])
  toPerson     Person       @relation("ToPerson", fields: [toPersonId], references: [id])
  
  createdAt    DateTime     @default(now())
  @@unique([fromPersonId, toPersonId, relationType])
}

enum RelationType { FATHER, MOTHER, WIFE, HUSBAND, CHILD }
```

---

## 3. Halaman & Route

| Route | Akses | Deskripsi |
|-------|-------|-----------|
| `/` | Public | Landing page + link visualization & statistics |
| `/login` | Public | Login page |
| `/family-tree` | Public (password) | **Visualisasi tree** dengan nama family |
| `/statistics` | Public (password) | **Statistik publik** |
| `/dashboard` | Admin/Contributor | Dashboard |
| `/dashboard/people` | Admin/Contributor | CRUD orang (datatable) |
| `/dashboard/relations` | Admin/Contributor | CRUD relasi |
| `/dashboard/users` | Admin only | CRUD user |
| `/dashboard/settings` | Admin only | Pengaturan: family name, password |

---

## 4. Statistik Publik (halaman `/statistics`)

Setelah masuk password publik:

| Statistik | Deskripsi |
|-----------|-----------|
| Total Anggota | Jumlah total anggota keluarga |
| Jumlah Pria | Total laki-laki |
| Jumlah Wanita | Total perempuan |
| Rata-rata Usia | Rata-rata usia anggota yang masih hidup |
| Usia Termuda | Anggota termuda yang masih hidup |
| Usia Tertua | Anggota tertua yang masih hidup |
| Rata-rata Jumlah Anak | Rata-rata anak perorang tua |
| Total Pasangan | Jumlah pasangan (suami-istri) |
| Distribusi Pekerjaan | Jumlah per pekerjaan (jika ada) |

---

## 5. Visualisasi Family Tree

### Struktur Tampilan
```
        [Kakek/Nenek]           <- Parents level (atas)
              |
        [Ayah] — [Ibu]           <- Spouse level (sejajar)
              |
        [Anak 1] [Anak 2]       <- Children level (bawah)
```

### Node Display
- Nama lengkap
- Usia / Almarhum
- Jumlah anak
- Click: popup detail

### Optimisasi (ratusan orang)
- Virtualization: render hanya node yang visible
- Load more bertahap jika > 100 node
- Zoom & pan controls
- Collapse/expand branch

---

## 6. API Endpoints

```
Auth:
POST   /api/auth/login
POST   /api/auth/logout

People:
GET    /api/people?page=1&limit=20
POST   /api/people
GET    /api/people/[id]
PUT    /api/people/[id]
DELETE /api/people/[id]

Relations:
GET    /api/relations
POST   /api/relations
DELETE /api/relations/[id]

Users (Admin):
GET    /api/users
POST   /api/users
PUT    /api/users/[id]
DELETE /api/users/[id]

Settings (Admin):
GET    /api/settings
PUT    /api/settings

Public:
GET    /api/public/statistics  (need password validation)
GET    /api/public/tree        (need password validation)
POST   /api/public/validate-password
```

---

## 7. Design System

### Colors
```css
--primary: #E07A5F;       /* Warm terracotta */
--primary-hover: #C96A52;
--secondary: #3D405B;    /* Warm dark */
--accent: #81B29A;       /* Soft green */
--background: #F4F1DE;  /* Warm cream */
--surface: #FFFFFF;
--text: #2D3142;
--text-muted: #6B7280;
--border: #E5E7EB;
```

### Typography
- **Font**: Nunito (Google Fonts)
- **Body**: 16px-18px
- **Headings**: 1.5rem-2.5rem, bold
- **Button**: min 44px height (touch-friendly)

### Components
- Rounded corners (12px-16px)
- Soft shadows
- Large touch targets
- Clear visual hierarchy

---

## 8. Bahasa Indonesia (Full)

Semua UI dalam Bahasa Indonesia:
- Navigation: "Beranda", "Pohon Keluarga", "Statistik", "Masuk"
- Dashboard: "Kelola Keluarga", "Kelola Relasi", "Kelola User", "Pengaturan"
- Actions: "Tambah", "Edit", "Hapus", "Simpan", "Batal", "Cari"
- Fields: "Nama Lengkap", "Nama Panggilan", "Tanggal Lahir", "Tanggal Wafat", "Jenis Kelamin", "Pekerjaan", "Kampung Halaman", "Domisili"
- Relations: "Ayah", "Ibu", "Suami", "Istri", "Anak"
- Messages: "Data berhasil disimpan", "Password salah", dll

---

## 9. Implementation Steps

1. Initialize Next.js 14 + TypeScript + Tailwind
2. Setup Prisma + PostgreSQL + schema
3. Setup NextAuth.js (credentials provider)
4. Create UI components (shadcn-like)
5. Implement dashboard layout
6. CRUD People + Relations API & UI
7. CRUD Users + Settings API & UI (admin)
8. Public password protection middleware
9. Statistics page
10. Family tree visualization (React Flow)
11. Responsive design optimization
12. Deployment
