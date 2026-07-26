# QA Evidence

บันทึกนี้มีเฉพาะคำสั่งและผลที่รันจริงใน local workspace วันที่ 26 กรกฎาคม 2026

## Environment/install

- Backend `npm install` — สำเร็จหลังใช้ system CA; npm audit รายงาน 3 high-severity transitive vulnerabilities ไม่ได้รัน auto-fix
- Frontend `pnpm install` — postinstall ครั้งแรกเกินเวลารอ แต่ process ทำงานเสร็จ; รัน `pnpm install --ignore-scripts` ซ้ำเพื่อ finalize lockfile สำเร็จ
- Frontend package manager — pnpm 8.6.2
- Local validation runtime — Node.js 24; workflow ยังใช้ Node.js 22

## Backend

| Command/check | Result |
| --- | --- |
| `npm run db:migrate:local` | ผ่าน; migration 0001 ใช้ 9 commands |
| `npm test` | ผ่าน 5/5 |
| `npm run typecheck` | ผ่าน |
| `npm run build:lambda` | ผ่าน |

Backend tests ที่รันครอบคลุม assignment auto-acknowledge/timeline, invalid transition/resolve, closure fallback, analysis fallback และ image MIME signature

## Frontend

| Command/check | Result |
| --- | --- |
| `pnpm test` | ผ่าน 5/5 |
| `pnpm typecheck` | ผ่านหลังแก้ type errors 2 จุด |
| `pnpm lint` | exit 0; เหลือ warning เดิม 2 รายการใน lighthouse scripts |
| `pnpm build` | ผ่าน; Vite build 529 modules |

Frontend tests ที่รันครอบคลุม labels, client-side filter, report validation, editable fallback fields และการเก็บคำถาม/คำตอบ follow-up หลังวิเคราะห์รอบสอง

## API smoke

รันกับ local Worker `http://127.0.0.1:8787`

- `/health` — `ok`
- `/docs` — HTTP 200
- `/openapi.json` — title `School SOS API`
- OpenAPI tags — `Incidents, AI`; ไม่มี Users path
- `/api/v1/users` — HTTP 404
- AI analyze โดยไม่มี key — `source: fallback`
- Create Incident — สำเร็จและได้ code `SOS-2026-88389F`
- Invalid transition — HTTP 400
- Missing image — HTTP 404
- Assignment — status `ACKNOWLEDGED`
- Start — status `IN_PROGRESS`
- Progress — Timeline มี 6 events ณ จุดตรวจ
- Resolve — status `RESOLVED`
- Closure — `source: fallback`
- Timeline หลังปิด — 8 events
- Valid PNG image — HTTP 200, `image/png`, 68 bytes
- Oversize image — HTTP 400
- MIME spoof (`image/png` แต่ bytes ไม่ใช่ PNG) — HTTP 400

## Browser Golden Flow

รันใน Codex in-app browser กับ local Frontend/Backend:

- กรอก Scenario น้ำรั่วที่ `/report`
- เลือก `BUILDING`
- AI fallback แสดง inline alert และยังสร้าง Incident ได้
- แก้ Title/Summary และยืนยัน `HIGH`
- สร้าง Incident `SOS-2026-E8EC29`
- มอบหมาย “ฝ่ายอาคารสถานที่” และได้ `ACKNOWLEDGED`
- เปลี่ยนเป็น `IN_PROGRESS`
- บันทึก progress
- Resolve พร้อม action/result/actor
- ได้ `RESOLVED`, Template Closure Summary และ Timeline 8 รายการ

DeepSeek live flow — ไม่ได้รัน เพราะไม่มี `DEEPSEEK_API_KEY`

## Responsive/accessibility browser checks

- Desktop Golden Flow — ผ่าน
- Mobile Dashboard — table ถูกซ่อน, แสดง 3 Incident cards, viewport content 375 px และไม่มี horizontal overflow
- Mobile Report — ไม่มี horizontal overflow
- Mobile Incident Detail — ไม่มี horizontal overflow; พบ interactive/focusable controls 17 รายการ
- Tablet Incident Detail — viewport content 819 px และไม่มี horizontal overflow
- Keyboard focus — ยืนยัน textarea รับ focus จาก interaction; browser automation ไม่สามารถเลื่อน focus ด้วย Tab ได้อย่างน่าเชื่อถือ จึงไม่ได้อ้างว่าทดสอบ full keyboard traversal ผ่าน

## Deployment

Production deploy/Public URL — ไม่ได้รัน เพราะ D1/KV IDs, Cloudflare/GitHub secrets, target remote และ Pages project ยังไม่ได้ยืนยัน
