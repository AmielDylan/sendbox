import sharp from 'sharp'

const MAX_SIZE = 10 * 1024 * 1024

type FileKind = 'jpeg' | 'png' | 'heic' | 'pdf'

export type PipelineErrorCode =
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_FORMAT'
  | 'PDF_ENCRYPTED'
  | 'PDF_RENDER_ERROR'
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
  // PDF : %PDF
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46)
    return 'pdf'
  return null
}

async function pdfToJpeg(buf: Buffer): Promise<Buffer | PipelineErrorCode> {
  let pdfjsLib: typeof import('pdfjs-dist/legacy/build/pdf.mjs')
  let createCanvas: (typeof import('@napi-rs/canvas'))['createCanvas']

  try {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const canvasMod = await import('@napi-rs/canvas')
    createCanvas = canvasMod.createCanvas
  } catch {
    return 'PDF_RENDER_ERROR'
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc = ''

  let pdf: Awaited<ReturnType<(typeof pdfjsLib)['getDocument']>['promise']>
  try {
    pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise
  } catch (err: any) {
    if (err?.name === 'PasswordException') return 'PDF_ENCRYPTED'
    return 'PDF_RENDER_ERROR'
  }

  let page: Awaited<ReturnType<typeof pdf.getPage>>
  try {
    page = await pdf.getPage(1)
  } catch {
    return 'PDF_RENDER_ERROR'
  }

  const viewport = page.getViewport({ scale: 2.0 })
  const canvas = createCanvas(
    Math.ceil(viewport.width),
    Math.ceil(viewport.height)
  )

  try {
    // pdfjs-dist v4 attend `canvas` (le canvas lui-même, pas le contexte 2d)
    await page.render({ canvas: canvas as any, viewport } as any).promise
  } catch {
    return 'PDF_RENDER_ERROR'
  }

  const png = canvas.toBuffer('image/png')
  return sharp(png).jpeg({ quality: 85 }).toBuffer()
}

export async function processKYCFile(buf: Buffer): Promise<PipelineResult> {
  if (buf.length > MAX_SIZE) return { ok: false, code: 'FILE_TOO_LARGE' }

  const kind = detectKind(buf)
  if (!kind) return { ok: false, code: 'INVALID_FILE_FORMAT' }

  try {
    if (kind === 'pdf') {
      const result = await pdfToJpeg(buf)
      if (typeof result === 'string') return { ok: false, code: result }
      return { ok: true, buffer: result }
    }
    const jpeg = await sharp(buf).jpeg({ quality: 85 }).toBuffer()
    return { ok: true, buffer: jpeg }
  } catch (err: any) {
    return { ok: false, code: 'FILE_PROCESSING_ERROR', detail: err?.message }
  }
}
