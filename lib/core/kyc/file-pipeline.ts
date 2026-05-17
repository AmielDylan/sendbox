import sharp from 'sharp'

const MAX_SIZE = 10 * 1024 * 1024

type FileKind = 'jpeg' | 'png' | 'heic'

export type PipelineErrorCode =
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_FORMAT'
  | 'FILE_PROCESSING_ERROR'

export type PipelineResult =
  | { ok: true; buffer: Buffer }
  | { ok: false; code: PipelineErrorCode; detail?: string }

function detectKind(buf: Buffer): FileKind | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg'
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return 'png'
  // HEIC : bytes 4–7 = 'ftyp'
  if (
    buf.length >= 12 &&
    buf[4] === 0x66 &&
    buf[5] === 0x74 &&
    buf[6] === 0x79 &&
    buf[7] === 0x70
  )
    return 'heic'
  return null
}

export async function processKYCFile(buf: Buffer): Promise<PipelineResult> {
  if (buf.length > MAX_SIZE) return { ok: false, code: 'FILE_TOO_LARGE' }

  const kind = detectKind(buf)
  if (!kind) return { ok: false, code: 'INVALID_FILE_FORMAT' }

  try {
    const jpeg = await sharp(buf).jpeg({ quality: 85 }).toBuffer()
    return { ok: true, buffer: jpeg }
  } catch (err: any) {
    return { ok: false, code: 'FILE_PROCESSING_ERROR', detail: err?.message }
  }
}
