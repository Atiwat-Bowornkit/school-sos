# School SOS Deployment Plan

Production target คือ Cloudflare Workers (`school-sos-backend`) + D1 (`school-sos-db`) + KV สำหรับภาพ และ Cloudflare Pages สำหรับ Frontend

## Prerequisites

- Node.js 22+ และ pnpm 8.6.2
- Cloudflare account ที่ login แล้ว
- GitHub repository ของโครงการ (remote ปัจจุบันต้องเป็น repo ที่ผู้ใช้ต้องการ deploy)
- DeepSeek API key สำหรับ live AI; หากไม่มี ระบบ fallback ยังทำงาน

## Agent ทำได้

- ติดตั้ง dependencies ด้วย npm/pnpm เดิม
- typecheck, test, lint และ build
- เตรียม `wrangler.jsonc` จาก `wrangler.example.jsonc`
- สร้าง D1/KV ผ่าน CLI หลัง Cloudflare login
- migrate D1, deploy Worker/Pages และ smoke test เมื่อ resource IDs/secrets พร้อม
- push code เมื่อผู้ใช้กำหนด remote และอนุญาต

## User ต้องทำ

- Login Cloudflare/OAuth
- สร้าง Cloudflare API Token และกำหนดสิทธิ์ Workers, D1, KV, Pages
- ยืนยัน Cloudflare Account ID และ production resource IDs
- กรอก GitHub Secrets
- ตั้ง DeepSeek secret
- ยืนยัน GitHub remote, project name และ Public URLs

## 1. สร้าง Cloudflare resources

หลัง login:

```powershell
cd backend
npx wrangler d1 create school-sos-db
npx wrangler kv namespace create KV
```

คัดลอก `database_id` และ KV `id` ไปใช้เป็น GitHub Secrets; ห้าม commit ID จริงถ้านโยบายทีมถือเป็นข้อมูล config ภายใน

## 2. ตั้ง Wrangler local/production

```powershell
cd backend
Copy-Item wrangler.example.jsonc wrangler.jsonc
```

แทน placeholder ในไฟล์ gitignored `wrangler.jsonc` ด้วย D1/KV IDs จริง

ตั้ง DeepSeek secret ผ่าน prompt ของ Wrangler:

```powershell
npx wrangler secret put DEEPSEEK_API_KEY
```

ห้ามใส่ key ลง `.env.example`, `wrangler.example.jsonc`, source code หรือ GitHub Actions log

## 3. ตรวจ build ก่อน deploy

```powershell
cd backend
npm ci
npm test
npm run typecheck
npm run build:lambda

cd ..\frontend
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
pnpm typecheck
pnpm build
```

## 4. Deploy ด้วยมือ

Backend:

```powershell
cd backend
npm run db:migrate:remote
npm run deploy
```

Frontend:

```powershell
cd frontend
$env:VITE_BACKEND_URL = "https://<worker>.workers.dev"
pnpm build
npx wrangler pages deploy dist --project-name=<PAGES_PROJECT_NAME> --branch=main
```

## 5. GitHub Actions

ตั้ง Repository Secrets:

| Secret | ใช้กับ |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Workers, D1, KV, Pages |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account |
| `D1_DATABASE_ID` | `school-sos-db` |
| `KV_NAMESPACE_ID` | Incident image KV |
| `PAGES_PROJECT_NAME` | Frontend Pages |
| `VITE_BACKEND_URL` | Worker public URL สำหรับ Frontend build |

Push/merge ไป `main` จะ build ทั้งสองส่วน แล้ว migrate/deploy เฉพาะ push ไป `main`

## 6. Post-deploy verification

ตรวจตามลำดับ:

```text
GET <backend>/health
GET <backend>/docs
GET <backend>/openapi.json
GET <backend>/api/v1/incidents
```

จาก Frontend public URL รัน Golden Scenario ถึง `RESOLVED`, ตรวจภาพ, fallback, Timeline, Desktop/Tablet/Mobile และยืนยัน `/api/v1/users` เป็น 404

## 7. Deployment status ของรอบนี้

ไม่ได้รัน production deploy เพราะ repository ยังใช้ resource placeholders และยังไม่ได้รับการยืนยัน Cloudflare D1/KV IDs, secrets, target GitHub remote และ Pages project สำหรับ School SOS จึงส่งมอบ local build และขั้นตอน deploy ตามจริง
