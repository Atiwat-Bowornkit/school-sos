# School SOS

## 1. Product Overview

School SOS คือ Web Application สำหรับแจ้ง ประสานงาน และติดตามการแก้ไขปัญหาภายในโรงเรียน ตั้งแต่ผู้พบเหตุแจ้งข้อมูลจนผู้รับผิดชอบปิดเหตุได้สำเร็จ ตัว MVP เป็นระบบ Full-Stack จริง ใช้ Backend API และ Cloudflare D1/KV ไม่ใช้ Local Storage เป็นฐานข้อมูล

## 2. Problem Statement

ระบบช่วยลดปัญหาข้อมูลเหตุที่กระจัดกระจาย ไม่ครบ และติดตามสถานะไม่ได้ โดยรวมรายละเอียด ผู้รับผิดชอบ Priority ความคืบหน้า ผลการแก้ไข และ Timeline ไว้ใน Incident เดียว

## 3. Golden Flow

```text
แจ้งเหตุ + แนบภาพ → AI ตรวจข้อมูล/ถามเพิ่มได้ 1 ครั้ง → ผู้ใช้ยืนยัน
→ สร้าง Incident → มอบหมาย → ACKNOWLEDGED → IN_PROGRESS
→ บันทึกความคืบหน้า → RESOLVED → Closure Summary → Timeline
```

DeepSeek เป็นผู้เสนอแนะเท่านั้น ผู้ใช้แก้ Title, Summary, Category และ Confirmed Priority ได้ก่อนสร้าง Incident

## 4. Scope

มี 3 หน้าหลัก:

- `/` Dashboard
- `/report` แจ้งเหตุใหม่
- `/incidents/:id` รายละเอียดเหตุและการดำเนินงาน

MVP ไม่มี Login, Authentication, RBAC, User Management, Notification ภายนอก, Real-time, Map, Image AI, Analytics ขั้นสูง หรือข้อมูลนักเรียน

## 5. Tech Stack

| ส่วน | เทคโนโลยี |
| --- | --- |
| Backend | TypeScript, Hono, Cloudflare Workers, D1, KV, Zod, OpenAPI |
| Architecture | Clean Architecture และ Dependency Injection |
| Frontend | Vue 3, TypeScript, Vuetify, Pinia, Vite |
| AI | DeepSeek ผ่าน Backend พร้อม Template Fallback |
| Deploy | Cloudflare Workers + Cloudflare Pages + GitHub Actions |
| Test | Vitest |

## 6. Project Structure

```text
starter-template/
├── backend/
│   ├── migrations/                 # D1 schema
│   └── src/
│       ├── domain/                 # entities/repository contracts/errors
│       ├── services/               # business rules
│       ├── infrastructure/         # D1, KV, Memory, DeepSeek/Fallback
│       ├── handlers/               # HTTP orchestration
│       ├── schemas/                # Zod + OpenAPI schemas
│       ├── routers/                # public routes
│       └── di/                     # dependency wiring
├── frontend/src/
│   ├── pages/                      # 3 product routes
│   ├── stores/                     # UI/form state
│   ├── apis/                       # typed Backend calls
│   ├── models/                     # public API models
│   └── components/school-sos/      # incident UI
├── docs/
└── .github/workflows/deploy.yml
```

Data flow:

```text
Page → Pinia Store → API wrapper → Hono Router → Handler → Service → Repository → D1/KV
```

## 7. Local Setup

ต้องมี Node.js 22+ (ตรวจ local ด้วย Node.js 24 ได้), npm และ pnpm 8.6.2

```powershell
npm install --global pnpm@8.6.2
```

เปิด Backend และ Frontend คนละ terminal ตามหัวข้อถัดไป

## 8. Backend Setup

```powershell
cd backend
npm install
Copy-Item wrangler.example.jsonc wrangler.jsonc
# สำหรับ local เท่านั้น สามารถใช้ placeholder IDs ตามตัวอย่างได้
npm run db:migrate:local
npm run dev
```

Backend: `http://localhost:8787`

API docs: `http://localhost:8787/docs`

คำสั่งตรวจ:

```powershell
npm test
npm run typecheck
npm run build:lambda
```

## 9. Frontend Setup

```powershell
cd frontend
pnpm install
Copy-Item .env.example .env
pnpm dev
```

Frontend: `http://localhost:5173`

คำสั่งตรวจ:

