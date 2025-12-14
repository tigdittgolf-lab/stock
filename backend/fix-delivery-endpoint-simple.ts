// Script simple pour corriger l'endpoint des bons de livraison
import { readFileSync, writeFileSync } from 'fs';

function fixDeliveryEndpoint() {
  console.log('🔧 Fixing delivery note endpoint...');
  
  try {
    // Lire le fichier
    const content = readFileSync('./src/routes/sales.ts', 'utf8');
    
    // Chercher le début de l'endpoint
    const startMarker = "sales.post('/delivery-notes', async (c) => {";
    const endMarker = "// ===== PROFORMA INVOICES =====";
    
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);
    
    if (startIndex === -1 || endIndex === -1) {
      console.error('❌ Could not find endpoint boundaries');
      console.log('Start found:', startIndex !== -1);
      console.log('End found:', endIndex !== -1);
      return;
    }
    
    console.log(`📍 Found endpoint: start=${startIndex}, end=${endIndex}`);
    
    // Nouveau endpoint corrigé (version compacte)
    const newEndpoint = `sales.post('/delivery-notes', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    const { Nclient, date_fact, detail_bl } = body;

    if (!detail_bl || !Array.isArray(detail_bl) || detail_bl.length === 0) {
      return c.json({ success: false, error: 'detail_bl is required and must be a non-empty array' }, 400);
    }

    console.log(\`🆕 Creating delivery note for tenant: \${tenant}, Client: \${Nclient}\`);

    // 1. Obtenir le prochain numéro de BL
    const { data: nextNBl, error: numberError } = await supabaseAdmin.rpc('get_next_bl_number_simple', {
      p_tenant: tenant
    });

    if (numberError) {
      console.error('❌ Failed to get next BL number:', numberError);
      return c.json({ success: false, error: 'Failed to generate BL number' }, 500);
    }

    // 2. Valider le client
    const { data: clients, error: clientError } = await supabaseAdmin.rpc('get_clients_by_tenant', {
      p_tenant: tenant
    });

    if (clientError) {
      console.error('❌ Failed to fetch clients:', clientError);
      return c.json({ success: false, error: 'Failed to validate client' }, 500);
    }

    const clientExists = clients?.find(client => client.nclient === Nclient);
    if (!clientExists) {
      return c.json({ success: false, error: \`Client \${Nclient} not found\` }, 400);
    }

    // 3. Valider les articles
    const { data: articles, error: articleError } = await supabaseAdmin.rpc('get_articles_by_tenant', {
      p_tenant: tenant
    });

    if (articleError) {
      console.error('❌ Failed to fetch articles:', articleError);
      return c.json({ success: false, error: 'Failed to validate articles' }, 500);
    }

    // 4. Calculer les totaux et valider le stock
    let montant_ht = 0;
    let TVA = 0;
    const processedDetails = [];

    for (const detail of detail_bl) {
      const articleExists = articles?.find(article => article.narticle.trim() === detail.Narticle.trim());
      if (!articleExists) {
        return c.json({ success: false, error: \`Article \${detail.Narticle} not found\` }, 400);
      }

      // Vérifier le stock
      const { data: stockInfo, error: stockError } = await supabaseAdmin.rpc('get_article_stock_simple', {
        p_tenant: tenant,
        p_narticle: detail.Narticle
      });

      if (stockError) {
        console.error(\`❌ Failed to get stock for \${detail.Narticle}:\`, stockError);
        return c.json({ success: false, error: \`Failed to check stock for \${detail.Narticle}\` }, 500);
      }

      const currentStockBL = parseFloat(stockInfo?.stock_bl || '0');
      const requestedQty = parseFloat(detail.Qte);
      
      if (currentStockBL < requestedQty) {
        return c.json({ 
          success: false, 
          error: \`Stock insuffisant pour \${detail.Narticle}. Disponible: \${currentStockBL}, demandé: \${requestedQty}\`
        }, 400);
      }

      const total_ligne = requestedQty * parseFloat(detail.prix);
      const tva_amount = total_ligne * (parseFloat(detail.tva) / 100);

      montant_ht += total_ligne;
      TVA += tva_amount;

      processedDetails.push({
        nfact: nextNBl,
        narticle: detail.Narticle,
        qte: requestedQty,
        tva: parseFloat(detail.tva),
        prix: parseFloat(detail.prix),
        total_ligne: total_ligne
      });
    }

    // 5. Créer le BL
    const blDate = date_fact || new Date().toISOString().split('T')[0];
    
    const { data: blHeader, error: blError } = await supabaseAdmin.rpc('insert_bl_simple', {
      p_tenant: tenant,
      p_nfact: nextNBl,
      p_nclient: Nclient,
      p_date_fact: blDate,
      p_montant_ht: montant_ht,
      p_tva: TVA
    });

    if (blError) {
      console.error('❌ Failed to create BL:', blError);
      return c.json({ success: false, error: \`Failed to create BL: \${blError.message}\` }, 500);
    }

    // 6. Ajouter les détails
    for (const detail of processedDetails) {
      const { error: detailErr } = await supabaseAdmin.rpc('insert_detail_bl_simple', {
        p_tenant: tenant,
        p_nfact: detail.nfact,
        p_narticle: detail.narticle,
        p_qte: detail.qte,
        p_prix: detail.prix,
        p_tva: detail.tva,
        p_total_ligne: detail.total_ligne
      });
      
      if (detailErr) {
        console.error(\`❌ Failed to insert detail for \${detail.narticle}:\`, detailErr);
        return c.json({ success: false, error: \`Failed to save BL details: \${detailErr.message}\` }, 500);
      }
    }

    // 7. Mettre à jour les stocks
    for (const detail of processedDetails) {
      const { error: stockError } = await supabaseAdmin.rpc('update_stock_bl_simple', {
        p_tenant: tenant,
        p_narticle: detail.narticle,
        p_quantity: detail.qte
      });

      if (stockError) {
        console.warn(\`⚠️ Stock update failed for \${detail.narticle}:\`, stockError);
      }
    }

    console.log(\`✅ BL \${nextNBl} created successfully for client \${Nclient}\`);

    return c.json({
      success: true,
      message: \`Bon de livraison \${nextNBl} créé avec succès !\`,
      data: {
        nbl: nextNBl,
        nclient: Nclient,
        client_name: clientExists.raison_sociale,
        date_fact: blDate,
        montant_ht: montant_ht,
        tva: TVA,
        montant_ttc: montant_ht + TVA,
        details: processedDetails.map(detail => ({
          narticle: detail.narticle,
          designation: articles?.find(a => a.narticle.trim() === detail.narticle.trim())?.designation || '',
          qte: detail.qte,
          prix: detail.prix,
          tva: detail.tva,
          total_ligne: detail.total_ligne
        })),
        source: 'database'
      }
    });

  } catch (error) {
    console.error('❌ Error creating delivery note:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la création du bon de livraison'
    }, 500);
  }
});

`;

    // Remplacer l'ancien endpoint
    const beforeEndpoint = content.substring(0, startIndex);
    const afterEndpoint = content.substring(endIndex);
    
    const newContent = beforeEndpoint + newEndpoint + '\n' + afterEndpoint;
    
    // Sauvegarder
    writeFileSync('./src/routes/sales.ts', newContent, 'utf8');
    
    console.log('✅ Delivery note endpoint successfully replaced!');
    console.log('📋 The endpoint now uses RPC functions instead of hardcoded data');
    console.log('🧪 Ready to test delivery note creation');
    
  } catch (error) {
    console.error('❌ Failed to fix endpoint:', error);
  }
}

fixDeliveryEndpoint();