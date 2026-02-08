// Script pour vérifier les données existantes
const { createClient } = require('@supabase/supabase-js');

// Configuration directe depuis backend/.env
const SUPABASE_URL = 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
    console.log('🔍 Vérification des données existantes\n');
    console.log('=' .repeat(60));
    
    const tenantId = '2025_bu01';
    
    // Vérifier les bons de livraison
    console.log('\n📦 Bons de livraison:');
    const { data: deliveryNotes, error: dnError } = await supabase
        .from('bons_livraison')
        .select('nbl, nclient, date_fact, montant_ht, tva, montant_ttc')
        .eq('tenant_id', tenantId)
        .order('nbl', { ascending: false })
        .limit(5);
    
    if (dnError) {
        console.log('❌ Erreur:', dnError.message);
    } else if (deliveryNotes && deliveryNotes.length > 0) {
        console.log(`✅ ${deliveryNotes.length} bon(s) de livraison trouvé(s):`);
        deliveryNotes.forEach(dn => {
            const totalTTC = dn.montant_ttc || (parseFloat(dn.montant_ht || 0) + parseFloat(dn.tva || 0));
            console.log(`   - BL #${dn.nbl} | Client: ${dn.nclient} | Montant: ${totalTTC.toFixed(2)} DA | Date: ${dn.date_fact}`);
        });
    } else {
        console.log('⚠️  Aucun bon de livraison trouvé');
    }
    
    // Vérifier les factures
    console.log('\n📄 Factures:');
    const { data: invoices, error: invError } = await supabase
        .from('factures')
        .select('nfacture, nclient, date_fact, montant_ht, tva, montant_ttc')
        .eq('tenant_id', tenantId)
        .order('nfacture', { ascending: false })
        .limit(5);
    
    if (invError) {
        console.log('❌ Erreur:', invError.message);
    } else if (invoices && invoices.length > 0) {
        console.log(`✅ ${invoices.length} facture(s) trouvée(s):`);
        invoices.forEach(inv => {
            const totalTTC = inv.montant_ttc || (parseFloat(inv.montant_ht || 0) + parseFloat(inv.tva || 0));
            console.log(`   - Facture #${inv.nfacture} | Client: ${inv.nclient} | Montant: ${totalTTC.toFixed(2)} DA | Date: ${inv.date_fact}`);
        });
    } else {
        console.log('⚠️  Aucune facture trouvée');
    }
    
    // Vérifier les paiements existants
    console.log('\n💰 Paiements existants:');
    const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(5);
    
    if (payError) {
        console.log('❌ Erreur:', payError.message);
    } else if (payments && payments.length > 0) {
        console.log(`✅ ${payments.length} paiement(s) trouvé(s):`);
        payments.forEach(p => {
            console.log(`   - ID: ${p.id} | Type: ${p.document_type} | Doc ID: ${p.document_id} | Montant: ${p.amount} DA | Date: ${p.payment_date}`);
        });
    } else {
        console.log('⚠️  Aucun paiement trouvé');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📝 Prochaines étapes:');
    
    if (deliveryNotes && deliveryNotes.length > 0) {
        const firstBL = deliveryNotes[0];
        console.log(`\n✅ Vous pouvez tester avec le BL #${firstBL.nbl}:`);
        console.log(`   1. Ouvrez: http://localhost:3000/delivery-notes/${firstBL.nbl}`);
        console.log(`   2. Cliquez sur "💰 Enregistrer un paiement"`);
        console.log(`   3. Testez le système de paiement`);
    } else {
        console.log('\n⚠️  Créez d\'abord un bon de livraison pour tester le système de paiement');
        console.log('   1. Allez sur: http://localhost:3000/delivery-notes/create');
        console.log('   2. Créez un nouveau bon de livraison');
        console.log('   3. Puis testez le système de paiement');
    }
    
    console.log('\n🌐 Serveur de développement: http://localhost:3000');
}

checkData().catch(console.error);
