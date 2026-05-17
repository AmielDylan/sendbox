import { createWorker } from 'tesseract.js'
import { parse } from 'mrz'
import { createAdminClient } from '@/lib/shared/db/admin'

export interface MRZResult {
  mrz_valid: boolean
  mrz_name: string | null
  mrz_nationality: string | null
  mrz_birth_date: string | null
  mrz_expiry: string | null
  mrz_expired: boolean | null
  mrz_raw: string | null
  ocr_confidence: number
}

interface OCRLines {
  lines: string[]
  rawText: string
  confidence: number
}

async function downloadBuffer(
  admin: ReturnType<typeof createAdminClient>,
  docPath: string
): Promise<Buffer> {
  const { data: fileData, error: dlError } = await admin.storage
    .from('kyc-documents')
    .download(docPath)
  if (dlError || !fileData) {
    throw new Error(
      `Impossible de télécharger le document: ${dlError?.message}`
    )
  }
  return Buffer.from(await fileData.arrayBuffer())
}

async function runOCR(buffer: Buffer): Promise<OCRLines> {
  const worker = await createWorker('eng')
  await worker.setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
  })
  const { data } = await worker.recognize(buffer)
  await worker.terminate()

  const rawText: string = data.text ?? ''
  const confidence: number = (data.confidence ?? 0) / 100
  const lines = rawText
    .split('\n')
    .map(l => l.trim().replace(/\s/g, ''))
    .filter(l => /^[A-Z0-9<]{20,}$/.test(l))

  return { lines, rawText, confidence }
}

function parseMRZLines(ocr: OCRLines): MRZResult | null {
  const td3 = ocr.lines.filter(l => l.length === 44)
  const td1 = ocr.lines.filter(l => l.length === 30)
  const mrzLines =
    td3.length >= 2 ? td3.slice(-2) : td1.length >= 3 ? td1.slice(-3) : null

  if (!mrzLines) return null

  try {
    const parsed = parse(mrzLines)
    if (!parsed.valid) return null

    const fields = parsed.fields
    const expiryRaw: string = fields.expirationDate ?? ''
    const today = new Date()
    let expired: boolean | null = null
    if (expiryRaw.length === 6) {
      const year = parseInt(expiryRaw.slice(0, 2), 10)
      const month = parseInt(expiryRaw.slice(2, 4), 10)
      const fullYear = year >= 0 && year <= 30 ? 2000 + year : 1900 + year
      expired = new Date(fullYear, month - 1, 1) < today
    }

    return {
      mrz_valid: true,
      mrz_name:
        [fields.lastName, fields.firstName].filter(Boolean).join(' ') || null,
      mrz_nationality: fields.nationality ?? null,
      mrz_birth_date: fields.birthDate ?? null,
      mrz_expiry: expiryRaw || null,
      mrz_expired: expired,
      mrz_raw: mrzLines.join('\n'),
      ocr_confidence: ocr.confidence,
    }
  } catch {
    return null
  }
}

export async function processKYCMRZ(
  userId: string,
  docPath: string,
  fallbackPath?: string
): Promise<MRZResult> {
  const admin = createAdminClient()

  const buffer = await downloadBuffer(admin, docPath)
  const ocr = await runOCR(buffer)

  let result = parseMRZLines(ocr)

  // Si MRZ non trouvée et fallbackPath fourni, réessayer sur le fichier alternatif
  if (!result && fallbackPath) {
    const fallbackBuffer = await downloadBuffer(admin, fallbackPath)
    const fallbackOcr = await runOCR(fallbackBuffer)
    result = parseMRZLines(fallbackOcr)
    if (!result) {
      result = {
        mrz_valid: false,
        mrz_name: null,
        mrz_nationality: null,
        mrz_birth_date: null,
        mrz_expiry: null,
        mrz_expired: null,
        mrz_raw: fallbackOcr.rawText.slice(0, 500),
        ocr_confidence: fallbackOcr.confidence,
      }
    }
  }

  if (!result) {
    result = {
      mrz_valid: false,
      mrz_name: null,
      mrz_nationality: null,
      mrz_birth_date: null,
      mrz_expiry: null,
      mrz_expired: null,
      mrz_raw: ocr.rawText.slice(0, 500),
      ocr_confidence: ocr.confidence,
    }
  }

  await upsertReview(admin, userId, result)
  return result
}

async function upsertReview(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  result: MRZResult
) {
  await admin
    .from('kyc_reviews')
    .update({
      mrz_valid: result.mrz_valid,
      mrz_name: result.mrz_name,
      mrz_nationality: result.mrz_nationality,
      mrz_birth_date: result.mrz_birth_date,
      mrz_expiry: result.mrz_expiry,
      mrz_expired: result.mrz_expired,
      mrz_raw: result.mrz_raw,
      ocr_confidence: result.ocr_confidence,
    })
    .eq('user_id', userId)
    .eq('status', 'PENDING')
}
