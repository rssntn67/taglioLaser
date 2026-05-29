# Sito Preventivi Taglio Laser — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Costruire un sito in italiano per preventivi automatici di taglio laser: upload DXF → calcolo ml → prezzo in tempo reale → checkout → admin panel.

**Architecture:** Next.js 14 App Router full-stack. Il parsing DXF avviene server-side via API route (`/api/dxf/parse`). Il preventivo è calcolato in tempo reale sul client dopo aver ricevuto i ml dal server. Il pannello admin è protetto da NextAuth.js con credenziali da env vars.

**Tech Stack:** Next.js 14, TypeScript, PostgreSQL 16, Prisma 5, dxf-parser, Nodemailer, NextAuth.js 4, Tailwind CSS 3, Docker Compose, Jest + ts-jest

---

## File Map

```
taglioLaser/
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── .env.local.example
├── jest.config.ts
├── middleware.ts
├── types/index.ts
├── lib/
│   ├── prisma.ts
│   ├── dxf/
│   │   ├── parser.ts
│   │   └── __tests__/parser.test.ts
│   ├── pricing/
│   │   ├── calculator.ts
│   │   └── __tests__/calculator.test.ts
│   └── email/sender.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── Badge.tsx
│   └── configuratore/
│       ├── MaterialSelector.tsx
│       ├── ThicknessSelector.tsx
│       ├── DxfUploader.tsx
│       └── PreventivoPanel.tsx
└── app/
    ├── (public)/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── preventivo/page.tsx
    │   ├── checkout/page.tsx
    │   ├── conferma/page.tsx
    │   └── contatti/page.tsx
    ├── admin/
    │   ├── layout.tsx
    │   ├── login/page.tsx
    │   ├── page.tsx
    │   ├── prezzi/page.tsx
    │   ├── ordini/page.tsx
    │   └── ordini/[id]/page.tsx
    └── api/
        ├── auth/[...nextauth]/route.ts
        ├── dxf/parse/route.ts
        ├── preventivo/route.ts
        ├── ordini/route.ts
        └── admin/
            ├── prezzi/route.ts
            ├── ordini/route.ts
            └── ordini/[id]/
                ├── route.ts
                └── dxf/route.ts
```

---

### Task 1: Inizializzazione progetto

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `jest.config.ts`

- [ ] **Step 1: Crea il progetto Next.js**

```bash
cd /Users/antonio/Rcs/rssntn67/taglioLaser
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --no-git
```

Risposta alle domande interactive: conferma tutte le opzioni di default.

- [ ] **Step 2: Installa le dipendenze**

```bash
npm install prisma @prisma/client next-auth dxf-parser nodemailer uuid
npm install -D @types/nodemailer @types/uuid ts-jest jest @types/jest jest-environment-node
```

- [ ] **Step 3: Configura Jest**

Crea `jest.config.ts`:

```typescript
import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': ['ts-jest', {}] },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  testPathPattern: '__tests__',
};

export default config;
```

- [ ] **Step 4: Configura Tailwind per il tema minimal**

Sostituisci il contenuto di `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        ink: '#111111',
        mist: '#f5f5f5',
        border: '#eeeeee',
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 5: Crea il file dei tipi condivisi**

Crea `types/index.ts`:

```typescript
export interface ThicknessWithPrice {
  id: number;
  valore: number;
  price: { quotaFissaEur: number; costoPerMetroEur: number } | null;
}

export interface MaterialWithThicknesses {
  id: number;
  nome: string;
  slug: string;
  thicknesses: ThicknessWithPrice[];
}

export interface DxfParseResult {
  metriLineari: number;
  entitaCount: number;
  dxfKey: string;
}

export interface PreventivoResult {
  quotaFissaTotale: number;
  costoTaglioTotale: number;
  totale: number;
}

export interface OrderPayload {
  nome: string;
  email: string;
  azienda?: string;
  pIva?: string;
  note?: string;
  materialId: number;
  thicknessId: number;
  quantita: number;
  metriLineari: number;
  dxfKey: string;
}
```

- [ ] **Step 6: Crea `.env.local.example`**

```bash
# Database
DATABASE_URL="postgresql://tagliolaser:password@localhost:5432/tagliolaser"

# NextAuth
NEXTAUTH_SECRET="cambia-con-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Credenziali admin
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="cambia-con-password-sicura"

# SMTP
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user@example.com"
SMTP_PASS="password"
SMTP_FROM="noreply@example.com"
```

```bash
cp .env.local.example .env.local
```

- [ ] **Step 7: Commit**

```bash
git init
git add .
git commit -m "feat: inizializzazione progetto Next.js 14 con Tailwind e Jest"
```

---

### Task 2: Docker e configurazione ambiente

**Files:**
- Create: `Dockerfile`, `docker-compose.yml`, `nginx.conf`, `.dockerignore`

- [ ] **Step 1: Crea `Dockerfile`**

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
RUN mkdir -p uploads/dxf && chown nextjs:nodejs uploads
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

- [ ] **Step 2: Aggiungi `output: 'standalone'` a `next.config.ts`**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

- [ ] **Step 3: Crea `docker-compose.yml`**

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env.local
    volumes:
      - uploads:/app/uploads
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: tagliolaser
      POSTGRES_USER: tagliolaser
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tagliolaser"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  pgdata:
  uploads:
```

- [ ] **Step 4: Crea `nginx.conf`**

```nginx
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name _;

    ssl_certificate /etc/letsencrypt/live/DOMINIO/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMINIO/privkey.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

- [ ] **Step 5: Crea `.dockerignore`**

```
node_modules
.next
.env.local
uploads
.git
```

- [ ] **Step 6: Commit**

```bash
git add Dockerfile docker-compose.yml nginx.conf .dockerignore next.config.ts
git commit -m "feat: aggiunge configurazione Docker e Nginx"
```

---

### Task 3: Schema Prisma, migration e seed

**Files:**
- Create: `prisma/schema.prisma`, `prisma/seed.ts`

- [ ] **Step 1: Inizializza Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Scrivi lo schema**

Sostituisci `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Material {
  id          Int         @id @default(autoincrement())
  nome        String
  slug        String      @unique
  thicknesses Thickness[]
  orders      Order[]
}

model Thickness {
  id         Int      @id @default(autoincrement())
  materialId Int
  valore     Float
  material   Material @relation(fields: [materialId], references: [id])
  price      Price?
  orders     Order[]

  @@unique([materialId, valore])
}

model Price {
  id               Int       @id @default(autoincrement())
  thicknessId      Int       @unique
  quotaFissaEur    Float
  costoPerMetroEur Float
  thickness        Thickness @relation(fields: [thicknessId], references: [id])
}

model Order {
  id           Int         @id @default(autoincrement())
  createdAt    DateTime    @default(now())
  status       OrderStatus @default(PENDING)
  nome         String
  email        String
  azienda      String?
  pIva         String?
  note         String?
  materialId   Int
  thicknessId  Int
  quantita     Int
  metriLineari Float
  prezzoTotale Float
  dxfKey       String
  material     Material    @relation(fields: [materialId], references: [id])
  thickness    Thickness   @relation(fields: [thicknessId], references: [id])
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
}
```

- [ ] **Step 3: Crea il seed**

Crea `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MATERIALS = [
  {
    nome: 'Acciaio Inox',
    slug: 'inox',
    thicknesses: [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10],
  },
  {
    nome: 'Acciaio al Carbonio',
    slug: 'carbonio',
    thicknesses: [1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15],
  },
  {
    nome: 'Alluminio',
    slug: 'alluminio',
    thicknesses: [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8],
  },
  {
    nome: 'Ottone / Rame',
    slug: 'ottone-rame',
    thicknesses: [0.5, 1, 1.5, 2, 3, 4, 5],
  },
];

