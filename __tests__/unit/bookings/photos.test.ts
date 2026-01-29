import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  validatePackagePhoto,
  generatePackagePhotoFileName,
  MAX_FILE_SIZE,
  MAX_PHOTOS,
  ACCEPTED_TYPES,
} from '@/lib/core/bookings/photos'

/**
 * Tests pour les utilitaires de gestion des photos de colis
 */
describe('Package Photos Utilities', () => {
  describe('validatePackagePhoto', () => {
    describe('Validation du type de fichier', () => {
      it('accepte les fichiers JPEG', () => {
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
        const result = validatePackagePhoto(file)

        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it('accepte les fichiers PNG', () => {
        const file = new File(['test'], 'test.png', { type: 'image/png' })
        const result = validatePackagePhoto(file)

        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it('accepte les fichiers WebP', () => {
        const file = new File(['test'], 'test.webp', { type: 'image/webp' })
        const result = validatePackagePhoto(file)

        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it('rejette les fichiers GIF', () => {
        const file = new File(['test'], 'test.gif', { type: 'image/gif' })
        const result = validatePackagePhoto(file)

        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/format non supporté/i)
      })

      it('rejette les fichiers SVG', () => {
        const file = new File(['test'], 'test.svg', { type: 'image/svg+xml' })
        const result = validatePackagePhoto(file)

        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/format non supporté/i)
      })

      it('rejette les fichiers BMP', () => {
        const file = new File(['test'], 'test.bmp', { type: 'image/bmp' })
        const result = validatePackagePhoto(file)

        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/format non supporté/i)
      })

      it('rejette les fichiers PDF', () => {
        const file = new File(['test'], 'test.pdf', {
          type: 'application/pdf',
        })
        const result = validatePackagePhoto(file)

        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/format non supporté/i)
      })

      it('rejette les fichiers texte', () => {
        const file = new File(['test'], 'test.txt', { type: 'text/plain' })
        const result = validatePackagePhoto(file)

        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/format non supporté/i)
      })
    })

    describe('Validation de la taille du fichier', () => {
      it('accepte un fichier de 1 MB', () => {
        const content = new Uint8Array(1_000_000) // 1 MB
        const file = new File([content], 'test.jpg', { type: 'image/jpeg' })
        const result = validatePackagePhoto(file)

        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it('accepte un fichier de 4.9 MB (juste en dessous de la limite)', () => {
        const content = new Uint8Array(4_900_000) // 4.9 MB
        const file = new File([content], 'test.jpg', { type: 'image/jpeg' })
        const result = validatePackagePhoto(file)

        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it('accepte un fichier exactement de 5 MB', () => {
        const content = new Uint8Array(MAX_FILE_SIZE) // Exactly 5 MB
        const file = new File([content], 'test.jpg', { type: 'image/jpeg' })
        const result = validatePackagePhoto(file)

        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it('rejette un fichier de 5.1 MB (au-dessus de la limite)', () => {
        const content = new Uint8Array(5_100_000) // 5.1 MB
        const file = new File([content], 'test.jpg', { type: 'image/jpeg' })
        const result = validatePackagePhoto(file)

        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/trop volumineux/i)
        expect(result.error).toMatch(/5 MB/i)
      })

      it('rejette un fichier de 10 MB', () => {
        const content = new Uint8Array(10_000_000) // 10 MB
        const file = new File([content], 'test.jpg', { type: 'image/jpeg' })
        const result = validatePackagePhoto(file)

        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/trop volumineux/i)
      })

      it('accepte un fichier très petit (1 KB)', () => {
        const content = new Uint8Array(1_000) // 1 KB
        const file = new File([content], 'test.jpg', { type: 'image/jpeg' })
        const result = validatePackagePhoto(file)

        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it('accepte un fichier vide (0 bytes)', () => {
        const file = new File([], 'test.jpg', { type: 'image/jpeg' })
        const result = validatePackagePhoto(file)

        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })

    describe('Validation combinée type + taille', () => {
      it('rejette un fichier valide en taille mais invalide en type', () => {
        const content = new Uint8Array(1_000_000) // 1 MB
        const file = new File([content], 'test.gif', { type: 'image/gif' })
        const result = validatePackagePhoto(file)

        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/format non supporté/i)
      })

      it('rejette un fichier valide en type mais invalide en taille', () => {
        const content = new Uint8Array(10_000_000) // 10 MB
        const file = new File([content], 'test.jpg', { type: 'image/jpeg' })
        const result = validatePackagePhoto(file)

        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error).toMatch(/trop volumineux/i)
      })

      it('rejette un fichier invalide en type ET en taille', () => {
        const content = new Uint8Array(10_000_000) // 10 MB
        const file = new File([content], 'test.gif', { type: 'image/gif' })
        const result = validatePackagePhoto(file)

        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
        // Le premier critère vérifié est le type
        expect(result.error).toMatch(/format non supporté/i)
      })
    })
  })

  describe('generatePackagePhotoFileName', () => {
    beforeEach(() => {
      // Mock Date.now() pour avoir des noms de fichiers prévisibles
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T10:30:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('génère un nom de fichier au format correct', () => {
      const bookingId = 'booking-123'
      const index = 0
      const fileName = generatePackagePhotoFileName(bookingId, index)

      expect(fileName).toMatch(/^booking-123\/photo_0_\d+\.jpg$/)
    })

    it('inclut le bookingId dans le chemin', () => {
      const bookingId = 'booking-abc-xyz'
      const fileName = generatePackagePhotoFileName(bookingId, 0)

      expect(fileName).toContain('booking-abc-xyz/')
    })

    it("inclut l'index dans le nom", () => {
      const fileName1 = generatePackagePhotoFileName('booking-123', 0)
      const fileName2 = generatePackagePhotoFileName('booking-123', 1)
      const fileName3 = generatePackagePhotoFileName('booking-123', 2)

      expect(fileName1).toContain('photo_0_')
      expect(fileName2).toContain('photo_1_')
      expect(fileName3).toContain('photo_2_')
    })

    it('inclut un timestamp', () => {
      const fileName = generatePackagePhotoFileName('booking-123', 0)
      const expectedTimestamp = Date.now()

      expect(fileName).toContain(`${expectedTimestamp}`)
    })

    it('se termine par .jpg', () => {
      const fileName = generatePackagePhotoFileName('booking-123', 0)

      expect(fileName.endsWith('.jpg')).toBe(true)
    })

    it('génère des noms différents pour le même booking (timestamps différents)', () => {
      const fileName1 = generatePackagePhotoFileName('booking-123', 0)

      // Avancer le temps de 1 seconde
      vi.advanceTimersByTime(1000)

      const fileName2 = generatePackagePhotoFileName('booking-123', 0)

      expect(fileName1).not.toBe(fileName2)
    })

    it('génère des noms différents pour différents bookings', () => {
      const fileName1 = generatePackagePhotoFileName('booking-123', 0)
      const fileName2 = generatePackagePhotoFileName('booking-456', 0)

      expect(fileName1).not.toBe(fileName2)
      expect(fileName1).toContain('booking-123/')
      expect(fileName2).toContain('booking-456/')
    })

    it('gère des bookingId avec des caractères spéciaux', () => {
      const bookingId = 'booking-123-abc-xyz_test'
      const fileName = generatePackagePhotoFileName(bookingId, 0)

      expect(fileName).toContain('booking-123-abc-xyz_test/')
    })

    it('gère des index élevés', () => {
      const fileName = generatePackagePhotoFileName('booking-123', 99)

      expect(fileName).toContain('photo_99_')
    })

    it('suit le format complet attendu', () => {
      const bookingId = 'test-booking'
      const index = 2
      const fileName = generatePackagePhotoFileName(bookingId, index)

      // Format attendu: {bookingId}/photo_{index}_{timestamp}.jpg
      const pattern = new RegExp(`^${bookingId}/photo_${index}_\\d+\\.jpg$`)
      expect(fileName).toMatch(pattern)
    })
  })

  describe('Constantes exportées', () => {
    it('MAX_FILE_SIZE est 5 MB', () => {
      expect(MAX_FILE_SIZE).toBe(5_000_000)
    })

    it('MAX_PHOTOS est 5', () => {
      expect(MAX_PHOTOS).toBe(5)
    })

    it('ACCEPTED_TYPES contient les 3 types supportés', () => {
      expect(ACCEPTED_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp'])
      expect(ACCEPTED_TYPES).toHaveLength(3)
    })

    it('ACCEPTED_TYPES ne contient pas de types non supportés', () => {
      expect(ACCEPTED_TYPES).not.toContain('image/gif')
      expect(ACCEPTED_TYPES).not.toContain('image/svg+xml')
      expect(ACCEPTED_TYPES).not.toContain('image/bmp')
      expect(ACCEPTED_TYPES).not.toContain('application/pdf')
    })
  })
})
