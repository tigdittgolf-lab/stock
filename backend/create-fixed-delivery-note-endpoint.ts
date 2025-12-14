// Endpoint corrigé pour la création des bons de livraison
// Remplace les données hardcodées par de vraies requêtes RPC

export const createDeliveryNoteEndpoint = `
// Create new delivery note - VERSION CORRIGÉE AVEC RPC
sales.post('/delivery-notes', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    const { Nclient, date_fact, detail_bl, ...blData } = body;

    if (!detail_bl || !Array.isArray(detail_bl) || detail_bl.length === 0) {
      return c.json({ success: false, error: 'detail_bl is required and must be a non-empty array' }, 400);
    }

    console.log(\`🆕 Creating delivery note for tenant: \${tenant}\`);
    console.log(\`📋 Client: \${Nclient}, Articles: \${detail_bl.length}\`);

    // 1. OBTENIR LE PROCHAIN NUMÉRO DE BL VIA RPC
    const { data: nextNBl, error: numberError } = await supabaseAdmin.rpc('get_next_bl_number', {
      p_tenant: tenant
    });

    if (numberError) {
      console.error('❌ Failed to get next BL number:', numberError);
      return c.json({ success: false, error: 'Failed to generate BL number' }, 500);
    }

    console.log(\`🔢 Next BL number: \${nextNBl}\`);

    // 2. VALIDER QUE LE CLIENT EXISTE VIA RPC
    const { data: clients, error: clientError } = await supabaseAdmin.rpc('get_clients_by_tenant', {
      p_tenant: tenant
    });

    if (clientError) {
      console.error('❌ Failed to fetch clients:', clientError);
      return c.json({ success: false, error: 'Failed to validate client' }, 500);
    }

    const clientExists = clients?.find(client => client.nclient === Nclient);
    if (!clientExists) {
      console.log(\`❌ Client \${Nclient} not found\`);
      return c.json({ success: false, error: \`Client \${Nclient} not found\` }, 400);
    }

    console.log(\`✅ Client \${Nclient} found: \${clientExists.raison_sociale}\`);

    // 3. RÉCUPÉRER LES ARTICLES VIA RPC
    const { data: articles, error: articleError } = await supabaseAdmin.rpc('get_articles_by_tenant', {
      p_tenant: tenant
    });

    if (articleError) {
      console.error('❌ Failed to fetch articles:', articleError);
      return c.json({ success: false, error: 'Failed to validate articles' }, 500);
    }

    // 4. VALIDER ET CALCULER LES TOTAUX
    let montant_ht = 0;
    let TVA = 0;
    const processedDetails = [];

    for (const detail of detail_bl) {
      // Valider que l'article existe
      const articleExists = articles?.find(article => article.narticle.trim() === detail.Narticle.trim());
      if (!articleExists) {
        console.log(\`❌ Article \${detail.Narticle} not found\`);
        return c.json({ success: false, error: \`Article \${detail.Narticle} not found\` }, 400);
      }

      console.log(\`✅ Article \${detail.Narticle} found: \${articleExists.designation}\`);

      // Vérifier le stock disponible
      const currentStockBL = parseFloat(articleExists.stock_bl || '0');
      const requestedQty = parseFloat(detail.Qte);
      
      if (currentStockBL < requestedQty) {
        console.log(\`⚠️ Insufficient stock for article \${detail.Narticle}: available=\${currentStockBL}, requested=\${requestedQty}\`);
        return c.json({ 
          success: false, 
          error: \`Stock insuffisant pour l'article \${detail.Narticle}. Stock disponible: \${currentStockBL}, demandé: \${requestedQty}\`
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
        total_ligne: total_ligne,
        facturer: detail.facturer || false
      });
    }

    // 5. CRÉER L'EN-TÊTE DU BL VIA RPC
    const blDate = date_fact || new Date().toISOString().split('T')[0];
    
    console.log(\`💾 Saving BL \${nextNBl} to database for client \${Nclient} in schema \${tenant}\`);
    
    const { data: blHeader, error: blError } = await supabaseAdmin.rpc('insert_bl', {
      p_tenant: tenant,
      p_nfact: nextNBl,
      p_nclient: Nclient,
      p_date_fact: blDate,
      p_montant_ht: montant_ht,
      p_tva: TVA,
      p_timbre: 0,
      p_autre_taxe: 0
    });

    if (blError) {
      console.error('❌ Failed to create BL header:', blError);
      return c.json({ success: false, error: \`Failed to create BL: \${blError.message}\` }, 500);
    }

    console.log(\`✅ BL header \${nextNBl} saved to database successfully\`);

    // 6. SAUVEGARDER LES DÉTAILS VIA RPC
    for (const detail of processedDetails) {
      const { data: detailResult, error: detailErr } = await supabaseAdmin.rpc('insert_detail_bl', {
        p_tenant: tenant,
        p_nfact: detail.nfact,
        p_narticle: detail.narticle,
        p_qte: detail.qte,
        p_prix: detail.prix,
        p_tva: detail.tva,
        p_total_ligne: detail.total_ligne
      });
      
      if (detailErr) {
        console.error(\`❌ Failed to insert detail for article \${detail.narticle}:\`, detailErr);
        return c.json({ success: false, error: \`Failed to save BL details: \${detailErr.message}\` }, 500);
      }
    }

    console.log(\`✅ \${processedDetails.length} BL details saved to database successfully\`);

    // 7. METTRE À JOUR LES STOCKS VIA RPC
    for (const detail of processedDetails) {
      const { data: stockResult, error: stockError } = await supabaseAdmin.rpc('update_stock_bl', {
        p_tenant: tenant,
        p_narticle: detail.narticle,
        p_quantity: detail.qte
      });

      if (stockError) {
        console.warn(\`⚠️ Stock BL update failed for article \${detail.narticle}:\`, stockError);
      } else {
        console.log(\`📦 Stock BL updated for article \${detail.narticle}: new stock = \${stockResult?.[0]?.stock_bl || 'unknown'}\`);
      }
    }

    // 8. PRÉPARER LA RÉPONSE
    const newBL = {
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
      created_at: new Date().toISOString(),
      source: 'database'
    };

    console.log(\`✅ BL \${nextNBl} created successfully for client \${Nclient}\`);

    return c.json({
      success: true,
      message: \`Bon de livraison \${nextNBl} créé avec succès !\`,
      data: newBL
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

console.log('✅ Fixed delivery note endpoint created!');
console.log('📋 Next steps:');
console.log('1. Execute create-bl-rpc-functions.sql in Supabase SQL Editor');
console.log('2. Replace the delivery note endpoint in sales.ts with the fixed version');
console.log('3. Test the delivery note creation');