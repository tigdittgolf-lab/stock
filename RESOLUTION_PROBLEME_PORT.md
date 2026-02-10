# ✅ PROBLÈME RÉSOLU: Port MySQL 3306 vs 3307

**Date:** 10 février 2026  
**Problème:** phpMyAdmin montrait 0 paiements, mais les données existaient

---

## 🔍 CAUSE DU PROBLÈME

**Vous aviez 2 serveurs MySQL:**

| Port | Serveur | Paiements | Utilisé par |
|------|---------|-----------|-------------|
| **3306** | MySQL standalone | 0 | phpMyAdmin (avant) |
| **3307** | WAMP MySQL | 6 | Application + Migration |

**Résultat:** Confusion totale! Les données étaient sur le port 3307, mais phpMyAdmin regardait le port 3306.

---

## ✅ SOLUTION APPLIQUÉE

### 1. Script exécuté ✅
```powershell
.\fix-phpmyadmin-port.ps1
```

**Ce qui a été fait:**
- ✅ Fichier modifié: `C:\wamp64\apps\phpmyadmin4.9.7\config.inc.php`
- ✅ Port changé: 3306 → 3307
- ✅ Sauvegarde créée: `config.inc.php.backup_20260210_134608`

### 2. Prochaines étapes

#### Étape 1: Redémarrer WAMP
1. **Clic droit** sur l'icône WAMP (barre des tâches)
2. **Restart All Services**
3. Attendre que WAMP soit vert

#### Étape 2: Ouvrir phpMyAdmin
```
http://localhost/phpmyadmin
```

#### Étape 3: Vérifier les données
1. Sélectionner la base **stock_management**
2. Cliquer sur la table **payments**
3. **Vous devriez voir 6 paiements!** ✅

---

## 📊 VÉRIFICATION DES DONNÉES

### Les 6 paiements dans MySQL (port 3307):

| ID | Document | Montant | Date | Notes |
|----|----------|---------|------|-------|
| 1 | BL 5 | 100.00 DA | 2026-02-08 | Note p1 |
| 2 | BL 5 | 200.00 DA | 2026-02-07 | note p2 |
| 3 | BL 3 | 4000.00 DA | 2026-02-08 | note 2 paiement |
| 4 | BL 5 | 500.00 DA | 2026-02-08 | p 500 |
| 5 | BL 5 | 390.00 DA | 2026-02-08 | fin de paiement |
| 6 | BL 3 | 65.17 DA | 2026-02-09 | note 2 payment |

**Total BL 3:** 4065.17 DA  
**Total BL 5:** 1190.00 DA

---

## 🎯 CONFIGURATION FINALE

### Pour l'application web:

Quand vous activerez MySQL dans l'interface:
```
Host:     localhost
Port:     3307  ← IMPORTANT!
Database: stock_management
User:     root
Password: (vide)
```

### Pour phpMyAdmin:

Après redémarrage de WAMP:
- ✅ Se connecte automatiquement au port 3307
- ✅ Affiche les 6 paiements
- ✅ Plus de confusion

---

## 🔧 SI BESOIN DE REVENIR EN ARRIÈRE

La sauvegarde est ici:
```
C:\wamp64\apps\phpmyadmin4.9.7\config.inc.php.backup_20260210_134608
```

Pour restaurer:
```powershell
Copy-Item "C:\wamp64\apps\phpmyadmin4.9.7\config.inc.php.backup_20260210_134608" "C:\wamp64\apps\phpmyadmin4.9.7\config.inc.php" -Force
```

---

## 📚 LEÇON APPRISE

**Toujours vérifier le port MySQL utilisé!**

### Commandes utiles:

**Vérifier le port WAMP:**
```powershell
# Via my.ini
Get-Content "C:\wamp64\bin\mysql\mysql5.7.36\my.ini" | Select-String "port"
```

**Tester les deux ports:**
```powershell
# Port 3306
mysql -u root -P 3306 -e "SELECT COUNT(*) FROM stock_management.payments;"

# Port 3307
mysql -u root -P 3307 -e "SELECT COUNT(*) FROM stock_management.payments;"
```

---

## ✅ CHECKLIST FINALE

- [x] Script exécuté
- [x] Fichier config.inc.php modifié
- [x] Sauvegarde créée
- [ ] WAMP redémarré
- [ ] phpMyAdmin vérifié
- [ ] 6 paiements visibles
- [ ] MySQL activé dans l'application (port 3307)

---

## 🎉 RÉSULTAT ATTENDU

### Avant:
```
phpMyAdmin → port 3306 → 0 paiements ❌
Application → Supabase → 6 paiements (cloud)
Confusion totale!
```

### Après:
```
phpMyAdmin → port 3307 → 6 paiements ✅
Application → MySQL (port 3307) → 6 paiements ✅
Tout synchronisé!
```

---

**Redémarrez WAMP maintenant et vérifiez phpMyAdmin!** 🚀
