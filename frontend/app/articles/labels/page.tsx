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
  showCode: boolean;
  showDesignation: boolean;
  showPrice: boolean;
  showPriceHT: boolean;
  showBarcode: boolean;
  showFamily: boolean;
}

interface LabelSize {
  id: string;
  name: string;
  width: number;  // en mm
  height: number; // en mm
  padding: number; // en mm
  fontSize: {
    code: number;      // en pt
    designation: number;
    family: number;
    priceHT: number;
    priceTTC: number;
    label: number;     // HT/TTC
    currency: number;  // DA
  };
  barcode: {
    width: number;     // en %
    height: number;    // en mm
    jsWidth: number;   // paramètre JsBarcode
    jsHeight: number;  // paramètre JsBarcode
  };
}

const LABEL_SIZES: LabelSize[] = [
  {
    id: 'small',
    name: '50mm x 30mm (Petite)',
    width: 50,
    height: 30,
    padding: 2,
    fontSize: {
      code: 14,
      designation: 8,
      family: 7,
      priceHT: 12,
      priceTTC: 14,
      label: 8,
      currency: 7
    },
    barcode: {
      width: 75,
      height: 4,
      jsWidth: 0.9,
      jsHeight: 20
    }
  },
  {
    id: 'medium',
    name: '60mm x 40mm (Moyenne)',
    width: 60,
    height: 40,
    padding: 2.5,
    fontSize: {
      code: 16,
      designation: 10,
      family: 8,
      priceHT: 14,
      priceTTC: 16,
      label: 9,
      currency: 8
    },
    barcode: {
      width: 75,
      height: 6,
      jsWidth: 1.2,
      jsHeight: 30
    }
  },
  {
    id: 'large',
    name: '70mm x 50mm (Grande)',
    width: 70,
    height: 50,
    padding: 3,
    fontSize: {
      code: 18,
      designation: 12,
      family: 9,
      priceHT: 16,
      priceTTC: 18,
      label: 10,
      currency: 9
    },
    barcode: {
      width: 80,
      height: 8,
      jsWidth: 1.4,
      jsHeight: 40
    }
  },
  {
    id: 'xlarge',
    name: '100mm x 50mm (Très grande)',
    width: 100,
    height: 50,
    padding: 3,
    fontSize: {
      code: 20,
      designation: 14,
      family: 10,
      priceHT: 18,
      priceTTC: 20,
      label: 11,
      currency: 10
    },
    barcode: {
      width: 85,
      height: 9,
      jsWidth: 1.6,
      jsHeight: 45
    }
  }
];

