# School SOS Scope Summary

## Product

School SOS เป็น MVP สำหรับแจ้ง ประสานงาน และติดตามเหตุภายในโรงเรียน เป้าหมายคือทำ Golden Flow ตั้งแต่แจ้งเหตุถึงปิดเหตุให้ครบด้วยข้อมูลจริงใน D1

## Users in the demo

- ผู้แจ้งเหตุ: กรอกข้อมูล แนบภาพ ตรวจ/แก้คำแนะนำ AI และสร้าง Incident
- ผู้รับผิดชอบ: ดู Dashboard มอบหมาย ยืนยัน Priority เปลี่ยนสถานะ บันทึก progress และ resolve

ระบบไม่มีบัญชีผู้ใช้หรือ permission; actor เป็นข้อความประกอบ Timeline

## In scope

- 3 routes: `/`, `/report`, `/incidents/:id`
- 4 statuses และ 4 priorities
- 7 categories
- ภาพ JPEG/PNG/WebP หนึ่งภาพ decoded ไม่เกิน 1 MB
- DeepSeek text analysis/closure ผ่าน Backend
- Template fallback ทุก AI failure
- D1 Incident/Timeline และ KV image
- Dashboard client filters, responsive table/cards
- Public OpenAPI สำหรับ Incidents และ AI

## Out of scope

Login, Register, RBAC, Users, My Tasks, notifications, real-time, map/GPS, image AI, video, chatbot หลายรอบ, multi-school, advanced analytics, export, PDF/Excel, procurement, budget, inventory และ student records

## Acceptance focus

Golden Flow, AI fallback, persistence, status rules, Timeline, resolve, image validation, responsive/accessibility, automated checks และ deploy readiness สำคัญกว่าจำนวนฟีเจอร์
