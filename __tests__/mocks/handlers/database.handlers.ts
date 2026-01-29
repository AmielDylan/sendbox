import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'

/**
 * MSW Handlers pour mocker Supabase Database (REST API)
 * Ces handlers interceptent les appels CRUD vers les tables Supabase
 */

// Store en mémoire pour simuler la base de données pendant les tests
const mockDatabase = {
  profiles: new Map<string, any>(),
  announcements: new Map<string, any>(),
  bookings: new Map<string, any>(),
  messages: new Map<string, any>(),
  notifications: new Map<string, any>(),
  ratings: new Map<string, any>(),
  transactions: new Map<string, any>(),
}

export const databaseHandlers = [
  // GET - Select queries (tous les tables)
  http.get('*/rest/v1/:table', async ({ params, request }) => {
    const table = params.table as string
    const url = new URL(request.url)
    const select = url.searchParams.get('select')

    // Récupérer toutes les données de la table
    let data = Array.from(mockDatabase[table as keyof typeof mockDatabase]?.values() || [])

    // Filtrer selon les query params (support basique de .eq())
    // Supabase envoie des filtres comme: ?id=eq.value ou ?status=eq.active
    url.searchParams.forEach((value, key) => {
      if (key !== 'select' && value.startsWith('eq.')) {
        const filterValue = value.substring(3) // Enlever 'eq.'
        data = data.filter((row: any) => String(row[key]) === filterValue)
      }
    })

    // Retourner les données
    return HttpResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Range': `0-${data.length - 1}/${data.length}`,
      },
    })
  }),

  // POST - Insert
  http.post('*/rest/v1/:table', async ({ params, request }) => {
    const table = params.table as string
    const body = (await request.json()) as any

    // Générer un ID si pas présent
    const id = body.id || faker.string.uuid()
    const newRecord = {
      ...body,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Stocker dans le mock database
    mockDatabase[table as keyof typeof mockDatabase]?.set(id, newRecord)

    return HttpResponse.json([newRecord], {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        Location: `/${table}?id=eq.${id}`,
      },
    })
  }),

  // PATCH - Update
  http.patch('*/rest/v1/:table', async ({ params, request }) => {
    const table = params.table as string
    const url = new URL(request.url)
    const body = (await request.json()) as any

    // Extraire l'ID du query string (ex: ?id=eq.xxx)
    const idParam = url.searchParams.get('id')
    const id = idParam?.replace('eq.', '')

    if (!id) {
      return HttpResponse.json(
        { error: 'ID required for update' },
        { status: 400 }
      )
    }

    const store = mockDatabase[table as keyof typeof mockDatabase]
    const existingRecord = store?.get(id)

    if (!existingRecord) {
      return HttpResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      )
    }

    const updatedRecord = {
      ...existingRecord,
      ...body,
      updated_at: new Date().toISOString(),
    }

    store?.set(id, updatedRecord)

    return HttpResponse.json([updatedRecord], {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }),

  // DELETE
  http.delete('*/rest/v1/:table', async ({ params, request }) => {
    const table = params.table as string
    const url = new URL(request.url)

    // Extraire l'ID du query string
    const idParam = url.searchParams.get('id')
    const id = idParam?.replace('eq.', '')

    if (!id) {
      return HttpResponse.json(
        { error: 'ID required for delete' },
        { status: 400 }
      )
    }

    const store = mockDatabase[table as keyof typeof mockDatabase]
    store?.delete(id)

    return HttpResponse.json({}, {
      status: 204,
    })
  }),

  // RPC - Remote Procedure Calls (fonctions Supabase)
  http.post('*/rest/v1/rpc/:function', async ({ params, request }) => {
    const functionName = params.function as string
    const body = (await request.json()) as any

    // Mocker quelques fonctions courantes
    switch (functionName) {
      case 'increment_views':
        return HttpResponse.json({ success: true }, { status: 200 })

      case 'create_notification':
        const notificationId = faker.string.uuid()
        const notification = {
          id: notificationId,
          ...body,
          created_at: new Date().toISOString(),
        }
        mockDatabase.notifications.set(notificationId, notification)
        return HttpResponse.json(notification, { status: 200 })

      default:
        return HttpResponse.json({ success: true }, { status: 200 })
    }
  }),
]

// Fonction helper pour réinitialiser le mock database entre les tests
export function resetMockDatabase() {
  Object.values(mockDatabase).forEach(store => store.clear())
}

// Fonction helper pour pré-remplir des données de test
export function seedMockDatabase(table: keyof typeof mockDatabase, data: any[]) {
  data.forEach(record => {
    mockDatabase[table].set(record.id, record)
  })
}
