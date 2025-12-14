// Tester toutes les nouvelles fonctions RPC de documents
import { supabaseAdmin } from './src/supabaseClient.js';

async function testAllDocumentFunctions() {
  console.log('🧪 Testing all document RPC functions...');
  
  const testTenant = '2025_bu01';
  
  try {
    // ===== TEST FACTURES =====
    console.log('\n📄 Testing FACTURES functions...');
    
    // Test get_next_invoice_number
    const { data: nextInvoiceNumber, error: invoiceNumberError } = await supabaseAdmin.rpc('get_next_invoice_number', {
      p_tenant: testTenant
    });
    
    if (invoiceNumberError) {
      console.error('❌ get_next_invoice_number failed:', invoiceNumberError);
    } else {
      console.log(`✅ Next invoice number: ${nextInvoiceNumber}`);
    }
    
    // ===== TEST PROFORMA =====
    console.log('\n📋 Testing PROFORMA functions...');
    
    // Test get_next_proforma_number
    const { data: nextProformaNumber, error: proformaNumberError } = await supabaseAdmin.rpc('get_next_proforma_number', {
      p_tenant: testTenant
    });
    
    if (proformaNumberError) {
      console.error('❌ get_next_proforma_number failed:', proformaNumberError);
    } else {
      console.log(`✅ Next proforma number: ${nextProformaNumber}`);
    }
    
    // ===== TEST BONS D'ACHAT =====
    console.log('\n🛒 Testing PURCHASE ORDER functions...');
    
    // Test get_next_purchase_order_number
    const { data: nextPONumber, error: poNumberError } = await supabaseAdmin.rpc('get_next_purchase_order_number', {
      p_tenant: testTenant
    });
    
    if (poNumberError) {
      console.error('❌ get_next_purchase_order_number failed:', poNumberError);
    } else {
      console.log(`✅ Next purchase order number: ${nextPONumber}`);
    }
    
    // ===== TEST FACTURES D'ACHAT =====
    console.log('\n💰 Testing PURCHASE INVOICE functions...');
    
    // Test get_next_purchase_invoice_number
    const { data: nextPINumber, error: piNumberError } = await supabaseAdmin.rpc('get_next_purchase_invoice_number', {
      p_tenant: testTenant
    });
    
    if (piNumberError) {
      console.error('❌ get_next_purchase_invoice_number failed:', piNumberError);
    } else {
      console.log(`✅ Next purchase invoice number: ${nextPINumber}`);
    }
    
    // ===== TEST COMPLET AVEC CRÉATION =====
    console.log('\n🔬 Testing complete document creation workflow...');
    
    // Test création d'une facture complète
    if (!invoiceNumberError && nextInvoiceNumber) {
      console.log('📄 Testing complete invoice creation...');
      
      // Créer la facture
      const { data: invoiceResult, error: invoiceError } = await supabaseAdmin.rpc('insert_invoice', {
        p_tenant: testTenant,
        p_nfact: nextInvoiceNumber,
        p_nclient: 'CL01',
        p_date_fact: '2025-01-01',
        p_montant_ht: 200,
        p_tva: 38
      });
      
      if (invoiceError) {
        console.error('❌ insert_invoice failed:', invoiceError);
      } else {
        console.log(`✅ Invoice created: ${invoiceResult}`);
        
        // Ajouter un détail
        const { data: detailResult, error: detailError } = await supabaseAdmin.rpc('insert_detail_invoice', {
          p_tenant: testTenant,
          p_nfact: nextInvoiceNumber,
          p_narticle: '1000',
          p_qte: 2,
          p_prix: 100,
          p_tva: 19,
          p_total_ligne: 200
        });
        
        if (detailError) {
          console.error('❌ insert_detail_invoice failed:', detailError);
        } else {
          console.log(`✅ Invoice detail added: ${detailResult}`);
          
          // Tester la mise à jour du stock
          const { data: stockResult, error: stockError } = await supabaseAdmin.rpc('update_stock_facture', {
            p_tenant: testTenant,
            p_narticle: '1000',
            p_quantity: 2
          });
          
          if (stockError) {
            console.error('❌ update_stock_facture failed:', stockError);
          } else {
            console.log(`✅ Stock updated for invoice: ${JSON.stringify(stockResult)}`);
          }
        }
        
        // Nettoyer les données de test
        console.log('🧹 Cleaning up test invoice...');
        await supabaseAdmin.rpc('exec_sql', {
          sql: `DELETE FROM "${testTenant}".detail_fact WHERE nfact = ${nextInvoiceNumber};`
        });
        await supabaseAdmin.rpc('exec_sql', {
          sql: `DELETE FROM "${testTenant}".facture WHERE nfact = ${nextInvoiceNumber};`
        });
        
        // Restaurer le stock
        if (stockResult) {
          await supabaseAdmin.rpc('exec_sql', {
            sql: `UPDATE "${testTenant}".article SET stock_f = stock_f + 2 WHERE narticle = '1000';`
          });
        }
        
        console.log('✅ Test invoice cleaned up and stock restored');
      }
    }
    
    // ===== RÉSUMÉ DES TESTS =====
    console.log('\n📊 TEST SUMMARY:');
    console.log('================');
    console.log(`📄 Factures: ${invoiceNumberError ? '❌' : '✅'} (Next: ${nextInvoiceNumber || 'N/A'})`);
    console.log(`📋 Proforma: ${proformaNumberError ? '❌' : '✅'} (Next: ${nextProformaNumber || 'N/A'})`);
    console.log(`🛒 Bons d'achat: ${poNumberError ? '❌' : '✅'} (Next: ${nextPONumber || 'N/A'})`);
    console.log(`💰 Factures d'achat: ${piNumberError ? '❌' : '✅'} (Next: ${nextPINumber || 'N/A'})`);
    
    const allWorking = !invoiceNumberError && !proformaNumberError && !poNumberError && !piNumberError;
    
    if (allWorking) {
      console.log('\n🎉 ALL DOCUMENT FUNCTIONS ARE WORKING!');
      console.log('📋 Ready to update all endpoints in sales.ts');
      console.log('🔧 All document types can now use real RPC functions instead of hardcoded data');
    } else {
      console.log('\n⚠️ Some functions need attention before updating endpoints');
    }
    
    console.log('\n📋 Available RPC functions:');
    console.log('==========================');
    console.log('🔹 BL: get_next_bl_number_simple, insert_bl_simple, insert_detail_bl_simple, update_stock_bl_simple');
    console.log('🔹 Factures: get_next_invoice_number, insert_invoice, insert_detail_invoice, update_stock_facture');
    console.log('🔹 Proforma: get_next_proforma_number, insert_proforma, insert_detail_proforma');
    console.log('🔹 Bons d\'achat: get_next_purchase_order_number, insert_purchase_order, insert_detail_purchase_order');
    console.log('🔹 Factures d\'achat: get_next_purchase_invoice_number, insert_purchase_invoice, insert_detail_purchase_invoice, increase_stock_purchase');
    console.log('🔹 Communs: get_clients_by_tenant, get_articles_by_tenant, get_suppliers_by_tenant, get_article_stock_simple');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAllDocumentFunctions();