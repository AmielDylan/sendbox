# Statuts des Annonces - Documentation

## 🎯 Statuts Possibles

Une annonce peut avoir **5 statuts différents**:

### 1. `active` (Actif)
- ✅ Annonce publiée et visible
- ✅ Espace disponible > 0 kg
- ✅ Aucune réservation active OU réservations partielles avec espace restant
- ✅ Peut recevoir de nouvelles demandes de réservation

**Exemple:**
```
Capacité: 10 kg
Réservations actives: 0 kg
→ Statut: active
```

### 2. `partially_booked` (Partiellement réservé)
- ✅ Annonce avec au moins 1 réservation active
- ✅ Espace disponible > 0 kg
- ✅ Peut encore recevoir des demandes (jusqu'à épuisement)

**Exemple:**
```
Capacité: 10 kg
Réservations actives: 6 kg (3 kg + 3 kg)
Espace restant: 4 kg
→ Statut: partially_booked
```

### 3. `fully_booked` (Complet)
- ❌ Plus d'espace disponible (0 kg restant)
- ❌ Ne peut plus recevoir de demandes
- ✅ Toutes les réservations sont confirmées/payées

**Exemple:**
```
Capacité: 10 kg
Réservations actives: 10 kg (5 kg + 3 kg + 2 kg)
Espace restant: 0 kg
→ Statut: fully_booked
```

### 4. `cancelled` (Annulé)
- ❌ Annonce annulée par le voyageur
- ❌ N'apparaît plus dans les recherches
- ❌ Les réservations existantes sont automatiquement annulées

**⚠️ IMPORTANT:** Ce statut est **MANUEL uniquement**
- Seul le voyageur peut annuler son annonce
- Une annonce ne passe JAMAIS à `cancelled` automatiquement

### 5. `completed` (Terminé)
- ✅ Voyage terminé (date de départ passée)
- ✅ Peut être marqué manuellement ou automatiquement
- ℹ️ Conservé pour historique

---

## 🔄 Changements de Statut Automatiques

Le trigger `update_announcement_status()` met à jour le statut automatiquement:

### Après création/modification d'une réservation:

```sql
-- Compte uniquement les réservations ACTIVES
reserved_kg = SUM(kilos_requested) WHERE status IN (
  'accepted',
  'paid',
  'deposited',
  'in_transit',
  'delivered'
)

remaining_kg = available_kg - reserved_kg

-- Calcul du statut
IF remaining_kg <= 0 THEN
  status = 'fully_booked'
ELSIF remaining_kg < available_kg THEN
  status = 'partially_booked'
ELSE
  status = 'active'
END
```

### ⚠️ Statuts de réservation NON comptés:
- `pending` - Demande pas encore acceptée
- `cancelled` - Réservation annulée/refusée

---

## 📊 Exemples de Scénarios

### Scénario 1: Nouvelle demande acceptée
```
État initial:
- Annonce: 10 kg, status='active'
- Réservations: aucune

Action: Voyageur accepte une demande de 3 kg
Résultat:
- reserved_kg = 3 kg
- remaining_kg = 7 kg
- status = 'partially_booked'
```

### Scénario 2: Réservation annulée
```
État initial:
- Annonce: 10 kg, status='partially_booked'
- Réservation 1: 3 kg (paid)
- Réservation 2: 5 kg (paid)
- reserved_kg = 8 kg

Action: Réservation 1 annulée
Résultat:
- reserved_kg = 5 kg (seule Réservation 2 comptée)
- remaining_kg = 5 kg
- status = 'partially_booked'
```

### Scénario 3: Toutes les réservations annulées
```
État initial:
- Annonce: 10 kg, status='partially_booked'
- Réservation 1: 3 kg (paid)
- Réservation 2: 5 kg (paid)

Action: Les 2 réservations sont annulées
Résultat:
- reserved_kg = 0 kg
- remaining_kg = 10 kg
- status = 'active' ✅ (redevient active!)
```

### Scénario 4: Annonce complète puis annulation
```
État initial:
- Annonce: 10 kg, status='fully_booked'
- Réservation 1: 6 kg (paid)
- Réservation 2: 4 kg (paid)

Action: Réservation 2 annulée
Résultat:
- reserved_kg = 6 kg
- remaining_kg = 4 kg
- status = 'partially_booked' ✅ (redevient disponible!)
```

---

## 🐛 Problèmes Possibles

### "Mon annonce est annulée alors qu'elle a encore de l'espace"

**Causes possibles:**
1. ❌ Le voyageur a manuellement annulé l'annonce
2. ❌ Bug dans l'application qui appelle incorrectement l'update
3. ✅ Vérifier les logs: `SELECT * FROM announcements WHERE id = 'xxx'`

**Ce qui ne devrait JAMAIS arriver:**
- Une annonce passe à `cancelled` automatiquement
- Une annonce reste `fully_booked` après annulation de réservations

### "Ma réservation est annulée mais l'annonce reste fully_booked"

**Solution:**
Le trigger se déclenche après UPDATE du statut de la réservation.
Si le statut reste bloqué, exécuter manuellement:
```sql
-- Forcer le recalcul
UPDATE announcements
SET reserved_kg = (
  SELECT COALESCE(SUM(kilos_requested), 0)
  FROM bookings
  WHERE announcement_id = announcements.id
    AND status IN ('accepted', 'paid', 'deposited', 'in_transit', 'delivered')
)
WHERE id = 'announcement-id';

-- Le trigger update_announcement_status se déclenchera
-- sur la prochaine modification de booking
```

---

## 🔍 Vérification et Debug

### Voir l'état actuel d'une annonce:
```sql
SELECT
  id,
  status,
  available_kg,
  reserved_kg,
  available_kg - reserved_kg AS remaining_kg
FROM announcements
WHERE id = 'xxx';
```

### Voir toutes les réservations d'une annonce:
```sql
SELECT
  id,
  status,
  kilos_requested,
  created_at
FROM bookings
WHERE announcement_id = 'xxx'
ORDER BY created_at DESC;
```

### Compter manuellement le poids réservé:
```sql
SELECT
  a.id,
  a.available_kg,
  a.reserved_kg AS db_reserved_kg,
  COALESCE(SUM(b.kilos_requested), 0) AS calculated_reserved_kg,
  a.available_kg - COALESCE(SUM(b.kilos_requested), 0) AS calculated_remaining_kg
FROM announcements a
LEFT JOIN bookings b ON b.announcement_id = a.id
  AND b.status IN ('accepted', 'paid', 'deposited', 'in_transit', 'delivered')
WHERE a.id = 'xxx'
GROUP BY a.id;
```

Si `db_reserved_kg` ≠ `calculated_reserved_kg`, le trigger n'a pas été déclenché correctement.

---

## ✅ Résumé

1. **Une annonce ne devient JAMAIS `cancelled` automatiquement**
2. **Les réservations annulées ne comptent PAS dans le poids réservé**
3. **Une annonce redevient `active` si toutes ses réservations sont annulées**
4. **Le trigger se déclenche après chaque INSERT/UPDATE de booking**
5. **Seuls les statuts actifs sont comptés** (accepted, paid, deposited, in_transit, delivered)
