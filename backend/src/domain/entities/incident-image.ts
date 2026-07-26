export interface IncidentImage {
  id: string
  incidentId: string
  imageData: string // base64 data URL
  imageMimeType: string
  sortOrder: number
  createdAt: string
}
