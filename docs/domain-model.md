# Domain Model

## Incident

Incident เก็บ raw report, AI-editable summary, category/location, suggested/confirmed priority, workflow state, assignee, optional follow-up, optional image key/MIME, resolution และ AI source

Domain เก็บ `imageKey`/`imageMimeType`; HTTP DTO แปลงเป็น relative `imageUrl` เฉพาะ Incident Detail

## Status workflow

```text
NEW → ACKNOWLEDGED → IN_PROGRESS → RESOLVED
 ↑          ↓
 └──────────┘ (ACKNOWLEDGED → NEW)
            ↑
 IN_PROGRESS ┘ (IN_PROGRESS → ACKNOWLEDGED)
```

- Assignment ครั้งแรกเปลี่ยน `NEW` เป็น `ACKNOWLEDGED`
- Backward transition ไม่ล้าง assignee
- Frontend ต้อง confirm backward transition
- Resolve ต้องมี assignee, อยู่ `IN_PROGRESS`, มี action/result
- AI closure failure ห้ามทำให้ resolve ล้มเหลว

## Priority

`suggestedPriority` มาจาก AI/fallback และไม่เปลี่ยนตามมนุษย์  
`confirmedPriority` เป็นค่าปฏิบัติการที่ Dashboard ใช้และมนุษย์แก้ได้

List sort: `HIGH → MEDIUM → LOW → UNASSIGNED`, จากนั้น `createdAt` ล่าสุดก่อน

## Category

```text
BUILDING
GENERAL_SAFETY
UTILITY
HEALTH_ACCIDENT
EQUIPMENT_TECHNOLOGY
CLEANLINESS_HYGIENE
OTHER
```

## Timeline

Event types:

- `INCIDENT_CREATED`
- `AI_ANALYZED`
- `ASSIGNEE_UPDATED`
- `PRIORITY_UPDATED`
- `STATUS_CHANGED`
- `PROGRESS_RECORDED`
- `INCIDENT_RESOLVED`
- `CLOSURE_SUMMARY_GENERATED`

ทุก mutation สร้าง Timeline ใน Backend และ Detail ส่งเรียงเก่าไปใหม่

## Persistence

- D1: `incidents`, `incident_timeline`
- KV: image bytes key ตาม Incident ID
- Memory: contract-compatible implementation สำหรับ unit tests/Lambda build

หาก KV put สำเร็จแต่ D1 create ล้มเหลว Service ลบ KV key ที่ค้าง
