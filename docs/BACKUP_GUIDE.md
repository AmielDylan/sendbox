# Guide de Sauvegarde et Restauration Supabase

Ce guide explique comment faire des backups avant d'exécuter des scripts destructifs comme `clean-database.ts`.

## 🔒 Sauvegarder la base de données

### Option 1: Backup via Supabase Dashboard (Recommandé)

1. Aller sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionner votre projet
3. Aller dans **Database** → **Backups**
4. Cliquer sur **Create backup**
5. Attendre la fin de la création du backup

**Avantages**:
- ✅ Inclut toutes les tables et données
- ✅ Point-in-time recovery disponible
- ✅ Restauration en 1 clic
- ✅ Backups automatiques quotidiens (sur plans payants)

**Limites**:
- ⚠️ Les backups manuels peuvent être limités selon votre plan
- ⚠️ Pas disponible pour la base de données locale

### Option 2: Export SQL via pg_dump

Si vous avez accès direct à la base de données PostgreSQL:

```bash
# Récupérer la chaîne de connexion depuis Supabase Dashboard
# Settings → Database → Connection string (Direct connection)

# Sauvegarder toute la base
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres" > backup-full-$(date +%Y%m%d-%H%M%S).sql

# Sauvegarder uniquement le schéma public
pg_dump -n public "postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres" > backup-public-$(date +%Y%m%d-%H%M%S).sql

# Sauvegarder uniquement les données (sans schéma)
pg_dump --data-only "postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres" > backup-data-$(date +%Y%m%d-%H%M%S).sql
```

### Option 3: Export via Supabase CLI

```bash
# Installer Supabase CLI si nécessaire
npm install -g supabase

# Se connecter
supabase login

# Créer un backup
supabase db dump -f backup-$(date +%Y%m%d-%H%M%S).sql
```

### Option 4: Script TypeScript pour backup rapide

Créer un fichier `scripts/backup-database.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function backupTable(tableName: string) {
  const { data, error } = await supabase.from(tableName).select('*')
  if (error) throw error

  const filename = `backup-${tableName}-${Date.now()}.json`
  fs.writeFileSync(filename, JSON.stringify(data, null, 2))
  console.log(`✅ ${tableName} sauvegardé: ${filename}`)
}

async function main() {
  const tables = ['profiles', 'announcements', 'bookings', 'transactions', 'ratings', 'messages', 'notifications']

  for (const table of tables) {
    await backupTable(table)
  }
}

main()
```

Exécuter:
```bash
npx tsx scripts/backup-database.ts
```

---

## 🔄 Restaurer la base de données

### Restaurer depuis Supabase Dashboard

1. Aller dans **Database** → **Backups**
2. Sélectionner le backup à restaurer
3. Cliquer sur **Restore**
4. Confirmer l'action

⚠️ **Attention**: La restauration écrase toutes les données actuelles.

### Restaurer depuis un fichier SQL

```bash
# Restaurer un backup complet
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres" < backup-full-20260121.sql

# Restaurer uniquement les données
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres" < backup-data-20260121.sql
```

### Restaurer depuis des fichiers JSON

Si vous avez utilisé le script TypeScript de backup:

```typescript
// scripts/restore-database.ts
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function restoreTable(tableName: string, filename: string) {
  const data = JSON.parse(fs.readFileSync(filename, 'utf-8'))

  for (const row of data) {
    const { error } = await supabase.from(tableName).insert(row)
    if (error) {
      console.error(`❌ Erreur lors de l'insertion dans ${tableName}:`, error)
    }
  }

  console.log(`✅ ${tableName} restauré depuis ${filename}`)
}

// Usage: npx tsx scripts/restore-database.ts backup-announcements-1234567890.json announcements
const [filename, tableName] = process.argv.slice(2)
restoreTable(tableName, filename)
```

---

## 📦 Sauvegarder le Storage

### Télécharger tous les fichiers d'un bucket

```typescript
// scripts/backup-storage.ts
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function backupBucket(bucketName: string) {
  const backupDir = `storage-backup/${bucketName}`
  fs.mkdirSync(backupDir, { recursive: true })

  const { data: files, error } = await supabase.storage.from(bucketName).list()
  if (error) throw error

  for (const file of files) {
    const { data, error: downloadError } = await supabase.storage
      .from(bucketName)
      .download(file.name)

    if (downloadError) {
      console.error(`❌ Erreur téléchargement ${file.name}:`, downloadError)
      continue
    }

    const buffer = await data.arrayBuffer()
    fs.writeFileSync(path.join(backupDir, file.name), Buffer.from(buffer))
    console.log(`✅ ${file.name} sauvegardé`)
  }

  console.log(`✅ Bucket ${bucketName} sauvegardé dans ${backupDir}`)
}

const buckets = ['kyc-documents', 'signatures', 'contracts', 'package-proofs']

async function main() {
  for (const bucket of buckets) {
    await backupBucket(bucket)
  }
}

main()
```

---

## ⚠️ Checklist avant nettoyage

Avant d'exécuter `clean-database.ts` ou tout script destructif:

- [ ] ✅ Créer un backup via Supabase Dashboard
- [ ] ✅ Exporter un dump SQL avec `pg_dump`
- [ ] ✅ Tester le script en mode `--dry-run`
- [ ] ✅ Vérifier qu'aucun utilisateur critique ne sera affecté
- [ ] ✅ Informer l'équipe si en production
- [ ] ✅ Avoir testé la procédure de restauration au préalable
- [ ] ✅ Documenter l'opération (raison, date, qui l'a faite)

---

## 🚨 En cas de problème

Si vous avez supprimé des données par erreur:

1. **NE PAS PANIQUER** - Les backups existent pour ça
2. **ARRÊTER IMMÉDIATEMENT** toute opération en cours
3. **NE PAS** exécuter d'autres scripts ou requêtes
4. Restaurer depuis le dernier backup (voir ci-dessus)
5. Vérifier que tout est revenu à la normale
6. Analyser ce qui s'est mal passé pour éviter que ça se reproduise

---

## 📝 Bonnes pratiques

1. **Toujours faire un backup avant une opération destructive**
2. **Tester en développement d'abord**
3. **Utiliser `--dry-run` pour les scripts qui le supportent**
4. **Conserver plusieurs backups** (ne pas supprimer les anciens immédiatement)
5. **Documenter chaque intervention** dans un journal
6. **Planifier les opérations** en dehors des heures de pointe
7. **Avoir un plan de rollback** avant de commencer

---

## 🔗 Liens utiles

- [Documentation Supabase Backups](https://supabase.com/docs/guides/platform/backups)
- [pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
