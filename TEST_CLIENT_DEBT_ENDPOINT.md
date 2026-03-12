# Test de l'endpoint de dette client

## Modifications effectuées

### 1. Fonctions SQL créées dans Supabase
- `get_clients_simple(p_tenant)` - Liste rapide des clients SANS calcul de dette (évite timeout)
- `get_client_debt(p_tenant, p_client_code)` - Calcul de dette pour UN SEUL client
- `get_clients_by_tenant(p_tenant)` - Alias mis à jour pour utiliser la version simple

### 2. Backend
- Nouvel endpoint: `GET /api/sales/clients/:id/debt`
- Retourne les infos complètes du client avec:
  - CA Factures (`c_affaire_fact`)
  - CA BL (`c_affaire_bl`)
  - CA Total (`chiffre_affaire`)
  - Total factures non payées (`total_factures`)
  - Total BL non payés (`total_bl`)
  - Total paiements (`total_paiements`)
  - Dette/Solde (`solde`)

### 3. Frontend (BL uniquement pour l'instant)
- Modifié `frontend/app/delivery-notes/page.tsx`
- Quand un client est sélectionné, appelle `/api/sales/clients/:id/debt`
- Affiche les infos avec dette dans l'interface

## Test manuel

1. Démarrer le frontend: `cd frontend && npm run dev`
2. Aller sur la page BL: http://localhost:3001/delivery-notes
3. Sélectionner le client 1051 (BELLOUZA BELKACEM)
4. Vérifier que les infos affichées sont:
   - CA Factures: 0.00 DA
   - CA BL: 34022.10 DA
   - CA Total: 34022.10 DA
   - Dette/Reste à Payer: 4.00 DA (11.9 - 5.9 - 2.0)

## Résolution du problème de timeout

Avant:
- `get_clients_by_tenant` appelait `get_clients_with_debt`
- Calculait la dette pour TOUS les 1000 clients
- Timeout après 10 secondes

Après:
- `get_clients_by_tenant` appelle `get_clients_simple` (rapide)
- Calcul de dette uniquement quand on sélectionne un client spécifique
- Pas de timeout

## TODO
- Ajouter la même fonctionnalité aux pages Factures et Proformas
- Tester avec d'autres clients
