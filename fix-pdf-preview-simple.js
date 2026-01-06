// Nouvelle fonction openPDFPreview simplifiée
const openPDFPreview = (blId, type) => {
  console.log(`🔍 Simple PDF Preview - ID: ${blId}, Type: ${type}`);
  
  if (!blId || isNaN(blId) || blId <= 0) {
    console.error(`🚨 Invalid BL ID: ${blId}`);
    alert(`Erreur: ID BL invalide: ${blId}`);
    return;
  }

  const urls = {
    complete: `/api/pdf/delivery-note/${blId}`,
    small: `/api/pdf/delivery-note-small/${blId}`,
    ticket: `/api/pdf/delivery-note-ticket/${blId}`
  };

  const pdfUrl = urls[type];
  console.log(`📄 Opening PDF URL: ${pdfUrl}`);
  
  // Solution ULTRA SIMPLE: Ouvrir directement l'URL
  window.open(pdfUrl, '_blank');
};

console.log('✅ Simple PDF Preview function ready');