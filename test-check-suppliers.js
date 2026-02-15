// Script pour vérifier les fournisseurs existants
const baseUrl = 'http://localhost:3005';
const tenant = '2025_bu01';

const checkSuppliers = async () => {
  console.log('🔍 Vérification des fournisseurs existants\n');
  
  try {
    const response = await fetch(`${baseUrl}/api/suppliers`, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant
      }
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ ${result.data.length} fournisseurs trouvés :\n`);
      result.data.forEach((supplier, index) => {
        console.log(`${index + 1}. Code: ${supplier.nfournisseur || supplier.Nfournisseur}`);
        console.log(`   Nom: ${supplier.nom_fournisseur || supplier.Nom_fournisseur}`);
        console.log(`   Adresse: ${supplier.adresse_fourni || supplier.Adresse_fourni || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ Erreur:', result.error);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
};

checkSuppliers();
