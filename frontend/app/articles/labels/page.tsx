'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

interface Article {
  narticle: string;
  designation: string;
  prix_vente: number;
  prix_achat?: number;
  code_barre?: string;
  famille?: string;
  tva?: number;
}

interface LabelConfig {
  article: Article;
  quantity: number;
  showPrice: boolean;
  showPriceHT: boolean;
  showBarcode: boolean;
  showFamily: boolean;
}

export default function ArticleLabelsPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<LabelConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    // S'assurer qu'on est côté client
    if (typeof window === 'undefined') return;
    
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const response = await fetch(getApiUrl('sales/articles'), {
        headers: { 'X-Tenant': tenant }
      });
      
      const data = await response.json();
      if (data.success) {
        // Normaliser les données pour s'assurer que prix_vente est un nombre
        const normalizedArticles = data.data.map((article: any) => ({
          ...article,
          prix_vente: parseFloat(article.prix_vente) || 0
        }));
        setArticles(normalizedArticles);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const addArticleToLabels = (article: Article) => {
    const existing = selectedArticles.find(a => a.article.narticle === article.narticle);
    if (existing) {
      setSelectedArticles(selectedArticles.map(a => 
        a.article.narticle === article.narticle 
          ? { ...a, quantity: a.quantity + 1 }
          : a
      ));
    } else {
      setSelectedArticles([...selectedArticles, {
        article,
        quantity: 1,
        showPrice: true,
        showPriceHT: true,
        showBarcode: true,
        showFamily: true
      }]);
    }
  };

  const updateLabelConfig = (narticle: string, updates: Partial<LabelConfig>) => {
    setSelectedArticles(selectedArticles.map(label =>
      label.article.narticle === narticle ? { 
        ...label, 
        ...updates,
        // S'assurer que toutes les propriétés booléennes existent
        showPrice: updates.showPrice !== undefined ? updates.showPrice : label.showPrice,
        showPriceHT: updates.showPriceHT !== undefined ? updates.showPriceHT : (label.showPriceHT ?? true),
        showBarcode: updates.showBarcode !== undefined ? updates.showBarcode : label.showBarcode,
        showFamily: updates.showFamily !== undefined ? updates.showFamily : label.showFamily
      } : label
    ));
  };

  const removeLabel = (narticle: string) => {
    setSelectedArticles(selectedArticles.filter(l => l.article.narticle !== narticle));
  };

  const previewLabels = () => {
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) return;

    const labelsHtml = selectedArticles.flatMap(config => 
      Array(config.quantity).fill(null).map(() => generateLabelHtml(config))
    ).join('');

    previewWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Aperçu des Étiquettes</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          body {
            margin: 20px;
            padding: 0;
            font-family: Arial, sans-serif;
            background: #f5f5f5;
          }
          
          .preview-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: center;
          }
          
          .label {
            width: 50mm;
            height: 30mm;
            padding: 2mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            border: 2px solid #333;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            page-break-inside: avoid;
          }
          
          .label > * {
            page-break-inside: avoid;
          }
          
          .label-code {
            font-size: 9pt;
            font-weight: bold;
          }
          
          .label-designation {
            font-size: 7pt;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-height: 3.5mm;
          }
          
          .label-family {
            font-size: 6pt;
            color: #666;
            font-style: italic;
          }
          
          .label-price {
            font-size: 12pt;
            font-weight: bold;
            text-align: center;
            margin: 0.3mm 0;
            color: #d32f2f;
          }
          
          .label-price-ht {
            font-size: 9pt;
            font-weight: bold;
            text-align: center;
            margin: 0.3mm 0;
            color: #1976d2;
          }
          
          .label-barcode-container {
            text-align: center;
            margin-top: 0.5mm;
            page-break-inside: avoid;
          }
          
          .barcode {
            width: 100%;
            height: 6mm;
            max-height: 6mm;
          }
          
          .label-barcode-text {
            font-size: 6pt;
            text-align: center;
            font-family: monospace;
            letter-spacing: 0.5px;
            margin-top: 0.3mm;
          }
          
          .toolbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: white;
            padding: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
            z-index: 1000;
          }
          
          .toolbar button {
            padding: 10px 20px;
            margin: 0 5px;
            font-size: 14px;
            cursor: pointer;
            border: none;
            border-radius: 4px;
          }
          
          .print-btn {
            background: #4CAF50;
            color: white;
          }
          
          .close-btn {
            background: #f44336;
            color: white;
          }
          
          .content {
            margin-top: 60px;
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <button class="print-btn" onclick="window.print()">🖨️ Imprimer</button>
          <button class="close-btn" onclick="window.close()">✕ Fermer</button>
        </div>
        <div class="content">
          <div class="preview-container">
            ${labelsHtml}
          </div>
        </div>
        <script>
          window.onload = function() {
            const barcodes = document.querySelectorAll('.barcode');
            barcodes.forEach((svg) => {
              const container = svg.closest('.label-barcode-container');
              const text = container.querySelector('.label-barcode-text');
              if (text && text.textContent) {
                try {
                  JsBarcode(svg, text.textContent, {
                    format: 'CODE128',
                    width: 1,
                    height: 30,
                    displayValue: false,
                    margin: 0
                  });
                } catch (e) {
                  console.error('Erreur génération code-barres:', e);
                  // En cas d'erreur, afficher un message
                  svg.outerHTML = '<div style="font-size:8pt;color:red;">Code-barres invalide</div>';
                }
              }
            });
          };
        </script>
      </body>
      </html>
    `);

    previewWindow.document.close();
  };

  const printLabels = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const labelsHtml = selectedArticles.flatMap(config => 
      Array(config.quantity).fill(null).map(() => generateLabelHtml(config))
    ).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Étiquettes Articles</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          @page {
            size: 50mm 30mm;
            margin: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          
          .label {
            width: 50mm;
            height: 30mm;
            padding: 2mm;
            box-sizing: border-box;
            page-break-after: always;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            border: 1px solid #000;
          }
          
          .label > * {
            page-break-inside: avoid;
          }
          
          .label-header {
            text-align: center;
            font-weight: bold;
            font-size: 10pt;
            border-bottom: 1px solid #000;
            padding-bottom: 1mm;
            margin-bottom: 1mm;
          }
          
          .label-code {
            font-size: 9pt;
            font-weight: bold;
          }
          
          .label-designation {
            font-size: 7pt;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-height: 3.5mm;
          }
          
          .label-family {
            font-size: 6pt;
            color: #666;
            font-style: italic;
          }
          
          .label-price {
            font-size: 12pt;
            font-weight: bold;
            text-align: center;
            margin: 0.3mm 0;
            color: #d32f2f;
          }
          
          .label-price-ht {
            font-size: 9pt;
            font-weight: bold;
            text-align: center;
            margin: 0.3mm 0;
            color: #1976d2;
          }
          
          .label-barcode-container {
            text-align: center;
            margin-top: 0.5mm;
            page-break-inside: avoid;
          }
          
          .barcode {
            width: 100%;
            height: 6mm;
            max-height: 6mm;
          }
          
          .label-barcode-text {
            font-size: 6pt;
            text-align: center;
            font-family: monospace;
            letter-spacing: 0.5px;
            margin-top: 0.3mm;
          }
          
          @media print {
            .label {
              border: none;
            }
          }
        </style>
      </head>
      <body>
        ${labelsHtml}
        <script>
          // Générer les codes-barres après le chargement
          window.onload = function() {
            const barcodes = document.querySelectorAll('.barcode');
            barcodes.forEach((svg, index) => {
              const container = svg.closest('.label-barcode-container');
              const text = container.querySelector('.label-barcode-text');
              if (text && text.textContent) {
                try {
                  JsBarcode(svg, text.textContent, {
                    format: 'CODE128',
                    width: 1,
                    height: 30,
                    displayValue: false,
                    margin: 0
                  });
                } catch (e) {
                  console.error('Erreur génération code-barres:', e);
                }
              }
            });
            
            // Imprimer après génération des codes-barres
            setTimeout(() => window.print(), 500);
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  const generateLabelHtml = (config: LabelConfig) => {
    const { article, showPrice, showPriceHT, showBarcode, showFamily } = config;
    
    // Calculer le prix HT si TVA disponible
    const prixHT = article.tva 
      ? article.prix_vente / (1 + article.tva / 100)
      : article.prix_achat || article.prix_vente * 0.81; // Fallback: -19% si pas de TVA
    
    // Utiliser le code-barres s'il existe, sinon utiliser le code article
    const barcodeValue = article.code_barre || article.narticle;
    
    return `
      <div class="label">
        <div>
          <div class="label-code">${article.narticle}</div>
          <div class="label-designation">${article.designation}</div>
          ${showFamily && article.famille ? `<div class="label-family">${article.famille}</div>` : ''}
        </div>
        <div>
          ${showPriceHT ? `<div class="label-price-ht">HT: ${prixHT.toFixed(2)} DA</div>` : ''}
          ${showPrice ? `<div class="label-price">TTC: ${article.prix_vente?.toFixed(2)} DA</div>` : ''}
        </div>
        ${showBarcode ? `
          <div class="label-barcode-container">
            <svg class="barcode"></svg>
            <div class="label-barcode-text">${barcodeValue}</div>
          </div>
        ` : ''}
      </div>
    `;
  };

  const filteredArticles = articles.filter(a =>
    a.narticle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.designation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>🏷️ Impression d'Étiquettes</h1>
        <div>
          <button 
            onClick={previewLabels}
            disabled={selectedArticles.length === 0}
            className={styles.secondaryButton}
            style={{ marginRight: '0.5rem' }}
          >
            👁️ Aperçu
          </button>
          <button 
            onClick={printLabels}
            disabled={selectedArticles.length === 0}
            className={styles.primaryButton}
          >
            🖨️ Imprimer ({selectedArticles.reduce((sum, l) => sum + l.quantity, 0)} étiquettes)
          </button>
          <button onClick={() => router.push('/dashboard')} className={styles.secondaryButton}>
            Retour
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Liste des articles */}
          <div>
            <h2>Articles Disponibles</h2>
            <input
              type="text"
              placeholder="🔍 Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginBottom: '1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '1rem',
                backgroundColor: 'var(--background)',
                color: 'var(--text-primary)'
              }}
            />
            
            <div style={{ 
              maxHeight: '600px', 
              overflowY: 'auto',
              border: '1px solid var(--border-color)',
              borderRadius: '8px'
            }}>
              {filteredArticles.map(article => (
                <div
                  key={article.narticle}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    backgroundColor: 'var(--card-background)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--card-background-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--card-background)'}
                  onClick={() => addArticleToLabels(article)}
                >
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{article.narticle}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{article.designation}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--success-color)', marginTop: '0.25rem' }}>
                    {(parseFloat(article.prix_vente as any) || 0).toFixed(2)} DA
                  </div>
                  {article.code_barre && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                      📊 Code-barres: {article.code_barre}
                    </div>
                  )}
                  {!article.code_barre && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--warning-color)', marginTop: '0.25rem' }}>
                      ⚠️ Pas de code-barres
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Configuration des étiquettes */}
          <div>
            <h2>Étiquettes à Imprimer</h2>
            {selectedArticles.length === 0 ? (
              <div style={{ 
                padding: '3rem', 
                textAlign: 'center', 
                color: 'var(--text-tertiary)',
                border: '2px dashed var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--background-secondary)'
              }}>
                <p>Cliquez sur un article pour ajouter une étiquette</p>
              </div>
            ) : (
              <div style={{ 
                maxHeight: '600px', 
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1rem',
                backgroundColor: 'var(--background)'
              }}>
                {selectedArticles.map(config => (
                  <div
                    key={config.article.narticle}
                    style={{
                      padding: '1rem',
                      marginBottom: '1rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--card-background)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{config.article.narticle}</strong>
                      <button
                        onClick={() => removeLabel(config.article.narticle)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--error-color)',
                          cursor: 'pointer',
                          fontSize: '1.2rem'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                      {config.article.designation}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label style={{ color: 'var(--text-primary)' }}>Quantité:</label>
                      <input
                        type="number"
                        min="1"
                        value={config.quantity}
                        onChange={(e) => updateLabelConfig(config.article.narticle, { 
                          quantity: parseInt(e.target.value) || 1 
                        })}
                        style={{
                          width: '80px',
                          padding: '0.25rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          backgroundColor: 'var(--background)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        <input
                          type="checkbox"
                          checked={config.showPrice ?? true}
                          onChange={(e) => updateLabelConfig(config.article.narticle, { 
                            showPrice: e.target.checked 
                          })}
                        />
                        {' '}Afficher le prix TTC
                      </label>
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        <input
                          type="checkbox"
                          checked={config.showPriceHT ?? true}
                          onChange={(e) => updateLabelConfig(config.article.narticle, { 
                            showPriceHT: e.target.checked 
                          })}
                        />
                        {' '}Afficher le prix HT
                      </label>
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        <input
                          type="checkbox"
                          checked={config.showBarcode ?? true}
                          onChange={(e) => updateLabelConfig(config.article.narticle, { 
                            showBarcode: e.target.checked 
                          })}
                        />
                        {' '}Afficher le code-barres
                      </label>
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        <input
                          type="checkbox"
                          checked={config.showFamily ?? true}
                          onChange={(e) => updateLabelConfig(config.article.narticle, { 
                            showFamily: e.target.checked 
                          })}
                        />
                        {' '}Afficher la famille
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
