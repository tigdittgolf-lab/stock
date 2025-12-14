// Ajouter tous les endpoints de documents corrigés dans sales-clean.ts
import { readFileSync, writeFileSync } from 'fs';

function addAllDocumentEndpoints() {
  console.log('🔧 Adding all document endpoints to sales-clean.ts...');
  
  try {
    // Lire le fichier actuel
    const content = readFileSync('./src/routes/sales-clean.ts', 'utf8');
    
    // Nouveaux endpoints à ajouter
    const newEndpoints = `

// ===== FACTURES - CORRIGÉ AVEC RPC =====

// POST /api/sales/invoices - Créer une facture
sales.post('/invoices', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    const { Nclient, date_fact, detail_fact } = body;

    if (!detail_fact || !Array.isArray(detail_fact) || detail_fact.length === 0) {
      return c.json({ success: false, error: 'detail_fact is required and must be a non-empty array' }, 400);
    }

    console.log(\`🆕 Creating invoice for tenant: \${tenant}, Client: \${Nclient}\`);

    // 1. Obtenir le prochain numéro de facture
    const { data: nextNumber, error: numberError } = await supabaseAdmin.rpc('get_next_invoice_number', {
      p_tenant: tenant
    });

    if (numberError) {
      console.error('❌ Failed to get next invoice number:', numberError);
      return c.json({ success: false, error: 'Failed to generate invoice number' }, 500);
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

    for (const detail of detail_fact) {
      const articleExists = articles?.find(article => article.narticle.trim() === detail.Narticle.trim());
      if (!articleExists) {
        return c.json({ success: false, error: \`Article \${detail.Narticle} not found\` }, 400);
      }

      // Vérifier le stock facture
      const { data: stockInfo, error: stockError } = await supabaseAdmin.rpc('get_article_stock_simple', {
        p_tenant: tenant,
        p_narticle: detail.Narticle
      });

      if (stockError) {
        console.error(\`❌ Failed to get stock for \${detail.Narticle}:\`, stockError);
        return c.json({ success: false, error: \`Failed to check stock for \${detail.Narticle}\` }, 500);
      }

      const currentStockF = parseFloat(stockInfo?.stock_f || '0');
      const requestedQty = parseFloat(detail.Qte);
      
      if (currentStockF < requestedQty) {
        return c.json({ 
          success: false, 
          error: \`Stock facture insuffisant pour \${detail.Narticle}. Disponible: \${currentStockF}, demandé: \${requestedQty}\`
        }, 400);
      }

      const total_ligne = requestedQty * parseFloat(detail.prix);
      const tva_amount = total_ligne * (parseFloat(detail.tva) / 100);

      montant_ht += total_ligne;
      TVA += tva_amount;

      processedDetails.push({
        nfact: nextNumber,
        narticle: detail.Narticle,
        qte: requestedQty,
        tva: parseFloat(detail.tva),
        prix: parseFloat(detail.prix),
        total_ligne: total_ligne
      });
    }

    // 5. Créer la facture
    const factDate = date_fact || new Date().toISOString().split('T')[0];
    
    const { data: factHeader, error: factError } = await supabaseAdmin.rpc('insert_invoice', {
      p_tenant: tenant,
      p_nfact: nextNumber,
      p_nclient: Nclient,
      p_date_fact: factDate,
      p_montant_ht: montant_ht,
      p_tva: TVA
    });

    if (factError) {
      console.error('❌ Failed to create invoice:', factError);
      return c.json({ success: false, error: \`Failed to create invoice: \${factError.message}\` }, 500);
    }

    // 6. Ajouter les détails
    for (const detail of processedDetails) {
      const { error: detailErr } = await supabaseAdmin.rpc('insert_detail_invoice', {
        p_tenant: tenant,
        p_nfact: detail.nfact,
        p_narticle: detail.narticle,
        p_qte: detail.qte,
        p_prix: detail.prix,
        p_tva: detail.tva,
        p_total_ligne: detail.total_ligne
      });
      
      if (detailErr) {
        console.error(\`❌ Failed to insert invoice detail for \${detail.narticle}:\`, detailErr);
        return c.json({ success: false, error: \`Failed to save invoice details: \${detailErr.message}\` }, 500);
      }
    }

    // 7. Mettre à jour les stocks facture
    for (const detail of processedDetails) {
      const { error: stockError } = await supabaseAdmin.rpc('update_stock_facture', {
        p_tenant: tenant,
        p_narticle: detail.narticle,
        p_quantity: detail.qte
      });

      if (stockError) {
        console.warn(\`⚠️ Stock facture update failed for \${detail.narticle}:\`, stockError);
      }
    }

    console.log(\`✅ Invoice \${nextNumber} created successfully for client \${Nclient}\`);

    return c.json({
      success: true,
      message: \`Facture \${nextNumber} créée avec succès !\`,
      data: {
        nfact: nextNumber,
        nclient: Nclient,
        client_name: clientExists.raison_sociale,
        date_fact: factDate,
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
    console.error('❌ Error creating invoice:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la création de la facture'
    }, 500);
  }
});

// ===== PROFORMA - CORRIGÉ AVEC RPC =====

// POST /api/sales/proforma - Créer une proforma
sales.post('/proforma', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    const { Nclient, date_fact, detail_proforma } = body;

    if (!detail_proforma || !Array.isArray(detail_proforma) || detail_proforma.length === 0) {
      return c.json({ success: false, error: 'detail_proforma is required and must be a non-empty array' }, 400);
    }

    console.log(\`🆕 Creating proforma for tenant: \${tenant}, Client: \${Nclient}\`);

    // 1. Obtenir le prochain numéro de proforma
    const { data: nextNumber, error: numberError } = await supabaseAdmin.rpc('get_next_proforma_number', {
      p_tenant: tenant
    });

    if (numberError) {
      console.error('❌ Failed to get next proforma number:', numberError);
      return c.json({ success: false, error: 'Failed to generate proforma number' }, 500);
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

    // 4. Calculer les totaux (pas de vérification de stock pour proforma)
    let montant_ht = 0;
    let TVA = 0;
    const processedDetails = [];

    for (const detail of detail_proforma) {
      const articleExists = articles?.find(article => article.narticle.trim() === detail.Narticle.trim());
      if (!articleExists) {
        return c.json({ success: false, error: \`Article \${detail.Narticle} not found\` }, 400);
      }

      const total_ligne = parseFloat(detail.Qte) * parseFloat(detail.prix);
      const tva_amount = total_ligne * (parseFloat(detail.tva) / 100);

      montant_ht += total_ligne;
      TVA += tva_amount;

      processedDetails.push({
        nfact: nextNumber,
        narticle: detail.Narticle,
        qte: parseFloat(detail.Qte),
        tva: parseFloat(detail.tva),
        prix: parseFloat(detail.prix),
        total_ligne: total_ligne
      });
    }

    // 5. Créer la proforma
    const proformaDate = date_fact || new Date().toISOString().split('T')[0];
    
    const { data: proformaHeader, error: proformaError } = await supabaseAdmin.rpc('insert_proforma', {
      p_tenant: tenant,
      p_nfact: nextNumber,
      p_nclient: Nclient,
      p_date_fact: proformaDate,
      p_montant_ht: montant_ht,
      p_tva: TVA
    });

    if (proformaError) {
      console.error('❌ Failed to create proforma:', proformaError);
      return c.json({ success: false, error: \`Failed to create proforma: \${proformaError.message}\` }, 500);
    }

    // 6. Ajouter les détails
    for (const detail of processedDetails) {
      const { error: detailErr } = await supabaseAdmin.rpc('insert_detail_proforma', {
        p_tenant: tenant,
        p_nfact: detail.nfact,
        p_narticle: detail.narticle,
        p_qte: detail.qte,
        p_prix: detail.prix,
        p_tva: detail.tva,
        p_total_ligne: detail.total_ligne
      });
      
      if (detailErr) {
        console.error(\`❌ Failed to insert proforma detail for \${detail.narticle}:\`, detailErr);
        return c.json({ success: false, error: \`Failed to save proforma details: \${detailErr.message}\` }, 500);
      }
    }

    console.log(\`✅ Proforma \${nextNumber} created successfully for client \${Nclient}\`);

    return c.json({
      success: true,
      message: \`Proforma \${nextNumber} créée avec succès !\`,
      data: {
        nproforma: nextNumber,
        nclient: Nclient,
        client_name: clientExists.raison_sociale,
        date_fact: proformaDate,
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
    console.error('❌ Error creating proforma:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la création de la proforma'
    }, 500);
  }
});

// ===== BONS D'ACHAT - CORRIGÉ AVEC RPC =====

// POST /api/sales/purchase-orders - Créer un bon d'achat
sales.post('/purchase-orders', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    const { Nfournisseur, date_bc, detail_bc } = body;

    if (!detail_bc || !Array.isArray(detail_bc) || detail_bc.length === 0) {
      return c.json({ success: false, error: 'detail_bc is required and must be a non-empty array' }, 400);
    }

    console.log(\`🆕 Creating purchase order for tenant: \${tenant}, Supplier: \${Nfournisseur}\`);

    // 1. Obtenir le prochain numéro de bon d'achat
    const { data: nextNumber, error: numberError } = await supabaseAdmin.rpc('get_next_purchase_order_number', {
      p_tenant: tenant
    });

    if (numberError) {
      console.error('❌ Failed to get next purchase order number:', numberError);
      return c.json({ success: false, error: 'Failed to generate purchase order number' }, 500);
    }

    // 2. Valider le fournisseur
    const { data: suppliers, error: supplierError } = await supabaseAdmin.rpc('get_suppliers_by_tenant', {
      p_tenant: tenant
    });

    if (supplierError) {
      console.error('❌ Failed to fetch suppliers:', supplierError);
      return c.json({ success: false, error: 'Failed to validate supplier' }, 500);
    }

    const supplierExists = suppliers?.find(supplier => supplier.nfournisseur === Nfournisseur);
    if (!supplierExists) {
      return c.json({ success: false, error: \`Supplier \${Nfournisseur} not found\` }, 400);
    }

    // 3. Valider les articles
    const { data: articles, error: articleError } = await supabaseAdmin.rpc('get_articles_by_tenant', {
      p_tenant: tenant
    });

    if (articleError) {
      console.error('❌ Failed to fetch articles:', articleError);
      return c.json({ success: false, error: 'Failed to validate articles' }, 500);
    }

    // 4. Calculer les totaux
    let montant_ht = 0;
    let TVA = 0;
    const processedDetails = [];

    for (const detail of detail_bc) {
      const articleExists = articles?.find(article => article.narticle.trim() === detail.Narticle.trim());
      if (!articleExists) {
        return c.json({ success: false, error: \`Article \${detail.Narticle} not found\` }, 400);
      }

      const total_ligne = parseFloat(detail.Qte) * parseFloat(detail.prix);
      const tva_amount = total_ligne * (parseFloat(detail.tva) / 100);

      montant_ht += total_ligne;
      TVA += tva_amount;

      processedDetails.push({
        nbc: nextNumber,
        narticle: detail.Narticle,
        qte: parseFloat(detail.Qte),
        tva: parseFloat(detail.tva),
        prix: parseFloat(detail.prix),
        total_ligne: total_ligne
      });
    }

    // 5. Créer le bon d'achat
    const bcDate = date_bc || new Date().toISOString().split('T')[0];
    
    const { data: bcHeader, error: bcError } = await supabaseAdmin.rpc('insert_purchase_order', {
      p_tenant: tenant,
      p_nbc: nextNumber,
      p_nfournisseur: Nfournisseur,
      p_date_bc: bcDate,
      p_montant_ht: montant_ht,
      p_tva: TVA
    });

    if (bcError) {
      console.error('❌ Failed to create purchase order:', bcError);
      return c.json({ success: false, error: \`Failed to create purchase order: \${bcError.message}\` }, 500);
    }

    // 6. Ajouter les détails
    for (const detail of processedDetails) {
      const { error: detailErr } = await supabaseAdmin.rpc('insert_detail_purchase_order', {
        p_tenant: tenant,
        p_nbc: detail.nbc,
        p_narticle: detail.narticle,
        p_qte: detail.qte,
        p_prix: detail.prix,
        p_tva: detail.tva,
        p_total_ligne: detail.total_ligne
      });
      
      if (detailErr) {
        console.error(\`❌ Failed to insert purchase order detail for \${detail.narticle}:\`, detailErr);
        return c.json({ success: false, error: \`Failed to save purchase order details: \${detailErr.message}\` }, 500);
      }
    }

    console.log(\`✅ Purchase order \${nextNumber} created successfully for supplier \${Nfournisseur}\`);

    return c.json({
      success: true,
      message: \`Bon d'achat \${nextNumber} créé avec succès !\`,
      data: {
        nbc: nextNumber,
        nfournisseur: Nfournisseur,
        supplier_name: supplierExists.nom_fournisseur,
        date_bc: bcDate,
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
    console.error('❌ Error creating purchase order:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la création du bon d\\'achat'
    }, 500);
  }
});

// ===== FACTURES D'ACHAT - CORRIGÉ AVEC RPC =====

// POST /api/sales/purchase-invoices - Créer une facture d'achat
sales.post('/purchase-invoices', async (c) => {
  try {
    const tenant = c.get('tenant');
    if (!tenant) {
      return c.json({ success: false, error: 'Tenant header required' }, 400);
    }

    const body = await c.req.json();
    const { Nfournisseur, date_fact, detail_facture_achat } = body;

    if (!detail_facture_achat || !Array.isArray(detail_facture_achat) || detail_facture_achat.length === 0) {
      return c.json({ success: false, error: 'detail_facture_achat is required and must be a non-empty array' }, 400);
    }

    console.log(\`🆕 Creating purchase invoice for tenant: \${tenant}, Supplier: \${Nfournisseur}\`);

    // 1. Obtenir le prochain numéro de facture d'achat
    const { data: nextNumber, error: numberError } = await supabaseAdmin.rpc('get_next_purchase_invoice_number', {
      p_tenant: tenant
    });

    if (numberError) {
      console.error('❌ Failed to get next purchase invoice number:', numberError);
      return c.json({ success: false, error: 'Failed to generate purchase invoice number' }, 500);
    }

    // 2. Valider le fournisseur
    const { data: suppliers, error: supplierError } = await supabaseAdmin.rpc('get_suppliers_by_tenant', {
      p_tenant: tenant
    });

    if (supplierError) {
      console.error('❌ Failed to fetch suppliers:', supplierError);
      return c.json({ success: false, error: 'Failed to validate supplier' }, 500);
    }

    const supplierExists = suppliers?.find(supplier => supplier.nfournisseur === Nfournisseur);
    if (!supplierExists) {
      return c.json({ success: false, error: \`Supplier \${Nfournisseur} not found\` }, 400);
    }

    // 3. Valider les articles
    const { data: articles, error: articleError } = await supabaseAdmin.rpc('get_articles_by_tenant', {
      p_tenant: tenant
    });

    if (articleError) {
      console.error('❌ Failed to fetch articles:', articleError);
      return c.json({ success: false, error: 'Failed to validate articles' }, 500);
    }

    // 4. Calculer les totaux
    let montant_ht = 0;
    let TVA = 0;
    const processedDetails = [];

    for (const detail of detail_facture_achat) {
      const articleExists = articles?.find(article => article.narticle.trim() === detail.Narticle.trim());
      if (!articleExists) {
        return c.json({ success: false, error: \`Article \${detail.Narticle} not found\` }, 400);
      }

      const total_ligne = parseFloat(detail.Qte) * parseFloat(detail.prix);
      const tva_amount = total_ligne * (parseFloat(detail.tva) / 100);

      montant_ht += total_ligne;
      TVA += tva_amount;

      processedDetails.push({
        nfact_achat: nextNumber,
        narticle: detail.Narticle,
        qte: parseFloat(detail.Qte),
        tva: parseFloat(detail.tva),
        prix: parseFloat(detail.prix),
        total_ligne: total_ligne
      });
    }

    // 5. Créer la facture d'achat
    const factDate = date_fact || new Date().toISOString().split('T')[0];
    
    const { data: factHeader, error: factError } = await supabaseAdmin.rpc('insert_purchase_invoice', {
      p_tenant: tenant,
      p_nfact_achat: nextNumber,
      p_nfournisseur: Nfournisseur,
      p_date_fact: factDate,
      p_montant_ht: montant_ht,
      p_tva: TVA
    });

    if (factError) {
      console.error('❌ Failed to create purchase invoice:', factError);
      return c.json({ success: false, error: \`Failed to create purchase invoice: \${factError.message}\` }, 500);
    }

    // 6. Ajouter les détails
    for (const detail of processedDetails) {
      const { error: detailErr } = await supabaseAdmin.rpc('insert_detail_purchase_invoice', {
        p_tenant: tenant,
        p_nfact_achat: detail.nfact_achat,
        p_narticle: detail.narticle,
        p_qte: detail.qte,
        p_prix: detail.prix,
        p_tva: detail.tva,
        p_total_ligne: detail.total_ligne
      });
      
      if (detailErr) {
        console.error(\`❌ Failed to insert purchase invoice detail for \${detail.narticle}:\`, detailErr);
        return c.json({ success: false, error: \`Failed to save purchase invoice details: \${detailErr.message}\` }, 500);
      }
    }

    // 7. Augmenter le stock (achat = entrée de stock)
    for (const detail of processedDetails) {
      const { error: stockError } = await supabaseAdmin.rpc('increase_stock_purchase', {
        p_tenant: tenant,
        p_narticle: detail.narticle,
        p_quantity: detail.qte
      });

      if (stockError) {
        console.warn(\`⚠️ Stock increase failed for \${detail.narticle}:\`, stockError);
      }
    }

    console.log(\`✅ Purchase invoice \${nextNumber} created successfully for supplier \${Nfournisseur}\`);

    return c.json({
      success: true,
      message: \`Facture d'achat \${nextNumber} créée avec succès !\`,
      data: {
        nfact_achat: nextNumber,
        nfournisseur: Nfournisseur,
        supplier_name: supplierExists.nom_fournisseur,
        date_fact: factDate,
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
    console.error('❌ Error creating purchase invoice:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la création de la facture d\\'achat'
    }, 500);
  }
});
`;

    // Ajouter les nouveaux endpoints à la fin du fichier
    const newContent = content + newEndpoints;
    
    // Sauvegarder
    writeFileSync('./src/routes/sales-clean.ts', newContent, 'utf8');
    
    console.log('✅ All document endpoints successfully added!');
    console.log('📋 Added endpoints:');
    console.log('   - POST /api/sales/invoices (Factures)');
    console.log('   - POST /api/sales/proforma (Proforma)');
    console.log('   - POST /api/sales/purchase-orders (Bons d\'achat)');
    console.log('   - POST /api/sales/purchase-invoices (Factures d\'achat)');
    console.log('🔧 All endpoints now use RPC functions instead of hardcoded data');
    
  } catch (error) {
    console.error('❌ Failed to add endpoints:', error);
  }
}

addAllDocumentEndpoints();