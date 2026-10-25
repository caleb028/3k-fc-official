# 3K FC Official Website & Digital Fan Engagement Platform

> **"God's Favourite Club" • "Home of Stars"**  
> **Official Digital Headquarters for 3K Football Club — Embu County, Kenya**  
> **Competition:** FKF Premier League (2026/27 Season)  
> **Project Prepared by:** Caleb Ngiciri

---

## 1. Executive Summary & Club Heritage

**3K FC (3K Football Club)** is an ambitious, community-rooted football club from **Embu County, Kenya**. Founded in **Nginda Ward**, the club represents the historic **K-Cluster** communities:
- **Kagumori**
- **Kathangari**
- **Kibugu**
- **Kathuniri**
- **Kiriari**
- **Kairuri**

### Verified Historical Milestones
- **FKF Division One Zone A Champions:** Clinched at Moi Stadium, Embu.
- **2025/26 National Super League (NSL) Campaign:** Finished **2nd in the NSL with 77 points** under Head Coach **Nicodemus Omasete** and Captain **Daniel "Dante" Wabwire**, achieving historic automatic promotion to Kenya's top flight: the **FKF Premier League (2026/27 Season)**.
- **Home Match Venue:** **Moi Stadium, Embu** *(Subject to official FKF Premier League match venue confirmation)*.
- **Main Partner:** **Mozzart Bet Kenya** *(Subject to confirmation of the current 2026/27 sponsorship agreement)*.

---

## 2. System Architecture

The platform is engineered as **two connected but structurally separated applications** within Next.js 15 App Router:

```
├── Public Fan Portal (Mobile-First Web & PWA)
│   ├── /                           (11-Section Editorial Homepage)
│   ├── /news & /news/[slug]        (Bilingual Editorial Publishing)
│   ├── /fixtures & /results        (Calendar Sync & Verified Scores)
│   ├── /table                      (FKF Premier League Standings)
│   ├── /team & /team/[slug]        (Squad Profiles & Verified Statistics)
│   ├── /matches/[slug]             (Live Match Centre & Fan MOTM Poll)
│   ├── /tickets                    (12-Step M-Pesa Ticketing & HMAC QR)
│   ├── /shop & /shop/[slug]        (Official Merchandise & Embu Collection)
│   ├── /supporters                 (Membership Tiers & Digital Cards)
│   ├── /partners                   (Commercial Showcase & Attribution)
│   ├── /support-3k                 (Donations & Transparent Receipts)
│   ├── /club                       (History Timeline & Moi Stadium Guide)
│   ├── /contact                    (Secretariat & Department Directory)
│   ├── /account                    (Supporter Hub & Ticket Wallet)
│   └── Legal Policies              (/privacy, /terms, /ticket-terms, /refund-policy, /delivery-policy)
│
└── Protected Back-Office Dashboard (/admin/*)
    ├── /admin/login & /setup       (Staff Auth & Bootstrap Token Provisioning)
    ├── 1. Overview                 (/admin/dashboard)
    ├── 2. News & Media             (/admin/news)
    ├── 3. Fixtures                 (/admin/fixtures)
    ├── 4. Match Centre Console     (/admin/match-centre)
    ├── 5. Results & Delegation     (/admin/results)
    ├── 6. League Standings         (/admin/table)
    ├── 7. Squad & Staff            (/admin/squad)
    ├── 8. Ticketing Operations     (/admin/tickets)
    ├── 9. Turnstile Gate Scanner   (/admin/gate)
    ├── 10. Orders & Payments       (/admin/payments)
    ├── 11. Merchandise & Inventory (/admin/merchandise)
    ├── 12. Supporters & Members    (/admin/memberships)
    ├── 13. Loyalty Ledger          (/admin/loyalty)
    ├── 14. Sponsors & Commercial   (/admin/sponsors)
    ├── 15. Donations & Campaigns   (/admin/donations)
    ├── 16. Multi-Channel Alerts    (/admin/notifications)
    ├── 17. Financial Reports       (/admin/reports)
    ├── 18. Website Pages           (/admin/pages)
    ├── 19. Languages & Dictionary  (/admin/languages)
    ├── 20. Users & Staff RBAC      (/admin/users)
    ├── 21. Immutable Audit Logs    (/admin/audit-logs)
    └── 22. Club Brand Settings     (/admin/settings)
```

---

## 3. Core Technical & Security Highlights

### Zero Floating-Point Financial Accounting
Every monetary amount across tickets, merchandise, memberships, delivery fees, and supporter donations is strictly stored in **integer minor units (`KES cents`)** (e.g. KES 200 is represented as `20000`). All mathematical operations use discrete integer arithmetic (`src/lib/money.ts`), eliminating IEEE-754 binary floating-point drift.

