import { createWorker } from 'tesseract.js'
import { createAdminClient } from '@/lib/shared/db/admin'

export async function runDocumentOCR(userId: string, docPath: string): Promise<string> {
  const admin = createAdminClient()

  const { data: signedData } = await admin.storage
    .from('kyc-documents')
    .createSignedUrl(docPath, 300)
  if (!signedData?.signedUrl) throw new Error('Signed URL unavailable')

  const worker = await createWorker('fra+eng')
  const { data } = await worker.recognize(signedData.signedUrl)
  await worker.terminate()

  const rawText = data.text ?? ''

  await admin
    .from('kyc_reviews')
    .update({ mrz_raw: rawText })
    .eq('user_id', userId)
    .eq('status', 'PENDING')

  return rawText
}
