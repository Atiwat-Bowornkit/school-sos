# School SOS Frontend

Vue 3 + TypeScript + Vuetify + Pinia SPA สำหรับ Golden Flow ของ School SOS

## Routes

- `/` Dashboard: summary, filter, desktop table, mobile cards
- `/report` แบบฟอร์ม 3 ขั้นและ AI fallback
- `/incidents/:id` รายละเอียด มอบหมาย Priority สถานะ progress resolve และ Timeline

ไม่มี Login, User Profile, User Management หรือ localStorage persistence ของ Incident

## Data flow

```text
Page → Pinia Store → typed API wrapper → School SOS Backend
```

- `useIncidentStore`: list/detail/timeline/loading/error/mutations
- `useReportStore`: form/AI/follow-up/step/image/reset
- D1 เป็นแหล่งข้อมูลหลัก; store เก็บเฉพาะ UI และ form state

## Local

```powershell
pnpm install
Copy-Item .env.example .env
pnpm dev
```

Environment:

```text
VITE_BACKEND_URL=http://localhost:8787
```

ห้ามใช้ `VITE_API_BASE_URL` หรือใส่ DeepSeek key ใน Frontend

## Commands

```powershell
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm preview
```

ใช้ pnpm 8.6.2 เท่านั้น `pnpm lint` มี `--fix`; ตรวจ diff หลังรัน

## Image processing

Browser Canvas ย่อภาพด้านยาวไม่เกิน 1,200 px และ encode WebP แบบลดคุณภาพซ้ำจน decoded payload ไม่เกิน 1 MB หากทำไม่ได้จะแสดง field error และไม่ส่ง

## Accessibility/responsive

UI มี label/error/alt text, ARIA สำหรับ action, focus state, badge มีข้อความ และเปลี่ยน table เป็น cards บนจอเล็ก ออกแบบสำหรับ desktop, tablet และ mobile โดยไม่ต้อง scroll แนวนอน

## Production note

เป็น demo แบบ public URL ทุกคนสามารถแก้ Incident ได้ ต้องเพิ่ม Authentication/RBAC ก่อนใช้กับข้อมูลสำคัญ
