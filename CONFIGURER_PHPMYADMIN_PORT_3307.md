# 🔧 CONFIGURER phpMyAdmin POUR LE PORT 3307

**Problème:** phpMyAdmin se connecte au port 3306, mais vos données sont sur le port 3307 (WAMP).

---

## 🎯 SOLUTION RAPIDE

### Étape 1: Localiser le fichier de configuration

Le fichier se trouve ici:
```
C:\wamp64\apps\phpmyadmin5.2.0\config.inc.php
```

**Note:** Le numéro de version peut varier (5.2.0, 5.1.0, etc.)

### Étape 2: Ouvrir le fichier

1. **Clic droit** sur l'icône WAMP (barre des tâches)
2. **phpMyAdmin** → **config.inc.php**

**OU**

Ouvrir avec un éditeur de texte:
```
C:\wamp64\apps\phpmyadmin5.2.0\config.inc.php
```

### Étape 3: Modifier le port

Chercher cette ligne (vers la ligne 30-40):
```php
$cfg['Servers'][$i]['port'] = '3306';
```

**Changer en:**
```php
$cfg['Servers'][$i]['port'] = '3307';
```

### Étape 4: Sauvegarder et redémarrer

1. **Sauvegarder** le fichier
2. **Redémarrer** les services WAMP:
   - Clic droit sur WAMP → **Restart All Services**

### Étape 5: Vérifier

1. Ouvrir phpMyAdmin: http://localhost/phpmyadmin
2. Sélectionner la base **stock_management**
3. Cliquer sur la table **payments**
4. **Vous devriez voir les 6 paiements!** ✅

---

## 🔍 ALTERNATIVE: Vérifier quel port WAMP utilise

### Via l'interface WAMP:

1. **Clic droit** sur WAMP
2. **MySQL** → **Version** → **my.ini**
3. Chercher la ligne `port = `
4. Vous verrez: `port = 3307`

---

## 📊 VÉRIFICATION RAPIDE

### Avant la modification:
```
phpMyAdmin → port 3306 → 0 paiements ❌
```

### Après la modification:
```
phpMyAdmin → port 3307 → 6 paiements ✅
```

---

## 🎯 POURQUOI DEUX PORTS?

WAMP utilise le port **3307** au lieu du port standard **3306** pour éviter les conflits avec:
- Une autre installation MySQL
- Un autre serveur de base de données
- Des services système

**C'est normal et c'est une bonne pratique!**

---

## ✅ APRÈS LA CONFIGURATION

Une fois phpMyAdmin configuré sur le port 3307:

1. ✅ Vous verrez les 6 paiements dans phpMyAdmin
2. ✅ Vous pourrez gérer la base visuellement
3. ✅ Plus de confusion entre les deux serveurs
4. ✅ Tout sera synchronisé

---

## 🔧 SI VOUS NE TROUVEZ PAS LE FICHIER

### Chercher tous les config.inc.php:

```powershell
Get-ChildItem -Path "C:\wamp64" -Filter "config.inc.php" -Recurse -ErrorAction SilentlyContinue | Select-Object FullName
```

### Ou chercher dans:
- `C:\wamp64\apps\phpmyadmin*\config.inc.php`
- `C:\wamp64\alias\phpmyadmin.conf`

---

## 💡 ASTUCE: Connexion directe au bon port

Dans phpMyAdmin, vous pouvez aussi:

1. **Se déconnecter** (si connecté)
2. Sur la page de connexion, cliquer sur **"Serveur"**
3. Entrer manuellement:
   - **Serveur:** localhost:3307
   - **Utilisateur:** root
   - **Mot de passe:** (vide)

---

## 🎉 RÉSULTAT FINAL

Après configuration:

```
┌─────────────────────────────────────┐
│  phpMyAdmin (port 3307)             │
├─────────────────────────────────────┤
│  Base: stock_management             │
│  Table: payments                    │
│  Lignes: 6 ✅                       │
│                                     │
│  - ID 1: BL 5 - 100.00 DA          │
│  - ID 2: BL 5 - 200.00 DA          │
│  - ID 3: BL 3 - 4000.00 DA         │
│  - ID 4: BL 5 - 500.00 DA          │
│  - ID 5: BL 5 - 390.00 DA          │
│  - ID 6: BL 3 - 65.17 DA           │
└─────────────────────────────────────┘
```

---

**Modifiez le fichier config.inc.php maintenant!** 🚀
