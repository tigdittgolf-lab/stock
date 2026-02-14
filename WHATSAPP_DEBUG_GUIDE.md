# Guide de Débogage WhatsApp

## Problème résolu
Le bouton "Envoyer via WhatsApp" n'envoyait pas le document.

## Solution implémentée
Au lieu d'essayer d'envoyer le PDF directement (nécessite API WhatsApp Business), le système envoie maintenant un **lien de téléchargement** dans le message WhatsApp.

## Comment ça fonctionne maintenant

### 1. Quand vous cliquez sur "📱 Envoyer via WhatsApp"
- Une modale s'ouvre avec les options d'envoi
- Vous pouvez saisir un numéro manuellement (ex: +213674768390)
- Vous pouvez personnaliser le message

### 2. Quand vous cliquez sur "Envoyer"
Le système fait automatiquement:
```javascript
1. Vérifie que le PDF est accessible (test HEAD request)
2. Génère l'URL complète du PDF (ex: http://localhost:3000/api/pdf/delivery-note/8703)
3. Crée un message avec le lien:
   "Voici votre bon de livraison N° 8703
   
   📄 Télécharger le document:
   http://localhost:3000/api/pdf/delivery-note/8703"
4. Nettoie le numéro de téléphone (enlève espaces, tirets)
5. Ajoute +213 si le numéro commence par 0
6. Ouvre WhatsApp avec: https://wa.me/213674768390?text=...
```

### 3. Dans WhatsApp
- Le message est pré-rempli avec le lien
- Vous cliquez sur "Envoyer"
- Le destinataire reçoit le lien
- Il clique sur le lien pour télécharger le PDF

## Logs de débogage

Ouvrez la console du navigateur (F12) pour voir:
```
🚀 Starting WhatsApp send process...
📊 Document info: { documentType: 'bl', documentId: 8703, documentNumber: 8703 }
📄 Full PDF URL: http://localhost:3000/api/pdf/delivery-note/8703
⏳ Testing PDF accessibility...
✅ PDF is accessible
📝 Full message: Voici votre bon de livraison N° 8703...
📱 Opening WhatsApp for 1 contact(s)
📞 Processing phone: +213674768390 → +213674768390
🔗 WhatsApp URL: https://wa.me/213674768390?text=...
✅ WhatsApp window opened for +213674768390
```

## Tests à effectuer

### Test 1: Vérifier que le PDF est accessible
```bash
# Dans le navigateur, ouvrez:
http://localhost:3000/api/pdf/delivery-note/8703

# Vous devriez voir le PDF s'afficher
```

### Test 2: Tester le bouton WhatsApp
1. Allez sur la liste des BL
2. Cliquez sur "📱 Envoyer via WhatsApp" pour un BL
3. Saisissez votre numéro: +213674768390
4. Cliquez sur "Envoyer"
5. Vérifiez dans la console:
   - ✅ PDF is accessible
   - ✅ WhatsApp window opened

### Test 3: Vérifier le message WhatsApp
1. WhatsApp devrait s'ouvrir automatiquement
2. Le message devrait contenir:
   - Votre texte personnalisé
   - Le lien vers le PDF
3. Cliquez sur "Envoyer"
4. Le destinataire reçoit le lien

## Problèmes possibles

### ❌ "PDF not accessible"
**Cause**: Le backend n'est pas démarré ou le PDF n'existe pas
**Solution**: 
```bash
cd backend
bun run dev
```

### ❌ "Popup blocked"
**Cause**: Le navigateur bloque les popups
**Solution**: Autorisez les popups pour localhost:3000

### ❌ "Invalid phone number"
**Cause**: Format de numéro incorrect
**Solution**: Utilisez le format international: +213674768390

### ❌ Le lien ne fonctionne pas pour le destinataire
**Cause**: Le lien pointe vers localhost (pas accessible depuis l'extérieur)
**Solution**: 
- En développement: Le destinataire doit être sur le même réseau local
- En production: Le lien pointera vers votre domaine public

## Améliorations futures

### Option 1: Hébergement public du PDF
- Uploader le PDF sur un service cloud (S3, Cloudinary)
- Générer un lien public temporaire (expire après 24h)
- Envoyer ce lien dans WhatsApp

### Option 2: API WhatsApp Business
- Configurer WhatsApp Business API
- Envoyer le PDF directement comme pièce jointe
- Nécessite:
  - Compte WhatsApp Business
  - Numéro de téléphone dédié
  - Configuration dans .env:
    ```
    WHATSAPP_BUSINESS_ACCOUNT_ID=...
    WHATSAPP_PHONE_NUMBER_ID=...
    WHATSAPP_ACCESS_TOKEN=...
    ```

## Fichiers modifiés

1. **frontend/components/PrintOptions.tsx**
   - Fonction `handleSendWhatsApp()` complètement réécrite
   - Ajout de logs de débogage détaillés
   - Vérification de l'accessibilité du PDF
   - Génération du lien complet avec window.location.origin
   - Nettoyage automatique des numéros de téléphone
   - Ajout automatique de +213 pour les numéros algériens

2. **backend/src/routes/whatsapp.ts**
   - Génération du vrai PDF au lieu du placeholder
   - Support pour BL, Factures et Proformas
   - Meilleurs logs d'erreur

## Support

Si le problème persiste:
1. Vérifiez les logs dans la console (F12)
2. Vérifiez que le backend est démarré
3. Testez l'URL du PDF directement dans le navigateur
4. Vérifiez le format du numéro de téléphone
