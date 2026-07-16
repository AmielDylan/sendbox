import { http, HttpResponse } from 'msw'

const mockStorageStore = {
  objects: new Map<string, any>(),
}

export const storageHandlers = [
  http.post(/\/storage\/v1\/object\/[^/]+\/.+$/, async ({ request }) => {
    const url = new URL(request.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const bucketIndex = parts.findIndex(part => part === 'object') + 1
    const bucket = parts[bucketIndex]
    const objectPath = parts.slice(bucketIndex + 1).join('/')
    const id = `${bucket}/${objectPath}`

    mockStorageStore.objects.set(id, {
      id,
      bucket,
      path: objectPath,
      created_at: new Date().toISOString(),
      content_type: request.headers.get('content-type'),
    })

    return HttpResponse.json(
      {
        Id: id,
        Key: id,
        id,
        path: objectPath,
        fullPath: id,
      },
      { status: 200 }
    )
  }),
]

export function resetMockStorageStore() {
  mockStorageStore.objects.clear()
}
