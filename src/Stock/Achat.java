/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package Stock;

import java.awt.AWTKeyStroke;
import java.awt.Color;
import java.awt.KeyboardFocusManager;
import java.awt.event.KeyEvent;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;
import javax.swing.*;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.design.JRDesignQuery;
import net.sf.jasperreports.engine.design.JasperDesign;
import net.sf.jasperreports.engine.xml.JRXmlLoader;
import net.sf.jasperreports.view.JasperViewer;
import org.jdesktop.swingx.autocomplete.AutoCompleteDecorator;
//import net.proteanit.sql.DbUtils;

/**
 *
 * @author IT
 */
public class Achat extends javax.swing.JFrame {

    /**
     * Creates new form Facture
     */
    public Achat(String par, String det, String mas, String bas) {
        //JOptionPane.showMessageDialog(null, parametre);
        
        parametre = par;        
        fichier_detail = det;
        fichier_master = mas;
        base=bas;
        facture="facture_a";
        //JOptionPane.showMessageDialog(null, fichier_master);
        //remettre_ordre();
        nettoyer_facture.nettoyer_facture(base,facture);
        
        initComponents();
        //jPanel4.setVisible(false);
// 1. Get default keys
        Set<AWTKeyStroke> ftk = new HashSet<AWTKeyStroke>(
                KeyboardFocusManager.getCurrentKeyboardFocusManager()
                .getDefaultFocusTraversalKeys(
                KeyboardFocusManager.FORWARD_TRAVERSAL_KEYS));

// 2. Add our key
        ftk.add(KeyStroke.getKeyStroke("ENTER"));


// 3. Set new keys
        KeyboardFocusManager.getCurrentKeyboardFocusManager()
                .setDefaultFocusTraversalKeys(
                KeyboardFocusManager.FORWARD_TRAVERSAL_KEYS, ftk);
        AutoCompleteDecorator.decorate(jComboBox2);
        AutoCompleteDecorator.decorate(jComboBox1);
    }
    