### Tamper-Proof HMAC-SHA256 QR Ticketing
- Ticket identifiers are cryptographically signed using `crypto.createHmac('sha256')` (`src/lib/tickets/qr-crypto.ts`).
- **Kenya Data Protection Act 2019 Compliance:** Zero Personally Identifiable Information (no names, phones, or emails) is encoded in public QR codes.
- Gate redemption uses database-locked conditional updates (`UPDATE Tickets SET status = 'REDEEMED' WHERE id = ? AND status = 'VALID'`) to guarantee that simultaneous scans at multiple stadium gates reject duplicates instantaneously.

### 10-Role Staff RBAC Matrix
The administrative back-office enforces server-side permission checks (`requireAdminPermission(resource, action)`) across 10 distinct staff roles:
1. `SUPER_ADMIN`
2. `CLUB_EXECUTIVE`
3. `MEDIA_MANAGER`
4. `MATCHDAY_EDITOR`
5. `TICKETING_MANAGER`
6. `GATE_STAFF`
7. `STORE_MANAGER`
8. `MEMBERSHIP_MANAGER`
9. `SPONSOR_MANAGER`
10. `FINANCE_OFFICER`

### Double-Entry Loyalty Points Ledger
Points are never awarded from untrusted frontend signals. Every change (attendance, merchandise purchase, membership welcome) creates an idempotent `LoyaltyLedgerEntry` with a mandatory reason, authorized staff actor, and atomic refund reversal support.

### Safaricom M-Pesa Daraja Integration
Server-side STK Push initiation and idempotent callback processing (`/api/payments/mpesa/callback`). Automatic transaction status reconciliation with sensitive phone digits masked in callback logs (`25471****678`).

---

## 4. Local Installation & Development

### Prerequisites
- Node.js 18.18+ or 20+
- npm or pnpm

### Quick Start
```bash
# 1. Clone repository & install dependencies
git clone https://github.com/3kfc/3k-fc-official.git
cd 3k-fc-official
npm install

# 2. Configure Environment Variables
cp .env.example .env

# 3. Synchronize Database & Seed Verified Club Records
npx prisma db push
npx prisma db seed

# 4. Run Test Suite
npm test

# 5. Start Development Server
npm run dev
```

Visit `http://localhost:3000` for the public website and `http://localhost:3000/admin/login` for the back-office dashboard.

---

## 5. First-Run Super Admin Provisioning

To prevent insecure default passwords, the system uses a one-time bootstrap token workflow:
1. Ensure `ADMIN_BOOTSTRAP_TOKEN` is set in your `.env` (default: `3KFC-EMBU-BOOTSTRAP-2026`).
2. Navigate to `http://localhost:3000/admin/setup`.
3. Provide the bootstrap token, your official club email, first name, last name, and a strong password (min 12 characters).
4. The system provisions the initial `SUPER_ADMIN` account with salted PBKDF2-SHA512 hashing and immediately issues a secure, HTTP-only session cookie (`3kfc_admin_session`).

---

## 6. Testing & Quality Assurance

The codebase includes comprehensive unit and integration tests powered by **Vitest**:

```bash
# Run all tests
npm test

# Run tests in watch mode
npx vitest

# Run Next.js production build check
npm run build
```

### Test Coverage Highlights:
- `tests/money.test.ts`: Integer minor units arithmetic, formatters, and discount precision.
- `tests/qr-crypto.test.ts`: HMAC-SHA256 signature generation, validation, tampering detection, and PII omission.
- `tests/rbac.test.ts`: Staff role boundaries, resource:action isolation, negative checks, and multi-role union.
- `tests/daraja.test.ts`: E.164 phone normalization (`07...`, `01...`, `+254...`) and privacy payload sanitization.
- `tests/loyalty.test.ts`: Non-zero integer delta checks, administrative audit justifications, and staff authorization guards.

---

## 7. Production Deployment & Database Migration

### PostgreSQL Deployment (Vercel, Railway, Supabase, Neon)
1. Set `DATABASE_URL="postgresql://user:pass@host:5432/3kfc_prod?sslmode=require"` in environment variables.
2. The schema is 100% relational and drop-in compatible with PostgreSQL (`prisma/schema.postgresql.prisma`).
3. Run `npx prisma migrate deploy` on deployment pipelines.
4. Set `QR_TICKET_SIGNING_SECRET`, `SESSION_SECRET`, and `ADMIN_BOOTSTRAP_TOKEN` to high-entropy 256-bit keys.

---

## 8. License & Club Rights

© 2026 3K FC (3K Football Club — Embu County, Kenya). All official club badges, trademarks, kit graphics, and editorial content are the exclusive property of 3K FC.
