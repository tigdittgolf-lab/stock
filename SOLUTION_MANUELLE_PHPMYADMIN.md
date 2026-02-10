# 🔧 SOLUTION MANUELLE - phpMyAdmin Port 3307

**Le script automatique n'a pas fonctionné. Voici la solution manuelle (5 minutes).**

---

## 🎯 MÉTHODE 1: Modification manuelle (Recommandé)

### Étape 1: Ouvrir le fichier config

1. **Ouvrir l'Explorateur Windows**
2. **Aller dans:** `C:\wamp64\apps\phpmyadmin5.1.1\`
3. **Clic droit** sur `config.inc.php`
4. **Ouvrir avec** → Notepad++ (ou Bloc-notes)

### Étape 2: Trouver la section serveur

Chercher cette ligne (vers la ligne 30-50):
```php
$cfg['Servers'][$i]['host'] = 'localhost';
```

### Étape 3: Ajouter le port

**JUSTE APRÈS** cette ligne, ajouter:
```php
$cfg['Servers'][$i]['port'] = '3307';
```

**Exemple complet:**
```php
$i++;
$cfg['Servers'][$i]['auth_type'] = 'cookie';
$cfg['Servers'][$i]['host'] = 'localhost';
$cfg['Servers'][$i]['port'] = '3307';  // ← AJOUTER CETTE LIGNE
$cfg['Servers'][$i]['connect_type'] = 'tcp';
$cfg['Servers'][$i]['compress'] = false;
$cfg['Servers'][$i]['AllowNoPassword'] = true;
```

### Étape 4: Sauvegarder

1. **Fichier** → **Enregistrer**
2. **Fermer** l'éditeur

### Étape 5: Redémarrer WAMP

1. **Clic droit** sur WAMP (barre des tâches)
2. **Restart All Services**
3. Attendre que WAMP soit vert

### Étape 6: Tester

1. Ouvrir: http://localhost/phpmyadmin
2. Base: `stock_management`
3. Table: `payments`
4. **Vous devriez voir 6 paiements!** ✅

---

## 🎯 MÉTHODE 2: Connexion manuelle (Alternative)

Si la méthode 1 ne fonctionne pas:

### Dans phpMyAdmin:

1. **Ouvrir** http://localhost/phpmyadmin
2. **Se déconnecter** (si connecté)
3. Sur la page de connexion:
   - **Serveur:** `localhost:3307`
   - **Utilisateur:** `root`
   - **Mot de passe:** (laisser vide)
4. **Connexion**

---

## 🎯 MÉTHODE 3: Utiliser MySQL Workbench (Alternative)

Si phpMyAdmin pose trop de problèmes:

### Télécharger MySQL Workbench:
https://dev.mysql.com/downloads/workbench/

### Connexion:
- **Hostname:** localhost
- **Port:** 3307
- **Username:** root
- **Password:** (vide)

---

## 🎯 MÉTHODE 4: Ligne de commande (Toujours fonctionnel)

Vous pouvez toujours utiliser la ligne de commande:

```powershell
# Voir tous les paiements
C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe -u root -P 3307 -e "SELECT * FROM stock_management.payments;"

# Compter les paiements
C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe -u root -P 3307 -e "SELECT COUNT(*) FROM stock_management.payments;"

# Voir un paiement spécifique
C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe -u root -P 3307 -e "SELECT * FROM stock_management.payments WHERE id = 3;"
```

---

## ✅ VÉRIFICATION FINALE

### Les 6 paiements sont là (port 3307):

```
ID 1: BL 5 - 100.00 DA
ID 2: BL 5 - 200.00 DA
ID 3: BL 3 - 4000.00 DA
ID 4: BL 5 - 500.00 DA
ID 5: BL 5 - 390.00 DA
ID 6: BL 3 - 65.17 DA
```

**Commande de vérification:**
```powershell
C:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe -u root -P 3307 -e "SELECT id, document_id, amount FROM stock_management.payments;"
```

---

## 🎯 POUR L'APPLICATION WEB

Quand vous activerez MySQL dans l'interface:

```
Host:     localhost
Port:     3307  ← IMPORTANT!
Database: stock_management
User:     root
Password: (vide)
```

---

## 📞 SI PROBLÈME PERSISTE

### Vérifier quelle version de phpMyAdmin est active:

1. **Clic droit** sur WAMP
2. **Tools** → **Change phpMyAdmin version**
3. Sélectionner la version (4.9.7 ou 5.1.1)
4. Modifier le `config.inc.php` de cette version

### Ou utiliser directement MySQL en ligne de commande

C'est plus fiable et ça fonctionne toujours!

---

**Essayez la MÉTHODE 1 maintenant!** 🚀

**Fichier à modifier:** `C:\wamp64\apps\phpmyadmin5.1.1\config.inc.php`  
**Ligne à ajouter:** `$cfg['Servers'][$i]['port'] = '3307';`
