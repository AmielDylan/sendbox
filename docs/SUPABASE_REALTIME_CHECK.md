# Vérification Supabase Realtime

## 🔍 Étapes pour vérifier que Realtime est activé

### 1. Aller dans le Dashboard Supabase

https://supabase.com/dashboard/project/VOTRE_PROJECT_ID

### 2. Vérifier que Realtime est activé globalement

- Aller dans **Settings** → **API**
- Chercher la section **Realtime**
- Vérifier que Realtime est **activé**

### 3. Vérifier que la table `profiles` a Realtime activé

- Aller dans **Database** → **Replication**
- Chercher la table `profiles`
- Vérifier que **Realtime** est activé pour cette table (coché)

### 4. Si Realtime n'est pas activé sur `profiles`

1. Aller dans **Database** → **Replication**
2. Trouver la ligne `profiles`
3. Activer le toggle **Realtime**
4. Publier les changements (bouton en bas)

---

## 🧪 Test Rapide

### Dans la console navigateur (F12) sur la page KYC

Vous devriez voir ces logs au chargement de la page :

```
🔔 Subscribing to KYC updates for user: xxx-xxx-xxx
📡 Realtime subscription status: SUBSCRIBED
```

Si vous voyez `CHANNEL_ERROR` ou rien du tout, Realtime n'est pas activé.

### Après avoir lancé le script `set-kyc-status.ts`

Vous devriez voir :

```
🔔 Realtime UPDATE received: { new: {...}, old: {...} }
📊 New KYC status: approved
```

---

## 🔧 SQL pour activer Realtime manuellement

Si le toggle ne fonctionne pas, exécutez cette requête SQL dans **SQL Editor** :

```sql
-- Activer Realtime pour la table profiles
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
```

Pour vérifier que c'est bien activé :

```sql
-- Lister les tables avec Realtime activé
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

Vous devriez voir `profiles` dans la liste.

---

## 🚨 Problèmes Courants

### 1. Realtime ne se connecte pas

**Symptôme** : Statut `CHANNEL_ERROR` ou `CLOSED`

**Solution** :
- Vérifier que la table `profiles` a Realtime activé
- Vérifier les RLS policies (doivent autoriser SELECT pour l'utilisateur)

### 2. Realtime se connecte mais ne reçoit rien

**Symptôme** : `SUBSCRIBED` mais pas de `UPDATE received`

**Causes possibles** :
- Les RLS policies bloquent les changements
- Le filtre `id=eq.${user.id}` ne matche pas
- La mise à jour ne touche pas réellement la table

**Solution** :
```sql
-- Vérifier les RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Vérifier que la mise à jour fonctionne
UPDATE profiles SET kyc_status = 'approved' WHERE id = 'VOTRE_USER_ID';
```

### 3. Realtime fonctionne mais l'UI ne se met pas à jour

**Symptôme** : Logs OK mais le badge ne change pas

**Solution** : Vérifier les hooks React
- Le `setState` est bien appelé dans le callback
- Pas de condition qui empêche le re-render

---

## ✅ Checklist de Diagnostic

- [ ] Realtime activé dans **Settings** → **API**
- [ ] Table `profiles` visible dans **Database** → **Replication**
- [ ] Toggle Realtime activé pour `profiles`
- [ ] Logs `SUBSCRIBED` dans la console navigateur
- [ ] Logs `UPDATE received` après changement du statut
- [ ] RLS policies autorisent SELECT pour l'utilisateur connecté
- [ ] Badge se met à jour automatiquement sans rafraîchir

---

**Note** : Si Realtime fonctionne en développement mais pas en production, vérifiez que le plan Supabase inclut Realtime (disponible dans tous les plans, y compris gratuit).