```powershell
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

`pnpm lint` ใช้ `--fix`; ตรวจ diff ทุกครั้งหลังรัน

## 10. Environment Variables

Frontend:

- `VITE_APP_TITLE`
- `VITE_APP_URL`
- `VITE_APP_DESCRIPTION`
- `VITE_SITE_NAME`
- `VITE_AUTHOR`
- `VITE_THEME_COLOR`
- `VITE_BACKEND_URL`

Backend:

- `ENVIRONMENT`
- `DEEPSEEK_API_KEY` (secret)
- `DEEPSEEK_BASE_URL`
- `DEEPSEEK_MODEL`

ห้ามวาง `DEEPSEEK_API_KEY` ใน Frontend, `.env.example`, Git หรือ build artifact

## 11. D1 Migration

Migration เริ่มที่ `backend/migrations/0001_create_school_sos.sql` และสร้าง `incidents`, `incident_timeline` พร้อม indexes

```powershell
cd backend
npm run db:migrate:local
# หลังตั้ง Cloudflare resource จริงแล้ว:
npm run db:migrate:remote
```

D1 database name คือ `school-sos-db`

## 12. KV Image Storage

รองรับ JPEG, PNG หรือ WebP หนึ่งภาพ ขนาด decoded ไม่เกิน 1 MB Frontend ย่อด้านยาวไม่เกิน 1,200 px และลดคุณภาพแบบวนซ้ำก่อนส่ง Backend ตรวจ MIME/ขนาดซ้ำ แล้วเก็บ bytes ใน KV ด้วย key อิง Incident ID

ภาพอ่านผ่าน `GET /api/v1/incidents/:id/image` และส่ง Content-Type จริง หาก D1 สร้าง Incident ไม่สำเร็จหลังบันทึก KV ระบบลบภาพค้าง

## 13. DeepSeek Configuration

Backend ใช้ `deepseek-v4-flash`, JSON output, thinking disabled, timeout 12 วินาที และตรวจผลด้วย Zod:

```powershell
cd backend
npx wrangler secret put DEEPSEEK_API_KEY
```

ตั้ง `DEEPSEEK_BASE_URL` และ `DEEPSEEK_MODEL` ใน Wrangler vars ได้ โดยไม่ commit secret

## 14. AI Fallback

เมื่อไม่มี key, timeout, HTTP error, response ว่าง, JSON ผิด หรือ schema ไม่ผ่าน ระบบคืน `source: fallback` และ Priority เริ่มเป็น `UNASSIGNED` ผู้ใช้ยังแก้ข้อมูลและสร้าง Incident ได้ การ Resolve ก็สำเร็จพร้อม Template Closure Summary แม้ AI ล้มเหลว

AI follow-up จำกัดหนึ่งรอบทั้ง prompt และ adapter

## 15. API Endpoints

| Method | Path |
| --- | --- |
| GET | `/health` |
| GET | `/docs` |
| GET | `/openapi.json` |
| GET | `/api/v1/incidents?status=&priority=` |
| POST | `/api/v1/incidents` |
| GET | `/api/v1/incidents/:id` |
| PATCH | `/api/v1/incidents/:id` |
| POST | `/api/v1/incidents/:id/status` |
| POST | `/api/v1/incidents/:id/progress` |
| POST | `/api/v1/incidents/:id/resolve` |
| GET | `/api/v1/incidents/:id/image` |
| POST | `/api/v1/ai/incidents/analyze` |

JSON สำเร็จใช้ `{ "data": ... }`; ข้อผิดพลาดใช้ `{ "error": { "code": "...", "message": "..." } }` ดูรายละเอียดที่ [docs/api-contract.md](docs/api-contract.md)

## 16. Demo Flow

ใช้เหตุ “มีน้ำรั่วตรงบันไดอาคารเรียนและยังมีนักเรียนเดินผ่าน” ที่ `/report` เลือกอาคารและสถานที่ ระบุตำแหน่ง แนบภาพ ตรวจด้วย AI แล้วแก้ผลก่อนสร้าง จาก Dashboard เปิด Incident กำหนด “ฝ่ายอาคารสถานที่” ยืนยัน Priority เริ่มดำเนินการ เพิ่ม progress และปิดเหตุ ตรวจ Closure Summary กับ Timeline

## 17. Deployment

Workflow บน `main` ใช้ Node.js 22, npm สำหรับ Backend และ pnpm 8.6.2 สำหรับ Frontend จากนั้น migrate `school-sos-db`, deploy Worker `school-sos-backend` และ Cloudflare Pages

ต้องมี GitHub Secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `D1_DATABASE_ID`
- `KV_NAMESPACE_ID`
- `PAGES_PROJECT_NAME`
- `VITE_BACKEND_URL`

ดูขั้นตอนและหน้าที่คน/agent ที่ [deploy-plan.md](deploy-plan.md)

## 18. Known Limitations

- เป็น Demo ที่ทุกคนเข้าถึง URL และแก้ Incident ได้
- AI ไม่วิเคราะห์ภาพ
- ไม่มี real-time update หรือ notification
- Memory repositories ของ Lambda มีข้อมูลชั่วคราว เหมาะกับ build/test ไม่ใช่ production persistence
- ยังไม่มี Seed Data ตาม Scope รอบแรก
- DeepSeek live flow ต้องมี secret และ network; fallback ใช้งานได้เสมอ

## 19. Security Note

ห้ามใช้กับข้อมูลสำคัญหรือข้อมูลนักเรียนจริงก่อนเพิ่ม Authentication, Authorization, audit policy และ data retention ที่เหมาะสม ระบบปัจจุบัน validate input ทั้งสองฝั่ง จำกัด MIME/ขนาดภาพ ไม่ใช้ `v-html` กับข้อความผู้ใช้ ไม่ log key/base64/reasoning และเรียก AI ผ่าน Backend เท่านั้น

## 20. Next Development Steps

ก่อน production ควรเพิ่ม Authentication/RBAC, แยกตัวตน actor จาก request body, rate limiting, retention/backup, security review, observability และ integration tests บน Cloudflare environment จริง โดยไม่เปลี่ยน Golden Flow หลัก

หลักฐานคำสั่งและ QA ที่รันจริงอยู่ที่ [docs/qa-evidence.md](docs/qa-evidence.md)
