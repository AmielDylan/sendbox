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

/**
 * Télécharge le document depuis le bucket, lance Tesseract OCR,
 * extrait et valide les lignes MRZ, puis met à jour kyc_reviews.
 */
export async function processKYCMRZ(userId: string, docPath: string): Promise<MRZResult> {
  const admin = createAdminClient()

  // 1. Télécharger l'image depuis le bucket
  const { data: fileData, error: dlError } = await admin.storage
    .from('kyc-documents')
    .download(docPath)
  if (dlError || !fileData) {
    throw new Error(`Impossible de télécharger le document: ${dlError?.message}`)
  }

  const buffer = Buffer.from(await fileData.arrayBuffer())

  // 2. OCR via Tesseract — charset MRZ uniquement
  const worker = await createWorker('eng')
  await worker.setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
  })
  const { data } = await worker.recognize(buffer)
  await worker.terminate()

  const ocrText: string = data.text ?? ''
  const ocrConfidence: number = (data.confidence ?? 0) / 100

  // 3. Extraire les lignes MRZ (TD3: 2 lignes de 44 chars, TD1: 3 lignes de 30 chars)
  const lines = ocrText
    .split('\n')
    .map(l => l.trim().replace(/\s/g, ''))
    .filter(l => /^[A-Z0-9<]{20,}$/.test(l))

  let result: MRZResult = {
    mrz_valid: false,
    mrz_name: null,
    mrz_nationality: null,
    mrz_birth_date: null,
    mrz_expiry: null,
    mrz_expired: null,
    mrz_raw: ocrText.slice(0, 500),
    ocr_confidence: ocrConfidence,
  }

  // Essayer TD3 (2 lignes × 44) puis TD1 (3 lignes × 30)
  const td3Candidates = lines.filter(l => l.length === 44)
  const td1Candidates = lines.filter(l => l.length === 30)
  const mrzLines =
    td3Candidates.length >= 2
      ? td3Candidates.slice(-2)
      : td1Candidates.length >= 3
        ? td1Candidates.slice(-3)
        : null

  if (!mrzLines) {
    await upsertReview(admin, userId, result)
    return result
  }

  try {
    const parsed = parse(mrzLines)
    if (!parsed.valid) {
      await upsertReview(admin, userId, result)
      return result
    }

    const fields = parsed.fields
    const expiryRaw: string = fields.expirationDate ?? ''
    const today = new Date()
    let expired: boolean | null = null
    if (expiryRaw.length === 6) {
      const year = parseInt(expiryRaw.slice(0, 2), 10)
      const month = parseInt(expiryRaw.slice(2, 4), 10)
      const fullYear = year >= 0 && year <= 30 ? 2000 + year : 1900 + year
      const expiryDate = new Date(fullYear, month - 1, 1)
      expired = expiryDate < today
    }

    result = {
      mrz_valid: true,
      mrz_name: [fields.lastName, fields.firstName].filter(Boolean).join(' ') || null,
      mrz_nationality: fields.nationality ?? null,
      mrz_birth_date: fields.birthDate ?? null,
      mrz_expiry: expiryRaw || null,
      mrz_expired: expired,
      mrz_raw: mrzLines.join('\n'),
      ocr_confidence: ocrConfidence,
    }
  } catch {
    // parse() a jeté — résultat invalide déjà initialisé
  }

  await upsertReview(admin, userId, result)
  return result
}

async function upsertReview(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  result: MRZResult,
) {
  await (admin as any)
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
