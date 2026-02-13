# Correction - Création d'Utilisateur Manager avec Business Unit

## Problème Identifié

Lors de la création d'un utilisateur avec le rôle "manager", aucune Business Unit n'était disponible dans la liste déroulante, rendant impossible la création de ce type d'utilisateur.

### Causes Racines

1. **Endpoint manquant** : Aucun endpoint API pour lister les tenants (business units) disponibles
2. **Rôle manager absent** : Le formulaire ne proposait que "Utilisateur" et "Administrateur"
3. **Champs manquants** : Pas de champs pour sélectionner la Business Unit et l'Exercice
4. **Pas de chargement** : Aucun appel API pour récupérer les business units

## Solutions Appliquées

### 1. Backend - Nouvel Endpoint (`backend/src/routes/database.ts`)

Ajout de l'endpoint `GET /api/database/tenants/list` :

```typescript
database.get('/tenants/list', async (c) => {
  // Pour Supabase : utilise RPC list_available_tenants
  // Pour MySQL/PostgreSQL : requête sur information_schema
  // Retourne : { success: true, data: [{ business_unit, year, schema }] }
});
```

**Fonctionnalités** :
- ✅ Support Supabase (via RPC)
- ✅ Support MySQL (via information_schema)
- ✅ Support PostgreSQL (via information_schema)
- ✅ Filtre automatique des schémas au format `YYYY_buXX`
- ✅ Tri par ordre décroissant (plus récent en premier)

### 2. Frontend - Formulaire Amélioré (`frontend/app/users/page.tsx`)

#### A. Ajout du Rôle Manager

```typescript
<select value={formData.role} onChange={...}>
  <option value="user">Utilisateur</option>
  <option value="manager">Manager</option>  // ✅ NOUVEAU
  <option value="admin">Administrateur</option>
</select>
```

#### B. Champs Conditionnels pour Manager

```typescript
{formData.role === 'manager' && (
  <>
    <div className={styles.formGroup}>
      <label>Business Unit *</label>
      {businessUnits.length === 0 ? (
        // Message d'avertissement si aucune BU
      ) : (
        <select value={formData.business_unit}>
          {businessUnits.map(bu => (
            <option value={bu.business_unit}>
              {bu.business_unit.toUpperCase()} - {bu.year}
            </option>
          ))}
        </select>
      )}
    </div>
    
    <div className={styles.formGroup}>
      <label>Exercice *</label>
      <select value={formData.year}>
        {Array.from(new Set(businessUnits.map(bu => bu.year))).map(year => (
          <option value={year}>{year}</option>
        ))}
      </select>
    </div>
  </>
)}
```

#### C. Chargement des Business Units

```typescript
const loadBusinessUnits = async () => {
  const response = await fetch(getApiUrl('database/tenants/list'));
  const data = await response.json();
  
  if (data.success && data.data) {
    setBusinessUnits(data.data);
    // Sélection automatique de la première BU
  }
};
```

#### D. État du Formulaire Étendu

```typescript
const [formData, setFormData] = useState({
  email: '',
  password: '',
  nom: '',
  role: 'user',
  business_unit: '',  // ✅ NOUVEAU
  year: new Date().getFullYear()  // ✅ NOUVEAU
});
```

#### E. Affichage Amélioré dans le Tableau

```typescript
<td>
  <span style={{ /* Badge coloré selon le rôle */ }}>
    {role === 'admin' ? '👨‍💼 Admin' : 
     role === 'manager' ? '👔 Manager' : 
     '👤 User'}
  </span>
  {role === 'manager' && business_unit && (
    <div style={{ fontSize: '11px' }}>
      {business_unit.toUpperCase()} - {year}
    </div>
  )}
</td>
```

#### F. Validation du Bouton

```typescript
<button 
  type="submit"
  disabled={formData.role === 'manager' && businessUnits.length === 0}
  style={{
    opacity: formData.role === 'manager' && businessUnits.length === 0 ? 0.5 : 1,
    cursor: formData.role === 'manager' && businessUnits.length === 0 ? 'not-allowed' : 'pointer'
  }}
>
  Créer
</button>
```

## Message d'Avertissement

Si aucune Business Unit n'est disponible, un message clair s'affiche :

```
⚠️ Aucune Business Unit disponible

Vous devez d'abord créer une Business Unit et un exercice 
depuis le dashboard.
```

## Flux de Création d'un Manager

1. **Admin ouvre** la page Gestion des Utilisateurs
2. **Clique** sur "Ajouter un Utilisateur"
3. **Remplit** : Email, Mot de passe, Nom
4. **Sélectionne** le rôle "Manager"
5. **Les champs apparaissent** : Business Unit et Exercice
6. **Sélectionne** la BU et l'exercice souhaités
7. **Clique** sur "Créer"
8. **L'utilisateur est créé** avec les métadonnées :
   ```json
   {
     "nom": "...",
     "role": "manager",
     "business_unit": "bu02",
     "year": 2025
   }
   ```

## Prérequis

Pour créer un utilisateur manager, il faut :
1. ✅ Avoir au moins une Business Unit créée (ex: `2025_bu01`, `2025_bu02`)
2. ✅ Être connecté en tant qu'administrateur
3. ✅ Utiliser MySQL, PostgreSQL ou Supabase

## Test

### 1. Vérifier les Business Units Disponibles

```bash
# MySQL
SELECT SCHEMA_NAME FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME REGEXP '^[0-9]{4}_bu[0-9]{2}$';

# PostgreSQL
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name ~ '^[0-9]{4}_bu[0-9]{2}$';
```

### 2. Tester l'Endpoint

```bash
curl http://localhost:8787/api/database/tenants/list
```

Réponse attendue :
```json
{
  "success": true,
  "data": [
    {
      "business_unit": "bu02",
      "year": 2025,
      "schema": "2025_bu02"
    },
    {
      "business_unit": "bu01",
      "year": 2025,
      "schema": "2025_bu01"
    }
  ],
  "source": "mysql"
}
```

### 3. Créer un Manager

1. Aller sur `/users`
2. Cliquer "Ajouter un Utilisateur"
3. Remplir le formulaire avec rôle "Manager"
4. Vérifier que les BU sont listées
5. Créer l'utilisateur

## Fichiers Modifiés

- ✅ `backend/src/routes/database.ts` - Ajout endpoint `/tenants/list`
- ✅ `frontend/app/users/page.tsx` - Formulaire complet avec BU

## Bénéfices

1. **Fonctionnel** : Création de managers maintenant possible
2. **Clair** : Message d'erreur si pas de BU disponible
3. **Flexible** : Support multi-base de données
4. **Visuel** : Affichage des BU dans le tableau
5. **Sécurisé** : Validation côté client et serveur
