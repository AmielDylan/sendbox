# 🔐 Explications: Tokens et Identifiants Vercel

## Qu'est-ce que Vercel ?

**Vercel** est une plateforme de déploiement cloud pour les applications Next.js. C'est comme un service d'hébergement automatisé qui détecte tes changements Git et déploie ton app.

## 🎯 À quoi servent les trois éléments ?

### 1️⃣ **VERCEL_TOKEN** (Token d'authentification)

**Qu'est-ce que c'est ?**
- Un mot de passe sécurisé qui permet à GitHub Actions de se connecter à Vercel
- C'est comme une clé qui donne accès à ton compte Vercel

**À quoi ça sert ?**
```
GitHub Actions → (utilise VERCEL_TOKEN) → Vercel
       ↓                                      ↓
  "Je veux deployer"     ← s'authentifie →  "OK, vérifié!"
```

**Analogie:**
- Imagine que Vercel est une banque
- `VERCEL_TOKEN` = ta carte bancaire
- GitHub Actions l'utilise pour dire "c'est moi, je suis autorisé"

**Où le trouver ?**
```
https://vercel.com/account/tokens
→ Create Token
→ Copier la valeur
```

---

### 2️⃣ **VERCEL_ORG_ID** (ID de l'organisation)

**Qu'est-ce que c'est ?**
- L'identifiant unique de TON COMPTE/ORGANISATION sur Vercel
- C'est comme un numéro de client

**À quoi ça sert ?**
- Dire à GitHub Actions : "Déploie dans CETTE organisation Vercel"
- Si tu avais plusieurs comptes, ça indiquerait lequel utiliser

**Analogie:**
- Imagine une banque avec plusieurs succursales
- `VERCEL_ORG_ID` = le numéro de ta succursale préférée

**Format:**
```
Exemple: AbCdEfGhIjKlMnOpQrStUvWxYz123456
```

---

### 3️⃣ **VERCEL_PROJECT_ID** (ID du projet)

**Qu'est-ce que c'est ?**
- L'identifiant unique de TON PROJET dans Vercel
- Chaque app a son propre ID

**À quoi ça sert ?**
- Dire à GitHub Actions : "Déploie DANS CE PROJET spécifique"
- Si tu avais plusieurs apps, ça indiquerait laquelle deployer

**Analogie:**
- Imagine une banque avec plusieurs comptes
- `VERCEL_PROJECT_ID` = le numéro de ton compte courant

**Format:**
```
Exemple: prj_1a2b3c4d5e6f7g8h9i0j
```

---

## 🔗 Comment ça fonctionne ensemble ?

```
GitHub Actions (déploiement)
    ↓
1. Utilise VERCEL_TOKEN pour s'authentifier
   ✓ "Je suis un utilisateur autorisé"
    ↓
2. Utilise VERCEL_ORG_ID pour identifier l'organisation
   ✓ "Je veux accéder à CETTE organisation"
    ↓
3. Utilise VERCEL_PROJECT_ID pour identifier le projet
   ✓ "Je veux déployer dans CE projet"
    ↓
4. Vercel fait le déploiement
   ✓ Construit → teste → déploie l'app
    ↓
5. Succès !
```

## 📝 Exemple réel

**Avec les bonnes valeurs:**
```bash
# Dans le workflow deploy.yml
- name: Deploy to Vercel
  run: npx vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

# Ça signifie:
# "Déploie en production en utilisant:
#  - Mon token pour l'authentification (VERCEL_TOKEN)
#  - Mon organisation (VERCEL_ORG_ID)
#  - Mon projet Sendbox (VERCEL_PROJECT_ID)"
```

## 🔒 Sécurité

### ⚠️ IMPORTANT

- **VERCEL_TOKEN** = Super secret ! Ne le partage JAMAIS
- C'est comme un mot de passe
- GitHub le stocke chiffré dans les secrets
- Il n'est jamais visible dans les logs

**Bonne pratique:**
```
❌ MAUVAIS: Mettre le token dans le code
✅ BON:    Utiliser ${{ secrets.VERCEL_TOKEN }}
```

## 🔍 Où trouver les valeurs ?

### Méthode 1: Vercel CLI (Recommandé)

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Aller dans le projet
cd /Users/amieladjovi/Documents/Projets/Developpement/Projets/sendbox

# Lier le projet à Vercel
vercel link

# Les IDs s'affichent et se sauvegardent dans .vercel/project.json
```

### Méthode 2: Dashboard Vercel

1. Aller à https://vercel.com/dashboard
2. Cliquer sur ton projet "sendbox"
3. Aller à **Settings > General**
4. Copier l'**Org ID**
5. Copier le **Project ID**

### Méthode 3: Fichier .vercel/project.json

Après `vercel link`, ce fichier contient:
```json
{
  "projectId": "prj_xxxxx",
  "orgId": "team_xxxxx"
}
```

## 📋 Checklist

- [ ] J'ai un token Vercel (VERCEL_TOKEN)
- [ ] Je connais mon org ID (VERCEL_ORG_ID)
- [ ] Je connais mon project ID (VERCEL_PROJECT_ID)
- [ ] J'ai ajouté les 3 secrets à GitHub
- [ ] Les secrets ne sont visibles que dans les actions sécurisées

## ❓ Questions courantes

**Q: Puis-je partager mon token avec une autre personne ?**
A: Non ! Chaque personne devrait avoir son propre token.

**Q: Que se passe-t-il si quelqu'un utilise mon token ?**
A: Il pourrait déployer sur mes projets et accéder mes données. Régénère le token immédiatement!

**Q: Comment régénérer mon token si je l'ai perdu ?**
A: Aller à https://vercel.com/account/tokens et créer un nouveau.

**Q: Pourquoi 3 valeurs et pas juste une ?**
A: Sécurité et flexibilité :
- Token = authentification (qui es-tu ?)
- OrgID = organisation (quel compte ?)
- ProjectID = projet spécifique (quelle app ?)

C'est plus granulaire et sécurisé.

**Q: L'org ID et project ID sont-ils secrets ?**
A: Non, ce sont juste des identifiants publics. Mais c'est mieux de les garder privés quand même.

---

## 🚀 Prochaines étapes

1. Récupérer les 3 valeurs (voir "Où trouver")
2. Aller à GitHub Settings > Secrets
3. Ajouter les 3 secrets
4. Le déploiement automatique fonctionnera !
