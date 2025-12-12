/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package Stock;

import java.beans.PropertyChangeListener;
import java.beans.PropertyChangeSupport;
import java.io.Serializable;
import java.util.Date;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.persistence.Transient;

/**
 *
 * @author habib.belkacemi
 */
@Entity
@Table(name = "client", catalog = "test", schema = "")
@NamedQueries({
    @NamedQuery(name = "Client.findAll", query = "SELECT c FROM Client c"),
    @NamedQuery(name = "Client.findByNclient", query = "SELECT c FROM Client c WHERE c.nclient = :nclient"),
    @NamedQuery(name = "Client.findByRaisonsociale", query = "SELECT c FROM Client c WHERE c.raisonsociale = :raisonsociale"),
    @NamedQuery(name = "Client.findByAdresse", query = "SELECT c FROM Client c WHERE c.adresse = :adresse"),
    @NamedQuery(name = "Client.findByContactPerson", query = "SELECT c FROM Client c WHERE c.contactPerson = :contactPerson"),
    @NamedQuery(name = "Client.findByCaffairefact", query = "SELECT c FROM Client c WHERE c.caffairefact = :caffairefact"),
    @NamedQuery(name = "Client.findByCaffairebl", query = "SELECT c FROM Client c WHERE c.caffairebl = :caffairebl"),
    @NamedQuery(name = "Client.findByNrc", query = "SELECT c FROM Client c WHERE c.nrc = :nrc"),
    @NamedQuery(name = "Client.findByDateRC", query = "SELECT c FROM Client c WHERE c.dateRC = :dateRC"),
    @NamedQuery(name = "Client.findByLieuRC", query = "SELECT c FROM Client c WHERE c.lieuRC = :lieuRC"),
    @NamedQuery(name = "Client.findByIFiscal", query = "SELECT c FROM Client c WHERE c.iFiscal = :iFiscal"),
    @NamedQuery(name = "Client.findByNarticle", query = "SELECT c FROM Client c WHERE c.narticle = :narticle"),
    @NamedQuery(name = "Client.findByTel", query = "SELECT c FROM Client c WHERE c.tel = :tel"),
    @NamedQuery(name = "Client.findByEmail", query = "SELECT c FROM Client c WHERE c.email = :email"),
    @NamedQuery(name = "Client.findByCommentaire", query = "SELECT c FROM Client c WHERE c.commentaire = :commentaire")})
public class Client implements Serializable {
    @Transient
    private PropertyChangeSupport changeSupport = new PropertyChangeSupport(this);
    private static final long serialVersionUID = 1L;
    @Id
    @Basic(optional = false)
    @Column(name = "Nclient")
    private Integer nclient;
    @Basic(optional = false)
    @Column(name = "Raison_sociale")
    private String raisonsociale;
    @Basic(optional = false)
    @Column(name = "adresse")
    private String adresse;
    @Basic(optional = false)
    @Column(name = "contact_person")
    private String contactPerson;
    @Basic(optional = false)
    @Column(name = "C_affaire_fact")
    private double caffairefact;
    @Basic(optional = false)
    @Column(name = "C_affaire_bl")
    private double caffairebl;
    @Basic(optional = false)
    @Column(name = "NRC")
    private String nrc;
    @Basic(optional = false)
    @Column(name = "Date_RC")
    @Temporal(TemporalType.DATE)
    private Date dateRC;
    @Basic(optional = false)
    @Column(name = "Lieu_RC")
    private String lieuRC;
    @Basic(optional = false)
    @Column(name = "I_Fiscal")
    private String iFiscal;
    @Basic(optional = false)
    @Column(name = "N_article")
    private String narticle;
    @Basic(optional = false)
    @Column(name = "Tel")
    private String tel;
    @Basic(optional = false)
    @Column(name = "email")
    private String email;
    @Basic(optional = false)
    @Column(name = "Commentaire")
    private String commentaire;

    public Client() {
    }

    public Client(Integer nclient) {
        this.nclient = nclient;
    }

    public Client(Integer nclient, String raisonsociale, String adresse, String contactPerson, double caffairefact, double caffairebl, String nrc, Date dateRC, String lieuRC, String iFiscal, String narticle, String tel, String email, String commentaire) {
        this.nclient = nclient;
        this.raisonsociale = raisonsociale;
        this.adresse = adresse;
        this.contactPerson = contactPerson;
        this.caffairefact = caffairefact;
        this.caffairebl = caffairebl;
        this.nrc = nrc;
        this.dateRC = dateRC;
        this.lieuRC = lieuRC;
        this.iFiscal = iFiscal;
        this.narticle = narticle;
        this.tel = tel;
        this.email = email;
        this.commentaire = commentaire;
    }

