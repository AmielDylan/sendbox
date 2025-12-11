# Documentation Profil Utilisateur - Sendbox

Gestion du profil utilisateur avec upload d'avatar et modification des informations.

## 📋 Vue d'ensemble

Le système de profil permet aux utilisateurs de :

- Modifier leurs informations personnelles
- Uploader et changer leur photo de profil
- Changer leur mot de passe
- Changer leur email
- Supprimer leur compte

## 🔐 Sécurité

### Upload Avatar

- **Validation côté client** : Format et taille avant upload
- **Traitement côté serveur** : Crop carré centré + resize 200x200px avec Sharp
- **Compression JPEG** : Qualité 90% avec mozjpeg
- **Suppression métadonnées** : EXIF supprimé pour la vie privée
- **Bucket public** : Avatars accessibles publiquement (CDN Supabase)

### Changement de Mot de Passe

- **Vérification mot de passe actuel** : Requis avant changement
- **Validation stricte** : Min 12 caractères avec complexité
- **Rate limiting** : Géré par Supabase Auth

### Changement d'Email

- **Vérification mot de passe** : Requis pour confirmer
- **Email de confirmation** : Envoyé automatiquement par Supabase
- **Vérification requise** : Nouvel email doit être vérifié

### Suppression de Compte

- **Soft delete** : Compte marqué comme banni (pas de hard delete)
- **Double confirmation** : Mot de passe + texte "SUPPRIMER"
- **Déconnexion automatique** : Après suppression

## 📁 Structure

```
lib/
├── validations/
│   └── profile.ts          # Schémas Zod pour profil/compte
├── actions/
│   └── profile.ts          # Server Actions (update, changePassword, etc.)
└── utils/
    └── avatar.ts           # Utilitaires avatar (validation, initiales)

app/
└── (dashboard)/
    └── reglages/
        ├── profil/
        │   └── page.tsx    # Page gestion profil
        └── compte/
            └── page.tsx    # Page gestion compte
```

## 🚀 Configuration

### 1. Créer le bucket Supabase Storage

```sql
-- Exécuter dans Supabase SQL Editor ou via migration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);
```

### 2. Appliquer les migrations

```bash
supabase db push --linked
```

## 📝 Utilisation

### Page Profil (`/dashboard/reglages/profil`)

1. **Vue d'ensemble** : Photo, nom, email, rating, nombre de services
2. **Modification** :
   - Upload photo de profil (crop automatique)
   - Modification nom, prénom, téléphone
   - Modification adresse et bio

### Page Compte (`/dashboard/reglages/compte`)

1. **Changement mot de passe** :
   - Mot de passe actuel requis
   - Nouveau mot de passe avec validation stricte
   - Confirmation

2. **Changement email** :
   - Nouvel email
   - Mot de passe pour confirmer
   - Email de confirmation envoyé

3. **Suppression compte** :
   - Zone de danger
   - Double confirmation (mot de passe + "SUPPRIMER")
   - Soft delete (is_banned)

## 🔄 Workflow Avatar

```
Utilisateur sélectionne image
    ↓
Validation côté client (format, taille)
    ↓
Preview affichée
    ↓
Soumission formulaire
    ↓
Server Action : processAvatar() avec Sharp
    ↓
Crop carré centré + resize 200x200px
    ↓
Upload vers Supabase Storage (bucket avatars)
    ↓
URL publique générée
    ↓
Profil mis à jour avec avatar_url
```

## 🛠️ API

### Server Actions

```typescript
// Mettre à jour le profil
await updateProfile({
  firstname: string,
  lastname: string,
  phone: string,
  address: string,
  bio?: string,
  avatar?: File
})

// Changer le mot de passe
await changePassword({
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
})

// Changer l'email
await changeEmail({
  newEmail: string,
  password: string
})

// Supprimer le compte
await deleteAccount({
  password: string,
  confirmText: 'SUPPRIMER'
})

// Récupérer le profil actuel
await getCurrentProfile()
```

## 📊 Schéma Base de Données

Colonnes dans `profiles` :

- `address` : TEXT (adresse complète)
- `bio` : TEXT (biographie, max 500 caractères)
- `avatar_url` : TEXT (URL publique de l'avatar)

## 🎨 Traitement Avatar

### Spécifications

- **Taille finale** : 200x200px
- **Format** : JPEG (qualité 90%)
- **Crop** : Carré centré automatique
- **Taille max upload** : 2 MB
- **Formats acceptés** : JPEG, PNG, WebP

### Processus

1. Validation format et taille (côté client)
2. Crop carré centré (côté serveur avec Sharp)
3. Resize à 200x200px
4. Conversion JPEG avec compression
5. Suppression métadonnées EXIF
6. Upload vers Supabase Storage

## ⚠️ Notes Importantes

1. **Sharp** : Utilisé uniquement côté serveur dans les Server Actions
2. **Bucket Avatars** : Public pour permettre l'affichage (CDN Supabase)
3. **Soft Delete** : Ajouter colonne `is_banned` dans profiles si nécessaire
4. **Rate Limiting** : Géré par Supabase Auth pour changement password/email
5. **Emails** : Configuration requise dans Supabase Auth pour changement email

## 🔗 Ressources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)



