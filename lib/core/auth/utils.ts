
/**
 * Utilitaires pour l'authentification
 */

import { createClient } from "@/lib/shared/db/server"
import type { Profile } from '@/types'

/**
 * Récupère l'utilisateur actuel avec son profil
 */
export async function getCurrentUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  // Récupérer le profil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      user,
      profile: null,
    }
  }

  return {
    user,
    profile: profile as Profile,
  }
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export async function isAuthenticated() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return !!user
}

/**
 * Vérifie si l'utilisateur a un profil KYC approuvé
 */
export async function hasApprovedKYC() {
  const currentUser = await getCurrentUser()
  return (currentUser?.profile as any)?.kyc_status === 'approved'
}

/**
 * Redirige vers la page de connexion avec un message de redirection
 */
export function redirectToLogin(redirectPath?: string) {
  const { redirect } = require('next/navigation')
  const path = redirectPath
    ? `/login?redirect=${encodeURIComponent(redirectPath)}`
    : '/login'
  redirect(path)
}