// Prezzi di default: da aggiornare nel pannello admin
const DEFAULT_QUOTA_FISSA = 1.50;
const DEFAULT_COSTO_PER_METRO = 4.00;

async function main() {
  for (const mat of MATERIALS) {
    const material = await prisma.material.upsert({
      where: { slug: mat.slug },
      update: { nome: mat.nome },
      create: { nome: mat.nome, slug: mat.slug },
    });

    for (const valore of mat.thicknesses) {
      const thickness = await prisma.thickness.upsert({
        where: { materialId_valore: { materialId: material.id, valore } },
        update: {},
        create: { materialId: material.id, valore },
      });

      await prisma.price.upsert({
        where: { thicknessId: thickness.id },
        update: {},
        create: {
          thicknessId: thickness.id,
          quotaFissaEur: DEFAULT_QUOTA_FISSA,
          costoPerMetroEur: DEFAULT_COSTO_PER_METRO,
        },
      });
    }
  }

  console.log('Seed completato: materiali, spessori e prezzi di default inseriti.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 4: Aggiungi lo script seed a `package.json`**

Nel blocco `"scripts"` di `package.json`, aggiungi dopo l'ultimo script:

```json
"db:seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts",
"db:migrate": "prisma migrate dev"
```

E subito dopo `"scripts"`, aggiungi a livello radice di `package.json`:

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
},
```

- [ ] **Step 5: Esegui migration e seed** (richiede PostgreSQL in esecuzione)

Se non hai PostgreSQL locale, avvia solo il container DB:

```bash
docker compose up db -d
```

Poi:

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

Output atteso dal seed:
```
Seed completato: materiali, spessori e prezzi di default inseriti.
```

- [ ] **Step 6: Commit**

```bash
git add prisma/ package.json
git commit -m "feat: schema Prisma con materiali, spessori, prezzi e ordini"
```

---

### Task 4: Parser DXF (TDD)

**Files:**
- Create: `lib/dxf/parser.ts`, `lib/dxf/__tests__/parser.test.ts`

- [ ] **Step 1: Scrivi il test**

Crea `lib/dxf/__tests__/parser.test.ts`:

```typescript
import { calcolaMetriLineari } from '../parser';

// LINE di 100mm lungo l'asse X
const DXF_LINE_100MM = `
0
SECTION
2
ENTITIES
0
LINE
8
0
10
0.0
20
0.0
30
0.0
11
100.0
21
0.0
31
0.0
0
ENDSEC
0
EOF
`;

// CIRCLE di raggio 50mm → perimetro = 2π×50 ≈ 314.16mm
const DXF_CIRCLE_R50 = `
0
SECTION
2
ENTITIES
0
CIRCLE
8
0
10
0.0
20
0.0
30
0.0
40
50.0
0
ENDSEC
0
EOF
`;

describe('calcolaMetriLineari', () => {
  it('calcola una linea di 100mm = 0.1 metri', () => {
    const result = calcolaMetriLineari(DXF_LINE_100MM);
    expect(result.metriLineari).toBeCloseTo(0.1, 4);
    expect(result.entitaCount).toBe(1);
  });

  it('calcola il perimetro di un cerchio r=50mm ≈ 0.3142 metri', () => {
    const result = calcolaMetriLineari(DXF_CIRCLE_R50);
    expect(result.metriLineari).toBeCloseTo(2 * Math.PI * 50 / 1000, 4);
    expect(result.entitaCount).toBe(1);
  });

  it('restituisce 0 per DXF senza entità', () => {
    const empty = '0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF\n';
    const result = calcolaMetriLineari(empty);
    expect(result.metriLineari).toBe(0);
    expect(result.entitaCount).toBe(0);
  });

  it('lancia errore per stringa non DXF', () => {
    expect(() => calcolaMetriLineari('non valido')).toThrow();
  });
});
```

- [ ] **Step 2: Esegui il test — deve fallire**

```bash
npx jest lib/dxf --no-coverage
```

Output atteso: `FAIL` — `Cannot find module '../parser'`

- [ ] **Step 3: Implementa il parser**

Crea `lib/dxf/parser.ts`:

```typescript
import DxfParser from 'dxf-parser';

export interface DxfCalcResult {
  metriLineari: number;
  entitaCount: number;
}

function dist2d(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

export function calcolaMetriLineari(dxfContent: string): DxfCalcResult {
  const parser = new DxfParser();
  const dxf = parser.parseSync(dxfContent);

  if (!dxf) throw new Error('File DXF non valido');

  const entities = dxf.entities ?? [];
  let totaleMm = 0;
  let entitaCount = 0;

  for (const e of entities) {
    switch (e.type) {
      case 'LINE': {
        totaleMm += dist2d(e.vertices[0], e.vertices[1]);
        entitaCount++;
        break;
      }
      case 'ARC': {
        let diff = ((e.endAngle - e.startAngle) * Math.PI) / 180;
        if (diff <= 0) diff += 2 * Math.PI;
        totaleMm += e.radius * diff;
        entitaCount++;
        break;
      }
      case 'CIRCLE': {
        totaleMm += 2 * Math.PI * e.radius;
        entitaCount++;
        break;
      }
      case 'LWPOLYLINE':
      case 'POLYLINE': {
        const verts: Array<{ x: number; y: number }> = e.vertices;
        for (let i = 0; i < verts.length - 1; i++) {
          totaleMm += dist2d(verts[i], verts[i + 1]);
        }
        if (e.closed && verts.length > 1) {
          totaleMm += dist2d(verts[verts.length - 1], verts[0]);
        }
        entitaCount++;
        break;
      }
      case 'ELLIPSE': {
        // Approssimazione di Ramanujan
        const ep = e.majorAxisEndPoint as { x: number; y: number };
        const a = Math.sqrt(ep.x ** 2 + ep.y ** 2);
        const b = a * (e.axisRatio as number);
        const h = (a - b) ** 2 / (a + b) ** 2;
        totaleMm += Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
        entitaCount++;
        break;
      }
    }
  }

  return { metriLineari: totaleMm / 1000, entitaCount };
}
```

- [ ] **Step 4: Esegui i test — devono passare**

```bash
npx jest lib/dxf --no-coverage
```

Output atteso:
```
PASS lib/dxf/__tests__/parser.test.ts
  calcolaMetriLineari
    ✓ calcola una linea di 100mm = 0.1 metri
    ✓ calcola il perimetro di un cerchio r=50mm ≈ 0.3142 metri
    ✓ restituisce 0 per DXF senza entità
    ✓ lancia errore per stringa non DXF
```

- [ ] **Step 5: Commit**

```bash
git add lib/dxf/
git commit -m "feat: parser DXF con calcolo metri lineari (LINE, ARC, CIRCLE, POLYLINE, ELLIPSE)"
```

---

### Task 5: Calcolatore preventivo (TDD)

**Files:**
- Create: `lib/pricing/calculator.ts`, `lib/pricing/__tests__/calculator.test.ts`

- [ ] **Step 1: Scrivi il test**

Crea `lib/pricing/__tests__/calculator.test.ts`:

```typescript
import { calcolaPreventivo } from '../calculator';

describe('calcolaPreventivo', () => {
  it('calcola quota fissa + costo taglio + totale', () => {
    const result = calcolaPreventivo({
      quotaFissaEur: 1.50,
      costoPerMetroEur: 4.00,
      metriLineari: 3.45,
      quantita: 10,
    });
    expect(result.quotaFissaTotale).toBe(15.00);       // 1.50 × 10
    expect(result.costoTaglioTotale).toBe(138.00);     // 4.00 × 3.45 × 10
    expect(result.totale).toBe(153.00);
  });

  it('gestisce quantità 1', () => {
    const result = calcolaPreventivo({
      quotaFissaEur: 2.00,
      costoPerMetroEur: 5.00,
      metriLineari: 1.0,
      quantita: 1,
    });
    expect(result.totale).toBe(7.00);
  });

  it('arrotonda a 2 decimali', () => {
    const result = calcolaPreventivo({
      quotaFissaEur: 1.00,
      costoPerMetroEur: 3.333,
      metriLineari: 1.0,
      quantita: 1,
    });
    expect(result.costoTaglioTotale).toBe(3.33);
    expect(result.totale).toBe(4.33);
  });
});
```

- [ ] **Step 2: Esegui il test — deve fallire**

```bash
npx jest lib/pricing --no-coverage
```

Output atteso: `FAIL` — `Cannot find module '../calculator'`

- [ ] **Step 3: Implementa il calcolatore**

Crea `lib/pricing/calculator.ts`:

```typescript
export interface PriceParams {
  quotaFissaEur: number;
  costoPerMetroEur: number;
  metriLineari: number;
  quantita: number;
}

export interface PreventivoResult {
  quotaFissaTotale: number;
  costoTaglioTotale: number;
  totale: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calcolaPreventivo(params: PriceParams): PreventivoResult {
  const { quotaFissaEur, costoPerMetroEur, metriLineari, quantita } = params;
  const quotaFissaTotale = round2(quotaFissaEur * quantita);
  const costoTaglioTotale = round2(costoPerMetroEur * metriLineari * quantita);
  const totale = round2(quotaFissaTotale + costoTaglioTotale);
  return { quotaFissaTotale, costoTaglioTotale, totale };
}
```

- [ ] **Step 4: Esegui i test — devono passare**

```bash
npx jest lib/pricing --no-coverage
```

Output atteso:
```
PASS lib/pricing/__tests__/calculator.test.ts
  calcolaPreventivo
    ✓ calcola quota fissa + costo taglio + totale
    ✓ gestisce quantità 1
    ✓ arrotonda a 2 decimali
```

- [ ] **Step 5: Commit**

```bash
git add lib/pricing/
git commit -m "feat: calcolatore preventivo con formula quota fissa + costo al metro"
```

---

### Task 6: Prisma client e API routes

**Files:**
- Create: `lib/prisma.ts`, `lib/email/sender.ts`
- Create: `app/api/dxf/parse/route.ts`, `app/api/preventivo/route.ts`, `app/api/ordini/route.ts`

- [ ] **Step 1: Crea il singleton Prisma**

Crea `lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
```

- [ ] **Step 2: Crea il servizio email**

Crea `lib/email/sender.ts`:

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function inviaEmailConferma(params: {
  nome: string;
  email: string;
  orderId: number;
  prezzoTotale: number;
}) {
  const { nome, email, orderId, prezzoTotale } = params;
  await transporter.sendMail({
    from: `"Taglio Laser" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: `Conferma ordine #${orderId} — Taglio Laser`,
    html: `
      <h2>Grazie ${nome}!</h2>
      <p>Il tuo ordine <strong>#${orderId}</strong> è stato ricevuto.</p>
      <p><strong>Totale: €${prezzoTotale.toFixed(2)}</strong></p>
      <p>Ti contatteremo presto per confermare i dettagli e organizzare la consegna.</p>
    `,
  });
}
```

- [ ] **Step 3: Crea la directory uploads**

```bash
mkdir -p uploads/dxf
echo "uploads/dxf/" >> .gitignore
echo "!uploads/dxf/.gitkeep" >> .gitignore
touch uploads/dxf/.gitkeep
```

- [ ] **Step 4: Crea l'API route per il parsing DXF**

Crea `app/api/dxf/parse/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { calcolaMetriLineari } from '@/lib/dxf/parser';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Nessun file ricevuto' }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith('.dxf')) {
    return NextResponse.json({ error: 'Il file deve essere in formato DXF' }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File troppo grande (max 10MB)' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const content = Buffer.from(bytes).toString('utf-8');

  let calcResult;
  try {
    calcResult = calcolaMetriLineari(content);
  } catch {
    return NextResponse.json({ error: 'File DXF non valido o corrotto' }, { status: 422 });
  }

  const dxfKey = `${uuidv4()}.dxf`;
  const uploadDir = path.join(process.cwd(), 'uploads', 'dxf');
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, dxfKey), Buffer.from(bytes));

  return NextResponse.json({
    metriLineari: calcResult.metriLineari,
    entitaCount: calcResult.entitaCount,
    dxfKey,
  });
}
```

- [ ] **Step 5: Crea l'API route per il preventivo**

Crea `app/api/preventivo/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calcolaPreventivo } from '@/lib/pricing/calculator';

