# Golden Flow

## Scenario

```text
รายละเอียด: มีน้ำรั่วไหลลงมาตรงบันได พื้นเปียก และยังมีนักเรียนเดินผ่านบริเวณดังกล่าว
หมวด: อาคารและสถานที่
สถานที่: บันไดอาคารเรียน 1 ระหว่างชั้น 1 และชั้น 2
ผู้แจ้ง: ครูเวรประจำวัน
```

## Reporter flow

1. เปิด `/report`
2. กรอกรายละเอียดอย่างน้อย 10 ตัวอักษร, สถานที่อย่างน้อย 3 ตัวอักษร และ Category
3. แนบ JPEG/PNG/WebP หนึ่งภาพ
4. กดตรวจด้วย AI
5. ตอบ follow-up หากมี ระบบไม่ถามเกินหนึ่งครั้ง
6. ตรวจ/แก้ Title, Summary, Category และ Confirmed Priority
7. สร้าง Incident และเปิด Detail

หากไม่มี `DEEPSEEK_API_KEY` ต้องเห็น fallback alert, แก้ข้อมูลต่อได้ และสร้าง Incident ได้

## Coordinator flow

1. เปิด Dashboard และยืนยัน Incident ใหม่ปรากฏ
2. เปิด Incident Detail
3. กำหนด assignee; `NEW` เปลี่ยนเป็น `ACKNOWLEDGED`
4. ยืนยัน/แก้ Priority
5. เปลี่ยนเป็น `IN_PROGRESS`
6. เพิ่ม progress note
7. กรอก action/result และ resolve
8. ยืนยัน `RESOLVED`, Closure Summary และ Timeline ตั้งแต่สร้างถึงปิด

Backward transition แสดง confirm dialog และไม่ล้าง assignee

## Expected persistence

ทุก step เรียก Backend API Incident/Timeline อยู่ใน D1 ภาพอยู่ใน KV หน้า refresh แล้วข้อมูลยังอ่านจาก Backend ได้ Frontend store ไม่ใช่ฐานข้อมูล

## Responsive checklist

- Desktop: summary cards + data table
- Tablet: card/form sectionsไม่ล้นแนวนอน
- Mobile: Incident cardsแทน table และไม่มี horizontal overflow
- field มี label/error, image มี alt, action มีข้อความ/ARIA, focus state มองเห็น
