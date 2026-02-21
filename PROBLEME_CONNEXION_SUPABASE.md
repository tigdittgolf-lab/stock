# 🔌 Problème de Connexion Supabase

## 📊 Situation

✅ **MySQL**: Connexion réussie
❌ **Supabase**: Erreur de connexion DNS

## 🐛 Erreur

```
Error: getaddrinfo ENOTFOUND szgodrjglbpzkrksnroi.supabase.co
```

**Signification**: Le serveur Node.js ne peut pas résoudre le nom de domaine Supabase.

## 🔍 Causes Possibles

1. **Problème réseau temporaire**
2. **Pare-feu bloquant les connexions sortantes**
3. **DNS ne résout pas le domaine**
4. **Proxy réseau**
5. **VPN actif qui bloque**

## 🧪 Tests de Diagnostic

### Test 1: Ping Supabase
```bash
ping szgodrjglbpzkrksnroi.supabase.co
```

**Résultat attendu**: Réponses avec adresse IP

### Test 2: Curl Supabase
```bash
curl https://szgodrjglbpzkrksnroi.supabase.co
```

**Résultat attendu**: Réponse HTML ou JSON

### Test 3: Résolution DNS
```bash
nslookup szgodrjglbpzkrksnroi.supabase.co
```

**Résultat attendu**: Adresse IP retournée

### Test 4: Connexion depuis le Navigateur
Ouvrir dans le navigateur:
```
https://szgodrjglbpzkrksnroi.supabase.co
```

**Résultat attendu**: Page Supabase ou erreur 404 (mais pas erreur DNS)

## 🔧 Solutions

### Solution 1: Vérifier la Connexion Internet
```bash
# Tester la connexion générale
ping google.com

# Tester Supabase
ping szgodrjglbpzkrksnroi.supabase.co
```

### Solution 2: Désactiver VPN/Proxy
Si tu utilises un VPN ou proxy:
1. Désactiver temporairement
2. Relancer le serveur
3. Retester la migration

### Solution 3: Vider le Cache DNS
```bash
# Windows
ipconfig /flushdns

# Puis relancer le serveur
```

### Solution 4: Utiliser un DNS Public
Configurer DNS public (Google ou Cloudflare):
- Google DNS: 8.8.8.8 et 8.8.4.4
- Cloudflare DNS: 1.1.1.1 et 1.0.0.1

### Solution 5: Vérifier le Pare-feu
```bash
# Windows Firewall
# Vérifier que Node.js peut faire des connexions sortantes HTTPS
```

### Solution 6: Attendre et Réessayer
Parfois c'est un problème temporaire:
1. Attendre 1-2 minutes
2. Relancer la migration
3. Vérifier si ça fonctionne

## 🎯 Test Rapide

### Depuis PowerShell
```powershell
# Test de résolution DNS
Resolve-DnsName szgodrjglbpzkrksnroi.supabase.co

# Test de connexion
Test-NetConnection szgodrjglbpzkrksnroi.supabase.co -Port 443
```

### Depuis le Navigateur
1. Ouvrir: https://szgodrjglbpzkrksnroi.supabase.co
2. Si ça charge: Le problème est spécifique à Node.js
3. Si ça ne charge pas: Problème réseau général

## 📝 Diagnostic Complet

### Étape 1: Tester depuis le Navigateur
- [ ] Ouvrir https://szgodrjglbpzkrksnroi.supabase.co
- [ ] Noter si ça charge ou erreur

### Étape 2: Tester depuis PowerShell
```powershell
# Test DNS
Resolve-DnsName szgodrjglbpzkrksnroi.supabase.co

# Test connexion
Test-NetConnection szgodrjglbpzkrksnroi.supabase.co -Port 443
```

### Étape 3: Vérifier VPN/Proxy
- [ ] VPN actif? Si oui, désactiver
- [ ] Proxy configuré? Si oui, vérifier config

### Étape 4: Vider Cache DNS
```bash
ipconfig /flushdns
```

### Étape 5: Relancer le Serveur
```bash
# Arrêter le serveur (Ctrl+C)
# Relancer
npm run dev
```

### Étape 6: Retester la Migration
1. Ouvrir http://localhost:3001/admin/database-migration
2. Sélectionner 2009_bu02
3. Cliquer "Migrer"

## 🎉 Si Ça Fonctionne Depuis le Navigateur

Si Supabase est accessible depuis le navigateur mais pas depuis Node.js, c'est probablement:
1. **Pare-feu** bloquant Node.js
2. **Proxy** configuré dans le navigateur mais pas dans Node.js
3. **VPN** qui route différemment

### Solution: Variables d'Environnement Proxy
Si tu utilises un proxy, ajouter dans `.env.local`:
```
HTTP_PROXY=http://proxy.example.com:8080
HTTPS_PROXY=http://proxy.example.com:8080
```

## 📞 Prochaines Étapes

1. **Tester** depuis le navigateur: https://szgodrjglbpzkrksnroi.supabase.co
2. **Tester** depuis PowerShell: `Test-NetConnection szgodrjglbpzkrksnroi.supabase.co -Port 443`
3. **Partager** les résultats des tests

---

**Note**: Le problème n'est PAS dans le code de migration. C'est un problème réseau/DNS qui empêche Node.js de contacter Supabase.
