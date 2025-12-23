# Fräulein Franken – Geschenke für dich

Eine moderne Web-App für Kleingewerbe-Verwaltung: Warenbestand, Kundenverwaltung und Rechnungen mit PDF-Export.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.0-2D3748)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC)

## ✨ Features

- **Dashboard** – Statistiken, Warnungen bei niedrigem Bestand
- **Produktverwaltung** – CRUD, Bestandsbewegungen, Kategorien
- **Kundenverwaltung** – CRUD, Verknüpfung zu Rechnungen
- **Rechnungen** – Erstellen, bearbeiten, finalisieren, stornieren
- **PDF-Export** – Professionelle Rechnungs-PDFs
- **Kleinunternehmer** – §19 UStG standardmäßig (ohne MwSt.)
- **Bestandsbuchung** – Automatisch bei Rechnungsfinalisierung

## 🚀 Setup

### 1. Repository klonen

```bash
cd "c:\Katha 3\fraeulein-franken"
```

### 2. Abhängigkeiten installieren

```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren

Kopiere `.env.example` zu `.env` und fülle die Werte aus:

```bash
cp .env.example .env
```

#### Neon Datenbank einrichten

1. Erstelle einen kostenlosen Account bei [neon.tech](https://neon.tech)
2. Erstelle ein neues Projekt
3. Kopiere die Connection URL (PostgreSQL)
4. Füge sie in `.env` ein:

```env
DATABASE_URL="postgresql://username:password@host.neon.tech/dbname?sslmode=require"
```

#### Auth Secret generieren

```bash
# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

Füge das Ergebnis in `.env` ein:

```env
AUTH_SECRET="dein-generiertes-secret"
AUTH_URL="http://localhost:3000"
```

### 4. Datenbank migrieren

```bash
npx prisma generate
npx prisma db push
```

### 5. Seed-Daten laden (optional)

```bash
npx tsx prisma/seed.ts
```

Dies erstellt:
- Admin-Benutzer: `admin@fraeulein-franken.de` / `admin123`
- Beispielprodukte und Kunden
- Standardeinstellungen

### 6. Entwicklungsserver starten

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000)

## 📁 Projektstruktur

```
src/
├── app/
│   ├── (dashboard)/       # Dashboard-Layout mit Sidebar
│   │   ├── dashboard/     # Startseite
│   │   ├── produkte/      # Produktverwaltung
│   │   ├── kunden/        # Kundenverwaltung
│   │   ├── rechnungen/    # Rechnungsverwaltung
│   │   └── einstellungen/ # Firmenkonfiguration
│   ├── api/               # API Routes
│   ├── login/             # Login-Seite
│   └── layout.tsx
├── components/            # UI-Komponenten
├── lib/                   # Utilities
│   ├── prisma.ts          # Prisma Client
│   ├── auth.ts            # NextAuth Konfiguration
│   ├── pdf.ts             # PDF-Generierung
│   └── validators.ts      # Zod Schemas
└── types/                 # TypeScript Types
```

## 🌐 Deployment auf Vercel

### 1. Repository bei GitHub pushen

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/dein-username/fraeulein-franken.git
git push -u origin main
```

### 2. Vercel Projekt erstellen

1. Gehe zu [vercel.com](https://vercel.com)
2. "Import Project" → GitHub Repository wählen
3. Framework: Next.js (automatisch erkannt)

### 3. Umgebungsvariablen setzen

In den Vercel Project Settings → Environment Variables:

| Variable | Wert |
|----------|------|
| `DATABASE_URL` | Deine Neon Connection URL |
| `AUTH_SECRET` | Dein generiertes Secret |
| `AUTH_URL` | `https://deine-app.vercel.app` |

### 4. Deploy

Vercel deployed automatisch bei jedem Push zu `main`.

### 5. Datenbank migrieren (Produktion)

Nach dem ersten Deploy:

```bash
npx prisma db push
npx tsx prisma/seed.ts
```

## 🔒 Login-Daten

Nach dem Seeding:

- **E-Mail**: `admin@fraeulein-franken.de`
- **Passwort**: `admin123`

⚠️ **Ändere das Passwort in der Produktion!**

## 📋 API Endpoints

| Endpoint | Methoden | Beschreibung |
|----------|----------|--------------|
| `/api/products` | GET, POST | Produkte |
| `/api/products/[id]` | GET, PATCH, DELETE | Einzelprodukt |
| `/api/products/[id]/stock` | GET, POST | Bestandsbewegungen |
| `/api/customers` | GET, POST | Kunden |
| `/api/customers/[id]` | GET, PATCH, DELETE | Einzelkunde |
| `/api/invoices` | GET, POST | Rechnungen |
| `/api/invoices/[id]` | GET, PATCH, DELETE | Einzelrechnung |
| `/api/invoices/[id]/finalize` | POST | Rechnung finalisieren |
| `/api/invoices/[id]/paid` | POST | Als bezahlt markieren |
| `/api/invoices/[id]/cancel` | POST | Stornieren |
| `/api/settings` | GET, PATCH | Einstellungen |

## 🛠️ Technologie-Stack

- **Frontend**: Next.js 15 (App Router), React 19
- **Styling**: TailwindCSS v4
- **Auth**: NextAuth.js v5 (Credentials)
- **Datenbank**: Neon (PostgreSQL)
- **ORM**: Prisma 6
- **PDF**: jsPDF + jspdf-autotable
- **Validierung**: Zod
- **Icons**: Lucide React
- **Toasts**: react-hot-toast

## 📝 Lizenz

Private Nutzung für Fräulein Franken – Geschenke für dich.
