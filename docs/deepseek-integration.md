# DeepSeek Integration

## Boundary

Frontend ส่งเฉพาะข้อมูล Incident ไป Backend endpoint Backend เป็นผู้เรียก DeepSeek; API key ไม่ออกไปยัง Browser

## Runtime configuration

```text
DEEPSEEK_API_KEY   secret
DEEPSEEK_BASE_URL  default https://api.deepseek.com
DEEPSEEK_MODEL     default deepseek-v4-flash
```

ตั้ง production secret:

```powershell
cd backend
npx wrangler secret put DEEPSEEK_API_KEY
```

## Request policy

- native `fetch`
- timeout 12 วินาที
- `response_format: { "type": "json_object" }`
- `thinking: { "type": "disabled" }`
- system prompt แยกจาก JSON user data
- follow-up ได้สูงสุดหนึ่งครั้ง; ถ้า model พยายามถามรอบสอง adapter ถือว่าล้มเหลว
- ไม่ log key, prompt ที่อาจมีข้อมูล/ภาพ หรือ reasoning

## Validation

DeepSeek envelope และ JSON content ถูกตรวจด้วย Zod Analysis ต้องมี:

```text
needsFollowUp
followUpQuestion
analysis: title, summary, suggestedCategory, suggestedPriority, priorityReason
```

Closure ต้องมี `summary`

## Resilient fallback

กรณีต่อไปนี้คืน `source: fallback`:

- ไม่มี key
- timeout/network error
- HTTP error
- response/content ว่าง
- JSON parse error
- Zod validation error
- model ถาม follow-up รอบสอง

Analysis fallback คง category ผู้ใช้, สร้างข้อความแก้ได้ และเริ่ม Priority `UNASSIGNED` Closure fallback สร้าง Template Summary จากข้อมูลที่บันทึกแล้ว ทำให้ Resolve สำเร็จแม้ AI ไม่พร้อม

## Security

ไม่มี image AI และไม่ส่ง base64 image ให้ DeepSeek ห้าม commit secret หรือเปิดเผย reasoning AI เป็นคำแนะนำ ไม่ใช่ผู้ตัดสินใจ ผู้ใช้ต้องยืนยันผลก่อนสร้าง Incident
