import type {
  IncidentImage,
  IncidentImageRepository,
} from '../../domain/repositories/incident-image-repository'

export class MemoryIncidentImageRepository implements IncidentImageRepository {
  private readonly images = new Map<string, IncidentImage>()

  async save(key: string, image: IncidentImage): Promise<void> {
    this.images.set(key, {
      data: new Uint8Array(image.data),
      mimeType: image.mimeType,
    })
  }

  async find(key: string): Promise<IncidentImage | null> {
    const image = this.images.get(key)
    return image
      ? { data: new Uint8Array(image.data), mimeType: image.mimeType }
      : null
  }

  async delete(key: string): Promise<void> {
    this.images.delete(key)
  }
}
