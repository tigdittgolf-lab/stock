// Patch pour corriger l'endpoint BL - À ajouter dans sales-clean.ts

// REMPLACER la fonction GET /api/sales/delivery-notes par :

sales.get('/delivery-notes', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    console.log(`📋 Fetching REAL delivery notes for tenant: ${tenant}`);

    // Utiliser la fonction RPC pour récupérer les VRAIS BL
    const { data: blData, error: blError } = await supabaseAdmin.rpc('get_bl_list_by_tenant', {
      p_tenant: tenant
    });

    if (blError) {
      console.error('❌ Failed to fetch REAL BL data:', blError);
      return c.json({
        success: true,
        data: [],
        message: 'Failed to fetch REAL BL data - RPC error',
        tenant: tenant,
        source: 'fallback'
      });
    }

    // Transformer les données pour correspondre au format attendu
    const enrichedBL = (blData || []).map(bl => ({
      id: bl.nfact,
      nbl: bl.nfact,
      nclient: bl.nclient,
      client_name: bl.client_name || bl.nclient,
      date_fact: bl.date_fact,
      montant_ht: parseFloat(bl.montant_ht || '0'),
      tva: parseFloat(bl.tva || '0'),
      montant_ttc: parseFloat(bl.montant_ht || '0') + parseFloat(bl.tva || '0'),
      created_at: bl.created_at,
      type: 'bl'
    }));

    console.log(`✅ Found ${enrichedBL.length} REAL delivery notes from database via RPC`);

    return c.json({
      success: true,
      data: enrichedBL,
      tenant: tenant,
      source: 'real_database_via_rpc'
    });

  } catch (error) {
    console.error('❌ Error fetching REAL delivery notes:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération des bons de livraison'
    }, 500);
  }
});