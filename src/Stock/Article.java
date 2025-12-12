/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package Stock;

import java.beans.PropertyChangeListener;
import java.beans.PropertyChangeSupport;
import java.io.Serializable;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.Table;
import javax.persistence.Transient;

/**
 *
 * @author habib.belkacemi
 */
@Entity
@Table(name = "article", catalog = "test", schema = "")
@NamedQueries({
    @NamedQuery(name = "Article.findAll", query = "SELECT a FROM Article a"),
    @NamedQuery(name = "Article.findByNarticle", query = "SELECT a FROM Article a WHERE a.narticle = :narticle"),
    @NamedQuery(name = "Article.findByFamille", query = "SELECT a FROM Article a WHERE a.famille = :famille"),
    @NamedQuery(name = "Article.findByDesignation", query = "SELECT a FROM Article a WHERE a.designation = :designation"),
    @NamedQuery(name = "Article.findByNfournisseur", query = "SELECT a FROM Article a WHERE a.nfournisseur = :nfournisseur"),
    @NamedQuery(name = "Article.findByPrixUnitaire", query = "SELECT a FROM Article a WHERE a.prixUnitaire = :prixUnitaire"),
    @NamedQuery(name = "Article.findByMarge", query = "SELECT a FROM Article a WHERE a.marge = :marge"),
    @NamedQuery(name = "Article.findByTva", query = "SELECT a FROM Article a WHERE a.tva = :tva"),
    @NamedQuery(name = "Article.findByPrixVente", query = "SELECT a FROM Article a WHERE a.prixVente = :prixVente"),
    @NamedQuery(name = "Article.findBySeuil", query = "SELECT a FROM Article a WHERE a.seuil = :seuil"),
    @NamedQuery(name = "Article.findByStockF", query = "SELECT a FROM Article a WHERE a.stockF = :stockF"),
    @NamedQuery(name = "Article.findByStockBl", query = "SELECT a FROM Article a WHERE a.stockBl = :stockBl")})
public class Article implements Serializable {
    @Transient
    private PropertyChangeSupport changeSupport = new PropertyChangeSupport(this);
    private static final long serialVersionUID = 1L;
    @Id
    @Basic(optional = false)
    @Column(name = "Narticle")
    private String narticle;
    @Basic(optional = false)
    @Column(name = "famille")
    private String famille;
    @Basic(optional = false)
    @Column(name = "designation")
    private String designation;
    @Basic(optional = false)
    @Column(name = "Nfournisseur")
    private String nfournisseur;
    @Basic(optional = false)
    @Column(name = "prix_unitaire")
    private double prixUnitaire;
    @Basic(optional = false)
    @Column(name = "marge")
    private int marge;
    @Basic(optional = false)
    @Column(name = "tva")
    private double tva;
    @Basic(optional = false)
    @Column(name = "prix_vente")
    private double prixVente;
    @Basic(optional = false)
    @Column(name = "seuil")
    private int seuil;
    @Basic(optional = false)
    @Column(name = "stock_f")
    private int stockF;
    @Basic(optional = false)
    @Column(name = "stock_bl")
    private int stockBl;

    public Article() {
    }

    public Article(String narticle) {
        this.narticle = narticle;
    }

    public Article(String narticle, String famille, String designation, String nfournisseur, double prixUnitaire, int marge, double tva, double prixVente, int seuil, int stockF, int stockBl) {
        this.narticle = narticle;
        this.famille = famille;
        this.designation = designation;
        this.nfournisseur = nfournisseur;
        this.prixUnitaire = prixUnitaire;
        this.marge = marge;
        this.tva = tva;
        this.prixVente = prixVente;
        this.seuil = seuil;
        this.stockF = stockF;
        this.stockBl = stockBl;
    }

    public String getNarticle() {
        return narticle;
    }

    public void setNarticle(String narticle) {
        String oldNarticle = this.narticle;
        this.narticle = narticle;
        changeSupport.firePropertyChange("narticle", oldNarticle, narticle);
    }

    public String getFamille() {
        return famille;
    }

    public void setFamille(String famille) {
        String oldFamille = this.famille;
        this.famille = famille;
        changeSupport.firePropertyChange("famille", oldFamille, famille);
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        String oldDesignation = this.designation;
        this.designation = designation;
        changeSupport.firePropertyChange("designation", oldDesignation, designation);
    }

    public String getNfournisseur() {
        return nfournisseur;
    }

    public void setNfournisseur(String nfournisseur) {
        String oldNfournisseur = this.nfournisseur;
        this.nfournisseur = nfournisseur;
        changeSupport.firePropertyChange("nfournisseur", oldNfournisseur, nfournisseur);
    }

    public double getPrixUnitaire() {
        return prixUnitaire;
    }

    public void setPrixUnitaire(double prixUnitaire) {
        double oldPrixUnitaire = this.prixUnitaire;
        this.prixUnitaire = prixUnitaire;
        changeSupport.firePropertyChange("prixUnitaire", oldPrixUnitaire, prixUnitaire);
    }

    public int getMarge() {
        return marge;
    }

    public void setMarge(int marge) {
        int oldMarge = this.marge;
        this.marge = marge;
        changeSupport.firePropertyChange("marge", oldMarge, marge);
    }

    public double getTva() {
        return tva;
    }

    public void setTva(double tva) {
        double oldTva = this.tva;
        this.tva = tva;
        changeSupport.firePropertyChange("tva", oldTva, tva);
    }

    public double getPrixVente() {
        return prixVente;
    }

    public void setPrixVente(double prixVente) {
        double oldPrixVente = this.prixVente;
        this.prixVente = prixVente;
        changeSupport.firePropertyChange("prixVente", oldPrixVente, prixVente);
    }

    public int getSeuil() {
        return seuil;
    }

    public void setSeuil(int seuil) {
        int oldSeuil = this.seuil;
        this.seuil = seuil;
        changeSupport.firePropertyChange("seuil", oldSeuil, seuil);
    }

    public int getStockF() {
        return stockF;
    }

    public void setStockF(int stockF) {
        int oldStockF = this.stockF;
        this.stockF = stockF;
        changeSupport.firePropertyChange("stockF", oldStockF, stockF);
    }

    public int getStockBl() {
        return stockBl;
    }

    public void setStockBl(int stockBl) {
        int oldStockBl = this.stockBl;
        this.stockBl = stockBl;
        changeSupport.firePropertyChange("stockBl", oldStockBl, stockBl);
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (narticle != null ? narticle.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof Article)) {
            return false;
        }
        Article other = (Article) object;
        if ((this.narticle == null && other.narticle != null) || (this.narticle != null && !this.narticle.equals(other.narticle))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "Stock.Article[ narticle=" + narticle + " ]";
    }

    public void addPropertyChangeListener(PropertyChangeListener listener) {
        changeSupport.addPropertyChangeListener(listener);
    }

    public void removePropertyChangeListener(PropertyChangeListener listener) {
        changeSupport.removePropertyChangeListener(listener);
    }
    
}