    public Integer getNclient() {
        return nclient;
    }

    public void setNclient(Integer nclient) {
        Integer oldNclient = this.nclient;
        this.nclient = nclient;
        changeSupport.firePropertyChange("nclient", oldNclient, nclient);
    }

    public String getRaisonsociale() {
        return raisonsociale;
    }

    public void setRaisonsociale(String raisonsociale) {
        String oldRaisonsociale = this.raisonsociale;
        this.raisonsociale = raisonsociale;
        changeSupport.firePropertyChange("raisonsociale", oldRaisonsociale, raisonsociale);
    }

    public String getAdresse() {
        return adresse;
    }

    public void setAdresse(String adresse) {
        String oldAdresse = this.adresse;
        this.adresse = adresse;
        changeSupport.firePropertyChange("adresse", oldAdresse, adresse);
    }

    public String getContactPerson() {
        return contactPerson;
    }

    public void setContactPerson(String contactPerson) {
        String oldContactPerson = this.contactPerson;
        this.contactPerson = contactPerson;
        changeSupport.firePropertyChange("contactPerson", oldContactPerson, contactPerson);
    }

    public double getCaffairefact() {
        return caffairefact;
    }

    public void setCaffairefact(double caffairefact) {
        double oldCaffairefact = this.caffairefact;
        this.caffairefact = caffairefact;
        changeSupport.firePropertyChange("caffairefact", oldCaffairefact, caffairefact);
    }

    public double getCaffairebl() {
        return caffairebl;
    }

    public void setCaffairebl(double caffairebl) {
        double oldCaffairebl = this.caffairebl;
        this.caffairebl = caffairebl;
        changeSupport.firePropertyChange("caffairebl", oldCaffairebl, caffairebl);
    }

    public String getNrc() {
        return nrc;
    }

    public void setNrc(String nrc) {
        String oldNrc = this.nrc;
        this.nrc = nrc;
        changeSupport.firePropertyChange("nrc", oldNrc, nrc);
    }

    public Date getDateRC() {
        return dateRC;
    }

    public void setDateRC(Date dateRC) {
        Date oldDateRC = this.dateRC;
        this.dateRC = dateRC;
        changeSupport.firePropertyChange("dateRC", oldDateRC, dateRC);
    }

    public String getLieuRC() {
        return lieuRC;
    }

    public void setLieuRC(String lieuRC) {
        String oldLieuRC = this.lieuRC;
        this.lieuRC = lieuRC;
        changeSupport.firePropertyChange("lieuRC", oldLieuRC, lieuRC);
    }

    public String getIFiscal() {
        return iFiscal;
    }

    public void setIFiscal(String iFiscal) {
        String oldIFiscal = this.iFiscal;
        this.iFiscal = iFiscal;
        changeSupport.firePropertyChange("IFiscal", oldIFiscal, iFiscal);
    }

    public String getNarticle() {
        return narticle;
    }

    public void setNarticle(String narticle) {
        String oldNarticle = this.narticle;
        this.narticle = narticle;
        changeSupport.firePropertyChange("narticle", oldNarticle, narticle);
    }

    public String getTel() {
        return tel;
    }

    public void setTel(String tel) {
        String oldTel = this.tel;
        this.tel = tel;
        changeSupport.firePropertyChange("tel", oldTel, tel);
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        String oldEmail = this.email;
        this.email = email;
        changeSupport.firePropertyChange("email", oldEmail, email);
    }

    public String getCommentaire() {
        return commentaire;
    }

    public void setCommentaire(String commentaire) {
        String oldCommentaire = this.commentaire;
        this.commentaire = commentaire;
        changeSupport.firePropertyChange("commentaire", oldCommentaire, commentaire);
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (nclient != null ? nclient.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof Client)) {
            return false;
        }
        Client other = (Client) object;
        if ((this.nclient == null && other.nclient != null) || (this.nclient != null && !this.nclient.equals(other.nclient))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "Stock.Client[ nclient=" + nclient + " ]";
    }

    public void addPropertyChangeListener(PropertyChangeListener listener) {
        changeSupport.addPropertyChangeListener(listener);
    }

    public void removePropertyChangeListener(PropertyChangeListener listener) {
        changeSupport.removePropertyChangeListener(listener);
    }
    
}
