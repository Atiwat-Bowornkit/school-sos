const MAX_BYTES = 1024 * 1024
const MAX_DIMENSION = 1200
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? ''
  return Math.ceil((base64.length * 3) / 4)
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('ไม่สามารถอ่านรูปภาพนี้ได้'))
    }
    image.src = url
  })
}

export async function resizeIncidentImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type))
    throw new Error('รองรับเฉพาะไฟล์ JPEG, PNG และ WebP')

  const image = await loadImage(file)
  const initialScale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height))
  let width = Math.max(1, Math.round(image.width * initialScale))
  let height = Math.max(1, Math.round(image.height * initialScale))
  let quality = 0.86

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context)
      throw new Error('เบราว์เซอร์ไม่รองรับการปรับขนาดรูปภาพ')
    context.drawImage(image, 0, 0, width, height)
    const dataUrl = canvas.toDataURL('image/webp', quality)
    if (dataUrl.startsWith('data:image/webp') && dataUrlBytes(dataUrl) <= MAX_BYTES)
      return dataUrl
    quality = Math.max(0.5, quality - 0.07)
    if (quality <= 0.55) {
      width = Math.max(1, Math.round(width * 0.85))
      height = Math.max(1, Math.round(height * 0.85))
    }
  }
  throw new Error('รูปภาพมีขนาดใหญ่เกินไป กรุณาเลือกภาพอื่น')
}
