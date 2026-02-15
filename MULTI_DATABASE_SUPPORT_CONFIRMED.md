# Support Multi-Base de Données - Confirmé ✅

## Architecture

L'application supporte **3 types de bases de données** de manière transparente:
- **Supabase** (PostgreSQL hébergé)
- **PostgreSQL** (local ou distant)
- **MySQL** (local ou distant)

## Comment ça fonctionne

### 1. DatabaseRouter (`backend/src/services/databaseRouter.ts`)
Interface unifiée qui remplace `supabaseAdmin` dans tout le code.

**Méthodes disponibles:**
- `.rpc(functionName, params)` - Appelle des fonctions stockées
- `.from(table)` - Opérations CRUD (SELECT, INSERT, UPDATE, DELETE)
- `.execSql(sql)` - Exécution SQL directe

### 2. DatabaseService (`backend/src/services/databaseService.ts`)
Service qui gère les connexions et exécute les requêtes selon le type de base active.

**Méthodes clés:**
- `switchDatabase(config)` - Change de base de données
- `getActiveDatabaseType()` - Retourne 'mysql' | 'postgresql' | 'supabase'
- `executeQuery(sql, params)` - Exécute une requête SQL
- `executeRPC(functionName, params)` - Exécute une fonction/procédure

### 3. Routes (`backend/src/routes/sales.ts`, etc.)
Utilisent `databaseRouter` au lieu de `supabaseAdmin` directement.

## Modifications pour les tables bachat/fachat

Les routes suivantes ont été adaptées pour fonctionner avec la structure MySQL actuelle:

### GET /api/sales/purchases/delivery-notes
- Récupère les BL d'achat depuis `bachat`
- Enrichit avec les détails de `bachat_detail`
- Ajoute les infos fournisseur et article

### POST /api/sales/purchases/delivery-notes
- Crée un BL dans `bachat` (nfact en varchar)
- Crée les détails dans `bachat_detail` (avec nfournisseur)
- Met à jour `stock_bl` dans la table `article`

### POST /api/sales/purchases/invoices
- Crée une facture dans `fachat` (nfact en varchar)
- Crée les détails dans `fachat_detail` (tout en varchar)
- Met à jour `stock_f` dans la table `article`

### POST /api/sales/purchases/convert-bl/:id
- Convertit un BL en facture
- Transfère le stock de `stock_bl` vers `stock_f`

## Structure des tables MySQL

### bachat (Bons de Livraison Achat)
```sql
nfact        varchar(20)  -- Numéro du BL
date_fact    date         -- Date du BL
nfournisseur varchar(10)  -- Fournisseur
montant_ht   double(12,2) -- Montant HT
tva          double(12,2) -- TVA
timbre       double(12,2) -- Timbre
autre_taxe   double(12,2) -- Autres taxes
ncheque      varchar(20)  -- Numéro chèque
banque       varchar(20)  -- Banque
```

### bachat_detail (Détails BL Achat)
```sql
NFact        varchar(10)  -- Référence BL
nfournisseur varchar(10)  -- Fournisseur (clé composite)
Narticle     varchar(10)  -- Article
Qte          varchar(10)  -- Quantité (varchar!)
tva          varchar(10)  -- TVA (varchar!)
prix         varchar(10)  -- Prix (varchar!)
total_ligne  varchar(10)  -- Total (varchar!)
```

### fachat (Factures Achat)
```sql
nfact        varchar(20)  -- Numéro facture
date_fact    date         -- Date facture
nfournisseur varchar(10)  -- Fournisseur
montant_ht   double(12,2) -- Montant HT
tva          double(12,2) -- TVA
timbre       double(12,2) -- Timbre
autre_taxe   double(12,2) -- Autres taxes
ncheque      varchar(20)  -- Numéro chèque
banque       varchar(20)  -- Banque
```

### fachat_detail (Détails Facture Achat)
```sql
NFact        varchar(10)  -- Référence facture
nfournisseur varchar(10)  -- Fournisseur (clé composite)
Narticle     varchar(10)  -- Article
Qte          varchar(10)  -- Quantité (varchar!)
tva          varchar(10)  -- TVA (varchar!)
prix         varchar(10)  -- Prix (varchar!)
total_ligne  varchar(10)  -- Total (varchar!)
```

## Changement de base de données

Pour changer de base de données, l'utilisateur peut:

1. **Via l'interface** (si implémentée):
   - Sélectionner le type de base
   - Entrer les paramètres de connexion
   - Cliquer sur "Changer"

2. **Via configuration**:
   ```typescript
   await backendDatabaseService.switchDatabase({
     type: 'mysql',
     name: 'MySQL Local',
     host: 'localhost',
     port: 3306,
     database: 'stock_management',
     username: 'root',
     password: ''
   });
   ```

3. **Via variables d'environnement**:
   ```env
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_DATABASE=stock_management
   MYSQL_USER=root
   MYSQL_PASSWORD=
   ```

## Avantages de cette architecture

✅ **Flexibilité** - Change de base sans modifier le code
✅ **Compatibilité** - Même API pour toutes les bases
✅ **Migration facile** - Passe de MySQL à PostgreSQL ou Supabase
✅ **Développement** - Teste localement avec MySQL, déploie sur Supabase
✅ **Performance** - Utilise les fonctionnalités natives de chaque base

## Conclusion

L'application respecte bien l'idée initiale de pouvoir changer de base de données à tout moment. Le `databaseRouter` agit comme une couche d'abstraction qui traduit les appels en requêtes spécifiques à chaque type de base de données.
