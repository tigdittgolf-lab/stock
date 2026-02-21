'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from "../../../page.module.css";

// Fonction helper pour construire les URLs d'API
const getApiUrl = (path: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api';
  return `${baseUrl}/${path}`;
};

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

interface Article {
  narticle: string;
  designation: string;
  famille: string;
  nfournisseur?: string;
  prix_unitaire: number;
  marge: number;
  tva: number;
  prix_vente: number;
  seuil: number;
  stock_f: number;
  stock_bl: number;
}

export default function EditArticle() {
  const router = useRouter();
  const params = useParams();
  // Trim whitespace from article ID to handle any leading/trailing spaces
  const articleId = (params.id as string).trim();
  
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [articleLoading, setArticleLoading] = useState(true);

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
    // Vérifier l'authentification et les informations de tenant
    const tenantInfoStr = localStorage.getItem('tenant_info');
    if (!tenantInfoStr) {
      router.push('/login');
      return;
    }

    try {
      const tenant: TenantInfo = JSON.parse(tenantInfoStr);
      setTenantInfo(tenant);
      loadFormData(tenant);
      loadArticleData(tenant, articleId);
    } catch (error) {
      console.error('Error parsing tenant info:', error);
      router.push('/login');
    }
  }, [router, articleId]);

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
      setError('Erreur lors du chargement des données');
    }
  };

  const loadArticleData = async (tenant: TenantInfo, id: string) => {
    try {
      setArticleLoading(true);
      
      // Récupérer le type de base de données depuis localStorage
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
      
      const response = await fetch(`http://localhost:3005/api/articles/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenant.schema,
          'X-Database-Type': dbType
        }
      });

      const result = await response.json();

      if (result.success && result.data) {
        const article = result.data;
        setFormData({
          narticle: article.narticle,
          designation: article.designation,
          famille: article.famille,
          nfournisseur: article.nfournisseur || '',
          prix_unitaire: article.prix_unitaire.toString(),
          marge: article.marge.toString(),
          tva: article.tva.toString(),
          seuil: article.seuil.toString(),
          stock_f: article.stock_f.toString(),
          stock_bl: article.stock_bl.toString()
        });
      } else {
        setError('Article non trouvé');
      }
    } catch (err) {
      console.error('Error loading article:', err);
      setError('Erreur lors du chargement de l\'article');
    } finally {
      setArticleLoading(false);
    }
  };

  const fetchFamilies = async (headers: any) => {
    try {
      console.log('🔍 Fetching families from settings API...');
      const response = await fetch(`http://localhost:3005/api/settings/families`, { headers });
      const result = await response.json();
      
      if (result.success && result.data) {
        // Convertir le format de l'API settings vers le format attendu par le formulaire
        const formattedFamilies = result.data.map((family: any) => ({
          nfamille: family.famille,
          designation: family.famille
        }));
        setFamilies(formattedFamilies);
        console.log('✅ Families loaded from settings:', formattedFamilies);
      } else {
        console.warn('⚠️ No families found, using fallback');
        // Fallback en cas d'erreur
        const fallbackFamilies = [
          { nfamille: 'Droguerie', designation: 'Droguerie' },
          { nfamille: 'Peinture', designation: 'Peinture' },
          { nfamille: 'Outillage', designation: 'Outillage' },
          { nfamille: 'Électricité', designation: 'Électricité' },
          { nfamille: 'Plomberie', designation: 'Plomberie' },
          { nfamille: 'Quincaillerie', designation: 'Quincaillerie' }
        ];
        setFamilies(fallbackFamilies);
      }
    } catch (error) {
      console.error('❌ Error fetching families:', error);
      // Fallback en cas d'erreur
      const fallbackFamilies = [
        { nfamille: 'Droguerie', designation: 'Droguerie' },
        { nfamille: 'Peinture', designation: 'Peinture' },
        { nfamille: 'Outillage', designation: 'Outillage' },
        { nfamille: 'Électricité', designation: 'Électricité' },
        { nfamille: 'Plomberie', designation: 'Plomberie' },
        { nfamille: 'Quincaillerie', designation: 'Quincaillerie' }
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

    // Calculer automatiquement le prix de vente
    if (name === 'prix_unitaire' || name === 'marge' || name === 'tva') {
      calculatePrixVente({
        ...formData,
        [name]: value
      });
    }
  };

  const calculatePrixVente = (data: any) => {
    const prixUnitaire = parseFloat(data.prix_unitaire) || 0;
    const marge = parseFloat(data.marge) || 0;
    const tva = parseFloat(data.tva) || 0;

    if (prixUnitaire > 0 && marge > 0) {
      const prixAvecMarge = prixUnitaire * (1 + marge / 100);
      const prixVente = prixAvecMarge * (1 + tva / 100);
      
      // Mettre à jour l'affichage du prix de vente
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
    if (!formData.designation || !formData.famille) {
      setError('Veuillez remplir tous les champs obligatoires');
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

      const articleData = {
        designation: formData.designation,
        famille: formData.famille,
        nfournisseur: formData.nfournisseur || null,
        prix_unitaire: prixUnitaire,
        marge: marge,
        tva: tva,
        seuil: seuil,
        stock_f: stockF,
        stock_bl: stockBl
      };

      // Récupérer le type de base de données depuis localStorage
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';

      const response = await fetch(`http://localhost:3005/api/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenantInfo.schema,
          'X-Database-Type': dbType
        },
        body: JSON.stringify(articleData)
      });

      const result = await response.json();

      if (result.success) {
        showSuccessToast(`✅ Article ${formData.narticle} modifié avec succès !`);
        
        // Attendre un peu pour que l'utilisateur voie le toast
        setTimeout(() => {
          router.push('/dashboard?tab=articles&message=Article modifié avec succès');
        }, 2000);
      } else {
        setError(result.error || 'Erreur lors de la modification');
      }

    } catch (err) {
      console.error('Error updating article:', err);
      setError('Erreur lors de la modification de l\'article');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard?tab=articles');
  };

  const showSuccessToast = (message: string) => {
    setSuccessMessage(message);
    setError(null);
    
    // Supprimer le message après 3 secondes
    setTimeout(() => {
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
        <div>Vérification de l'authentification...</div>
      </div>
    );
  }

  if (articleLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div>Chargement de l'article...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>Modifier l'Article {formData.narticle}</h1>
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
              ← Retour
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
                  Code Article (Non modifiable)
                </label>
                <input
                  type="text"
                  value={formData.narticle}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px',
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d'
                  }}
                />
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
                  <option value="">Sélectionner une famille</option>
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
                Désignation *
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
                  Stock Factures
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
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Stock Bons de Livraison
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
                  Prix de Vente Calculé
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
                  {(() => {
                    const prixUnitaire = parseFloat(formData.prix_unitaire) || 0;
                    const marge = parseFloat(formData.marge) || 0;
                    const tva = parseFloat(formData.tva) || 0;
                    const prixVente = prixUnitaire * (1 + marge / 100) * (1 + tva / 100);
                    return `${prixVente.toFixed(2)} DA`;
                  })()}
                </div>
              </div>
            </div>

            {/* Toast de succès positionné juste au-dessus des boutons */}
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
                🎉 {successMessage}
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
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: loading ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px'
                }}
              >
                {loading ? 'Modification...' : '✅ Modifier l\'Article'}
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