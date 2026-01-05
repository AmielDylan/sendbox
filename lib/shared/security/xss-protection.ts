/**
 * Protection contre les attaques XSS
 */

import DOMPurify from 'isomorphic-dompurify'

/**
 * Nettoie du HTML pour prévenir les attaques XSS
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * Nettoie du texte pour affichage sécurisé
 */
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
}

/**
 * Valide et nettoie une URL
 */
export function sanitizeURL(url: string): string | null {
  try {
    const parsed = new URL(url)
    // Autoriser uniquement HTTP/HTTPS
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

/**
 * Nettoie le contenu pour les messages (escape HTML uniquement)
 * Utilisé côté client ET serveur pour garantir la cohérence
 */
export function sanitizeMessageContent(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
}









