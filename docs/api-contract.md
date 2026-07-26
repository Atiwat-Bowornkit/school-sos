# Public API Contract

Base path: `/api/v1`

Success:

```json
{ "data": {} }
```

Error:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

## Common enums

```text
status: NEW | ACKNOWLEDGED | IN_PROGRESS | RESOLVED
priority: UNASSIGNED | LOW | MEDIUM | HIGH
category: BUILDING | GENERAL_SAFETY | UTILITY | HEALTH_ACCIDENT |
          EQUIPMENT_TECHNOLOGY | CLEANLINESS_HYGIENE | OTHER
source: deepseek | fallback
```

## System

| Method | Path | Response |
| --- | --- | --- |
| GET | `/health` | service health |
| GET | `/docs` | Scalar OpenAPI UI |
| GET | `/openapi.json` | OpenAPI document |

## Incidents

### List

`GET /api/v1/incidents?status=NEW&priority=HIGH`

Filters are optional. Results sort by confirmed priority `HIGH → MEDIUM → LOW → UNASSIGNED`, then newest first. List items do not expose an image URL.

### Create

`POST /api/v1/incidents`

```json
{
  "rawDescription": "มีน้ำรั่วไหลลงมาตรงบันไดและมีนักเรียนเดินผ่าน",
  "title": "น้ำรั่วบริเวณบันไดอาคารเรียน 1",
  "summary": "พื้นบันไดเปียกและเสี่ยงต่อการลื่นล้ม",
  "category": "BUILDING",
  "location": "บันไดอาคารเรียน 1 ระหว่างชั้น 1 และชั้น 2",
  "reporterName": "ครูเวรประจำวัน",
  "suggestedPriority": "HIGH",
  "confirmedPriority": "HIGH",
  "priorityReason": "เป็นเส้นทางสัญจรและเสี่ยงต่ออุบัติเหตุ",
  "followUpQuestion": "optional",
  "followUpAnswer": "optional",
  "imageDataUrl": "data:image/png;base64,...",
  "aiAnalysisSource": "fallback"
}
```

Backend สร้าง UUID, `SOS-<year>-<suffix>` และ Timeline

### Detail

`GET /api/v1/incidents/:id`

```json
{
  "data": {
    "incident": {
      "id": "...",
      "incidentCode": "SOS-2026-ABC123",
      "imageUrl": "/api/v1/incidents/:id/image"
    },
    "timeline": []
  }
}
```

Timeline เรียงเก่าไปใหม่ `imageUrl` เป็น relative URL และมีเฉพาะ detail ที่มีภาพ

### Update assignment/priority

`PATCH /api/v1/incidents/:id`

```json
{
  "assigneeName": "ฝ่ายอาคารสถานที่",
  "confirmedPriority": "HIGH",
  "actorName": "ครูเวร"
}
```

ส่งอย่างน้อย `assigneeName` หรือ `confirmedPriority` การมอบหมายครั้งแรก auto-acknowledge จาก `NEW`

### Change status

`POST /api/v1/incidents/:id/status`

```json
{ "status": "IN_PROGRESS", "actorName": "ครูเวร", "note": "เริ่มตรวจจุดรั่ว" }
```

### Progress

`POST /api/v1/incidents/:id/progress`

```json
{ "description": "ปิดพื้นที่และตรวจสอบจุดรั่ว", "actorName": "ฝ่ายอาคารสถานที่" }
```

### Resolve

`POST /api/v1/incidents/:id/resolve`

```json
{
  "actionTaken": "ปิดวาล์ว ซ่อมจุดรั่ว และเช็ดพื้น",
  "resolutionResult": "หยุดน้ำรั่วและเปิดทางเดินได้",
  "resolutionNote": "ติดตามซ้ำในวันถัดไป",
  "actorName": "ฝ่ายอาคารสถานที่"
}
```

Resolve ต้องมี assignee และสถานะ `IN_PROGRESS` Closure Summary เป็น internal service call ไม่เปิด endpoint แยก

### Image

`GET /api/v1/incidents/:id/image`

คืน raw bytes พร้อม MIME จริง หรือ JSON 404 ภาพรับเฉพาะ JPEG/PNG/WebP decoded ไม่เกิน 1 MB

## AI

`POST /api/v1/ai/incidents/analyze`

```json
{
  "description": "มีน้ำรั่วตรงบันไดอาคารเรียน",
  "selectedCategory": "BUILDING",
  "location": "อาคารเรียน 1",
  "followUpAnswer": "optional",
  "followUpAlreadyAsked": false
}
```

```json
{
  "data": {
    "needsFollowUp": false,
    "followUpQuestion": null,
    "analysis": {
      "title": "...",
      "summary": "...",
      "suggestedCategory": "BUILDING",
      "suggestedPriority": "UNASSIGNED",
      "priorityReason": "..."
    },
    "source": "fallback"
  }
}
```