    private void Update_Table_Factures() {
        
        try {            
            String sql = "select F.id as \"Seq.\", F.Narticle as \"Code Article\", A.Designation as \"Designation\", F.prix as \"Prix Unitaire\", A.tva as \"TVA\", F.qte as \"Quantité\", F.total_ligne as \"Prix Total\"  from facture_a AS F, article AS A where F.narticle=A.narticle order by F.id";            
            tm = new MyTableModel(sql,base);
            Table_Factures.setModel(tm);
            Table_Factures.setDefaultRenderer(Double.class, new TKMntRenderer());
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "avec la table Fournisseurs\n" + e.getMessage());
        }
    }
    
    @SuppressWarnings("unchecked")
    // <editor-fold defaultstate="collapsed" desc="Generated Code">//GEN-BEGIN:initComponents
    private void initComponents() {

        jPanel2 = new javax.swing.JPanel();
        date_fact = new com.toedter.calendar.JDateChooser();
        jLabel1 = new javax.swing.JLabel();
        jLabel2 = new javax.swing.JLabel();
        txt_code_cli = new javax.swing.JTextField();
        jLabel3 = new javax.swing.JLabel();
        txt_nfact = new javax.swing.JTextField();
        jLabel4 = new javax.swing.JLabel();
        jLabel5 = new javax.swing.JLabel();
        jLabel6 = new javax.swing.JLabel();
        txt_stock_f = new javax.swing.JTextField();
        txt_stock_bl = new javax.swing.JTextField();
        jComboBox1 = new javax.swing.JComboBox();
        jScrollPane1 = new javax.swing.JScrollPane();
        Table_Factures = new javax.swing.JTable();
        jPanel1 = new javax.swing.JPanel();
        jLabel7 = new javax.swing.JLabel();
        txt_code_art = new javax.swing.JTextField();
        jLabel8 = new javax.swing.JLabel();
        jComboBox2 = new javax.swing.JComboBox();
        jLabel9 = new javax.swing.JLabel();
        txt_prix_unit = new javax.swing.JTextField();
        jLabel10 = new javax.swing.JLabel();
        txt_tva = new javax.swing.JTextField();
        jLabel11 = new javax.swing.JLabel();
        txt_qte = new javax.swing.JTextField();
        jLabel12 = new javax.swing.JLabel();
        txt_prix_tot = new javax.swing.JTextField();
        btn_quitter = new javax.swing.JButton();
        btn_nouvelle_facture = new javax.swing.JButton();
        btn_imprimer = new javax.swing.JButton();
        btn_supprimer = new javax.swing.JButton();
        sauvegarder = new javax.swing.JButton();
        Enregistrer = new javax.swing.JButton();
        txt_s_total = new javax.swing.JTextField();
        jLabel13 = new javax.swing.JLabel();
        jLabel15 = new javax.swing.JLabel();
        txt_total_tva = new javax.swing.JTextField();
        jLabel14 = new javax.swing.JLabel();
        txt_timbre = new javax.swing.JTextField();
        txt_TTC = new javax.swing.JTextField();
        jLabel16 = new javax.swing.JLabel();
        txt_commentaire = new javax.swing.JTextField();
        Label_coment = new javax.swing.JLabel();
        txt_titre = new javax.swing.JTextField();

        setDefaultCloseOperation(javax.swing.WindowConstants.DISPOSE_ON_CLOSE);
        setTitle("Achat");
        setExtendedState(javax.swing.JFrame.MAXIMIZED_BOTH);
        addWindowListener(new java.awt.event.WindowAdapter() {
            public void windowOpened(java.awt.event.WindowEvent evt) {
                formWindowOpened(evt);
            }
        });

        jPanel2.setBorder(javax.swing.BorderFactory.createTitledBorder(""));

        date_fact.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusLost(java.awt.event.FocusEvent evt) {
                date_factFocusLost(evt);
            }
        });

        jLabel1.setText("Date :");

        jLabel2.setText("Code Fourn :");

        txt_code_cli.setCursor(new java.awt.Cursor(java.awt.Cursor.TEXT_CURSOR));
        txt_code_cli.setInputVerifier(new Pass_Verifier_Fournisseur(base));
        txt_code_cli.setVerifyInputWhenFocusTarget(false);
        txt_code_cli.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusGained(java.awt.event.FocusEvent evt) {
                txt_code_cliFocusGained(evt);
            }
            public void focusLost(java.awt.event.FocusEvent evt) {
                txt_code_cliFocusLost(evt);
            }
        });
        txt_code_cli.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                txt_code_cliActionPerformed(evt);
            }
        });
        txt_code_cli.addKeyListener(new java.awt.event.KeyAdapter() {
            public void keyReleased(java.awt.event.KeyEvent evt) {
                txt_code_cliKeyReleased(evt);
            }
        });

        jLabel3.setText("N° Facture : ");

        txt_nfact.setHorizontalAlignment(javax.swing.JTextField.RIGHT);
        txt_nfact.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusLost(java.awt.event.FocusEvent evt) {
                txt_nfactFocusLost(evt);
            }
        });

        jLabel4.setText("Nom :");

        jLabel5.setText("Stock Fact. :");

        jLabel6.setText("Stock BL:");

        txt_stock_f.setEditable(false);
        txt_stock_f.setBackground(new java.awt.Color(255, 255, 255));
        txt_stock_f.setEnabled(false);

        txt_stock_bl.setEditable(false);
        txt_stock_bl.setBackground(new java.awt.Color(255, 255, 255));
        txt_stock_bl.setEnabled(false);

        jComboBox1.setEditable(true);
        jComboBox1.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusLost(java.awt.event.FocusEvent evt) {
                jComboBox1FocusLost(evt);
            }
        });
        jComboBox1.addPopupMenuListener(new javax.swing.event.PopupMenuListener() {
            public void popupMenuCanceled(javax.swing.event.PopupMenuEvent evt) {
            }
            public void popupMenuWillBecomeInvisible(javax.swing.event.PopupMenuEvent evt) {
                jComboBox1PopupMenuWillBecomeInvisible(evt);
            }
            public void popupMenuWillBecomeVisible(javax.swing.event.PopupMenuEvent evt) {
            }
        });

        javax.swing.GroupLayout jPanel2Layout = new javax.swing.GroupLayout(jPanel2);
        jPanel2.setLayout(jPanel2Layout);
        jPanel2Layout.setHorizontalGroup(
            jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel2Layout.createSequentialGroup()
                .addGap(24, 24, 24)
                .addGroup(jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.TRAILING)
                    .addComponent(jLabel1)
                    .addComponent(jLabel3))
                .addGap(18, 18, 18)
                .addGroup(jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(txt_nfact, javax.swing.GroupLayout.PREFERRED_SIZE, 69, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(date_fact, javax.swing.GroupLayout.PREFERRED_SIZE, 143, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addGap(142, 142, 142)
                .addGroup(jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.TRAILING)
                    .addGroup(jPanel2Layout.createSequentialGroup()
                        .addComponent(jLabel2)
                        .addGap(18, 18, 18)
                        .addComponent(txt_code_cli, javax.swing.GroupLayout.PREFERRED_SIZE, 63, javax.swing.GroupLayout.PREFERRED_SIZE))
                    .addGroup(jPanel2Layout.createSequentialGroup()
                        .addComponent(jLabel5)
                        .addGap(18, 18, 18)
                        .addComponent(txt_stock_f, javax.swing.GroupLayout.PREFERRED_SIZE, 62, javax.swing.GroupLayout.PREFERRED_SIZE)))
                .addGroup(jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addGroup(jPanel2Layout.createSequentialGroup()
                        .addGap(88, 88, 88)
                        .addComponent(jLabel4))
                    .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, jPanel2Layout.createSequentialGroup()
                        .addGap(72, 72, 72)
                        .addComponent(jLabel6)))
                .addGap(18, 18, 18)
                .addGroup(jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(txt_stock_bl, javax.swing.GroupLayout.PREFERRED_SIZE, 64, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(jComboBox1, javax.swing.GroupLayout.PREFERRED_SIZE, 183, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addContainerGap(15, Short.MAX_VALUE))
        );
        jPanel2Layout.setVerticalGroup(
            jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel2Layout.createSequentialGroup()
                .addGap(24, 24, 24)
                .addGroup(jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.TRAILING)
                    .addComponent(jLabel1)
                    .addComponent(date_fact, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addGroup(jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                        .addComponent(jLabel2)
                        .addComponent(txt_code_cli, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                        .addComponent(jLabel4)
                        .addComponent(jComboBox1, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, 14, Short.MAX_VALUE)
                .addGroup(jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel3)
                    .addComponent(txt_nfact, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel5)
                    .addComponent(jLabel6)
                    .addComponent(txt_stock_bl, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(txt_stock_f, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addGap(29, 29, 29))
        );

        Table_Factures.setModel(new javax.swing.table.DefaultTableModel(
            new Object [][] {
                {null, null, null, null, null, null, null},
                {null, null, null, null, null, null, null},
                {null, null, null, null, null, null, null},
                {null, null, null, null, null, null, null},
                {null, null, null, null, null, null, null},
                {null, null, null, null, null, null, null},
                {null, null, null, null, null, null, null},
                {null, null, null, null, null, null, null},
                {null, null, null, null, null, null, null},
                {null, null, null, null, null, null, null}
            },
            new String [] {
                "Seq.", "Code Article", "Description", "Prix Unitaire", "TVA", "Quantité", "Prix Total"
            }
        ) {
            Class[] types = new Class [] {
                java.lang.Integer.class, java.lang.String.class, java.lang.String.class, java.lang.Double.class, java.lang.Double.class, java.lang.Double.class, java.lang.Double.class
            };

            public Class getColumnClass(int columnIndex) {
                return types [columnIndex];
            }
        });
        Table_Factures.setToolTipText("");
        Table_Factures.setCursor(new java.awt.Cursor(java.awt.Cursor.DEFAULT_CURSOR));
        Table_Factures.setName(""); // NOI18N
        Table_Factures.addMouseListener(new java.awt.event.MouseAdapter() {
            public void mouseClicked(java.awt.event.MouseEvent evt) {
                Table_FacturesMouseClicked(evt);
            }
        });
        Table_Factures.addKeyListener(new java.awt.event.KeyAdapter() {
            public void keyReleased(java.awt.event.KeyEvent evt) {
                Table_FacturesKeyReleased(evt);
            }
        });
        jScrollPane1.setViewportView(Table_Factures);

        jLabel7.setText("Code Article");

        txt_code_art.addCaretListener(new javax.swing.event.CaretListener() {
            public void caretUpdate(javax.swing.event.CaretEvent evt) {
                txt_code_artCaretUpdate(evt);
            }
        });
        txt_code_art.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                txt_code_artActionPerformed(evt);
            }
        });
        txt_code_art.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusGained(java.awt.event.FocusEvent evt) {
                txt_code_artFocusGained(evt);
            }
            public void focusLost(java.awt.event.FocusEvent evt) {
                txt_code_artFocusLost(evt);
            }
        });
        txt_code_art.addKeyListener(new java.awt.event.KeyAdapter() {
            public void keyReleased(java.awt.event.KeyEvent evt) {
                txt_code_artKeyReleased(evt);
            }
        });

        jLabel8.setText("Description");

        jComboBox2.setEditable(true);
        jComboBox2.addPopupMenuListener(new javax.swing.event.PopupMenuListener() {
            public void popupMenuCanceled(javax.swing.event.PopupMenuEvent evt) {
            }
            public void popupMenuWillBecomeInvisible(javax.swing.event.PopupMenuEvent evt) {
                jComboBox2PopupMenuWillBecomeInvisible(evt);
            }
            public void popupMenuWillBecomeVisible(javax.swing.event.PopupMenuEvent evt) {
            }
        });

        jLabel9.setText("Prix Unitaire");

        txt_prix_unit.setHorizontalAlignment(javax.swing.JTextField.RIGHT);
        txt_prix_unit.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusGained(java.awt.event.FocusEvent evt) {
                txt_prix_unitFocusGained(evt);
            }
        });
        txt_prix_unit.addKeyListener(new java.awt.event.KeyAdapter() {
            public void keyTyped(java.awt.event.KeyEvent evt) {
                txt_prix_unitKeyTyped(evt);
            }
        });

        jLabel10.setText("TVA");

        txt_tva.setEditable(false);
        txt_tva.setBackground(new java.awt.Color(255, 255, 255));
        txt_tva.setHorizontalAlignment(javax.swing.JTextField.RIGHT);
        txt_tva.setDisabledTextColor(new java.awt.Color(0, 0, 0));
        txt_tva.setEnabled(false);

        jLabel11.setText("Quantité");

        txt_qte.setHorizontalAlignment(javax.swing.JTextField.RIGHT);
        txt_qte.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                txt_qteActionPerformed(evt);
            }
        });
        txt_qte.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusLost(java.awt.event.FocusEvent evt) {
                txt_qteFocusLost(evt);
            }
        });
        txt_qte.addKeyListener(new java.awt.event.KeyAdapter() {
            public void keyTyped(java.awt.event.KeyEvent evt) {
                txt_qteKeyTyped(evt);
            }
        });

        jLabel12.setText("Prix Total ");

        txt_prix_tot.setEditable(false);
        txt_prix_tot.setBackground(new java.awt.Color(255, 255, 255));
        txt_prix_tot.setHorizontalAlignment(javax.swing.JTextField.RIGHT);
        txt_prix_tot.setDisabledTextColor(new java.awt.Color(0, 0, 0));
        txt_prix_tot.setEnabled(false);

        javax.swing.GroupLayout jPanel1Layout = new javax.swing.GroupLayout(jPanel1);
        jPanel1.setLayout(jPanel1Layout);
        jPanel1Layout.setHorizontalGroup(
            jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel1Layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING, false)
                    .addComponent(txt_code_art)
                    .addComponent(jLabel7, javax.swing.GroupLayout.DEFAULT_SIZE, 77, Short.MAX_VALUE))
                .addGroup(jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addGroup(jPanel1Layout.createSequentialGroup()
                        .addGap(84, 84, 84)
                        .addComponent(jLabel8, javax.swing.GroupLayout.PREFERRED_SIZE, 96, javax.swing.GroupLayout.PREFERRED_SIZE)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                        .addComponent(jLabel9)
                        .addGap(55, 55, 55)
                        .addComponent(jLabel10, javax.swing.GroupLayout.PREFERRED_SIZE, 27, javax.swing.GroupLayout.PREFERRED_SIZE)
                        .addGap(36, 36, 36))
                    .addGroup(jPanel1Layout.createSequentialGroup()
                        .addGap(29, 29, 29)
                        .addComponent(jComboBox2, 0, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                        .addGap(18, 18, 18)
                        .addComponent(txt_prix_unit, javax.swing.GroupLayout.PREFERRED_SIZE, 98, javax.swing.GroupLayout.PREFERRED_SIZE)
                        .addGap(18, 18, 18)
                        .addComponent(txt_tva, javax.swing.GroupLayout.PREFERRED_SIZE, 54, javax.swing.GroupLayout.PREFERRED_SIZE)
                        .addGap(18, 18, 18)))
                .addGroup(jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(txt_qte, javax.swing.GroupLayout.PREFERRED_SIZE, 47, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel11))
                .addGroup(jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addGroup(jPanel1Layout.createSequentialGroup()
                        .addGap(29, 29, 29)
                        .addComponent(jLabel12))
                    .addGroup(jPanel1Layout.createSequentialGroup()
                        .addGap(18, 18, 18)
                        .addComponent(txt_prix_tot, javax.swing.GroupLayout.PREFERRED_SIZE, 114, javax.swing.GroupLayout.PREFERRED_SIZE))))
        );
        jPanel1Layout.setVerticalGroup(
            jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel1Layout.createSequentialGroup()
                .addContainerGap(javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                .addGroup(jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel7)
                    .addComponent(jLabel9)
                    .addComponent(jLabel10, javax.swing.GroupLayout.PREFERRED_SIZE, 14, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel11)
                    .addComponent(jLabel12)
                    .addComponent(jLabel8, javax.swing.GroupLayout.PREFERRED_SIZE, 14, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addGap(8, 8, 8)
                .addGroup(jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(txt_code_art, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(jComboBox2, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(txt_prix_unit, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(txt_tva, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(txt_qte, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(txt_prix_tot, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)))
        );

        btn_quitter.setText("Quitter");
        btn_quitter.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btn_quitterActionPerformed(evt);
            }
        });

        btn_nouvelle_facture.setText("Nouvelle");
        btn_nouvelle_facture.setEnabled(false);
        btn_nouvelle_facture.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btn_nouvelle_factureActionPerformed(evt);
            }
        });

        btn_imprimer.setText("Imprimer");
        btn_imprimer.setEnabled(false);
        btn_imprimer.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btn_imprimerActionPerformed(evt);
            }
        });

        btn_supprimer.setText("Supprimer");
        btn_supprimer.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btn_supprimerActionPerformed(evt);
            }
        });

        sauvegarder.setText("Sauvegarder");
        sauvegarder.setEnabled(false);
        sauvegarder.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                sauvegarderActionPerformed(evt);
            }
        });

        Enregistrer.setText("Ajouter ligne");
        Enregistrer.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                EnregistrerActionPerformed(evt);
            }
        });
        Enregistrer.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusLost(java.awt.event.FocusEvent evt) {
                EnregistrerFocusLost(evt);
            }
        });

        txt_s_total.setEditable(false);
        txt_s_total.setBackground(new java.awt.Color(255, 255, 255));
        txt_s_total.setHorizontalAlignment(javax.swing.JTextField.RIGHT);
        txt_s_total.setDisabledTextColor(new java.awt.Color(0, 0, 0));
        txt_s_total.setEnabled(false);

        jLabel13.setText("S / Total");

        jLabel15.setText("T.V.A");

        txt_total_tva.setEditable(false);
        txt_total_tva.setBackground(new java.awt.Color(255, 255, 255));
        txt_total_tva.setHorizontalAlignment(javax.swing.JTextField.RIGHT);
        txt_total_tva.setDisabledTextColor(new java.awt.Color(0, 0, 0));
        txt_total_tva.setEnabled(false);

        jLabel14.setText("Timbre ");

        txt_timbre.setEditable(false);
        txt_timbre.setBackground(new java.awt.Color(255, 255, 255));
        txt_timbre.setHorizontalAlignment(javax.swing.JTextField.RIGHT);
        txt_timbre.setDisabledTextColor(new java.awt.Color(0, 0, 0));
        txt_timbre.setEnabled(false);

        txt_TTC.setEditable(false);
        txt_TTC.setBackground(new java.awt.Color(255, 255, 255));
        txt_TTC.setHorizontalAlignment(javax.swing.JTextField.RIGHT);
        txt_TTC.setDisabledTextColor(new java.awt.Color(0, 0, 0));
        txt_TTC.setEnabled(false);

        jLabel16.setText("T.T.C");

        txt_commentaire.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusLost(java.awt.event.FocusEvent evt) {
                txt_commentaireFocusLost(evt);
            }
        });

        Label_coment.setText("Commentaire :");

        txt_titre.setEditable(false);
        txt_titre.setBackground(new java.awt.Color(51, 51, 255));
        txt_titre.setFont(new java.awt.Font("Verdana", 1, 16)); // NOI18N
        txt_titre.setForeground(new java.awt.Color(255, 255, 255));
        txt_titre.setHorizontalAlignment(javax.swing.JTextField.CENTER);
        txt_titre.setFocusable(false);
        txt_titre.setVerifyInputWhenFocusTarget(false);

        javax.swing.GroupLayout layout = new javax.swing.GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.TRAILING)
                    .addGroup(layout.createSequentialGroup()
                        .addGap(124, 124, 124)
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.TRAILING)
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(Label_coment)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                                .addComponent(jLabel13))
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(txt_commentaire, javax.swing.GroupLayout.PREFERRED_SIZE, 567, javax.swing.GroupLayout.PREFERRED_SIZE)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                                    .addComponent(jLabel14, javax.swing.GroupLayout.Alignment.TRAILING)
                                    .addComponent(jLabel16, javax.swing.GroupLayout.Alignment.TRAILING)
                                    .addComponent(jLabel15, javax.swing.GroupLayout.Alignment.TRAILING))))
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.UNRELATED)
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                            .addComponent(txt_timbre, javax.swing.GroupLayout.PREFERRED_SIZE, 111, javax.swing.GroupLayout.PREFERRED_SIZE)
                            .addComponent(txt_total_tva, javax.swing.GroupLayout.PREFERRED_SIZE, 111, javax.swing.GroupLayout.PREFERRED_SIZE)
                            .addComponent(txt_TTC, javax.swing.GroupLayout.PREFERRED_SIZE, 111, javax.swing.GroupLayout.PREFERRED_SIZE)
                            .addComponent(txt_s_total, javax.swing.GroupLayout.PREFERRED_SIZE, 111, javax.swing.GroupLayout.PREFERRED_SIZE)))
                    .addGroup(layout.createSequentialGroup()
                        .addGap(70, 70, 70)
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                            .addComponent(jPanel2, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                            .addComponent(jScrollPane1)
                            .addComponent(jPanel1, javax.swing.GroupLayout.Alignment.TRAILING, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))))
                .addGap(18, 18, 18)
                .addComponent(txt_titre, javax.swing.GroupLayout.PREFERRED_SIZE, 188, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addContainerGap())
            .addGroup(layout.createSequentialGroup()
                .addGap(43, 43, 43)
                .addComponent(Enregistrer)
                .addGap(53, 53, 53)
                .addComponent(sauvegarder)
                .addGap(50, 50, 50)
                .addComponent(btn_supprimer)
                .addGap(47, 47, 47)
                .addComponent(btn_imprimer)
                .addGap(42, 42, 42)
                .addComponent(btn_nouvelle_facture)
                .addGap(39, 39, 39)
                .addComponent(btn_quitter, javax.swing.GroupLayout.PREFERRED_SIZE, 76, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addContainerGap(javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(jPanel2, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(txt_titre, javax.swing.GroupLayout.PREFERRED_SIZE, 34, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addGap(18, 18, 18)
                .addComponent(jScrollPane1, javax.swing.GroupLayout.PREFERRED_SIZE, 191, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addGap(18, 18, 18)
                .addComponent(jPanel1, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addGap(18, 18, 18)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.TRAILING)
                    .addComponent(txt_s_total, javax.swing.GroupLayout.PREFERRED_SIZE, 23, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                        .addComponent(jLabel13)
                        .addComponent(Label_coment)))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addGroup(layout.createSequentialGroup()
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                            .addComponent(txt_total_tva, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                            .addComponent(jLabel15))
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                            .addComponent(jLabel14)
                            .addComponent(txt_timbre, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)))
                    .addComponent(txt_commentaire, javax.swing.GroupLayout.PREFERRED_SIZE, 29, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(txt_TTC, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel16))
                .addGap(36, 36, 36)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(Enregistrer)
                    .addComponent(sauvegarder)
                    .addComponent(btn_supprimer)
                    .addComponent(btn_nouvelle_facture)
                    .addComponent(btn_imprimer)
                    .addComponent(btn_quitter))
                .addContainerGap(419, Short.MAX_VALUE))
        );

        pack();
    }// </editor-fold>//GEN-END:initComponents

    private void txt_code_cliActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_txt_code_cliActionPerformed
        // TODO add your handling code here:
    }//GEN-LAST:event_txt_code_cliActionPerformed
    
    private void formWindowOpened(java.awt.event.WindowEvent evt) {//GEN-FIRST:event_formWindowOpened
        String pilote = "com.mysql.jdbc.Driver";
        
        try {
            //txt_code_cli.requestFocusInWindow();
            //txt_code_art.requestFocusInWindow();
            // connexion avec la base de donnée
            //jPanel4.setVisible(false);
            txt_commentaire.setVisible(false);
            Label_coment.setVisible(false);
            String titre="";
            switch (parametre) {
                case "stock_f":
                    
                    titre = "Facturation";
                    champf="f";
                    break;
                case "stock_bl" :   
                    titre = "Bon de livraison";
                    champf="bl";
                    break;
                case "" :   
                    titre = "Proformat";
                    break;
            }
                            
            txt_titre.setText(titre);
            txt_titre.setBackground(Color.BLUE);
            txt_titre.setForeground(Color.WHITE);
            Class.forName(pilote);
            cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/mysql", "root", "");
            St = cnx.createStatement();  
            String sql = "select db_name from stock_table_parameter where code_activite='"+base+"'";
            Rs = St.executeQuery(sql);
            if (Rs.next()) {
            String var_cnx= "jdbc:mysql://localhost:3306/"+Rs.getString("db_name");
            var_cnx=var_cnx+"_"+base;           
            String user_bd="root";
            String passwd_bd="";
            cnx = DriverManager.getConnection(var_cnx, user_bd, passwd_bd);
            St = cnx.createStatement();
            }
            query = "truncate table facture_a";
            St.execute(query);
          // query = "select count(*) as nbre_enr FROM " + fichier_master + ";";
           // St.execute(query);
            //Rs = St.executeQuery(query);
            //if (Rs.next()) {
              //  String add1 = Rs.getString("nbre_enr");
                //if (Integer.parseInt(add1) > 0) {
                 //   query = "select max(nfact) as nfact_max FROM " + fichier_master + ";";
                    // JOptionPane.showMessageDialog(null, query);
                  //  Rs = St.executeQuery(query);
                   // if (Rs.next()) {
                    //    String add2 = Rs.getString("nfact_max");
                        // JOptionPane.showMessageDialog(null, add1);
                      //  int_nfact = Integer.parseInt(add2) + 1;
                   // }                    
                //} else {
                 //   int_nfact = 1;
               // }                
                //txt_nfact.setText(Integer.toString(int_nfact));
                Date dt = new Date();
                // SimpleDateFormat df = new SimpleDateFormat( "yyyy-MM-dd");
                //JOptionPane.showMessageDialog(null,df.format(dt));
                date_fact.setDate(dt);
                date_fact.setDateFormatString("yyyy-MM-dd");
                //JOptionPane.showMessageDialog(null, txt_nfact.getText());
                fillCombo1();
                fillCombo2();
            //}
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur de connexcion\n" + e.getMessage());
        }
        Update_Table_Factures();        
        
    }//GEN-LAST:event_formWindowOpened
    
    
    private void mettre_jour_stock(String xcode_art, String oper, String qte) {
        int x_resultat = 0;                
        try {
            if (!parametre.equals("")) {                
                String sql = "select stock_f,stock_bl from article where narticle = '" + xcode_art + "'";                
                Rs = St.executeQuery(sql);                
                if (Rs.next()) {
                    //String xstock_f = Rs.getString("stock_f");
                    String xstock_f = Rs.getString(parametre);
                    int v_xstock_f = Integer.parseInt(xstock_f);
                    int xqte = Integer.parseInt(qte);
                    
                    if (!"ajouter".equals(oper)) {                        
                        x_resultat = v_xstock_f - xqte;
                    } else {                        
                        x_resultat = v_xstock_f + xqte;                        
                    }
                    String query = "update article set " + parametre + " = '" + x_resultat + "' where narticle = '" + xcode_art + "'";                    
                    St3.executeUpdate(query);                    
                }                
            }
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans la mise à jour dans la table Article\n" + e.getMessage());
            
        }
    }

    private void calcul_des_montant() {
        
        try {            
            String sql = "select sum(qte*prix) as \"s_total\",sum(qte*prix*tva/100) as \"s_tva\" from facture_a";
            Rs = St.executeQuery(sql);
            if (Rs.next()) {
                String add1 = Rs.getString("s_total") + "0";
                String add2 = Rs.getString("s_tva") + "0";
                if ("null0".equals(add1)) {
                    add1 = "0.0";
                    add2 = "0.0";
                } else {
                    add1 = Rs.getString("s_total");
                    add2 = Rs.getString("s_tva");
                }                
                double add1_d = Double.parseDouble(add1);
                double add2_d = Double.parseDouble(add2);
                xtot_ht = add1_d;
                xtot_tva = add2_d;
                add1 = mntFmt.mntFmt(add1_d);
                add2 = mntFmt.mntFmt(add2_d);
                txt_s_total.setText(add1);
                txt_total_tva.setText(add2);
                timbre = add1_d * 1 / 100;
                if (timbre > 2500.00) {
                    timbre = 2500.00;
                }
                String add3 = mntFmt.mntFmt(timbre);
                txt_timbre.setText(add3);
                
            }
            double ttc = xtot_ht + xtot_tva + timbre;
            String add_ttc = mntFmt.mntFmt(ttc);
            txt_TTC.setText(add_ttc);
            if (ind_timbre) {
                    timbre = 0.00;
                    txt_timbre.setText("0.00");
                    ttc = xtot_ht + xtot_tva + timbre;
                    add_ttc = mntFmt.mntFmt(ttc);
                    txt_TTC.setText(add_ttc);
                }
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans la somme" + e.getMessage());
        }
    }

    private void champs_vide() {        
        txt_code_art.setText("");        
        jComboBox2.setSelectedIndex(0);        
        txt_prix_unit.setText("");
        txt_tva.setText("");        
        txt_stock_f.setText("");        
        txt_stock_bl.setText("");
        txt_qte.setText("");
        txt_prix_tot.setText("");        
    }
    
    private void affiche_champs() {
        try {
            // String add1 = Rs.getString("nfact");
            // txt_nfact.setText(add1);
            //String add2 = Rs.getString("raison_sociale");
            //txt_raison_sociale.setText(add2);
            
            
            String add3 = Rs.getString("Code Article");
            txt_code_art.setText(add3);
            String add4 = Rs.getString("Designation");
            
            for (j = 0; j < jComboBox2.getItemCount(); j++) {
                
                if (add4.equals(jComboBox2.getItemAt(j).toString())) {
                    
                    break;                    
                }
            }
            jComboBox2.setSelectedIndex(j);            
            String add5 = Rs.getString("Prix Unitaire");
            txt_prix_unit.setText(mntFmt.mntFmt(Double.parseDouble(add5)));
            String add6 = Rs.getString("TVA");
            txt_tva.setText(add6);
            String add7 = Rs.getString("Quantité");
            txt_qte.setText(add7);
            String add9 = Rs.getString("Prix Total");            
            txt_prix_tot.setText(mntFmt.mntFmt(Double.parseDouble(add9)));
            //String txt_spell="";
            //String X=Numb_to_Spell.spell(Double.parseDouble(add9), txt_spell);
            exp_spell = Numb_to_Spell.spell(Double.parseDouble(add9), "");
            //JOptionPane.showMessageDialog(null, X);
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans la table\n" + e.getMessage());
        }
    }
    
    private void Table_FacturesMouseClicked(java.awt.event.MouseEvent evt) {//GEN-FIRST:event_Table_FacturesMouseClicked
        art_desactive();
        try {
            
            int row = Table_Factures.getSelectedRow();            
            String Table_click = (Table_Factures.getModel().getValueAt(row, 0).toString());            
            String sql = "select F.id as \"Seq.\", F.Narticle as \"Code Article\", A.Designation as \"Designation\", F.prix as \"Prix Unitaire\", A.tva as \"TVA\", F.qte as \"Quantité\", F.total_ligne as \"Prix Total\"  from facture_a AS F, article AS A where F.narticle=A.narticle and F.id ='" + Table_click + "'";
           // Connection cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/test?useUnicode=yes&amp;characterEncoding=UTF-8", "root", "");
            //St = cnx.createStatement();
            Rs = St.executeQuery(sql);
            if (Rs.next()) {
                affiche_champs();                
                art_active();
            }
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans la table\n" + e.getMessage());
        }
        
    }//GEN-LAST:event_Table_FacturesMouseClicked
    
    private void Table_FacturesKeyReleased(java.awt.event.KeyEvent evt) {//GEN-FIRST:event_Table_FacturesKeyReleased
        if (evt.getKeyCode() == KeyEvent.VK_DOWN || evt.getKeyCode() == KeyEvent.VK_UP || evt.getKeyCode() == KeyEvent.VK_PAGE_UP || evt.getKeyCode() == KeyEvent.VK_PAGE_DOWN || evt.getKeyCode() == KeyEvent.VK_HOME || evt.getKeyCode() == KeyEvent.VK_END) {
            try {
                int row = Table_Factures.getSelectedRow();
                String Table_click = (Table_Factures.getModel().getValueAt(row, 0).toString());
                String sql = "select F.id as \"Seq.\", F.Narticle as \"Code Article\", A.Designation as \"Designation\", F.prix as \"Prix Unitaire\", A.tva as \"TVA\", F.qte as \"Quantité\", F.total_ligne as \"Prix Total\"  from facture_a AS F, article AS A where F.narticle=A.narticle and F.id ='" + Table_click + "'";
                
             //   Connection cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/test", "root", "");
              //  St = cnx.createStatement();
                Rs = St.executeQuery(sql);
                if (Rs.next()) {
                    affiche_champs();
                }
            } catch (Exception e) {
                JOptionPane.showMessageDialog(null, "Erreur dans la table\n" + e.getMessage());
            }
        }        
    }//GEN-LAST:event_Table_FacturesKeyReleased
    
    private void ajout_ligne() {
        try {
            //date_rc.setDateFormatString("yyyy-MM-dd");  
            String sql = "select * from article where narticle='" + txt_code_art.getText() + "'";
            Rs = St.executeQuery(sql);
            if (Rs.next()) {                
                sql = "select id, Narticle , prix, tva, qte , total_ligne from facture_a where narticle='" + txt_code_art.getText() + "'";
                //Connection cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/test", "root", "");
                // JOptionPane.showMessageDialog(null,sql);
                St1 = cnx.createStatement();
                St3 = cnx.createStatement();                
                St = cnx.createStatement();
                Rs = St.executeQuery(sql);
                if (Rs.next()) {                    
                    String add7 = Rs.getString("qte");
                    // JOptionPane.showMessageDialog(null,add7);
                    mettre_jour_stock(txt_code_art.getText(), "restituer", add7);
                    String query = "update facture_a set qte ='"
                            + txt_qte.getText() + "', prix ='"
                            + prix_unitaire.toString() + "', total_ligne ='"
                            + stot_ligne.toString() + "' where narticle = '" + txt_code_art.getText() + "'";                    
                    St.executeUpdate(query);
                    mettre_jour_stock(txt_code_art.getText(), "ajouter", txt_qte.getText());
                    Update_Table_Factures();
                    // JOptionPane.showMessageDialog(null,"ligne moodifiée !");                        
                } else {
                    String query = "insert into facture_a (nfact,nfournisseur,narticle, qte,tva,prix,total_ligne,type_fact) values ('"
                            + txt_nfact.getText() + "','"
                            +txt_code_cli.getText() + "','"
                            + txt_code_art.getText() + "','"
                            + txt_qte.getText() + "','"
                            + txt_tva.getText() + "','"
                            + prix_unitaire.toString() + "','"
                            + stot_ligne.toString() + "','"
                            + parametre + "')";
                   // JOptionPane.showMessageDialog(null,query);
                    St.executeUpdate(query);
                    mettre_jour_stock(txt_code_art.getText(), "ajouter", txt_qte.getText());
                    Update_Table_Factures();                    
                    
                    int lastRow = Table_Factures.getRowCount() - 1;
                    //JOptionPane.showMessageDialog(null,lastRow);
                    //Table_Factures.setRowSelectionInterval(lastRow, lastRow);
                    Table_Factures.changeSelection(lastRow, lastRow, rootPaneCheckingEnabled, rootPaneCheckingEnabled);

                    // JOptionPane.showMessageDialog(null,"ligne ajoutée !");
                }
                calcul_des_montant();
            }
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans l'insertion table\n" + e.getMessage());
            
        }
        //date_rc.setDateFormatString("yyyy-MM-dd");    
        champs_vide();
        Update_Table_Factures();
        //txt_code_art.setText("");
        txt_code_art.requestFocus();
        
    }
    private void EnregistrerActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_EnregistrerActionPerformed
        // if (!art_ok) {      
        //JOptionPane.showMessageDialog(null, art_ok);
        ajout_ligne();
        //}
    }//GEN-LAST:event_EnregistrerActionPerformed
    
    private void txt_code_artCaretUpdate(javax.swing.event.CaretEvent evt) {//GEN-FIRST:event_txt_code_artCaretUpdate
        
    }//GEN-LAST:event_txt_code_artCaretUpdate
    
    private void txt_code_artActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_txt_code_artActionPerformed
        
    }//GEN-LAST:event_txt_code_artActionPerformed
    
    private void txt_code_artKeyReleased(java.awt.event.KeyEvent evt) {//GEN-FIRST:event_txt_code_artKeyReleased
        
        
        if (evt.getKeyCode() == KeyEvent.VK_ESCAPE) {            
            int fact_ok = JOptionPane.showConfirmDialog(null, "Voulez vous terminer la facturation ?", "Confirmation", JOptionPane.YES_NO_OPTION);            
            if (fact_ok == 0) {
                art_desactive();                
            } else {                
                art_active();
            }
            //escape = ! escape;
            //JOptionPane.showMessageDialog(null, escape);
            // art_ok = true; 
            //  art_desactive();
            return;
        }
        try {
            String sql = "select * from article where narticle = '" + txt_code_art.getText() + "'";
            Rs = St.executeQuery(sql);            
            if (Rs.next()) {
                //JOptionPane.showMessageDialog(null, "trouvé");
                String add4 = Rs.getString("Designation");                
                for (j = 0; j < jComboBox2.getItemCount(); j++) {                    
                    if (add4.equals(jComboBox2.getItemAt(j).toString())) {                        
                        break;                        
                    }
                }
                jComboBox2.setSelectedIndex(j);                
                String add5 = Rs.getString("Prix_unitaire");
                txt_prix_unit.setText(mntFmt.mntFmt(Double.parseDouble(add5)));                
                String add6 = Rs.getString("TVA");
                txt_tva.setText(add6);
                String add7 = Rs.getString("stock_f");
                txt_stock_f.setText(add7);
                String add8 = Rs.getString("stock_bl");
                txt_stock_bl.setText(add8);
                txt_qte.setText("");
                txt_prix_tot.setText("");                
            } else {
                jComboBox2.setSelectedIndex(0);                
                txt_prix_unit.setText("");
                txt_tva.setText("");                
                txt_stock_f.setText("");                
                txt_stock_bl.setText("");
                txt_qte.setText("");
                txt_prix_tot.setText("");
            }            
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans l'insertion table\n" + e.getMessage());
            
        }
        
    }//GEN-LAST:event_txt_code_artKeyReleased
    
    private void txt_qteActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_txt_qteActionPerformed
        
        stot_ligne = Double.parseDouble(txt_prix_unit.getText()) * Double.parseDouble(txt_qte.getText());        
        txt_prix_tot.setText(mntFmt.mntFmt(Double.parseDouble((stot_ligne.toString()))));
        
        
    }//GEN-LAST:event_txt_qteActionPerformed
    private void fillCombo1() {
        String sql = "select * from fournisseur order by nom_fournisseur";
        try {
            jComboBox1.addItem("          ");            
            Rs = St.executeQuery(sql);
            while (Rs.next()) {
                String nme = Rs.getString("nom_fournisseur");
                //String nme1 = Rs.getString("nfournisseur");
                //jComboBox1.addItem(nme1 + " " + nme);
                jComboBox1.addItem(nme);
            }
            //JOptionPane.showMessageDialog(null, jComboBox1.getItemCount());
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans la liste jComboBox1\n" + e.getMessage());
        }
    }

    private void fillCombo2() {
        String sql = "select * from article order by designation";
        try {
            jComboBox2.addItem("          ");            
            Rs = St.executeQuery(sql);
            while (Rs.next()) {
                String nme = Rs.getString("designation");
                //String nme1 = Rs.getString("narticle");
                jComboBox2.addItem(nme);
            }
            
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans la liste jComboBox1\n" + e.getMessage());
        }
    }
    
    private void txt_code_cliKeyReleased(java.awt.event.KeyEvent evt) {//GEN-FIRST:event_txt_code_cliKeyReleased
        try {
            String sql = "select * from fournisseur where nfournisseur = '" + txt_code_cli.getText() + "'";
            Rs = St.executeQuery(sql);            
            if (Rs.next()) {
                //JOptionPane.showMessageDialog(null, "trouvé");
                String add4 = Rs.getString("nfournisseur");
                String add5 = Rs.getString("nom_fournisseur"); //+ " " + add4;
               // JOptionPane.showMessageDialog(null, add5);
               
                for (j = 0; j < jComboBox1.getItemCount(); j++) {                    
                    if (add5.equals(jComboBox1.getItemAt(j).toString())) {                        
                        break;                        
                    }
                }
                jComboBox1.setSelectedIndex(j); 
               
            } else {
                // JOptionPane.showMessageDialog(null, "Salam");
                
                jComboBox1.setSelectedIndex(0);                
            }            
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans l'insertion table\n" + e.getMessage());
        }
    }//GEN-LAST:event_txt_code_cliKeyReleased
    
    private void txt_qteFocusLost(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_txt_qteFocusLost
        if ("".equals(txt_prix_unit.getText())) {
            txt_prix_unit.setText("0");            
        }
        if ("".equals(txt_tva.getText())) {
            txt_prix_unit.setText("0");            
        }
        if ("".equals(txt_qte.getText())) {
            txt_qte.setText("0");
        }
        stot_ligne = Double.parseDouble(txt_prix_unit.getText().replaceAll(" ", "").replaceAll(",", ".")) * (Double.parseDouble(txt_qte.getText().replaceAll(" ", "").replaceAll(",", ".")));
        prix_unitaire = Double.parseDouble(txt_prix_unit.getText().replaceAll(" ", "").replaceAll(",", "."));
        txt_prix_tot.setText(mntFmt.mntFmt(Double.parseDouble((stot_ligne.toString()))));
        tva = stot_ligne * Double.parseDouble(txt_tva.getText().replaceAll(" ", "").replaceAll(",", ".")) / 100;
        txt_prix_unit.setText(mntFmt.mntFmt(Double.parseDouble((prix_unitaire.toString()))));
        
    }//GEN-LAST:event_txt_qteFocusLost
    
    private void txt_prix_unitKeyTyped(java.awt.event.KeyEvent evt) {//GEN-FIRST:event_txt_prix_unitKeyTyped
        char kar = evt.getKeyChar();
        
        if (!(kar >= '0' && kar <= '9')) {
            
            
            if (!(kar == ',' | kar == '.')) {
                evt.consume();
            }
        }        
    }//GEN-LAST:event_txt_prix_unitKeyTyped
    
    private void txt_qteKeyTyped(java.awt.event.KeyEvent evt) {//GEN-FIRST:event_txt_qteKeyTyped
        char kar = evt.getKeyChar();
        
        if (!(kar >= '0' && kar <= '9')) {
            
            if (!(kar == ',' | kar == '.')) {
                evt.consume();
            }
        }        
    }//GEN-LAST:event_txt_qteKeyTyped
    
    private void info_bancaire() {
        
        String[] par_prompts = {"Banque :", "N°Chèque :"};        
        String[] par_initial = {"", ""};
        //String [] message = { "", ""};
        String[] x = MultiInputPane.showMultiInputDialog(null, par_prompts, "Banque Info");
        
        txt_dom_bnq = x[0];
        txt_ncheque = x[1];
        //JOptionPane.showMessageDialog(null, txt_dom_bnq);
       // JOptionPane.showMessageDialog(null, txt_ncheque);
    }
    
    private void info_bl() {
        String xdt = ((JTextField) date_fact.getDateEditor().getUiComponent()).getText();
        String[] par_prompts = {"N°B.C :", "Date du B.C :", "Nom du preneur :"};        
        String[] par_initial = {"", xdt, ""};
        //String [] message = { "", ""};
        Object[] x = MultiInputPane.showMultiInputDialog(null, par_prompts, par_initial, "Complément d'info");
        
        txt_bc = x[0].toString();
        txt_dt_bc = x[1].toString();
        txt_nom_preneur = x[2].toString();        
    }    
    
    private void end_facture() {
        int fact_ok = JOptionPane.showConfirmDialog(null, "Voulez vous terminer la facturation ?", "Confirmation", JOptionPane.YES_NO_OPTION);        
        if (fact_ok == 0) {
            
        }
    }
    
    private void art_desactive() {
        txt_code_art.setEnabled(false);
        txt_code_art.setEditable(false);
        txt_code_art.requestFocus(false);
        txt_code_art.setInputVerifier(null);
        txt_code_art.enableInputMethods(false);
        txt_code_art.setInputVerifier(null);
        txt_code_art.setRequestFocusEnabled(false);
        Enregistrer.setEnabled(false);
        art_ok = true;        
        sauvegarder.setEnabled(true);
    }

    private void art_active() {
        txt_code_art.setEnabled(true);
        txt_code_art.setEditable(true);        
        Enregistrer.setEnabled(true);
        art_ok = false;        
        
    }
    
    private void sauvegarderActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_sauvegarderActionPerformed
        //info_bancaire();
       
        //info_bancaire();
        //txt_code_art.setEnabled(false);
        //txt_code_art.setEditable(false);
        try {
            if ("".equals(txt_nfact.getText()) ) {
           JOptionPane.showMessageDialog(null, "Merci de Saisir le N°Facture !");
          }
          else {    
                art_desactive();        
                sauvegarder.setEnabled(false);
            /*   int com = JOptionPane.showConfirmDialog(null, "Observation", "Confirmation", JOptionPane.YES_NO_OPTION);            
            if (com == 0) { 
                        txt_commentaire.setVisible(true);
                        Label_coment.setVisible(true);
                        //txt_commentaire.setText(comment);
                        txt_commentaire.setEditable(true);
                        txt_commentaire.setEnabled(true);
                        txt_commentaire.requestFocus();
            }
            */
            int choix = JOptionPane.showConfirmDialog(null, "Voulez vous confirmer votre choix", "Confirmation", JOptionPane.YES_NO_OPTION);            
            if (choix == 0) {
                //info_bancaire();     
                txt_dom_bnq = "";
                txt_ncheque = "";
                txt_bc = "";
                txt_dt_bc = ((JTextField) date_fact.getDateEditor().getUiComponent()).getText();
                txt_nom_preneur = "";
                ind_timbre = false;                
                switch (parametre) {
                    case "stock_f":
                        Object[] options_f = {"Chèque", "Espèces"};                        
                        int rf = JOptionPane.showOptionDialog(null, " Mode de payement ?", "Reglement", JOptionPane.YES_NO_OPTION, JOptionPane.QUESTION_MESSAGE, null, options_f, options_f[1]);                        
                        
                        if (rf == 0) {                                                        
                            ind_timbre = true;                                                                                    
                            info_bancaire();
                        }
                        break;
                    
                    case "stock_bl":
                        
                        ind_timbre = true;                        
                        info_bl();

                        break;
                    
                    case "":
                        ind_timbre = true;                        
                        break;
                    
                }
                
                
                String sql = "select id, Narticle , prix, tva, qte , total_ligne from facture_a where narticle='" + txt_code_art.getText() + "'";
                // Connection cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/test", "root", "");
                St1 = cnx.createStatement();
                St3 = cnx.createStatement();                
                St = cnx.createStatement();
                Rs = St.executeQuery(sql);
                //JOptionPane.showMessageDialog(null,"la SAUVEGARDE !");
                if (Rs.next()) {                    
                    String add7 = Rs.getString("qte");                    
                    mettre_jour_stock(txt_code_art.getText(), "restituer", add7);
                    String query = "update facture_a set qte ='"
                            + txt_qte.getText() + "', prix ='"
                            + prix_unitaire.toString() + "', total_ligne ='"
                            + stot_ligne.toString() + "' where narticle = '" + txt_code_art.getText() + "'";                    

                    Update_Table_Factures();                    
                    calcul_des_montant();
                    mettre_jour_stock(txt_code_art.getText(), "ajouter", txt_qte.getText());
                    // JOptionPane.showMessageDialog(null,"ligne moodifiée !");                        
                } else {                    
                    
                    if (!"".equals(txt_code_art.getText())) {
                        
                        String query = "insert into facture_a (nfact,narticle, qte,tva,prix,total_ligne,type_fact) values ('"
                                + txt_nfact.getText() + "','"
                                + txt_code_art.getText() + "','"
                                + txt_qte.getText() + "','"
                                + txt_tva.getText() + "','"
                                + prix_unitaire.toString() + "','"
                                + stot_ligne.toString() + "','"
                                + parametre + "')";
                        
                        St.executeUpdate(query);
                        Update_Table_Factures();                        
                        mettre_jour_stock(txt_code_art.getText(), "ajouter", txt_qte.getText());
                        int lastRow = Table_Factures.getRowCount() - 1;
                        Table_Factures.changeSelection(lastRow, lastRow, rootPaneCheckingEnabled, rootPaneCheckingEnabled);
                    }
                }
                
                calcul_des_montant();
                if (ind_timbre) {
                    timbre = 0.00;
                    txt_timbre.setText("0.00");
                    double ttc = xtot_ht + xtot_tva + timbre;
                    String add_ttc = mntFmt.mntFmt(ttc);
                    txt_TTC.setText(add_ttc);
                }                
                date_fact.setDateFormatString("yyyy-MM-dd");                
                String query = "insert into " + fichier_master + "(nfact,nfournisseur,date_fact,montant_ht,timbre,tva,autre_taxe,banque,ncheque) values ('"
                        + txt_nfact.getText() + "','"
                        + txt_code_cli.getText() + "','"
                        + ((JTextField) date_fact.getDateEditor().getUiComponent()).getText() + "','"
                        + xtot_ht.toString() + "','"
                        + timbre.toString() + "','"
                        + xtot_tva.toString() + "','"
                        + stot_ligne.toString() + "','"
                        + txt_dom_bnq + "','"
                        + txt_ncheque + "')";
                  
                St.executeUpdate(query);
                if (!parametre.equals("")) {
                    query = "select ca" + champf + " as ca from fournisseur where nfournisseur= '" + txt_code_cli.getText() + "'";
                   
                    St.execute(query);
                    Rs = St.executeQuery(query);
                    if (Rs.next()) {
                        String add1 = Rs.getString("ca");                        
                        double xtot_ttc = xtot_ht + timbre + xtot_tva + Double.parseDouble(add1);                        
                        query = "update fournisseur set ca" + champf + "=" + xtot_ttc + " where nfournisseur= '" + txt_code_cli.getText() + "'";
                        //JOptionPane.showMessageDialog(null,query);
                        exp_spell = Numb_to_Spell.spell((xtot_ht + timbre + xtot_tva), "");;
                        St.executeUpdate(query);                        
                    } 
                    } else {
                         exp_spell = Numb_to_Spell.spell((xtot_ht + timbre + xtot_tva), "");
                        
                }
                query ="update facture_a set nfact='" +txt_nfact.getText() + "'";
                // JOptionPane.showMessageDialog(null, query);
                St.executeUpdate(query);
                query = "insert into " + fichier_detail + " (nfact,nfournisseur, narticle, qte,tva,prix,total_ligne) select nfact,nfournisseur, narticle, qte,tva,prix,total_ligne from facture_a";
                // JOptionPane.showMessageDialog(null, query);
                St.executeUpdate(query);
                Update_Table_Factures();
                query = "truncate table facture_temp";
                St.execute(query);
                query = "INSERT INTO facture_temp select id, NFact, Narticle, Qte, tva, prix,prix, total_ligne, type_fact from facture_a";
                // JOptionPane.showMessageDialog(null, query);
                St.execute(query);
                calcul_des_montant();
                query = "truncate table facture_a";
                St.execute(query);
                //JOptionPane.showMessageDialog(null,"ligne ajoutée !");            
                //JOptionPane.showMessageDialog(null,"Vous avez dit Yes !");            
                
            }  
                btn_nouvelle_facture.setEnabled(true);
                btn_imprimer.setEnabled(true);
                
            
            } 
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans l'insertion table\n" + e.getMessage());
        }        
    }//GEN-LAST:event_sauvegarderActionPerformed
    
    private void btn_supprimerActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btn_supprimerActionPerformed
        
        try {
            String sql = "delete from facture_a where narticle='" + txt_code_art.getText() + "'";
            int r = JOptionPane.showConfirmDialog(null, "Voulez vous confirmer la suppression ? ", "Suppression", JOptionPane.YES_NO_OPTION);            
            if (r == 0) {                
                //Connection cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/test", "root", "");
                
               // St = cnx.createStatement();
                St.executeUpdate(sql);
                Update_Table_Factures();
                calcul_des_montant();
                JOptionPane.showMessageDialog(null, " Ligne supprimée !");
                mettre_jour_stock(txt_code_art.getText(), "restituer", txt_qte.getText());
                champs_vide();
                
            }
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans la suppresion table\n" + e.getMessage());
            
        }        
        
    }//GEN-LAST:event_btn_supprimerActionPerformed
    
    private void txt_code_cliFocusLost(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_txt_code_cliFocusLost

        //JOptionPane.showMessageDialog(null, txt_code_cli.requestFocusInWindow());
        
        if (!art_ok) {            
            txt_code_cli.setInputVerifier(new Pass_Verifier_Fournisseur(base));
            String sql = "select * from fournisseur where nfournisseur = '" + txt_code_cli.getText() + "'";            
            try {
                Rs = St.executeQuery(sql);                
                if (Rs.next()) {
                    String add = txt_code_cli.getText() ;//+ " " + Rs.getString("nom_fournisseur");
                    String add2 = Rs.getString("nom_fournisseur");
                   // String comment = Rs.getString("commentaire");
                    
                    /* if (!comment.equals("")) {
                        txt_commentaire.setVisible(true);
                        Label_coment.setVisible(true);
                        txt_commentaire.setText(comment);
                        txt_commentaire.setEditable(false);
                        txt_commentaire.setEnabled(false);
                    } else { 
                        txt_commentaire.setVisible(false);
                        Label_coment.setVisible(false);  
                        txt_commentaire.setText("");
                        txt_commentaire.setEditable(false);
                        txt_commentaire.setEnabled(false);
                    
                    } */
                        
                    String add1 = txt_code_cli.getText();
                    txt_code_cli.setText(add1);                    
                    
                    for (j = 0; j < jComboBox1.getItemCount(); j++) {
                        
                        if (add2.equals(jComboBox1.getItemAt(j).toString())) {
                            
                            break;                            
                        }
                    }                    
                    jComboBox1.setSelectedIndex(j);                    
                } else {                    
                    getToolkit().beep();
                    //getToolkit().beep();
                    //JOptionPane.showMessageDialog(null, "Code client Inéxistant");
                    // txt_code_cli.requestFocus(true);
                    //txt_code_cli.setText("");
                    txt_code_cli.requestFocus();
                    // JOptionPane.showMessageDialog(null, "Salam");
                    
                }                
            } catch (Exception e) {
                JOptionPane.showMessageDialog(null, "Erreur dans le comboBox \n" + e.getMessage());
            }
        }
    }//GEN-LAST:event_txt_code_cliFocusLost
    
    private void txt_code_cliFocusGained(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_txt_code_cliFocusGained
        //txt_code_cli.setText("");
        //JOptionPane.showMessageDialog(null, "Salam");
        //txt_code_cli.requestFocusInWindow();
        //   txt_code_cli.setRequestFocusEnabled(true);
        //txt_code_cli.requestFocus(true);        
    }//GEN-LAST:event_txt_code_cliFocusGained
    
    private void jComboBox1PopupMenuWillBecomeInvisible(javax.swing.event.PopupMenuEvent evt) {//GEN-FIRST:event_jComboBox1PopupMenuWillBecomeInvisible
        String tmp = (String) jComboBox1.getSelectedItem();        
        
        String sql = "select * from fournisseur where nom_fournisseur  = '" + tmp + "'";        
        try {
            Rs = St.executeQuery(sql);            
            if (Rs.next()) {
                
                String add = Rs.getString("nfournisseur");                
                //JOptionPane.showMessageDialog(null,add);
                txt_code_cli.setText(add);                
            } else {
                JOptionPane.showMessageDialog(null, "Pas de fournisseur pour ce code");
            }            
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans le comboBox \n" + e.getMessage());            
    }//GEN-LAST:event_jComboBox1PopupMenuWillBecomeInvisible
    }
    private void txt_code_artFocusLost(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_txt_code_artFocusLost
        //JOptionPane.showMessageDialog(null, art_ok); 
        //if (!art_ok) {           
        txt_code_art.setInputVerifier(new Pass_Verifier_Art(base));
        String sql = "select * from article where narticle = '" + txt_code_art.getText() + "'";        
        try {
            Rs = St.executeQuery(sql);            
            if (Rs.next()) {
                String add = Rs.getString("designation");
                String add1 = Rs.getString("narticle");
                txt_code_art.setText(add1);                
                
                for (j = 0; j < jComboBox2.getItemCount(); j++) {
                    
                    if (add.equals(jComboBox2.getItemAt(j).toString())) {                        
                        break;                        
                    }
                }
                jComboBox2.setSelectedIndex(j);                
            } else {
                //JOptionPane.showMessageDialog(null, "Salam");
                getToolkit().beep();
                txt_code_art.requestFocus();
            }            
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans le comboBox \n" + e.getMessage());
        }                 
    }//GEN-LAST:event_txt_code_artFocusLost
    
    private void txt_code_artFocusGained(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_txt_code_artFocusGained
        //txt_code_art.setText("");
        //txt_code_art.requestFocus(true);
    }//GEN-LAST:event_txt_code_artFocusGained
    
    private void jComboBox2PopupMenuWillBecomeInvisible(javax.swing.event.PopupMenuEvent evt) {//GEN-FIRST:event_jComboBox2PopupMenuWillBecomeInvisible
        String tmp = (String) jComboBox2.getSelectedItem();        
        String sql = "select * from article where designation = '" + tmp + "'";        
        try {
            Rs = St.executeQuery(sql);            
            if (Rs.next()) {
                String add = Rs.getString("narticle");                
                txt_code_art.setText(add);                
                String add5 = Rs.getString("Prix_unitaire");
                txt_prix_unit.setText(mntFmt.mntFmt(Double.parseDouble(add5)));                
                String add6 = Rs.getString("TVA");
                txt_tva.setText(add6);
                String add7 = Rs.getString("stock_f");
                txt_stock_f.setText(add7);
                String add8 = Rs.getString("stock_bl");
                txt_stock_bl.setText(add8);
                txt_qte.setText("");
                txt_prix_tot.setText("");
            } else {
                JOptionPane.showMessageDialog(null, "Pas de article pour ce code");
            }            
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans le comboBox \n" + e.getMessage());            
        }        
    }//GEN-LAST:event_jComboBox2PopupMenuWillBecomeInvisible
    
    private void btn_nouvelle_factureActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btn_nouvelle_factureActionPerformed
        
        art_ok = false;
        ind_timbre = false;
        champs_vide();
        txt_commentaire.setVisible(false);
        Label_coment.setVisible(false);                        
        txt_commentaire.setEditable(false);
        txt_commentaire.setEnabled(false);
        calcul_des_montant();
        
        jComboBox1.setSelectedIndex(0);        
        query = "truncate table facture_a";
        try {
            St.execute(query);            
            /* query = "select count(*) as nbre_enr FROM " + fichier_master + ";";
            St.execute(query);
            Rs = St.executeQuery(query);
            if (Rs.next()) {
                String add1 = Rs.getString("nbre_enr");
                if (Integer.parseInt(add1) > 0) {
                    query = "select max(nfact) as nfact_max FROM " + fichier_master + ";";
                    // JOptionPane.showMessageDialog(null, query);
                    Rs = St.executeQuery(query);
                    if (Rs.next()) {
                        String add2 = Rs.getString("nfact_max");
                        // JOptionPane.showMessageDialog(null, add1);
                        int_nfact = Integer.parseInt(add2) + 1;
                    }                    
                } else {
                    int_nfact = 1;
                }                
                txt_nfact.setText(Integer.toString(int_nfact));
            }  
             */
            stot_ligne = 0.00;            
            prix_unitaire = 0.00;            
            add1_d = .00;
            timbre = 0.00;
            tva = 0.00;
            xtot_ht = 0.00;            
            xtot_tva = 0.00;
            Update_Table_Factures();
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur  \n" + e.getMessage());            
        }
        txt_code_cli.setText("");
        Date dt = new Date();        
        date_fact.setDate(dt);
        date_fact.setDateFormatString("yyyy-MM-dd");
        btn_nouvelle_facture.setEnabled(false);
        btn_imprimer.setEnabled(false);
        date_fact.requestFocusInWindow();
        JOptionPane.showMessageDialog(null, "Nouvelle saisie !");
        txt_code_cli.requestFocus();
        art_active();
    }//GEN-LAST:event_btn_nouvelle_factureActionPerformed
    
    private void btn_imprimerActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btn_imprimerActionPerformed
        art_desactive();        
        try {            
            String query = "select * from activite";
            Rs = St.executeQuery(query);
            if (Rs.next()) {                
                txt_domaine_actvite = Rs.getString("domaine_activite");                
                txt_sous_domaine = Rs.getString("sous_domaine");
                txt_raison_sociale_v = Rs.getString("raison_sociale");
                txt_adresse = Rs.getString("adresse");
                txt_commune = Rs.getString("commune");
                txt_wilaya = Rs.getString("wilaya");
                txt_tel_fixe = Rs.getString("tel_fixe");
                txt_tel_port = Rs.getString("tel_port");
                txt_nrcv = Rs.getString("nrc");
                txt_nis = Rs.getString("nis");
                txt_nart = Rs.getString("nart");
                txt_ident_fiscal = Rs.getString("ident_fiscal");
                txt_banq = Rs.getString("banq");                
            }            
            switch (parametre) {
                case "stock_f":
                    jd = JRXmlLoader.load("C:\\outil_dev\\report_fact.jrxml");
                    sql = "SELECT fact.`NFact` AS fact_NFact,      fact.`Nclient` AS fact_Nclient,      fact.`date_fact` AS fact_date_fact,      fact.`montant_ht` AS fact_montant_ht,      fact.`timbre` AS fact_timbre,      fact.`TVA` AS fact_TVA,      fact.`autre_taxe` AS fact_autre_taxe,      client.`Nclient` AS client_Nclient,      client.`Raison_sociale` AS client_Raison_sociale,      client.`adresse` AS client_adresse,      client.`NRC` AS client_NRC,      client.`Date_RC` AS client_Date_RC,      client.`Lieu_RC` AS client_Lieu_RC,      client.`I_Fiscal` AS client_I_Fiscal,      client.`N_article` AS client_N_article       FROM      `client` client INNER JOIN `fact` fact ON client.`Nclient` = fact.`Nclient` WHERE fact.nfact ='" + txt_nfact.getText() + "'";
                    break;
                
                case "stock_bl":                   
                    jd = JRXmlLoader.load("C:\\outil_dev\\report_bl.jrxml");
                    sql = "SELECT bl.`NFact` AS fact_NFact,      bl.`Nclient` AS fact_Nclient,      bl.`date_fact` AS fact_date_fact,      bl.`montant_ht` AS fact_montant_ht,      bl.`timbre` AS fact_timbre,      bl.`TVA` AS fact_TVA,      bl.`autre_taxe` AS fact_autre_taxe,      client.`Nclient` AS client_Nclient,      client.`Raison_sociale` AS client_Raison_sociale,      client.`adresse` AS client_adresse,      client.`NRC` AS client_NRC,      client.`Date_RC` AS client_Date_RC,      client.`Lieu_RC` AS client_Lieu_RC,      client.`I_Fiscal` AS client_I_Fiscal,      client.`N_article` AS client_N_article,  bl.`nbc` AS fact_nbc, bl.`date_bc` AS fact_date_bc, bl.`nom_preneur` AS fact_nom_preneur        FROM      `client` client INNER JOIN `bl` bl ON client.`Nclient` = bl.`Nclient` WHERE bl.nfact ='" + txt_nfact.getText() + "'";                    
                    break;
                
                case "":
                    jd = JRXmlLoader.load("C:\\outil_dev\\report_prof.jrxml");
                    sql = "SELECT fprof.`NFact` AS fact_NFact,      fprof.`Nclient` AS fact_Nclient,      fprof.`date_fact` AS fact_date_fact,      fprof.`montant_ht` AS fact_montant_ht,      fprof.`timbre` AS fact_timbre,      fprof.`TVA` AS fact_TVA,      fprof.`autre_taxe` AS fact_autre_taxe,      client.`Nclient` AS client_Nclient,      client.`Raison_sociale` AS client_Raison_sociale,      client.`adresse` AS client_adresse,      client.`NRC` AS client_NRC,      client.`Date_RC` AS client_Date_RC,      client.`Lieu_RC` AS client_Lieu_RC,      client.`I_Fiscal` AS client_I_Fiscal,      client.`N_article` AS client_N_article       FROM      `client` client INNER JOIN `fprof` fprof ON client.`Nclient` = fprof.`Nclient` WHERE fprof.nfact ='" + txt_nfact.getText() + "'";
                    break;
                
            }


            //JOptionPane.showMessageDialog(null, sql);
            JRDesignQuery newquery = new JRDesignQuery();
            newquery.setText(sql);
            jd.setQuery(newquery);
            //JOptionPane.showMessageDialog(null, cnx);
            
            HashMap hm = new HashMap();
            hm.put("fact_spell", exp_spell);            
            hm.put("domaine_activite_p", txt_domaine_actvite);
            hm.put("sous_domaine_p", txt_sous_domaine);
            hm.put("raison_sociale_p", txt_raison_sociale_v);
            hm.put("adress_p", txt_adresse);
            hm.put("commune_p", txt_commune);
            hm.put("wilaya_p", txt_wilaya);
            hm.put("tel_fixe_p", txt_tel_fixe);
            hm.put("tel_port_p", txt_tel_port);
            hm.put("nrc_p", txt_nrcv);
            hm.put("nis_p", txt_nis);
            hm.put("art_p", txt_nart);
            hm.put("ident_fiscal_p", txt_ident_fiscal);
            hm.put("banq_p", txt_banq);
            JasperReport jr = JasperCompileManager.compileReport(jd);
            JasperPrint jp = JasperFillManager.fillReport(jr, hm, cnx);            
            JasperViewer.viewReport(jp, false);            
        } catch (Exception e) {
            e.printStackTrace() ;
        }        
        
    }//GEN-LAST:event_btn_imprimerActionPerformed
    
    private void btn_quitterActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btn_quitterActionPerformed
        try {            
            String query = "select count(*) as nbre_enr FROM facture_a";
            Rs = St.executeQuery(query);            
            if (Rs.next()) {
                String add1 = Rs.getString("nbre_enr");
                if (Integer.parseInt(add1) > 0) {                    
                    int r = JOptionPane.showConfirmDialog(null, "Vous voulez abandoner la facturation ?", "Confirmation", JOptionPane.YES_NO_OPTION);                    
                    if (r == 0) {
                        //    JOptionPane.showMessageDialog(null,"SALAM");
                        nettoyer_facture.nettoyer_facture(base, facture);
                        this.dispose();
                    }                    
                    
                } else {
                    this.dispose();                    
                }
            }
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur impression " + e.getMessage());
        }        
    }//GEN-LAST:event_btn_quitterActionPerformed
    
    private void EnregistrerFocusLost(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_EnregistrerFocusLost
        // if (! art_ok) {
        ajout_ligne();
        //}
    }//GEN-LAST:event_EnregistrerFocusLost
    
    private void jComboBox1FocusLost(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_jComboBox1FocusLost
        //txt_code_cli.requestFocus(false);
        // mise à jour le 5 Sept 2014
        /* art_active();
        txt_code_art.setRequestFocusEnabled(true);
        txt_code_art.requestFocus(); */
    }//GEN-LAST:event_jComboBox1FocusLost
    
    private void date_factFocusLost(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_date_factFocusLost
        //JOptionPane.showMessageDialog(null,"Salam");
        txt_code_cli.requestFocus();
    }//GEN-LAST:event_date_factFocusLost

    private void txt_commentaireFocusLost(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_txt_commentaireFocusLost
                      
        try {
                      if (!txt_commentaire.getText().equals("")) {
                          query = "update fournisseur set commentaire ='" + txt_commentaire.getText().replace("'","''") + "' where nfournisseur= '" + txt_code_cli.getText() + "'";
                         //JOptionPane.showMessageDialog(null,query); 
                          St.executeUpdate(query);
                        }
                        txt_commentaire.setVisible(false);
                        Label_coment.setVisible(false);                        
                        txt_commentaire.setEditable(false);
                        txt_commentaire.setEnabled(false);
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans mise à jour du fournisseur " + e.getMessage());
        }        
    }//GEN-LAST:event_txt_commentaireFocusLost

    private void txt_nfactFocusLost(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_txt_nfactFocusLost
        art_active();
        txt_code_art.setRequestFocusEnabled(true);
        txt_code_art.requestFocus();
    }//GEN-LAST:event_txt_nfactFocusLost

    private void txt_prix_unitFocusGained(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_txt_prix_unitFocusGained
        txt_prix_unit.selectAll();        // TODO add your handling code here:
    }//GEN-LAST:event_txt_prix_unitFocusGained

    /**
     * 6
     *
     * @param args the command line arguments
     */
    public static void Achat(final String par, final String det, final String mas, final String bas) {
        /* Set the Nimbus look and feel */
        //<editor-fold defaultstate="collapsed" desc=" Look and feel setting code (optional) ">
        /* If Nimbus (introduced in Java SE 6) is not available, stay with the default look and feel.
         * For details see http://download.oracle.com/javase/tutorial/uiswing/lookandfeel/plaf.html 
         */
        try {
            for (javax.swing.UIManager.LookAndFeelInfo info : javax.swing.UIManager.getInstalledLookAndFeels()) {
                if ("Nimbus".equals(info.getName())) {
                    javax.swing.UIManager.setLookAndFeel(info.getClassName());
                    break;
                }
            }
        } catch (ClassNotFoundException ex) {
            java.util.logging.Logger.getLogger(Achat.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (InstantiationException ex) {
            java.util.logging.Logger.getLogger(Achat.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (IllegalAccessException ex) {
            java.util.logging.Logger.getLogger(Achat.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (javax.swing.UnsupportedLookAndFeelException ex) {
            java.util.logging.Logger.getLogger(Achat.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        }
        //</editor-fold>

        /* Create and display the form */
        java.awt.EventQueue.invokeLater(new Runnable() {
            public void run() {
                
                new Achat(par, det, mas, bas).setVisible(true);
                
            }
        });
    }
    // Déclaration des variables
    private Statement St, St1, St3;
    private ResultSet Rs, Rs1;
    public Connection cnx;
    public String txt_domaine_actvite, txt_sous_domaine, txt_raison_sociale_v, txt_adresse, txt_commune, txt_wilaya;
    public String txt_tel_fixe, txt_tel_port, txt_nrcv, txt_nis, txt_nart, txt_ident_fiscal, txt_banq, txt_query, exp_spell;
    public String parametre, fichier_detail, fichier_master,champf,base;
    String query, facture;
    public String txt_nom_preneur, txt_dt_bc, txt_bc;
    public boolean art_ok = false, ind_timbre = false, escape = true;
    public String sql, txt_dom_bnq, txt_ncheque;
    public Object[] message;
    public JasperDesign jd;
    int j, int_nfact;
    MyTableModel tm;
    Double stot_ligne = 0.00, prix_unitaire = 0.00, add1_d = .00, mnt = 0.00, timbre = 0.00, tva = 0.00, xtot_ht = 0.00, xtot_tva = 0.00;
    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JButton Enregistrer;
    private javax.swing.JLabel Label_coment;
    private javax.swing.JTable Table_Factures;
    private javax.swing.JButton btn_imprimer;
    private javax.swing.JButton btn_nouvelle_facture;
    private javax.swing.JButton btn_quitter;
    private javax.swing.JButton btn_supprimer;
    private com.toedter.calendar.JDateChooser date_fact;
    private javax.swing.JComboBox jComboBox1;
    private javax.swing.JComboBox jComboBox2;
    private javax.swing.JLabel jLabel1;
    private javax.swing.JLabel jLabel10;
    private javax.swing.JLabel jLabel11;
    private javax.swing.JLabel jLabel12;
    private javax.swing.JLabel jLabel13;
    private javax.swing.JLabel jLabel14;
    private javax.swing.JLabel jLabel15;
    private javax.swing.JLabel jLabel16;
    private javax.swing.JLabel jLabel2;
    private javax.swing.JLabel jLabel3;
    private javax.swing.JLabel jLabel4;
    private javax.swing.JLabel jLabel5;
    private javax.swing.JLabel jLabel6;
    private javax.swing.JLabel jLabel7;
    private javax.swing.JLabel jLabel8;
    private javax.swing.JLabel jLabel9;
    private javax.swing.JPanel jPanel1;
    private javax.swing.JPanel jPanel2;
    private javax.swing.JScrollPane jScrollPane1;
    private javax.swing.JButton sauvegarder;
    private javax.swing.JTextField txt_TTC;
    private javax.swing.JTextField txt_code_art;
    private javax.swing.JTextField txt_code_cli;
    private javax.swing.JTextField txt_commentaire;
    private javax.swing.JTextField txt_nfact;
    private javax.swing.JTextField txt_prix_tot;
    private javax.swing.JTextField txt_prix_unit;
    private javax.swing.JTextField txt_qte;
    private javax.swing.JTextField txt_s_total;
    private javax.swing.JTextField txt_stock_bl;
    private javax.swing.JTextField txt_stock_f;
    private javax.swing.JTextField txt_timbre;
    private javax.swing.JTextField txt_titre;
    private javax.swing.JTextField txt_total_tva;
    private javax.swing.JTextField txt_tva;
    // End of variables declaration//GEN-END:variables
}
