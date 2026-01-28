/**
 * Protection contre les attaques XSS
 */

const escapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHTML(value: string): string {
  return value.replace(/[&<>"']/g, char => escapeMap[char] || char)
}

/**
 * Nettoie du HTML pour prévenir les attaques XSS
 */
export function sanitizeHTML(dirty: string): string {
  return escapeHTML(dirty)
}

/**
 * Nettoie du texte pour affichage sécurisé
 */
export function sanitizeText(text: string): string {
  return escapeHTML(text)
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
  return escapeHTML(text).trim()
}
