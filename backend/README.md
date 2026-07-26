# School SOS Backend

Hono API สำหรับ Cloudflare Workers ใช้ D1 เป็นข้อมูลหลัก, KV เก็บภาพ และ Clean Architecture แยก Domain/Service ออกจาก runtime

## Architecture

```text
Router → Handler → IncidentService → Repository contract
                                      ├── D1 incident/timeline
                                      ├── KV image
                                      └── Memory (tests/Lambda build)
```

Business rules อยู่ใน `src/services/incident-service.ts`; Domain ไม่ผูก Hono, D1, KV หรือ URL

## Local

```powershell
npm install
Copy-Item wrangler.example.jsonc wrangler.jsonc
npm run db:migrate:local
npm run dev
```

- Health: `http://localhost:8787/health`
- Docs: `http://localhost:8787/docs`
- OpenAPI: `http://localhost:8787/openapi.json`

## Commands

```powershell
npm test
npm run typecheck
npm run build:lambda
npm run db:migrate:local
npm run db:migrate:remote
npm run deploy
```

Backend ใช้ npm และ `package-lock.json`

## Persistence

- D1 `school-sos-db`: `incidents`, `incident_timeline`
- KV binding `KV`: JPEG/PNG/WebP หนึ่งภาพต่อ Incident ขนาด decoded ไม่เกิน 1 MB
- Memory repositories: unit tests และ Lambda bundle เท่านั้น; ไม่ใช่ production persistence

## AI

DeepSeek adapter ใช้ native `fetch`, model `deepseek-v4-flash`, JSON mode, thinking disabled, timeout 12 วินาที และ Zod validation Resilient adapter คืน Template fallback เมื่อ key/network/HTTP/content/JSON/schema ล้มเหลว

ตั้ง secret:

```powershell
npx wrangler secret put DEEPSEEK_API_KEY
```

Vars ที่ไม่ลับ: `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL`

## Public API

```text
GET  /health
GET  /docs
GET  /openapi.json
GET  /api/v1/incidents
POST /api/v1/incidents
GET  /api/v1/incidents/:id
PATCH /api/v1/incidents/:id
POST /api/v1/incidents/:id/status
POST /api/v1/incidents/:id/progress
POST /api/v1/incidents/:id/resolve
GET  /api/v1/incidents/:id/image
POST /api/v1/ai/incidents/analyze
```

รายละเอียด request/response อยู่ที่ `../docs/api-contract.md`

## Production note

ระบบ MVP ไม่มี Authentication/RBAC และรับ actor name จาก request จึงเหมาะกับ demo เท่านั้น ต้องเพิ่ม identity, authorization, rate limiting และ retention policy ก่อนใช้กับข้อมูลจริง