export default function ArticleLabelsPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<LabelConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [labelSize, setLabelSize] = useState<LabelSize>(() => {
    // Charger la taille sauvegardée ou utiliser la taille petite par défaut
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('labelSize');
      if (saved) {
        const savedId = saved;
        return LABEL_SIZES.find(s => s.id === savedId) || LABEL_SIZES[0];
      }
    }
    return LABEL_SIZES[0]; // Petite (50mm x 30mm) par défaut
  });

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    // Sauvegarder la taille sélectionnée
    if (typeof window !== 'undefined') {
      localStorage.setItem('labelSize', labelSize.id);
    }
  }, [labelSize]);

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
        showCode: true,           // Code article activé par défaut
        showDesignation: false,   // Désignation désactivée par défaut
        showPrice: true,          // Prix TTC activé par défaut
        showPriceHT: true,        // Prix HT activé par défaut
        showBarcode: false,       // Code-barres désactivé par défaut
        showFamily: false         // Famille désactivée par défaut
      }]);
    }
  };

  const updateLabelConfig = (narticle: string, updates: Partial<LabelConfig>) => {
    setSelectedArticles(selectedArticles.map(label =>
      label.article.narticle === narticle ? { 
        ...label, 
        ...updates,
        // S'assurer que toutes les propriétés booléennes existent
        showCode: updates.showCode !== undefined ? updates.showCode : (label.showCode ?? true),
        showDesignation: updates.showDesignation !== undefined ? updates.showDesignation : (label.showDesignation ?? true),
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

  const formatPrice = (price: number): string => {
    return price.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).replace(/\s/g, ' '); // Utiliser des espaces insécables
  };

  const generateLabelStyles = (size: LabelSize) => {
    return `
      .label {
        width: ${size.width}mm;
        height: ${size.height}mm;
        padding: ${size.padding}mm;
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
        font-size: ${size.fontSize.code}pt;
        font-weight: bold;
        text-align: center;
        margin-bottom: 1mm;
      }
      
      .label-designation {
        font-size: ${size.fontSize.designation}pt;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-height: ${size.fontSize.designation * 0.5}mm;
        text-align: center;
      }
      
      .label-family {
        font-size: ${size.fontSize.family}pt;
        color: #666;
        font-style: italic;
        text-align: center;
      }
      
      .label-price {
        font-size: ${size.fontSize.priceTTC}pt;
        font-weight: bold;
        text-align: left;
        margin: 0.5mm 0;
        color: #d32f2f;
      }
      
      .label-price-ht {
        font-size: ${size.fontSize.priceHT}pt;
        font-weight: bold;
        text-align: left;
        margin: 0.5mm 0;
        color: #1976d2;
      }
      
      .label-barcode-container {
        text-align: center;
        margin-top: 1mm;
        page-break-inside: avoid;
      }
      
      .barcode {
        width: ${size.barcode.width}%;
        height: ${size.barcode.height}mm;
        max-height: ${size.barcode.height}mm;
      }
    `;
  };

  const previewLabels = () => {
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) return;

    const labelsHtml = selectedArticles.flatMap(config => 
      Array(config.quantity).fill(null).map(() => generateLabelHtml(config))
    ).join('');

    const dynamicStyles = generateLabelStyles(labelSize);

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
          
          ${dynamicStyles}
          
          .currency {
            font-size: ${labelSize.fontSize.currency}pt;
            font-weight: normal;
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
              const barcodeValue = svg.getAttribute('data-barcode');
              if (barcodeValue) {
                try {
                  JsBarcode(svg, barcodeValue, {
                    format: 'CODE128',
                    width: ${labelSize.barcode.jsWidth},
                    height: ${labelSize.barcode.jsHeight},
                    displayValue: false,
                    margin: 0
                  });
                } catch (e) {
                  console.error('Erreur génération code-barres:', e);
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

    const dynamicStyles = generateLabelStyles(labelSize);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Étiquettes Articles</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          @page {
            size: ${labelSize.width}mm ${labelSize.height}mm;
            margin: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          
          ${dynamicStyles}
          
          .currency {
            font-size: ${labelSize.fontSize.currency}pt;
            font-weight: normal;
          }
          
          .label {
            page-break-after: always;
            border: 1px solid #000;
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
            barcodes.forEach((svg) => {
              const barcodeValue = svg.getAttribute('data-barcode');
              if (barcodeValue) {
                try {
                  JsBarcode(svg, barcodeValue, {
                    format: 'CODE128',
                    width: ${labelSize.barcode.jsWidth},
                    height: ${labelSize.barcode.jsHeight},
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
    const { article, showCode, showDesignation, showPrice, showPriceHT, showBarcode, showFamily } = config;
    
    // Calculer le prix HT si TVA disponible
    const prixHT = article.tva 
      ? article.prix_vente / (1 + article.tva / 100)
      : article.prix_achat || article.prix_vente * 0.81; // Fallback: -19% si pas de TVA
    
    // Fonction pour formater les prix avec espaces
    const formatPrice = (price: number) => {
      return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };
    
    // Utiliser le code-barres s'il existe, sinon utiliser le code article
    const barcodeValue = article.code_barre || article.narticle;
    
    return `
      <div class="label">
        <div>
          ${showCode ? `<div class="label-code">${article.narticle}</div>` : ''}
          ${showDesignation ? `<div class="label-designation">${article.designation}</div>` : ''}
          ${showFamily && article.famille ? `<div class="label-family">${article.famille}</div>` : ''}
        </div>
        <div>
          ${showPriceHT ? `<div class="label-price-ht"><span style="font-size: ${labelSize.fontSize.label}pt;">HT:</span> ${formatPrice(prixHT)} <span style="font-size: ${labelSize.fontSize.currency}pt; font-weight: normal;">DA</span></div>` : ''}
          ${showPrice ? `<div class="label-price"><span style="font-size: ${labelSize.fontSize.label}pt;">TTC:</span> ${formatPrice(article.prix_vente)} <span style="font-size: ${labelSize.fontSize.currency}pt; font-weight: normal;">DA</span></div>` : ''}
        </div>
        ${showBarcode ? `
          <div class="label-barcode-container">
            <svg class="barcode" data-barcode="${barcodeValue}"></svg>
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
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Taille:
            <select
              value={labelSize.id}
              onChange={(e) => {
                const newSize = LABEL_SIZES.find(s => s.id === e.target.value);
                if (newSize) setLabelSize(newSize);
              }}
              style={{
                padding: '0.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                backgroundColor: 'var(--background)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              {LABEL_SIZES.map(size => (
                <option key={size.id} value={size.id}>{size.name}</option>
              ))}
            </select>
          </label>
          <button 
            onClick={previewLabels}
            disabled={selectedArticles.length === 0}
            className={styles.secondaryButton}
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
                          checked={config.showCode ?? true}
                          onChange={(e) => updateLabelConfig(config.article.narticle, { 
                            showCode: e.target.checked 
                          })}
                        />
                        {' '}Afficher le code article
                      </label>
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        <input
                          type="checkbox"
                          checked={config.showDesignation ?? false}
                          onChange={(e) => updateLabelConfig(config.article.narticle, { 
                            showDesignation: e.target.checked 
                          })}
                        />
                        {' '}Afficher la désignation
                      </label>
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
                          checked={config.showBarcode ?? false}
                          onChange={(e) => updateLabelConfig(config.article.narticle, { 
                            showBarcode: e.target.checked 
                          })}
                        />
                        {' '}Afficher le code-barres
                      </label>
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        <input
                          type="checkbox"
                          checked={config.showFamily ?? false}
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


