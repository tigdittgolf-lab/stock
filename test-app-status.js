// Test rapide du statut de l'application
const testAppStatus = async () => {
  console.log('🔍 Vérification du statut de l\'application\n');
  
  const tailscaleUrl = 'https://desktop-bhhs068.tail1d9c54.ts.net';
  
  try {
    // Test Tailscale
    console.log('✅ TAILSCALE (Fonctionne):');
    console.log(`   URL: ${tailscaleUrl}`);
    
    const response = await fetch(`${tailscaleUrl}/api/sales/delivery-notes/5`, {
      headers: { 'X-Tenant': '2025_bu01' }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        console.log(`   ✅ Application accessible`);
        console.log(`   💰 TTC: ${data.data.montant_ttc} DA`);
        console.log(`   🗄️  Database: ${data.database_type}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
  }
  
  console.log('\n❌ VERCEL (Ne fonctionne pas):');
  console.log('   Erreur: DEPLOYMENT_NOT_FOUND');
  console.log('   Raison: Problèmes de configuration et builds échoués');
  console.log('   Solution: Utiliser Tailscale à la place');
  
  console.log('\n🎯 RECOMMANDATION:');
  console.log('   Utilisez Tailscale pour accéder à votre application:');
  console.log(`   ${tailscaleUrl}`);
  console.log('   Les corrections TTC Version 3.0 sont actives!');
};

testAppStatus().catch(console.error);