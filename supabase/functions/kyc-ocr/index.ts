import { serve } from 'std/http/server.ts'
import { decode } from 'https://deno.land/x/imagescript@1.2.15/mod.ts'
import { createOCREngine } from 'npm:tesseract-wasm'
import { parse } from 'npm:mrz'

const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const JSON_HEADERS = { 'content-type': 'application/json' }

// Module-level cache — persists across warm invocations
let wasmCache: Uint8Array | null = null
let modelCache: Uint8Array | null = null

async function loadAssets(): Promise<{ wasm: Uint8Array; model: Uint8Array }> {
  if (!wasmCache) {
    const r = await fetch(
      'https://cdn.jsdelivr.net/npm/tesseract-wasm/dist/tesseract-core-fast.wasm'
    )
    wasmCache = new Uint8Array(await r.arrayBuffer())
  }
  if (!modelCache) {
    const r = await fetch(
      'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/eng.traineddata'
    )
    modelCache = new Uint8Array(await r.arrayBuffer())
  }
  return { wasm: wasmCache, model: modelCache }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS })
}

serve(async req => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token || !SERVICE_ROLE_KEY || token !== SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  let signedUrl: string
  let documentType: string
  try {
    ;({ signedUrl, documentType } = await req.json())
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }
  if (!signedUrl || !documentType) {
    return jsonResponse({ error: 'Missing signedUrl or documentType' }, 400)
  }

  // 1. Fetch image
  const imgResp = await fetch(signedUrl)
  if (!imgResp.ok) return jsonResponse({ error: 'Failed to fetch image' }, 502)
  const imgBuffer = new Uint8Array(await imgResp.arrayBuffer())

  // 2. Decode + crop bottom 30%
  const img = await decode(imgBuffer)
  const cropY = Math.floor(img.height * 0.7)
  const cropH = img.height - cropY
  // @ts-ignore — imagescript Frame has crop()
  const cropped = img.crop(0, cropY, img.width, cropH)

  // 3. Convert imagescript RGBA pixels (32-bit ints) to Uint8ClampedArray
  const rgba = new Uint8ClampedArray(cropped.width * cropped.height * 4)
  let i = 0
  for (const px of cropped) {
    rgba[i++] = (px >> 24) & 0xff
    rgba[i++] = (px >> 16) & 0xff
    rgba[i++] = (px >> 8) & 0xff
    rgba[i++] = px & 0xff
  }
  const imageData = { data: rgba, width: cropped.width, height: cropped.height }

  // 4. OCR
  const { wasm, model } = await loadAssets()
  const engine = await createOCREngine({ wasmBinary: wasm })
  await engine.loadModel(model)
  engine.loadImage(imageData)
  engine.setVariable('tessedit_char_whitelist', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<')
  engine.setVariable('tessedit_pageseg_mode', '6')
  const rawText: string = engine.getText()
  engine.clearImage()
  engine.destroy()

  // 5. Detect MRZ lines
  const isPassport = documentType === 'PASSPORT'
  const expectedLen = isPassport ? 44 : 30
  const expectedCount = isPassport ? 2 : 3

  const lines = rawText
    .split('\n')
    .map(l => l.trim().replace(/\s+/g, ''))
    .filter(l => l.length === expectedLen && /^[A-Z0-9<]+$/.test(l))

  if (lines.length < expectedCount) {
    return jsonResponse({ detected: false })
  }

  // 6. Parse MRZ
  try {
    const result = parse(lines.slice(0, expectedCount))
    return jsonResponse({
      detected: true,
      valid: true,
      fields: {
        firstName: result.fields.firstName ?? null,
        lastName: result.fields.lastName ?? null,
        nationality: result.fields.nationality ?? null,
        birthDate: result.fields.birthDate ?? null,
        expiryDate: result.fields.expiryDate ?? null,
        documentNumber: result.fields.documentNumber ?? null,
      },
    })
  } catch {
    return jsonResponse({ detected: true, valid: false })
  }
})
