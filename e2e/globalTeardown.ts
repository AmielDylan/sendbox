import * as dotenv from 'dotenv'
import * as path from 'path'
import { createE2EAdminClient } from './helpers/supabase-admin'
import { PERSONAS } from './globalSetup'

dotenv.config({ path: path.resolve(__dirname, '../.env.test') })

export default async function globalTeardown() {
  const supabase = createE2EAdminClient()

  const { data: users } = await supabase.auth.admin.listUsers()
  const testEmails: string[] = Object.values(PERSONAS).map(p => p.email)

  for (const user of users?.users ?? []) {
    if (user.email && testEmails.includes(user.email)) {
      await supabase.auth.admin.deleteUser(user.id)
    }
  }

  console.log('\n🧹 E2E test users cleaned up\n')
}