export async function POST(request: NextRequest) {
  const body = await request.json() as { thicknessId: number; metriLineari: number; quantita: number };

  if (!body.thicknessId || body.metriLineari == null || !body.quantita) {
    return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
  }

  const price = await prisma.price.findUnique({ where: { thicknessId: body.thicknessId } });
  if (!price) {
    return NextResponse.json({ error: 'Prezzo non trovato per questo spessore' }, { status: 404 });
  }

  const result = calcolaPreventivo({
    quotaFissaEur: price.quotaFissaEur,
    costoPerMetroEur: price.costoPerMetroEur,
    metriLineari: body.metriLineari,
    quantita: body.quantita,
  });

  return NextResponse.json(result);
}
```

- [ ] **Step 6: Crea l'API route per la creazione ordini**

Crea `app/api/ordini/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calcolaPreventivo } from '@/lib/pricing/calculator';
import { inviaEmailConferma } from '@/lib/email/sender';
import type { OrderPayload } from '@/types';

export async function POST(request: NextRequest) {
  const body = await request.json() as OrderPayload;

  const required = ['nome', 'email', 'materialId', 'thicknessId', 'quantita', 'metriLineari', 'dxfKey'];
  for (const field of required) {
    if (!body[field as keyof OrderPayload]) {
      return NextResponse.json({ error: `Campo obbligatorio mancante: ${field}` }, { status: 400 });
    }
  }

  if (!/^[0-9a-f-]{36}\.dxf$/.test(body.dxfKey)) {
    return NextResponse.json({ error: 'dxfKey non valido' }, { status: 400 });
  }

  const price = await prisma.price.findUnique({ where: { thicknessId: body.thicknessId } });
  if (!price) {
    return NextResponse.json({ error: 'Prezzo non trovato' }, { status: 404 });
  }

  const { totale } = calcolaPreventivo({
    quotaFissaEur: price.quotaFissaEur,
    costoPerMetroEur: price.costoPerMetroEur,
    metriLineari: body.metriLineari,
    quantita: body.quantita,
  });

  const order = await prisma.order.create({
    data: {
      nome: body.nome,
      email: body.email,
      azienda: body.azienda,
      pIva: body.pIva,
      note: body.note,
      materialId: body.materialId,
      thicknessId: body.thicknessId,
      quantita: body.quantita,
      metriLineari: body.metriLineari,
      prezzoTotale: totale,
      dxfKey: body.dxfKey,
    },
    include: { material: true, thickness: true },
  });

  try {
    await inviaEmailConferma({ nome: order.nome, email: order.email, orderId: order.id, prezzoTotale: order.prezzoTotale });
  } catch (err) {
    console.error('Email non inviata:', err);
    // Non bloccare l'ordine se l'email fallisce
  }

  return NextResponse.json({ orderId: order.id }, { status: 201 });
}
```

- [ ] **Step 7: Commit**

```bash
git add lib/prisma.ts lib/email/ app/api/ uploads/
git commit -m "feat: API routes per DXF parsing, preventivo e creazione ordini"
```

---

### Task 7: Autenticazione admin (NextAuth + middleware)

**Files:**
- Create: `app/api/auth/[...nextauth]/route.ts`, `middleware.ts`, `app/admin/login/page.tsx`

- [ ] **Step 1: Crea la route NextAuth**

Crea `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (
          credentials?.email === process.env.ADMIN_EMAIL &&
          credentials?.password === process.env.ADMIN_PASSWORD
        ) {
          return { id: '1', email: credentials.email, name: 'Admin' };
        }
        return null;
      },
    }),
  ],
  pages: { signIn: '/admin/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
```

- [ ] **Step 2: Crea il middleware di protezione**

Crea `middleware.ts` nella root del progetto:

```typescript
import { withAuth } from 'next-auth/middleware';

export default withAuth({ pages: { signIn: '/admin/login' } });

export const config = { matcher: ['/admin/:path*'] };
```

- [ ] **Step 3: Crea la pagina di login admin**

Crea `app/admin/login/page.tsx`:

```tsx
'use client';

import { signIn } from 'next-auth/react';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const result = await signIn('credentials', {
      email: form.get('email'),
      password: form.get('password'),
      redirect: false,
    });

    if (result?.error) {
      setError('Credenziali non valide');
      setLoading(false);
    } else {
      router.push('/admin');
    }
  }

  return (
    <div className="min-h-screen bg-mist flex items-center justify-center">
      <div className="bg-white border border-border p-10 w-full max-w-sm">
        <h1 className="text-2xl font-black text-ink mb-8">Admin</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full border border-border px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              className="w-full border border-border px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink"
            />
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-white py-2 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verifica che NextAuth sia installato correttamente**

```bash
npx next build 2>&1 | head -30
```

Non deve esserci nessun errore di import.

- [ ] **Step 5: Commit**

```bash
git add app/api/auth/ middleware.ts app/admin/login/
git commit -m "feat: autenticazione admin con NextAuth credentials provider"
```

---

### Task 8: Componenti UI base

**Files:**
- Create: `components/ui/Button.tsx`, `components/ui/Input.tsx`, `components/ui/Select.tsx`, `components/ui/Badge.tsx`

- [ ] **Step 1: Crea `Button`**

Crea `components/ui/Button.tsx`:

```tsx
import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-5 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50',
        variant === 'primary' && 'bg-ink text-white hover:opacity-80',
        variant === 'secondary' && 'border border-border text-ink hover:border-ink',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Crea la utility `cn`**

Crea `lib/utils.ts`:

```typescript
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
```

- [ ] **Step 3: Crea `Input`**

Crea `components/ui/Input.tsx`:

```tsx
import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-ink uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full border border-border px-3 py-2.5 text-sm text-ink bg-white focus:outline-none focus:border-ink ${error ? 'border-red-500' : ''} ${className ?? ''}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Crea `Select`**

Crea `components/ui/Select.tsx`:

```tsx
import { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string | number; label: string }[];
}

export function Select({ label, options, id, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-ink uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`w-full border border-border px-3 py-2.5 text-sm text-ink bg-white focus:outline-none focus:border-ink ${className ?? ''}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 5: Crea `Badge`**

Crea `components/ui/Badge.tsx`:

```tsx
const VARIANTS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-green-100 text-green-800',
};

const LABELS: Record<string, string> = {
  PENDING: 'In attesa',
  CONFIRMED: 'Confermato',
  PROCESSING: 'In lavorazione',
  SHIPPED: 'Spedito',
};

export function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${VARIANTS[status] ?? 'bg-mist text-ink'}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add components/ui/ lib/utils.ts
git commit -m "feat: componenti UI base (Button, Input, Select, Badge)"
```

---

### Task 9: Homepage

**Files:**
- Create: `app/(public)/layout.tsx`, `app/(public)/page.tsx`

- [ ] **Step 1: Crea il layout pubblico**

Crea `app/(public)/layout.tsx`:

```tsx
import Link from 'next/link';
import { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-black text-ink tracking-tight">
            ◆ TaglioLaser
          </Link>
          <nav className="flex items-center gap-6 text-sm text-ink">
            <Link href="/preventivo" className="hover:opacity-60">Preventivo</Link>
            <Link href="/contatti" className="hover:opacity-60">Contatti</Link>
            <Link href="/preventivo" className="bg-ink text-white px-4 py-2 text-xs font-semibold hover:opacity-80">
              Calcola →
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border mt-24">
        <div className="max-w-6xl mx-auto px-6 py-8 text-xs text-gray-400">
          © {new Date().getFullYear()} TaglioLaser — Tutti i diritti riservati
        </div>
      </footer>
    </>
  );
}
```

- [ ] **Step 2: Crea la homepage**

Crea `app/(public)/page.tsx`:

```tsx
import Link from 'next/link';

const MATERIALI = [
  { nome: 'Acciaio Inox', desc: 'Spessori 0.5–10mm' },
  { nome: 'Acciaio al Carbonio', desc: 'Spessori 1–15mm' },
  { nome: 'Alluminio', desc: 'Spessori 0.5–8mm' },
  { nome: 'Ottone / Rame', desc: 'Spessori 0.5–5mm' },
];

const VANTAGGI = [
  { titolo: '±0.1mm', desc: 'Precisione di taglio' },
  { titolo: '24/48h', desc: 'Tempi di consegna' },
  { titolo: 'DXF', desc: 'Upload diretto del file' },
  { titolo: 'Online', desc: 'Preventivo istantaneo' },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">
            Servizio professionale di taglio laser
          </p>
          <h1 className="text-6xl font-black text-ink leading-none mb-6">
            Precisione<br />al decimo<br />di millimetro.
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-md">
            Carica il tuo file DXF, scegli materiale e spessore: ottieni il preventivo in pochi secondi.
          </p>
          <div className="flex gap-4">
            <Link
              href="/preventivo"
              className="bg-ink text-white px-8 py-4 font-semibold text-sm hover:opacity-80 transition-opacity"
            >
              Calcola preventivo →
            </Link>
            <Link
              href="/contatti"
              className="border border-border text-ink px-8 py-4 font-semibold text-sm hover:border-ink transition-colors"
            >
              Contattaci
            </Link>
          </div>
        </div>
      </section>

      {/* Vantaggi */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {VANTAGGI.map((v) => (
            <div key={v.titolo}>
              <div className="text-3xl font-black text-ink mb-1">{v.titolo}</div>
              <div className="text-sm text-gray-400">{v.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Materiali */}
      <section className="bg-mist">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-black text-ink mb-8">Materiali lavorati</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {MATERIALI.map((m) => (
              <div key={m.nome} className="bg-white border border-border p-6">
                <div className="text-sm font-bold text-ink mb-1">{m.nome}</div>
                <div className="text-xs text-gray-400">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl font-black text-ink mb-4">Pronto a iniziare?</h2>
        <p className="text-gray-400 mb-8">Nessuna registrazione richiesta. Preventivo gratuito e immediato.</p>
        <Link
          href="/preventivo"
          className="inline-block bg-ink text-white px-10 py-4 font-semibold text-sm hover:opacity-80"
        >
          Calcola il tuo preventivo →
        </Link>
      </section>
    </>
  );
}
```

- [ ] **Step 3: Avvia il server di sviluppo e verifica la homepage**

```bash
npm run dev
```

Apri `http://localhost:3000` — deve mostrare la homepage con hero, vantaggi, materiali e CTA.

- [ ] **Step 4: Commit**

```bash
git add app/\(public\)/
git commit -m "feat: homepage con hero, vantaggi e materiali"
```

---

### Task 10: Configuratore preventivo

**Files:**
- Create: `components/configuratore/MaterialSelector.tsx`, `ThicknessSelector.tsx`, `DxfUploader.tsx`, `PreventivoPanel.tsx`
- Create: `app/(public)/preventivo/page.tsx`

- [ ] **Step 1: Crea `MaterialSelector`**

Crea `components/configuratore/MaterialSelector.tsx`:

```tsx
import type { MaterialWithThicknesses } from '@/types';

interface Props {
  materials: MaterialWithThicknesses[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function MaterialSelector({ materials, selectedId, onSelect }: Props) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Materiale</p>
      <div className="grid grid-cols-2 gap-2">
        {materials.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`border p-3 text-left text-sm font-semibold transition-colors ${
              selectedId === m.id ? 'border-ink bg-ink text-white' : 'border-border text-ink hover:border-ink'
            }`}
          >
            {m.nome}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crea `ThicknessSelector`**

Crea `components/configuratore/ThicknessSelector.tsx`:

```tsx
import type { ThicknessWithPrice } from '@/types';

interface Props {
  thicknesses: ThicknessWithPrice[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function ThicknessSelector({ thicknesses, selectedId, onSelect }: Props) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Spessore (mm)</p>
      <div className="flex flex-wrap gap-2">
        {thicknesses.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`border px-3 py-1.5 text-sm font-mono transition-colors ${
              selectedId === t.id ? 'border-ink bg-ink text-white' : 'border-border text-ink hover:border-ink'
            }`}
          >
            {t.valore}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Crea `DxfUploader`**

Crea `components/configuratore/DxfUploader.tsx`:

```tsx
'use client';

import { useState, DragEvent, ChangeEvent } from 'react';
import type { DxfParseResult } from '@/types';

interface Props {
  onParsed: (result: DxfParseResult) => void;
  onError: (msg: string) => void;
}

export function DxfUploader({ onParsed, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.dxf')) {
      onError('Il file deve essere in formato DXF');
      return;
    }
    setLoading(true);
    setFileName(file.name);
    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/dxf/parse', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error ?? 'Errore durante il parsing');
        setFileName(null);
      } else {
        onParsed(data as DxfParseResult);
      }
    } catch {
      onError('Errore di rete');
      setFileName(null);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">File DXF</p>
      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center border-2 border-dashed h-28 cursor-pointer transition-colors ${
          dragging ? 'border-ink bg-mist' : 'border-border hover:border-ink'
        }`}
      >
        <input type="file" accept=".dxf" onChange={handleChange} className="hidden" />
        {loading ? (
          <span className="text-sm text-gray-400">Analisi in corso...</span>
        ) : fileName ? (
          <span className="text-sm font-semibold text-ink">✓ {fileName}</span>
        ) : (
          <>
            <span className="text-2xl mb-1">📁</span>
            <span className="text-sm text-gray-400">Trascina il file DXF qui</span>
            <span className="text-xs text-gray-300">oppure clicca per selezionarlo</span>
          </>
        )}
      </label>
    </div>
  );
}
```

- [ ] **Step 4: Crea `PreventivoPanel`**

Crea `components/configuratore/PreventivoPanel.tsx`:

```tsx
import type { PreventivoResult } from '@/types';
import { Button } from '@/components/ui/Button';

