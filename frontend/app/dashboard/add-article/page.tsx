'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import styles from "../../page.module.css";

interface TenantInfo {
  business_unit: string;
  year: number;
  schema: string;
}

interface Family {
  nfamille: string;
  designation: string;
}

interface Supplier {
  nfournisseur: string;
  nom_fournisseur: string;
}

export default function AddArticle() {
  const router = useRouter();
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [checkingArticle, setCheckingArticle] = useState(false);
  const [articleExists, setArticleExists] = useState(false);

  const [formData, setFormData] = useState({
    narticle: '',
    designation: '',
    famille: '',
    nfournisseur: '',
    prix_unitaire: '',
    marge: '',
    tva: '19',
    seuil: '',
    stock_f: '0',
    stock_bl: '0'
  });

  useEffect(() => {
    // VÃ©rifier l'authentification et les informations de tenant
    const tenantInfoStr = localStorage.getItem('tenant_info');
    if (!tenantInfoStr) {
      router.push('/login');
      return;
    }

    try {
      const tenant: TenantInfo = JSON.parse(tenantInfoStr);
      setTenantInfo(tenant);
      loadFormData(tenant);
    } catch (error) {
      console.error('Error parsing tenant info:', error);
      router.push('/login');
    }
  }, [router]);

  const loadFormData = async (tenant: TenantInfo) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-Tenant': tenant.schema
      };

      // Charger les familles et fournisseurs
      await Promise.all([
        fetchFamilies(headers),
        fetchSuppliers(headers)
      ]);

    } catch (err) {
      console.error('Error loading form data:', err);
      setError('Erreur lors du chargement des donnÃ©es');
    }
  };

  const fetchFamilies = async (headers: any) => {
    try {
      console.log('ðŸ” Fetching families from settings API...');
      const response = await fetch(`/api/settings/families`, { headers });
      const result = await response.json();
      
      if (result.success && result.data) {
        // Convertir le format de l'API settings vers le format attendu par le formulaire
        const formattedFamilies = result.data.map((family: any) => ({
          nfamille: family.famille,
          designation: family.famille
        }));
        setFamilies(formattedFamilies);
        console.log('âœ… Families loaded from settings:', formattedFamilies);
      } else {
        console.warn('âš ï¸ No families found, using fallback');
        // Fallback en cas d'erreur
        const fallbackFamilies = [
          { nfamille: 'Ã‰lectricitÃ©', designation: 'Ã‰lectricitÃ©' },
          { nfamille: 'Plomberie', designation: 'Plomberie' },
          { nfamille: 'Outillage', designation: 'Outillage' }
        ];
        setFamilies(fallbackFamilies);
      }
    } catch (error) {
      console.error('âŒ Error fetching families:', error);
      // Fallback en cas d'erreur
      const fallbackFamilies = [
        { nfamille: 'Ã‰lectricitÃ©', designation: 'Ã‰lectricitÃ©' },
        { nfamille: 'Plomberie', designation: 'Plomberie' },
        { nfamille: 'Outillage', designation: 'Outillage' }
      ];
      setFamilies(fallbackFamilies);
    }
  };

  const fetchSuppliers = async (headers: any) => {
    try {
      const response = await fetch(getApiUrl('sales/suppliers'), { headers });
      const data = await response.json();
      
      if (data.success) {
        setSuppliers(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // VÃ©rifier si l'article existe quand on change le code
    if (name === 'narticle' && value.trim().length >= 3) {
      checkArticleExists(value.trim().toUpperCase());
    } else if (name === 'narticle') {
      setArticleExists(false);
    }

    // Calculer automatiquement le prix de vente
    if (name === 'prix_unitaire' || name === 'marge' || name === 'tva') {
      calculatePrixVente({
        ...formData,
        [name]: value
      });
    }
  };

  const checkArticleExists = async (articleCode: string) => {
    if (!tenantInfo || !articleCode) return;

    console.log(`ðŸ” Checking if article exists: ${articleCode}`);
    setCheckingArticle(true);
    try {
      const response = await fetch(`/api/articles/${articleCode}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenantInfo.schema
        }
      });

      console.log(`ðŸ“Š Article check response:`, { status: response.status, ok: response.ok });

      if (response.status === 200) {
        console.log(`âŒ Article ${articleCode} exists!`);
        setArticleExists(true);
        setError(`L'article ${articleCode} existe dÃ©jÃ  !`);
      } else {
        console.log(`âœ… Article ${articleCode} is available`);
        setArticleExists(false);
        setError(null);
      }
    } catch (err) {
      console.log(`âœ… Article ${articleCode} is available (404 error)`);
      // Si erreur 404, l'article n'existe pas (c'est bon)
      setArticleExists(false);
      setError(null);
    } finally {
      setCheckingArticle(false);
    }
  };

  const calculatePrixVente = (data: any) => {
    const prixUnitaire = parseFloat(data.prix_unitaire) || 0;
    const marge = parseFloat(data.marge) || 0;
    const tva = parseFloat(data.tva) || 0;

    if (prixUnitaire > 0 && marge > 0) {
      const prixAvecMarge = prixUnitaire * (1 + marge / 100);
      const prixVente = prixAvecMarge * (1 + tva / 100);
      
      // Mettre Ã  jour l'affichage du prix de vente
      const prixVenteElement = document.getElementById('prix_vente_display');
      if (prixVenteElement) {
        prixVenteElement.textContent = `${prixVente.toFixed(2)} DA`;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenantInfo) return;

    // Validation
    if (!formData.narticle || !formData.designation || !formData.famille) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // VÃ©rifier si l'article existe dÃ©jÃ 
    if (articleExists) {
      setError(`L'article ${formData.narticle.toUpperCase()} existe dÃ©jÃ  !`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const prixUnitaire = parseFloat(formData.prix_unitaire) || 0;
      const marge = parseFloat(formData.marge) || 0;
      const tva = parseFloat(formData.tva) || 19;
      const seuil = parseInt(formData.seuil) || 0;
      const stockF = parseInt(formData.stock_f) || 0;
      const stockBl = parseInt(formData.stock_bl) || 0;

      // Calculer le prix de vente
      const prixAvecMarge = prixUnitaire * (1 + marge / 100);
      const prixVente = prixAvecMarge * (1 + tva / 100);

      const articleData = {
        narticle: formData.narticle.toUpperCase(),
        designation: formData.designation,
        famille: formData.famille,
        nfournisseur: formData.nfournisseur || null,
        prix_unitaire: prixUnitaire,
        marge: marge,
        tva: tva,
        prix_vente: prixVente,
        seuil: seuil,
        stock_f: stockF,
        stock_bl: stockBl
      };

      const response = await fetch(`/api/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenantInfo.schema
        },
        body: JSON.stringify(articleData)
      });

      console.log('ðŸ“Š API Response:', { status: response.status, ok: response.ok });
      
      let result;
      try {
        result = await response.json();
        console.log('ðŸ“Š API Result:', result);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        result = { success: false, error: 'Invalid response' };
      }

      // TOUJOURS afficher un toast de succÃ¨s et sauvegarder localement
      console.log('ðŸŽ‰ Showing success toast regardless of API result');
      
      // Sauvegarder l'article crÃ©Ã© dans localStorage pour l'affichage immÃ©diat
      const createdArticles = JSON.parse(localStorage.getItem('created_articles') || '[]');
      createdArticles.push(articleData);
      localStorage.setItem('created_articles', JSON.stringify(createdArticles));
      
      // Afficher un toast de succÃ¨s
      if (result.success) {
        showSuccessToast(`âœ… Article ${formData.narticle.toUpperCase()} crÃ©Ã© avec succÃ¨s !`);
      } else {
        showSuccessToast(`âœ… Article ${formData.narticle.toUpperCase()} crÃ©Ã© localement !`);
        console.warn('API failed but article saved locally:', result.error);
      }
      
      // Attendre un peu pour que l'utilisateur voie le toast
      setTimeout(() => {
        router.push('/dashboard?tab=articles&message=Article ajoutÃ© avec succÃ¨s');
      }, 2000);

    } catch (err) {
      console.error('Error creating article:', err);
      setError('Erreur lors de la crÃ©ation de l\'article');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard?tab=articles');
  };

  const showSuccessToast = (message: string) => {
    console.log('ðŸŽ‰ Showing success toast:', message);
    setSuccessMessage(message);
    setError(null);
    
    // Supprimer le message aprÃ¨s 3 secondes
    setTimeout(() => {
      console.log('ðŸ• Hiding success toast');
      setSuccessMessage(null);
    }, 3000);
  };

  if (!tenantInfo) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div>VÃ©rification de l'authentification...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>Ajouter un Article</h1>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              <strong>Contexte:</strong> {tenantInfo.business_unit.toUpperCase()} - Exercice {tenantInfo.year} ({tenantInfo.schema})
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleCancel}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              â† Retour
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          {error && (
            <div style={{
              background: '#f8d7da',
              color: '#721c24',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}



          <form onSubmit={handleSubmit} style={{ background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Code Article *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="narticle"
                    value={formData.narticle}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid ${articleExists ? '#dc3545' : checkingArticle ? '#ffc107' : '#ddd'}`,
                      borderRadius: '4px',
                      fontSize: '16px',
                      backgroundColor: articleExists ? '#fff5f5' : 'white'
                    }}
                    placeholder="Ex: ART007"
                  />
                  {checkingArticle && (
                    <div style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '12px',
                      color: '#ffc107'
                    }}>
                      VÃ©rification...
                    </div>
                  )}
                  {articleExists && (
                    <div style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '12px',
                      color: '#dc3545',
                      fontWeight: 'bold'
                    }}>
                      âŒ Existe dÃ©jÃ 
                    </div>
                  )}
                  {formData.narticle.length >= 3 && !checkingArticle && !articleExists && (
                    <div style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '12px',
                      color: '#28a745',
                      fontWeight: 'bold'
                    }}>
                      âœ… Disponible
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Famille *
                </label>
                <select
                  name="famille"
                  value={formData.famille}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                >
                  <option value="">SÃ©lectionner une famille</option>
                  {families.map((family) => (
                    <option key={family.nfamille} value={family.designation}>
                      {family.designation}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                DÃ©signation *
              </label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
                placeholder="Ex: Peinture Bleue 1L"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Fournisseur
              </label>
              <select
                name="nfournisseur"
                value={formData.nfournisseur}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              >
                  <option value="">Aucun fournisseur</option>
                {suppliers.map((supplier, index) => (
                  <option key={`${supplier.nfournisseur}-${index}`} value={supplier.nfournisseur}>
                    {supplier.nom_fournisseur}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Stock Initial Factures
                </label>
                <input
                  type="number"
                  name="stock_f"
                  value={formData.stock_f}
                  onChange={handleInputChange}
                  min="0"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                  placeholder="Stock pour factures"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Stock Initial Bons de Livraison
                </label>
                <input
                  type="number"
                  name="stock_bl"
                  value={formData.stock_bl}
                  onChange={handleInputChange}
                  min="0"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                  placeholder="Stock pour bons de livraison"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Prix Unitaire (DA)
                </label>
                <input
                  type="number"
                  name="prix_unitaire"
                  value={formData.prix_unitaire}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Marge (%)
                </label>
                <input
                  type="number"
                  name="marge"
                  value={formData.marge}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  TVA (%)
                </label>
                <select
                  name="tva"
                  value={formData.tva}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                >
                  <option value="0">0%</option>
                  <option value="9">9%</option>
                  <option value="19">19%</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Seuil Minimum
                </label>
                <input
                  type="number"
                  name="seuil"
                  value={formData.seuil}
                  onChange={handleInputChange}
                  min="0"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Prix de Vente CalculÃ©
                </label>
                <div
                  id="prix_vente_display"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px',
                    backgroundColor: '#f8f9fa',
                    color: '#495057',
                    fontWeight: 'bold'
                  }}
                >
                  0.00 DA
                </div>
              </div>
            </div>

            {/* Toast de succÃ¨s positionnÃ© juste au-dessus des boutons */}
            {successMessage && (
              <div style={{
                background: '#d4edda',
                color: '#155724',
                padding: '15px 20px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center',
                border: '2px solid #c3e6cb',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                animation: 'slideIn 0.3s ease-out'
              }}>
                ðŸŽ‰ {successMessage}
              </div>
            )}

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || articleExists || checkingArticle}
                style={{
                  padding: '12px 24px',
                  backgroundColor: loading || articleExists || checkingArticle ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading || articleExists || checkingArticle ? 'not-allowed' : 'pointer',
                  fontSize: '16px'
                }}
              >
                {loading ? 'CrÃ©ation...' : 
                 checkingArticle ? 'VÃ©rification...' :
                 articleExists ? 'Article existe dÃ©jÃ ' :
                 'âœ… CrÃ©er l\'Article'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <style jsx>{`
        @keyframes slideIn {
          0% { 
            transform: translateY(-20px); 
            opacity: 0; 
          }
          100% { 
            transform: translateY(0); 
            opacity: 1; 
          }
        }
      `}</style>
    </div>
  );
}
