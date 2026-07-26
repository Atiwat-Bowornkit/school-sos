export interface IncidentImage {
  data: Uint8Array
  mimeType: string
}

export interface IncidentImageRepository {
  save(key: string, image: IncidentImage): Promise<void>
  find(key: string): Promise<IncidentImage | null>
  delete(key: string): Promise<void>
}
