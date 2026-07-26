import type {
  IncidentImage,
  IncidentImageRepository,
} from '../../domain/repositories/incident-image-repository'

export class KVIncidentImageRepository implements IncidentImageRepository {
  constructor(private readonly kv: KVNamespace) {}

  async save(key: string, image: IncidentImage): Promise<void> {
    await this.kv.put(key, image.data, {
      metadata: { mimeType: image.mimeType },
    })
  }

  async find(key: string): Promise<IncidentImage | null> {
    const result = await this.kv.getWithMetadata<{ mimeType?: string }>(key, 'arrayBuffer')
    if (!result.value) return null
    return {
      data: new Uint8Array(result.value),
      mimeType: result.metadata?.mimeType ?? 'application/octet-stream',
    }
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key)
  }
}
