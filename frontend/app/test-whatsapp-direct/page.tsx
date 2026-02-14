'use client';

export default function TestWhatsAppDirect() {
  
  const testWhatsApp = async () => {
    console.log('═══════════════════════════════════════');
    console.log('🧪 TEST WHATSAPP AVEC UPLOAD TEMPORAIRE');
    console.log('═══════════════════════════════════════');
    
    try {
      // 1. Demander le numéro
      const phone = prompt('Entrez votre numéro WhatsApp (ex: +213792901660):');
      console.log('📞 Numéro saisi:', phone);
      
      if (!phone) {
        console.log('❌ Annulé');
        return;
      }
      
      // 2. Nettoyer le numéro
      let cleanPhone = phone.replace(/[^0-9+]/g, '');
      if (!cleanPhone.startsWith('+')) {
        if (cleanPhone.startsWith('0')) {
          cleanPhone = '+213' + cleanPhone.substring(1);
        } else {
          cleanPhone = '+213' + cleanPhone;
        }
      }
      console.log('✅ Numéro final:', cleanPhone);
      
      // 3. Télécharger le PDF
      console.log('📥 Téléchargement du PDF...');
      const pdfUrl = `/api/pdf/delivery-note/8703`;
      
      try {
        const response = await fetch(pdfUrl);
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`Impossible de télécharger le PDF (erreur ${response.status})`);
        }
        
        const blob = await response.blob();
        console.log('✅ PDF téléchargé:', blob.size, 'bytes, type:', blob.type);
        
        if (blob.size === 0) {
          throw new Error('Le PDF téléchargé est vide');
        }
        
        // 4. Uploader via notre API backend (qui contourne le problème CORS)
        console.log('☁️ Upload du PDF via notre API backend...');
        console.log('⏳ Cela peut prendre quelques secondes...');
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', blob, 'Bon_Livraison_8703.pdf');
        
        try {
          const uploadResponse = await fetch('/api/upload-temp-pdf', {
            method: 'POST',
            body: uploadFormData
          });
          
          console.log('📡 Upload response status:', uploadResponse.status, uploadResponse.statusText);
          
          const uploadData = await uploadResponse.json();
          console.log('📦 Upload data:', uploadData);
          
          if (!uploadResponse.ok || !uploadData.success) {
            throw new Error(uploadData.error || 'Erreur lors de l\'upload');
          }
          
          if (!uploadData.url) {
            throw new Error('URL de téléchargement non reçue');
          }
          
          const publicUrl = uploadData.url;
          console.log('✅ Lien public:', publicUrl);
          console.log('⏰ Ce lien expire dans 1 heure');
          
          // 5. Créer le message WhatsApp avec le lien public
          const message = `Voici votre Bon de Livraison N° 8703

📄 Télécharger le document (lien valide 1h):
${publicUrl}

💡 Cliquez sur le lien pour télécharger le PDF`;
          
          console.log('📝 Message:', message);
          
          // 6. Ouvrir WhatsApp
          const encodedMessage = encodeURIComponent(message);
          const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
          console.log('🔗 WhatsApp URL:', whatsappUrl.substring(0, 100) + '...');
          
          console.log('🚪 Opening WhatsApp...');
          const newWindow = window.open(whatsappUrl, '_blank');
          
          if (newWindow) {
            console.log('✅ SUCCESS!');
            alert(`✅ Succès !

Le document a été uploadé sur un serveur temporaire.

WhatsApp s'est ouvert avec le lien de téléchargement.

⚠️ Important: Le lien expire dans 1 heure.

Le destinataire pourra cliquer sur le lien pour télécharger le PDF.`);
          } else {
            console.error('❌ Popup bloqué');
            alert('❌ Les popups sont bloqués !\n\nAutorisez les popups pour ce site.');
          }
          
        } catch (uploadError) {
          console.error('❌ Upload error:', uploadError);
          throw new Error(`Erreur d'upload: ${uploadError instanceof Error ? uploadError.message : 'Erreur inconnue'}`);
        }
        
      } catch (pdfError) {
        console.error('❌ PDF error:', pdfError);
        throw new Error(`Erreur PDF: ${pdfError instanceof Error ? pdfError.message : 'Erreur inconnue'}`);
      }
      
    } catch (error) {
      console.error('❌ MAIN ERROR:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
      alert(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}\n\nVérifiez la console (F12) pour plus de détails.`);
    }
    
    console.log('═══════════════════════════════════════');
  };
  
  return (
    <div style={{ 
      padding: '40px', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>🧪 Test WhatsApp Direct</h1>
      
      <div style={{
        background: '#fff3cd',
        border: '1px solid #ffc107',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Ouvrez la console du navigateur (F12)</li>
          <li>Cliquez sur le bouton ci-dessous</li>
          <li>Entrez votre numéro WhatsApp</li>
          <li>Regardez les logs dans la console</li>
          <li>WhatsApp devrait s'ouvrir avec le message</li>
        </ol>
      </div>
      
      <button
        onClick={testWhatsApp}
        style={{
          background: '#25d366',
          color: 'white',
          border: 'none',
          padding: '15px 30px',
          fontSize: '18px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        📱 Tester WhatsApp
      </button>
      
      <div style={{
        marginTop: '30px',
        padding: '20px',
        background: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <h3>Ce que ce test fait:</h3>
        <ul>
          <li>✅ Télécharge le PDF depuis votre serveur</li>
          <li>✅ <strong>Upload le PDF sur tmpfiles.org (service gratuit)</strong></li>
          <li>✅ Génère un lien public temporaire (valide 1h)</li>
          <li>✅ Ouvre WhatsApp avec le lien de téléchargement</li>
          <li>✅ Le destinataire clique sur le lien pour télécharger</li>
        </ul>
      </div>
      
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#e8f5e9',
        border: '1px solid #4caf50',
        borderRadius: '8px'
      }}>
        <strong>✅ Avantages de cette méthode:</strong>
        <ul>
          <li>Le destinataire reçoit un vrai lien qui fonctionne</li>
          <li>Pas besoin de joindre manuellement le fichier</li>
          <li>Fonctionne même si le destinataire est sur un autre réseau</li>
          <li>Service gratuit et sans inscription</li>
        </ul>
      </div>
      
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '8px'
      }}>
        <strong>⚠️ Limitation:</strong>
        <p>Le lien expire après 1 heure. Si vous avez besoin de liens permanents, il faudra utiliser un service cloud payant (AWS S3, Cloudinary, etc.)</p>
      </div>
      
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#e3f2fd',
        border: '1px solid #2196f3',
        borderRadius: '8px'
      }}>
        <strong>💡 Si ça ne fonctionne pas:</strong>
        <ul>
          <li>Vérifiez que les popups ne sont pas bloqués</li>
          <li>Regardez la console pour voir où ça bloque</li>
          <li>Essayez avec un autre navigateur</li>
        </ul>
      </div>
    </div>
  );
}
