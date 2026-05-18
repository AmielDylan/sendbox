import { serve } from 'std/http/server.ts'
import { decode } from 'https://deno.land/x/imagescript@1.2.15/mod.ts'
import { createOCREngine } from 'npm:tesseract-wasm'
import { parse } from 'npm:mrz'

const JSON_HEADERS = { 'content-type': 'application/json' }

function isServiceRole(authHeader: string | null): boolean {
  if (!authHeader?.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role === 'service_role'
  } catch {
    return false
  }
}

// Module-level cache — persists across warm invocations
let wasmCache: Uint8Array | null = null
let modelCache: Uint8Array | null = null

async function loadAssets(): Promise<{ wasm: Uint8Array; model: Uint8Array }> {
  if (!wasmCache) {
    const r = await fetch(
      'https://unpkg.com/tesseract-wasm@0.11.0/dist/tesseract-core.wasm'
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

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  if (!isServiceRole(req.headers.get('Authorization'))) {
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

  let rawText: string
  try {
    // 1. Fetch image
    const imgResp = await fetch(signedUrl)
    if (!imgResp.ok) return jsonResponse({ error: 'Failed to fetch image', status: imgResp.status }, 502)
    const imgBuffer = new Uint8Array(await imgResp.arrayBuffer())

    // 2. Decode + crop bottom 30%
    const img = await decode(imgBuffer)
    const cropY = Math.floor(img.height * 0.55)
    const cropH = img.height - cropY
    // @ts-ignore — imagescript Frame has crop()
    const cropped = img.crop(0, cropY, img.width, cropH)

    // 3. imagescript.bitmap is already a Uint8ClampedArray in RGBA order
    // @ts-ignore — bitmap is a public property on imagescript Image
    const imageData = { data: cropped.bitmap as Uint8ClampedArray, width: cropped.width, height: cropped.height }

    // 4. OCR
    const { wasm, model } = await loadAssets()
    const engine = await createOCREngine({ wasmBinary: wasm })
    await engine.loadModel(model)
    engine.loadImage(imageData)
    engine.setVariable('tessedit_char_whitelist', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<')
    engine.setVariable('tessedit_pageseg_mode', '6')
    rawText = engine.getText()
    engine.clearImage()
    engine.destroy()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[kyc-ocr] processing error:', msg)
    return jsonResponse({ error: 'Processing failed', detail: msg }, 500)
  }

  // 5. Detect MRZ lines
  const isPassport = documentType === 'PASSPORT'
  const expectedLen = isPassport ? 44 : 30
  const expectedCount = isPassport ? 2 : 3

  const lines = rawText
    .split('\n')
    .map(l => {
      let line = l.trim().toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9<]/g, '')
      // Pad with < if slightly short — OCR often truncates trailing fill chars
      if (line.length >= expectedLen - 6 && line.length < expectedLen) {
        line = line.padEnd(expectedLen, '<')
      }
      return line
    })
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