interface Props {
  result: PreventivoResult | null;
  metriLineari: number | null;
  loading: boolean;
  onOrdina: () => void;
  canOrdina: boolean;
}

export function PreventivoPanel({ result, metriLineari, loading, onOrdina, canOrdina }: Props) {
  return (
    <div className="bg-mist border border-border p-8 h-full flex flex-col">
      <h2 className="text-lg font-black text-ink mb-6">Preventivo</h2>

      {!result && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400 text-center">
            Seleziona materiale, spessore<br />e carica il file DXF.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">Calcolo in corso...</p>
        </div>
      )}

      {result && !loading && (
        <div className="flex-1 space-y-4">
          {metriLineari != null && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Metri lineari taglio</p>
              <p className="text-2xl font-black text-ink">{metriLineari.toFixed(3)} ml</p>
            </div>
          )}
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Quota fissa</span>
              <span className="font-semibold">€ {result.quotaFissaTotale.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Costo taglio</span>
              <span className="font-semibold">€ {result.costoTaglioTotale.toFixed(2)}</span>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-ink">Totale</span>
              <span className="text-3xl font-black text-ink">€ {result.totale.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">IVA esclusa</p>
          </div>
          <Button onClick={onOrdina} disabled={!canOrdina} className="w-full mt-4">
            Ordina ora →
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Crea la pagina Configuratore**

Crea `app/(public)/preventivo/page.tsx`:

```tsx
import { ConfiguratoreClient } from './ConfiguratoreClient';
import prisma from '@/lib/prisma';
import type { MaterialWithThicknesses } from '@/types';

export default async function PreventivoPage() {
  const materials: MaterialWithThicknesses[] = await prisma.material.findMany({
    include: {
      thicknesses: {
        include: { price: true },
        orderBy: { valore: 'asc' },
      },
    },
    orderBy: { id: 'asc' },
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-black text-ink mb-2">Calcola il preventivo</h1>
      <p className="text-gray-400 mb-10">Carica il tuo file DXF e ottieni il prezzo in tempo reale.</p>
      <ConfiguratoreClient materials={materials} />
    </div>
  );
}
```

- [ ] **Step 6: Crea il client del configuratore**

Crea `app/(public)/preventivo/ConfiguratoreClient.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { MaterialWithThicknesses, DxfParseResult, PreventivoResult } from '@/types';
import { MaterialSelector } from '@/components/configuratore/MaterialSelector';
import { ThicknessSelector } from '@/components/configuratore/ThicknessSelector';
import { DxfUploader } from '@/components/configuratore/DxfUploader';
import { PreventivoPanel } from '@/components/configuratore/PreventivoPanel';
import { Input } from '@/components/ui/Input';

interface Props {
  materials: MaterialWithThicknesses[];
}

export function ConfiguratoreClient({ materials }: Props) {
  const router = useRouter();
  const [materialId, setMaterialId] = useState<number | null>(null);
  const [thicknessId, setThicknessId] = useState<number | null>(null);
  const [quantita, setQuantita] = useState(1);
  const [dxfResult, setDxfResult] = useState<DxfParseResult | null>(null);
  const [preventivoResult, setPreventivoResult] = useState<PreventivoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedMaterial = materials.find((m) => m.id === materialId) ?? null;
  const canCalcola = thicknessId !== null && dxfResult !== null;

  useEffect(() => {
    if (!canCalcola) {
      setPreventivoResult(null);
      return;
    }
    calcola();
  }, [thicknessId, dxfResult, quantita]);

  async function calcola() {
    setLoading(true);
    try {
      const res = await fetch('/api/preventivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thicknessId, metriLineari: dxfResult!.metriLineari, quantita }),
      });
      const data = await res.json();
      if (res.ok) setPreventivoResult(data);
    } finally {
      setLoading(false);
    }
  }

  function handleMaterialSelect(id: number) {
    setMaterialId(id);
    setThicknessId(null);
    setPreventivoResult(null);
    setDxfResult(null);
  }

  function handleOrdina() {
    if (!preventivoResult || !dxfResult || !materialId || !thicknessId) return;
    const params = new URLSearchParams({
      materialId: String(materialId),
      thicknessId: String(thicknessId),
      quantita: String(quantita),
      metriLineari: String(dxfResult.metriLineari),
      dxfKey: dxfResult.dxfKey,
      totale: String(preventivoResult.totale),
    });
    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      {/* Colonna sinistra: form */}
      <div className="space-y-8">
        <MaterialSelector materials={materials} selectedId={materialId} onSelect={handleMaterialSelect} />

        {selectedMaterial && (
          <ThicknessSelector
            thicknesses={selectedMaterial.thicknesses}
            selectedId={thicknessId}
            onSelect={setThicknessId}
          />
        )}

        <Input
          label="Quantità pezzi"
          type="number"
          min={1}
          max={9999}
          value={quantita}
          onChange={(e) => setQuantita(Math.max(1, Number(e.target.value)))}
        />

        <DxfUploader
          onParsed={(r) => { setError(''); setDxfResult(r); }}
          onError={(msg) => { setError(msg); setDxfResult(null); }}
        />

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {/* Colonna destra: preventivo */}
      <div className="sticky top-6">
        <PreventivoPanel
          result={preventivoResult}
          metriLineari={dxfResult?.metriLineari ?? null}
          loading={loading}
          onOrdina={handleOrdina}
          canOrdina={!!preventivoResult}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Verifica il configuratore**

```bash
npm run dev
```

Apri `http://localhost:3000/preventivo`. Verifica:
- I 4 materiali appaiono come bottoni
- Selezionando un materiale appaiono gli spessori
- Caricando un file DXF la colonna destra mostra il preventivo
- Cambiando quantità aggiorna il totale

- [ ] **Step 8: Commit**

```bash
git add components/configuratore/ app/\(public\)/preventivo/
git commit -m "feat: configuratore preventivo con upload DXF e calcolo in tempo reale"
```

---

### Task 11: Checkout e Conferma

**Files:**
- Create: `app/(public)/checkout/page.tsx`, `app/(public)/conferma/page.tsx`

- [ ] **Step 1: Crea la pagina Checkout**

Crea `app/(public)/checkout/page.tsx`:

```tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, FormEvent, Suspense } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function CheckoutForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const materialId = Number(params.get('materialId'));
  const thicknessId = Number(params.get('thicknessId'));
  const quantita = Number(params.get('quantita'));
  const metriLineari = Number(params.get('metriLineari'));
  const dxfKey = params.get('dxfKey') ?? '';
  const totale = Number(params.get('totale'));

  if (!materialId || !thicknessId || !dxfKey) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Preventivo non valido. <a href="/preventivo" className="underline">Ricomincia</a>.</p>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const payload = {
      nome: form.get('nome') as string,
      email: form.get('email') as string,
      azienda: (form.get('azienda') as string) || undefined,
      pIva: (form.get('pIva') as string) || undefined,
      note: (form.get('note') as string) || undefined,
      materialId,
      thicknessId,
      quantita,
      metriLineari,
      dxfKey,
    };

    try {
      const res = await fetch('/api/ordini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/conferma?orderId=${data.orderId}`);
      } else {
        setError(data.error ?? 'Errore durante la conferma');
      }
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div>
        <h1 className="text-3xl font-black text-ink mb-8">I tuoi dati</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Nome e Cognome *" name="nome" id="nome" required />
          <Input label="Email *" name="email" id="email" type="email" required />
          <Input label="Azienda" name="azienda" id="azienda" placeholder="Facoltativo" />
          <Input label="P.IVA" name="pIva" id="pIva" placeholder="Facoltativo" />
          <div className="space-y-1">
            <label htmlFor="note" className="block text-xs font-semibold text-ink uppercase tracking-wide">
              Note
            </label>
            <textarea
              name="note"
              id="note"
              rows={3}
              placeholder="Tolleranze particolari, finiture richieste..."
              className="w-full border border-border px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ink resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Invio in corso...' : 'Conferma ordine →'}
          </Button>
        </form>
      </div>

      <div className="bg-mist border border-border p-8 h-fit">
        <h2 className="text-sm font-black text-ink mb-6 uppercase tracking-wide">Riepilogo</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Quantità</span>
            <span className="font-semibold">{quantita} pz</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Metri lineari</span>
            <span className="font-semibold">{metriLineari.toFixed(3)} ml</span>
          </div>
          <div className="border-t border-border pt-3 mt-3 flex justify-between items-center">
            <span className="font-semibold text-ink">Totale</span>
            <span className="text-2xl font-black text-ink">€ {totale.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-400">IVA esclusa</p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Suspense fallback={<div>Caricamento...</div>}>
        <CheckoutForm />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 2: Crea la pagina Conferma**

Crea `app/(public)/conferma/page.tsx`:

```tsx
import Link from 'next/link';
import { Suspense } from 'react';

function ConfermaContent({ orderId }: { orderId: string }) {
  return (
    <div className="max-w-xl mx-auto text-center py-24 px-6">
      <div className="text-5xl mb-6">✓</div>
      <h1 className="text-4xl font-black text-ink mb-4">Ordine ricevuto!</h1>
      <p className="text-gray-400 mb-2">
        Il tuo ordine <strong className="text-ink">#{orderId}</strong> è stato confermato.
      </p>
      <p className="text-gray-400 mb-10">
        Riceverai una email di conferma a breve. Ti contatteremo per organizzare i dettagli.
      </p>
      <Link href="/" className="bg-ink text-white px-8 py-3 text-sm font-semibold hover:opacity-80">
        Torna alla home
      </Link>
    </div>
  );
}

export default async function ConfermaPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  return (
    <Suspense fallback={null}>
      <ConfermaContent orderId={orderId ?? '—'} />
    </Suspense>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(public\)/checkout/ app/\(public\)/conferma/
git commit -m "feat: pagine checkout e conferma ordine"
```

---

### Task 12: Pagina Contatti

**Files:**
- Create: `app/(public)/contatti/page.tsx`

- [ ] **Step 1: Crea la pagina**

Crea `app/(public)/contatti/page.tsx`:

```tsx
export default function ContattiPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-black text-ink mb-2">Contatti</h1>
      <p className="text-gray-400 mb-12">Per informazioni, richieste speciali o ordini su misura.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Email</p>
            <p className="text-sm text-ink">info@tagliolaser.it</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Telefono</p>
            <p className="text-sm text-ink">+39 000 000 0000</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Orari</p>
            <p className="text-sm text-ink">Lun–Ven 8:00–18:00</p>
          </div>
        </div>

        <div className="bg-mist border border-border p-8">
          <p className="text-sm text-gray-500 mb-6">
            Per la maggior parte delle richieste, usa il nostro strumento online:
          </p>
          <a
            href="/preventivo"
            className="inline-block bg-ink text-white px-6 py-3 text-sm font-semibold hover:opacity-80"
          >
            Calcola preventivo online →
          </a>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(public\)/contatti/
git commit -m "feat: pagina contatti"
```

---

### Task 13: Admin — Layout, Dashboard e API

**Files:**
- Create: `app/admin/layout.tsx`, `app/admin/page.tsx`
- Create: `app/api/admin/ordini/route.ts`, `app/api/admin/ordini/[id]/route.ts`, `app/api/admin/ordini/[id]/dxf/route.ts`

- [ ] **Step 1: Crea il layout admin**

Crea `app/admin/layout.tsx`:

```tsx
import { ReactNode } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-mist">
      <header className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-8">
          <Link href="/admin" className="text-sm font-black text-ink">Admin</Link>
          <nav className="flex gap-6 text-sm">
            <Link href="/admin/ordini" className="text-gray-500 hover:text-ink">Ordini</Link>
            <Link href="/admin/prezzi" className="text-gray-500 hover:text-ink">Prezzi</Link>
          </nav>
          <div className="ml-auto">
            <Link href="/" className="text-xs text-gray-400 hover:text-ink">← Sito pubblico</Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Crea la Dashboard admin**

Crea `app/admin/page.tsx`:

```tsx
import prisma from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

export default async function AdminDashboard() {
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [oggi, settimana, mese, ultimi] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { material: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-black text-ink mb-8">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {[{ label: 'Oggi', val: oggi }, { label: 'Settimana', val: settimana }, { label: 'Mese', val: mese }].map((s) => (
          <div key={s.label} className="bg-white border border-border p-6">
            <p className="text-3xl font-black text-ink">{s.val}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-black text-ink uppercase tracking-wide mb-4">Ultimi ordini</h2>
      <div className="bg-white border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="text-xs text-gray-400 uppercase">
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Materiale</th>
              <th className="px-4 py-3 text-right">Totale</th>
              <th className="px-4 py-3 text-left">Stato</th>
            </tr>
          </thead>
          <tbody>
            {ultimi.map((o) => (
              <tr key={o.id} className="border-b border-border hover:bg-mist">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link href={`/admin/ordini/${o.id}`} className="hover:underline">{o.id}</Link>
                </td>
                <td className="px-4 py-3">{o.nome}</td>
                <td className="px-4 py-3 text-gray-500">{o.material.nome}</td>
                <td className="px-4 py-3 text-right font-semibold">€ {o.prezzoTotale.toFixed(2)}</td>
                <td className="px-4 py-3"><Badge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Crea le API admin ordini**

Crea `app/api/admin/ordini/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(from || to ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
    },
    include: { material: true, thickness: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(orders);
}
```

Crea `app/api/admin/ordini/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: { material: true, thickness: { include: { price: true } } },
  });
  if (!order) return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const { id } = await params;
  const { status } = await request.json();
  const allowed = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'];
  if (!allowed.includes(status)) return NextResponse.json({ error: 'Stato non valido' }, { status: 400 });
  const order = await prisma.order.update({ where: { id: Number(id) }, data: { status } });
  return NextResponse.json(order);
}
```

Crea `app/api/admin/ordini/[id]/dxf/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id: Number(id) }, select: { dxfKey: true } });
  if (!order) return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 });

  // Valida che dxfKey sia solo uuid.dxf (sicurezza path traversal)
  if (!/^[0-9a-f-]{36}\.dxf$/.test(order.dxfKey)) {
    return NextResponse.json({ error: 'Key non valida' }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'uploads', 'dxf', order.dxfKey);
  try {
    const fileBuffer = await readFile(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/dxf',
        'Content-Disposition': `attachment; filename="ordine-${id}.dxf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'File non trovato' }, { status: 404 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add app/admin/ app/api/admin/
git commit -m "feat: admin layout, dashboard e API ordini"
```

---

### Task 14: Admin — Gestione Prezzi

**Files:**
- Create: `app/admin/prezzi/page.tsx`, `app/api/admin/prezzi/route.ts`

- [ ] **Step 1: Crea l'API admin prezzi**

Crea `app/api/admin/prezzi/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const materials = await prisma.material.findMany({
    include: {
      thicknesses: { include: { price: true }, orderBy: { valore: 'asc' } },
    },
    orderBy: { id: 'asc' },
  });

  return NextResponse.json(materials);
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { thicknessId, quotaFissaEur, costoPerMetroEur } = await request.json();

  if (typeof quotaFissaEur !== 'number' || typeof costoPerMetroEur !== 'number') {
    return NextResponse.json({ error: 'Valori non validi' }, { status: 400 });
  }

  const price = await prisma.price.update({
    where: { thicknessId },
    data: { quotaFissaEur, costoPerMetroEur },
  });

  return NextResponse.json(price);
}
```

- [ ] **Step 2: Crea la pagina gestione prezzi**

Crea `app/admin/prezzi/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import type { MaterialWithThicknesses } from '@/types';

interface EditState {
  thicknessId: number;
  quotaFissaEur: string;
  costoPerMetroEur: string;
}

export default function AdminPrezziPage() {
  const [materials, setMaterials] = useState<MaterialWithThicknesses[]>([]);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/admin/prezzi').then((r) => r.json()).then(setMaterials);
  }, []);

  function startEdit(t: MaterialWithThicknesses['thicknesses'][number]) {
    setEditing({
      thicknessId: t.id,
      quotaFissaEur: String(t.price?.quotaFissaEur ?? ''),
      costoPerMetroEur: String(t.price?.costoPerMetroEur ?? ''),
    });
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    await fetch('/api/admin/prezzi', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thicknessId: editing.thicknessId,
        quotaFissaEur: parseFloat(editing.quotaFissaEur),
        costoPerMetroEur: parseFloat(editing.costoPerMetroEur),
      }),
    });
    setSaved(editing.thicknessId);
    setEditing(null);
    setSaving(false);
    const updated = await fetch('/api/admin/prezzi').then((r) => r.json());
    setMaterials(updated);
    setTimeout(() => setSaved(null), 2000);
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-ink mb-8">Gestione Prezzi</h1>
      <p className="text-sm text-gray-400 mb-6">
        Clicca su un prezzo per modificarlo. Quota fissa = costo per pezzo; Costo/ml = costo al metro lineare di taglio.
      </p>

      {materials.map((m) => (
        <div key={m.id} className="mb-8">
          <h2 className="text-sm font-black text-ink uppercase tracking-wide mb-3">{m.nome}</h2>
          <div className="bg-white border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-mist">
                <tr className="text-xs text-gray-400 uppercase">
                  <th className="px-4 py-2 text-left">Spessore (mm)</th>
                  <th className="px-4 py-2 text-right">Quota fissa (€/pz)</th>
                  <th className="px-4 py-2 text-right">Costo/ml (€/m)</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {m.thicknesses.map((t) => {
                  const isEditing = editing?.thicknessId === t.id;
                  return (
                    <tr key={t.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-mono">{t.valore}</td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editing.quotaFissaEur}
                            onChange={(e) => setEditing({ ...editing, quotaFissaEur: e.target.value })}
                            className="border border-border px-2 py-1 w-20 text-right text-xs"
                          />
                        ) : (
                          <span className={saved === t.id ? 'text-green-600' : ''}>
                            € {t.price?.quotaFissaEur.toFixed(2) ?? '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editing.costoPerMetroEur}
                            onChange={(e) => setEditing({ ...editing, costoPerMetroEur: e.target.value })}
                            className="border border-border px-2 py-1 w-20 text-right text-xs"
                          />
                        ) : (
                          <span className={saved === t.id ? 'text-green-600' : ''}>
                            € {t.price?.costoPerMetroEur.toFixed(2) ?? '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <div className="flex gap-2 justify-end">
                            <button onClick={saveEdit} disabled={saving} className="text-xs bg-ink text-white px-3 py-1">
                              {saving ? '...' : 'Salva'}
                            </button>
                            <button onClick={() => setEditing(null)} className="text-xs border border-border px-3 py-1">
                              Annulla
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(t)} className="text-xs text-gray-400 hover:text-ink">
                            Modifica
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/prezzi/ app/api/admin/prezzi/
git commit -m "feat: admin gestione prezzi per materiale e spessore"
```

---

### Task 15: Admin — Ordini

**Files:**
- Create: `app/admin/ordini/page.tsx`, `app/admin/ordini/[id]/page.tsx`

- [ ] **Step 1: Crea la lista ordini**

Crea `app/admin/ordini/page.tsx`:

```tsx
import prisma from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

export default async function AdminOrdiniPage() {
  const orders = await prisma.order.findMany({
    include: { material: true },
    orderBy: { createdAt: 'desc' },
  });

  const csv = [
    'ID,Data,Nome,Email,Azienda,Materiale,Spessore,Quantità,ML,Totale,Stato',
    ...orders.map((o) =>
      [o.id, o.createdAt.toISOString(), o.nome, o.email, o.azienda ?? '', o.material.nome, o.thicknessId, o.quantita, o.metriLineari, o.prezzoTotale, o.status].join(',')
    ),
  ].join('\n');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-ink">Ordini</h1>
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
          download="ordini.csv"
          className="text-xs border border-border px-4 py-2 hover:border-ink"
        >
          Export CSV
        </a>
      </div>

      <div className="bg-white border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-mist">
            <tr className="text-xs text-gray-400 uppercase">
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Materiale</th>
              <th className="px-4 py-3 text-right">Totale</th>
              <th className="px-4 py-3 text-left">Stato</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0 hover:bg-mist">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link href={`/admin/ordini/${o.id}`} className="hover:underline">{o.id}</Link>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {o.createdAt.toLocaleDateString('it-IT')}
                </td>
                <td className="px-4 py-3">{o.nome}</td>
                <td className="px-4 py-3 text-gray-500">{o.material.nome}</td>
                <td className="px-4 py-3 text-right font-semibold">€ {o.prezzoTotale.toFixed(2)}</td>
                <td className="px-4 py-3"><Badge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crea il dettaglio ordine**

Crea `app/admin/ordini/[id]/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'In attesa' },
  { value: 'CONFIRMED', label: 'Confermato' },
  { value: 'PROCESSING', label: 'In lavorazione' },
  { value: 'SHIPPED', label: 'Spedito' },
];

interface OrderDetail {
  id: number;
  createdAt: string;
  status: string;
  nome: string;
  email: string;
  azienda?: string;
  pIva?: string;
  note?: string;
  quantita: number;
  metriLineari: number;
  prezzoTotale: number;
  dxfKey: string;
  material: { nome: string };
  thickness: { valore: number; price: { quotaFissaEur: number; costoPerMetroEur: number } | null };
}

export default function OrdineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/ordini/${id}`)
      .then((r) => r.json())
      .then((o) => { setOrder(o); setStatus(o.status); });
  }, [id]);

  async function handleStatusChange() {
    setSaving(true);
    await fetch(`/api/admin/ordini/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setSaving(false);
    if (order) setOrder({ ...order, status });
  }

  if (!order) return <div className="text-sm text-gray-400">Caricamento...</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-2xl font-black text-ink">Ordine #{order.id}</h1>
        <Badge status={order.status} />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-border p-6 space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wide text-ink mb-4">Cliente</h2>
          <p className="text-sm"><span className="text-gray-400">Nome:</span> {order.nome}</p>
          <p className="text-sm"><span className="text-gray-400">Email:</span> {order.email}</p>
          {order.azienda && <p className="text-sm"><span className="text-gray-400">Azienda:</span> {order.azienda}</p>}
          {order.pIva && <p className="text-sm"><span className="text-gray-400">P.IVA:</span> {order.pIva}</p>}
          {order.note && <p className="text-sm"><span className="text-gray-400">Note:</span> {order.note}</p>}
        </div>

        <div className="bg-white border border-border p-6 space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wide text-ink mb-4">Lavorazione</h2>
          <p className="text-sm"><span className="text-gray-400">Materiale:</span> {order.material.nome}</p>
          <p className="text-sm"><span className="text-gray-400">Spessore:</span> {order.thickness.valore} mm</p>
          <p className="text-sm"><span className="text-gray-400">Quantità:</span> {order.quantita} pz</p>
          <p className="text-sm"><span className="text-gray-400">Metri lineari:</span> {order.metriLineari.toFixed(3)} ml</p>
          <p className="text-sm font-semibold">Totale: € {order.prezzoTotale.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white border border-border p-6 mb-6">
        <h2 className="text-xs font-black uppercase tracking-wide text-ink mb-4">File DXF</h2>
        <a
          href={`/api/admin/ordini/${order.id}/dxf`}
          className="text-sm underline hover:opacity-70"
        >
          Scarica file DXF →
        </a>
      </div>

      <div className="bg-white border border-border p-6">
        <h2 className="text-xs font-black uppercase tracking-wide text-ink mb-4">Aggiorna stato</h2>
        <div className="flex items-center gap-4">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-border px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <Button onClick={handleStatusChange} disabled={saving || status === order.status}>
            {saving ? 'Salvataggio...' : 'Aggiorna'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verifica il pannello admin**

```bash
npm run dev
```

Apri `http://localhost:3000/admin` — deve reindirizzare a `/admin/login`. Accedi con le credenziali in `.env.local`. Verifica dashboard, lista ordini e gestione prezzi.

- [ ] **Step 4: Commit**

```bash
git add app/admin/ordini/
git commit -m "feat: admin lista ordini e pagina dettaglio con cambio stato"
```

---

### Task 16: Build finale e deploy Docker

**Files:**
- Modifica: `Dockerfile`, `docker-compose.yml`

- [ ] **Step 1: Esegui la build di produzione in locale**

```bash
npm run build
```

Output atteso: nessun errore TypeScript, nessun warning bloccante.

Se ci sono errori di tipo, correggili prima di procedere.

- [ ] **Step 2: Esegui tutti i test**

```bash
npx jest --no-coverage
```

Output atteso:
```
PASS lib/dxf/__tests__/parser.test.ts
PASS lib/pricing/__tests__/calculator.test.ts

Test Suites: 2 passed, 2 total
Tests:       7 passed, 7 total
```

- [ ] **Step 3: Aggiorna `package.json` con script di utilità**

Aggiungi agli `"scripts"`:

```json
"docker:build": "docker compose build",
"docker:up": "docker compose up -d",
"docker:logs": "docker compose logs -f app",
"docker:migrate": "docker compose exec app npx prisma migrate deploy",
"docker:seed": "docker compose exec app npx prisma db seed"
```

- [ ] **Step 4: Istruzioni per il deploy sul VPS**

Crea `DEPLOY.md` con le istruzioni:

```markdown
# Deploy su VPS

## Prima installazione

1. Copia il progetto sul VPS:
   ```bash
   git clone <repo> /opt/tagliolaser
   cd /opt/tagliolaser
   ```

2. Crea il file `.env.local` a partire da `.env.local.example` e compila tutti i valori.

3. Costruisci e avvia:
   ```bash
   docker compose build
   docker compose up -d
   ```

4. Esegui migration e seed:
   ```bash
   docker compose exec app npx prisma migrate deploy
   docker compose exec app npx prisma db seed
   ```

5. Configura Nginx come reverse proxy (vedi `nginx.conf`) e ottieni SSL con Let's Encrypt:
   ```bash
   certbot --nginx -d tuodominio.it
   ```

## Aggiornamenti

```bash
git pull
docker compose build app
docker compose up -d app
docker compose exec app npx prisma migrate deploy
```
```

- [ ] **Step 5: Commit finale**

```bash
git add .
git commit -m "feat: build di produzione verificata, configurazione Docker e istruzioni deploy"
```

---

## Checklist di Verifica Finale

Dopo aver completato tutti i task, verifica manualmente:

- [ ] Homepage carica senza errori a `http://localhost:3000`
- [ ] Selezionando materiale + spessore + caricando DXF appare il preventivo
- [ ] Cambiando quantità il totale si aggiorna
- [ ] Checkout invia l'ordine e reindirizza alla pagina di conferma
- [ ] Email di conferma viene ricevuta (configurare SMTP reale)
- [ ] `http://localhost:3000/admin` reindirizza al login
- [ ] Dopo login, la dashboard mostra i contatori e gli ultimi ordini
- [ ] La gestione prezzi permette di modificare quota fissa e costo/ml
- [ ] Il dettaglio ordine mostra tutti i dati e il cambio stato funziona
- [ ] Il download del file DXF dall'admin funziona
- [ ] `npm run build` completa senza errori
- [ ] `npx jest` passa tutti i test
