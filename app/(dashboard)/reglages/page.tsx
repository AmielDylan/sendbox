/**
 * Page principale des réglages - Redirige vers le compte
 */

import { redirect } from 'next/navigation'

export default function SettingsPage() {
  redirect('/dashboard/reglages/compte')
}

