# Documentation KYC - Sendbox

Système de vérification d'identité (Know Your Customer) pour Sendbox.

## 📋 Vue d'ensemble

Le système KYC permet de vérifier l'identité des utilisateurs avant qu'ils ne puissent créer des annonces ou effectuer des réservations. Il comprend :

- Upload sécurisé de documents d'identité
- Validation et compression automatique
- Review par les administrateurs
- Notifications par email

## 🔐 Sécurité

### Upload Sécurisé

- **Validation magic bytes** : Vérification du type réel de fichier (pas seulement l'extension)
- **Compression automatique** : Images > 2 MB compressées avec Sharp
- **Suppression EXIF** : Métadonnées supprimées pour protéger la vie privée
- **URLs signées** : Accès aux documents via URLs temporaires (24h)
- **RLS Policies** : Accès restreint selon les rôles

### Validation

- **Côté client** : Validation Zod avec react-hook-form
- **Côté serveur** : Validation Zod dans Server Actions
- **Types de fichiers** : JPEG, PNG, PDF uniquement
- **Taille maximale** : 5 MB par fichier

## 📁 Structure

```
lib/
├── validations/
│   └── kyc.ts              # Schémas Zod pour KYC
├── actions/
│   └── kyc.ts              # Server Actions (upload, review)
└── utils/
    └── file-upload.ts      # Utilitaires compression/validation

app/
├── (dashboard)/
│   └── reglages/
│       └── kyc/
│           └── page.tsx    # Page utilisateur KYC
└── admin/
    └── kyc/
        └── page.tsx        # Page admin review
```

## 🚀 Configuration

### 1. Créer le bucket Supabase Storage

```sql
-- Exécuter dans Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
);
```

### 2. Appliquer les migrations

```bash
# Appliquer la migration KYC
supabase db push --linked
```

### 3. Configurer les RLS Policies

Les policies sont définies dans `supabase/migrations/002_kyc_storage.sql`.

## 📝 Utilisation

### Pour les utilisateurs

1. Accéder à `/dashboard/reglages/kyc`
2. Remplir le formulaire KYC
3. Uploader les documents (recto + verso si CNI)
4. Soumettre la demande
5. Attendre la validation (24-48h)

### Pour les admins

1. Accéder à `/admin/kyc`
2. Voir la liste des KYC en attente
3. Visualiser les documents (URLs signées)
4. Approuver ou rejeter avec raison

## 🔄 Workflow

```
Utilisateur soumet KYC
    ↓
Documents uploadés → Storage Supabase
    ↓
Profil mis à jour (kyc_status = 'pending')
    ↓
Email notification envoyé
    ↓
Admin review
    ↓
Approuvé → kyc_status = 'approved'
Rejeté → kyc_status = 'rejected' + raison
    ↓
Email notification envoyé
```

## 📧 Notifications Email

Les emails suivants doivent être configurés dans Supabase :

1. **KYC soumis** : "Votre demande KYC a été reçue et sera examinée sous 24-48h"
2. **KYC approuvé** : "Votre KYC a été approuvé. Vous pouvez maintenant créer des annonces"
3. **KYC rejeté** : "Votre KYC a été rejeté : [raison]. Veuillez soumettre une nouvelle demande"

## 🛠️ API

### Server Actions

```typescript
// Soumettre un KYC
await submitKYC(formData: FormData)

// Récupérer le statut KYC
await getKYCStatus()

// Review KYC (admin)
await reviewKYC({ profileId, action: 'approve' | 'reject', rejectionReason? })

// Récupérer les KYC en attente (admin)
await getPendingKYC()

// Générer URL signée pour document (admin)
await getKYCDocumentUrl(filePath: string)
```

## 🔍 Validation des Fichiers

### Magic Bytes

Les fichiers sont validés via leurs magic bytes :

- **JPEG** : `FF D8 FF`
- **PNG** : `89 50 4E 47 0D 0A 1A 0A`
- **PDF** : `25 50 44 46` (%PDF)

### Compression

- Images > 2 MB sont automatiquement compressées
- Qualité JPEG : 85% → 50% (progressive)
- Métadonnées EXIF supprimées
- PDF non compressés (retournés tel quel)

## 📊 Schéma Base de Données

Colonnes ajoutées à `profiles` :

- `kyc_document_type` : 'passport' | 'national_id'
- `kyc_document_number` : string
- `kyc_document_front` : string (chemin storage)
- `kyc_document_back` : string (chemin storage, optionnel)
- `kyc_birthday` : timestamp
- `kyc_nationality` : string (code ISO)
- `kyc_address` : string
- `kyc_submitted_at` : timestamp
- `kyc_reviewed_at` : timestamp
- `kyc_rejection_reason` : string

## ⚠️ Notes Importantes

1. **Bucket Storage** : Doit être créé manuellement dans Supabase Dashboard
2. **RLS Policies** : Vérifiez que les policies sont correctement appliquées
3. **Rôle Admin** : À implémenter dans la table profiles pour sécuriser `/admin/kyc`
4. **Emails** : Configuration requise dans Supabase Auth → Email Templates
5. **Scan Antivirus** : Optionnel, peut être ajouté via VirusTotal API ou ClamAV

## 🔗 Ressources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Zod Validation](https://zod.dev/)








