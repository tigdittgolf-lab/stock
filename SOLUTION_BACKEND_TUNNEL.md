# Solution: Backend Local avec Tunnel

## 🎯 OBJECTIF
Permettre à l'application Vercel d'accéder aux bases de données locales du client via un tunnel.

## 🔧 ARCHITECTURE

```
Application Web (Vercel) → Tunnel Public → Backend Local → Bases Locales
```

## 📋 ÉTAPES D'IMPLÉMENTATION

### 1. Installer ngrok (ou cloudflared)
```bash
# Option A: ngrok
npm install -g ngrok
# ou télécharger depuis https://ngrok.com/

# Option B: cloudflared (Cloudflare Tunnel)
# Télécharger depuis https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/
```

### 2. Modifier le Backend pour Accepter les Connexions Externes
```javascript
// backend/src/index.js
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app',  // Votre domaine Vercel
    /\.ngrok\.io$/,                 // Tous les domaines ngrok
    /\.trycloudflare\.com$/         // Tous les domaines cloudflare
  ],
  credentials: true
}));
```

### 3. Script de Démarrage avec Tunnel
```bash
# start-with-tunnel.bat
@echo off
echo 🚀 Démarrage du backend avec tunnel...

# Démarrer le backend en arrière-plan
start /B npm run dev

# Attendre que le backend démarre
timeout /t 5

# Créer le tunnel ngrok
ngrok http 3005 --log=stdout
```

### 4. Configuration Dynamique de l'URL Backend
```javascript
// frontend/lib/config.js
export const getBackendUrl = () => {
  // En développement local
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3005';
  }
  
  // En production, utiliser l'URL du tunnel configurée par l'utilisateur
  const tunnelUrl = localStorage.getItem('backend_tunnel_url');
  if (tunnelUrl) {
    return tunnelUrl;
  }
  
  // Fallback vers une variable d'environnement
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';
};
```

### 5. Interface de Configuration du Tunnel
```javascript
// Composant pour configurer l'URL du tunnel
const TunnelConfig = () => {
  const [tunnelUrl, setTunnelUrl] = useState('');
  
  const saveTunnelUrl = () => {
    localStorage.setItem('backend_tunnel_url', tunnelUrl);
    // Tester la connexion
    testConnection(tunnelUrl);
  };
  
  return (
    <div>
      <input 
        placeholder="https://abc123.ngrok.io" 
        value={tunnelUrl}
        onChange={(e) => setTunnelUrl(e.target.value)}
      />
      <button onClick={saveTunnelUrl}>Configurer Tunnel</button>
    </div>
  );
};
```

## 🔄 WORKFLOW CLIENT

1. **Démarrer le backend local** : `npm run dev` (port 3005)
2. **Créer le tunnel** : `ngrok http 3005`
3. **Copier l'URL publique** : `https://abc123.ngrok.io`
4. **Configurer dans l'app web** : Coller l'URL dans l'interface
5. **Utiliser l'application** : Switch entre bases fonctionne

## ✅ AVANTAGES
- ✅ Accès aux bases locales depuis l'app web
- ✅ Sécurité : tunnel temporaire, contrôlé par le client
- ✅ Flexibilité : client peut choisir ses bases
- ✅ Pas de modification majeure du code existant

## ⚠️ CONSIDÉRATIONS
- Tunnel doit être actif pendant l'utilisation
- URL change à chaque redémarrage ngrok (version gratuite)
- Latence réseau supplémentaire