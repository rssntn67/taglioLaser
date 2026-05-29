# Sito Preventivi Taglio Laser — Design Spec
**Data:** 2026-05-29  
**Stato:** Approvato

---

## Panoramica

Sito web in italiano per la generazione automatica di preventivi di taglio laser. Il cliente carica un file DXF, seleziona materiale e spessore, e ottiene immediatamente il prezzo. Supporta acquisto diretto online. Include un pannello admin per la gestione prezzi e ordini.

**Target:** B2B (aziende, officine) e B2C (privati, hobbisti)  
**Lingua:** Italiano  
**Deploy:** VPS/server dedicato (Docker Compose)

---

## Stack Tecnologico

| Componente | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | PostgreSQL |
| ORM | Prisma |
| DXF Parsing | dxf-parser + logica custom |
| Autenticazione admin | NextAuth.js (credenziali email/password) |
| Email transazionali | Nodemailer (SMTP) |
| Storage file DXF | Filesystem locale VPS (`/uploads/dxf/`) |
| Deploy | Docker Compose (Next.js + PostgreSQL) |
| Stile | CSS Modules / Tailwind — tema Moderno/Minimal (bianco-nero, tipografia bold) |

---

## Struttura Progetto

```
/app
  /(public)
    /page.tsx              → Homepage
    /preventivo/page.tsx   → Configuratore preventivo
    /checkout/page.tsx     → Form dati cliente
    /conferma/page.tsx     → Conferma ordine
    /contatti/page.tsx     → Contatti
  /admin
    /page.tsx              → Dashboard
    /prezzi/page.tsx       → Gestione prezzi
    /ordini/page.tsx       → Lista ordini
    /ordini/[id]/page.tsx  → Dettaglio ordine
  /api
    /dxf/parse/route.ts    → Upload e parsing DXF
    /preventivo/route.ts   → Calcolo preventivo
    /ordini/route.ts       → Creazione ordine
    /admin/...             → API admin protette
/lib
  /dxf/parser.ts           → Parsing DXF e calcolo metri lineari
  /pricing/calculator.ts   → Logica calcolo preventivo
/prisma
  /schema.prisma           → Schema database
```

---

## Materiali Supportati

- Acciaio inossidabile (inox)
- Acciaio al carbonio
- Alluminio
- Ottone / Rame

---

## Flusso Utente — Preventivo

1. **Homepage** → CTA "Calcola Preventivo"
2. **Configuratore** (pagina singola split):
   - Colonna sinistra — form:
     - Selezione materiale (4 opzioni)
     - Selezione spessore (in base al materiale)
     - Quantità pezzi
     - Upload file DXF
   - Colonna destra — preventivo in tempo reale:
     - Metri lineari calcolati dal DXF
     - Quota fissa (€) × quantità
     - Costo taglio (€/ml × ml × quantità)
     - **Totale**
     - Pulsante "Ordina ora"
3. **Checkout** → form dati cliente (nome, email, azienda opzionale, P.IVA opzionale, note)
4. **Conferma** → riepilogo ordine + email automatica al cliente (Nodemailer via SMTP)
5. **Pagamento** → da integrare in fase successiva

---

## Calcolo Preventivo

**Formula:**
```
totale = (quota_fissa × quantità) + (costo_per_metro × metri_lineari × quantità)
```

**Parametri configurabili per combinazione materiale/spessore:**
- `quota_fissa_eur` — costo fisso per pezzo (es. €1.50)
- `costo_per_metro_eur` — costo al metro lineare di taglio (es. €4.00/ml)

**Parsing DXF:**
- Il file DXF viene caricato via API (`/api/dxf/parse`)
- La libreria `dxf-parser` estrae le entità geometriche (LINE, ARC, CIRCLE, POLYLINE, SPLINE)
- La logica custom calcola la lunghezza totale di tutte le entità
- Il risultato (metri lineari) viene restituito al frontend per il calcolo del preventivo

---

## Schema Database

```prisma
model Material {
  id          Int          @id @default(autoincrement())
  nome        String
  slug        String       @unique
  thicknesses Thickness[]
}

model Thickness {
  id         Int      @id @default(autoincrement())
  materialId Int
  valore     Float
  material   Material @relation(fields: [materialId], references: [id])
  price      Price?
}

model Price {
  id               Int       @id @default(autoincrement())
  thicknessId      Int       @unique
  quotaFissaEur    Float
  costoPerMetroEur Float
  thickness        Thickness @relation(fields: [thicknessId], references: [id])
}

model Order {
  id            Int         @id @default(autoincrement())
  createdAt     DateTime    @default(now())
  status        OrderStatus @default(PENDING)
  nome          String
  email         String
  azienda       String?
  pIva          String?
  note          String?
  materialId    Int
  thicknessId   Int
  quantita      Int
  metriLineari  Float
  prezzoTotale  Float
  dxfPath       String
  material      Material    @relation(fields: [materialId], references: [id])
  thickness     Thickness   @relation(fields: [thicknessId], references: [id])
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
}
```

---

## Admin Panel

**Autenticazione:** NextAuth.js con credenziali email/password. Route `/admin/*` protette da middleware Next.js.  
**Primo accesso:** le credenziali admin vengono create via script di seed Prisma (`prisma/seed.ts`) da eseguire una volta al deploy iniziale.

### `/admin` — Dashboard
- Contatori: ordini oggi / questa settimana / questo mese
- Tabella ultimi 10 ordini con stato

### `/admin/prezzi` — Gestione Prezzi
- Tabella editabile per ogni combinazione materiale + spessore
- Campi modificabili: `quota_fissa_eur`, `costo_per_metro_eur`
- Aggiunta/rimozione spessori per materiale

### `/admin/ordini` — Gestione Ordini
- Lista ordini con filtri per stato e data
- Export CSV

### `/admin/ordini/[id]` — Dettaglio Ordine
- Dati cliente completi
- File DXF scaricabile
- Riepilogo calcolo (ml, quota, totale)
- Cambio stato manuale

---

## Design Visivo

**Stile:** Moderno / Minimal  
- Palette: bianco `#ffffff`, nero `#111111`, grigio chiaro `#f5f5f5`
- Tipografia: font bold e pesante per titoli, leggero per testi secondari
- Nessun colore di accento — contrasto solo bianco/nero
- Componenti con bordi sottili `1px solid #eee`, border-radius piccolo (3-4px)
- Pulsanti primari: sfondo `#111`, testo bianco; secondari: bordo grigio, testo scuro

---

## Deploy (VPS)

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgres://...
      NEXTAUTH_SECRET: ...
    depends_on: [db]

  db:
    image: postgres:16
    volumes: [pgdata:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: tagliolaser
      POSTGRES_PASSWORD: ...
```

Reverse proxy consigliato: **Nginx** con certificato SSL (Let's Encrypt).

---

## Fuori Scope (v1)

- Piegatura e altri servizi di lavorazione
- Pagamento online (integrazione Stripe/PayPal in v2)
- Registrazione account cliente
- Multi-lingua
