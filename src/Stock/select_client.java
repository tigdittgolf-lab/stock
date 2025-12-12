/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package Stock;

import java.awt.AWTKeyStroke;
import java.awt.KeyboardFocusManager;
import java.awt.event.KeyEvent;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;
import javax.swing.JOptionPane;
import javax.swing.KeyStroke;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.design.JRDesignQuery;
import net.sf.jasperreports.engine.design.JasperDesign;
import net.sf.jasperreports.engine.xml.JRXmlLoader;
import net.sf.jasperreports.view.JasperViewer;

/**
 *
 * @author IT
 */
public class select_client extends javax.swing.JFrame {

    /**
     * Creates new form select_client
     */
    public select_client(String bas) {
        base= bas;
        initComponents();
        jPanel4.setVisible(false);
        btn_valider.setEnabled(false);
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
    }
        
    

    private void Update_Table_bl_instance() {
        try {
            String sql = "SELECT distinct(b.nclient), cl.raison_sociale FROM bl b, client cl where b.nclient=cl.nclient";              
            tm = new MyTableModel(sql,base);
            Table_bl_instance.setModel(tm);
            Table_bl_instance.setDefaultRenderer(Double.class, new TKMntRenderer());
            sql = "select count(*) as nbr_enr_sel from bl;";
            St.execute(sql);
            Rs=St.executeQuery(sql);
            if (Rs.next()) {
            String add1 = Rs.getString("nbr_enr_sel");
            nbre_enr_sel = Integer.parseInt(add1);
            }
            } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "avec la table Clients\n" + e.getMessage());
        }
    }    
    
   private void calcul_nfact(){
          try {
            fichier_master ="fact";
            fichier_detail ="detail_fact";
            String query="select count(*) as nbre_enr FROM "+fichier_master+";";
            St.execute(query);
            Rs=St.executeQuery(query);
            if (Rs.next()) {
            String add1 = Rs.getString("nbre_enr");
            if (Integer.parseInt(add1) > 0) {
            query="select max(nfact) as nfact_max FROM "+fichier_master+";";
            //JOptionPane.showMessageDialog(null, query);
            Rs=St.executeQuery(query);
            if (Rs.next()) {
            String add2 = Rs.getString("nfact_max");
            
            int_nfact= Integer.parseInt(add2)+1;
            } 
            }else {
            int_nfact=1;
             }            
            //JOptionPane.showMessageDialog(null,int_nfact );
            //txt_nfact.setText(Integer.toString(int_nfact));
            }
    } catch (Exception e) {
    
    JOptionPane.showMessageDialog(null, "Erreur dans la table\n" + e.getMessage());
    }
    }
    
    private void Update_Table_bl() {
        try {
            String sql = "SELECT NFACT,DATE_FACT,MONTANT_HT,TIMBRE,TVA,AUTRE_TAXE,FACTURER FROM bl where nclient = '"+ txt_code_cli.getText() +"'";  
           // JOptionPane.showMessageDialog(null,sql);
            tm = new MyTableModel(sql,base);
            Table_bl.setModel(tm);
            Table_bl.setDefaultRenderer(Double.class, new TKMntRenderer());
            sql = "select count(*) as nbr_enr from bl where nclient = '"+ txt_code_cli.getText() +"'";
            St.execute(sql);
            Rs=St.executeQuery(sql);
            if (Rs.next()) {
            String add1 = Rs.getString("nbr_enr");
            nbre_enr = Integer.parseInt(add1);
            }
            //btn_valider();
            } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "avec la table Clients\n" + e.getMessage());
        }
    }    
    
 private void Update_Table_detail() {
        try {
            String sql = "SELECT * FROM detail_bl where 0";  
            tm = new MyTableModel(sql,base);
            Table_detail.setModel(tm);
            Table_detail.setDefaultRenderer(Double.class, new TKMntRenderer());           
            } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "avec la table Clients\n" + e.getMessage());
        }
    }       
    /**
     * This method is called from within the constructor to initialize the form.
     * WARNING: Do NOT modify this code. The content of this method is always
     * regenerated by the Form Editor.
     */
    @SuppressWarnings("unchecked")
    // <editor-fold defaultstate="collapsed" desc="Generated Code">//GEN-BEGIN:initComponents
    private void initComponents() {

        jPanel1 = new javax.swing.JPanel();
        jScrollPane1 = new javax.swing.JScrollPane();
        Table_bl_instance = new javax.swing.JTable();
        txt_code_cli = new javax.swing.JTextField();
        jLabel1 = new javax.swing.JLabel();
        txt_raison_sociale = new javax.swing.JTextField();
        jLabel2 = new javax.swing.JLabel();
        btn_rechercher = new javax.swing.JButton();
        jPanel2 = new javax.swing.JPanel();
        btn_tout_deselectionner = new javax.swing.JButton();
        btn_valider = new javax.swing.JButton();
        btn_tout_selectionner = new javax.swing.JButton();
        jScrollPane2 = new javax.swing.JScrollPane();
        Table_bl = new javax.swing.JTable();
        jPanel3 = new javax.swing.JPanel();
        jScrollPane3 = new javax.swing.JScrollPane();
        Table_detail = new javax.swing.JTable();
        jPanel4 = new javax.swing.JPanel();
        jLabel3 = new javax.swing.JLabel();
        jLabel4 = new javax.swing.JLabel();
        txt_banq = new javax.swing.JTextField();
        txt_ncheque = new javax.swing.JTextField();
        btn_ok_cheque = new javax.swing.JButton();
        btn_quitter = new javax.swing.JButton();

        setDefaultCloseOperation(javax.swing.WindowConstants.DISPOSE_ON_CLOSE);
        setExtendedState(javax.swing.JFrame.MAXIMIZED_BOTH);
        addWindowListener(new java.awt.event.WindowAdapter() {
            public void windowOpened(java.awt.event.WindowEvent evt) {
                formWindowOpened(evt);
            }
        });

        jPanel1.setBorder(javax.swing.BorderFactory.createTitledBorder(null, "Client", javax.swing.border.TitledBorder.DEFAULT_JUSTIFICATION, javax.swing.border.TitledBorder.DEFAULT_POSITION, new java.awt.Font("Verdana", 1, 14))); // NOI18N

        Table_bl_instance.setModel(new javax.swing.table.DefaultTableModel(
            new Object [][] {
                {null, null, null, null},
                {null, null, null, null},
                {null, null, null, null},
                {null, null, null, null}
            },
            new String [] {
                "Title 1", "Title 2", "Title 3", "Title 4"
            }
        ));
        Table_bl_instance.addMouseListener(new java.awt.event.MouseAdapter() {
            public void mouseClicked(java.awt.event.MouseEvent evt) {
                Table_bl_instanceMouseClicked(evt);
            }
        });
        Table_bl_instance.addKeyListener(new java.awt.event.KeyAdapter() {
            public void keyReleased(java.awt.event.KeyEvent evt) {
                Table_bl_instanceKeyReleased(evt);
            }
        });
        jScrollPane1.setViewportView(Table_bl_instance);

        jLabel1.setText("Code Client :");

        jLabel2.setText("Raison Sociale :");

        btn_rechercher.setText("Rechercher");
        btn_rechercher.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btn_rechercherActionPerformed(evt);
            }
        });

        javax.swing.GroupLayout jPanel1Layout = new javax.swing.GroupLayout(jPanel1);
        jPanel1.setLayout(jPanel1Layout);
        jPanel1Layout.setHorizontalGroup(
            jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, jPanel1Layout.createSequentialGroup()
                .addContainerGap(javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                .addComponent(btn_rechercher)
                .addGap(20, 20, 20))
            .addGroup(jPanel1Layout.createSequentialGroup()
                .addGroup(jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.TRAILING)
                    .addGroup(jPanel1Layout.createSequentialGroup()
                        .addContainerGap()
                        .addGroup(jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                            .addComponent(jLabel2)
                            .addComponent(jLabel1))
                        .addGap(18, 18, 18)
                        .addGroup(jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                            .addComponent(txt_code_cli, javax.swing.GroupLayout.PREFERRED_SIZE, 68, javax.swing.GroupLayout.PREFERRED_SIZE)
                            .addComponent(txt_raison_sociale)))
                    .addGroup(javax.swing.GroupLayout.Alignment.LEADING, jPanel1Layout.createSequentialGroup()
                        .addGap(28, 28, 28)
                        .addComponent(jScrollPane1, javax.swing.GroupLayout.PREFERRED_SIZE, 337, javax.swing.GroupLayout.PREFERRED_SIZE)))
                .addGap(84, 84, 84))
        );
        jPanel1Layout.setVerticalGroup(
            jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel1Layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jScrollPane1, javax.swing.GroupLayout.PREFERRED_SIZE, 110, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, 35, Short.MAX_VALUE)
                .addGroup(jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(txt_code_cli, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel1))
                .addGap(18, 18, 18)
                .addGroup(jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(txt_raison_sociale, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel2))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(btn_rechercher))
        );

        jPanel2.setBorder(javax.swing.BorderFactory.createTitledBorder(null, "Liste des BL par Client", javax.swing.border.TitledBorder.DEFAULT_JUSTIFICATION, javax.swing.border.TitledBorder.DEFAULT_POSITION, new java.awt.Font("Verdana", 1, 14))); // NOI18N

        btn_tout_deselectionner.setText("Déselectionner tout");
        btn_tout_deselectionner.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btn_tout_deselectionnerActionPerformed(evt);
            }
        });

        btn_valider.setText("Valider le passage");
        btn_valider.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btn_validerActionPerformed(evt);
            }
        });

        btn_tout_selectionner.setText("Selectionner tout");
        btn_tout_selectionner.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btn_tout_selectionnerActionPerformed(evt);
            }
        });

        Table_bl.setModel(new javax.swing.table.DefaultTableModel(
            new Object [][] {
                {null, null, null, null},
                {null, null, null, null},
                {null, null, null, null},
                {null, null, null, null}
            },
            new String [] {
                "Title 1", "Title 2", "Title 3", "Title 4"
            }
        ));
        Table_bl.addMouseListener(new java.awt.event.MouseAdapter() {
            public void mouseClicked(java.awt.event.MouseEvent evt) {
                Table_blMouseClicked(evt);
            }
        });
        jScrollPane2.setViewportView(Table_bl);

        javax.swing.GroupLayout jPanel2Layout = new javax.swing.GroupLayout(jPanel2);
        jPanel2.setLayout(jPanel2Layout);
        jPanel2Layout.setHorizontalGroup(
            jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel2Layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jScrollPane2, javax.swing.GroupLayout.PREFERRED_SIZE, 762, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addContainerGap(javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
            .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, jPanel2Layout.createSequentialGroup()
                .addGap(0, 0, Short.MAX_VALUE)
                .addComponent(btn_tout_selectionner)
                .addGap(32, 32, 32)
                .addComponent(btn_tout_deselectionner)
                .addGap(38, 38, 38)
                .addComponent(btn_valider, javax.swing.GroupLayout.PREFERRED_SIZE, 193, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addContainerGap())
        );
        jPanel2Layout.setVerticalGroup(
            jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel2Layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jScrollPane2, javax.swing.GroupLayout.DEFAULT_SIZE, 173, Short.MAX_VALUE)
                .addGap(18, 18, 18)
                .addGroup(jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(btn_tout_selectionner)
                    .addComponent(btn_tout_deselectionner)
                    .addComponent(btn_valider))
                .addContainerGap())
        );

        jPanel3.setBorder(javax.swing.BorderFactory.createTitledBorder(null, "Détail du BL sélectionné", javax.swing.border.TitledBorder.DEFAULT_JUSTIFICATION, javax.swing.border.TitledBorder.DEFAULT_POSITION, new java.awt.Font("Verdana", 1, 14))); // NOI18N

        Table_detail.setModel(new javax.swing.table.DefaultTableModel(
            new Object [][] {
                {null, null, null, null},
                {null, null, null, null},
                {null, null, null, null},
                {null, null, null, null}
            },
            new String [] {
                "Title 1", "Title 2", "Title 3", "Title 4"
            }
        ));
        jScrollPane3.setViewportView(Table_detail);

        javax.swing.GroupLayout jPanel3Layout = new javax.swing.GroupLayout(jPanel3);
        jPanel3.setLayout(jPanel3Layout);
        jPanel3Layout.setHorizontalGroup(
            jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel3Layout.createSequentialGroup()
                .addGap(30, 30, 30)
                .addComponent(jScrollPane3, javax.swing.GroupLayout.PREFERRED_SIZE, 781, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addContainerGap(19, Short.MAX_VALUE))
        );
        jPanel3Layout.setVerticalGroup(
            jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, jPanel3Layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jScrollPane3, javax.swing.GroupLayout.DEFAULT_SIZE, 212, Short.MAX_VALUE)
                .addContainerGap())
        );

        jPanel4.setBorder(javax.swing.BorderFactory.createTitledBorder(null, "Infortmation bancaire", javax.swing.border.TitledBorder.DEFAULT_JUSTIFICATION, javax.swing.border.TitledBorder.DEFAULT_POSITION, new java.awt.Font("Verdana", 1, 14))); // NOI18N
        jPanel4.setToolTipText("");

        jLabel3.setText("Banq :");

        jLabel4.setText("N°Chèque :");

        btn_ok_cheque.setText("OK");
        btn_ok_cheque.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btn_ok_chequeActionPerformed(evt);
            }
        });

        javax.swing.GroupLayout jPanel4Layout = new javax.swing.GroupLayout(jPanel4);
        jPanel4.setLayout(jPanel4Layout);
        jPanel4Layout.setHorizontalGroup(
            jPanel4Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel4Layout.createSequentialGroup()
                .addGap(51, 51, 51)
                .addGroup(jPanel4Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(jLabel4, javax.swing.GroupLayout.PREFERRED_SIZE, 59, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel3, javax.swing.GroupLayout.PREFERRED_SIZE, 59, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addGap(27, 27, 27)
                .addGroup(jPanel4Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(txt_banq, javax.swing.GroupLayout.PREFERRED_SIZE, 54, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(txt_ncheque, javax.swing.GroupLayout.PREFERRED_SIZE, 141, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addContainerGap(82, Short.MAX_VALUE))
            .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, jPanel4Layout.createSequentialGroup()
                .addContainerGap(javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                .addComponent(btn_ok_cheque, javax.swing.GroupLayout.PREFERRED_SIZE, 53, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addGap(21, 21, 21))
        );
        jPanel4Layout.setVerticalGroup(
            jPanel4Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel4Layout.createSequentialGroup()
                .addGap(47, 47, 47)
                .addGroup(jPanel4Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel3)
                    .addComponent(txt_banq, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addGap(21, 21, 21)
                .addGroup(jPanel4Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel4)
                    .addComponent(txt_ncheque, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, 50, Short.MAX_VALUE)
                .addComponent(btn_ok_cheque)
                .addContainerGap())
        );

        btn_quitter.setText("Quitter");
        btn_quitter.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btn_quitterActionPerformed(evt);
            }
        });

        javax.swing.GroupLayout layout = new javax.swing.GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addGap(20, 20, 20)
                .addComponent(jPanel1, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, 42, Short.MAX_VALUE)
                .addComponent(jPanel2, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addGap(287, 287, 287))
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jPanel3, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addGroup(layout.createSequentialGroup()
                        .addGap(43, 43, 43)
                        .addComponent(jPanel4, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                        .addGap(0, 0, Short.MAX_VALUE))
                    .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                        .addComponent(btn_quitter, javax.swing.GroupLayout.PREFERRED_SIZE, 109, javax.swing.GroupLayout.PREFERRED_SIZE)
                        .addGap(296, 296, 296))))
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addGap(25, 25, 25)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.TRAILING)
                    .addComponent(jPanel2, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(jPanel1, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addGroup(layout.createSequentialGroup()
                        .addGap(68, 68, 68)
                        .addComponent(jPanel3, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                    .addGroup(layout.createSequentialGroup()
                        .addGap(79, 79, 79)
                        .addComponent(jPanel4, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addComponent(btn_quitter)))
                .addContainerGap(283, Short.MAX_VALUE))
        );

        pack();
    }// </editor-fold>//GEN-END:initComponents

    private void formWindowOpened(java.awt.event.WindowEvent evt) {//GEN-FIRST:event_formWindowOpened
    String pilote = "com.mysql.jdbc.Driver";


        try {
            // connexion avec la base de donnée 
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
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur de connexcion\n" + e.getMessage());
        }
        Update_Table_bl_instance();        
    }//GEN-LAST:event_formWindowOpened

    private void Table_bl_instanceMouseClicked(java.awt.event.MouseEvent evt) {//GEN-FIRST:event_Table_bl_instanceMouseClicked
         try {
            int row = Table_bl_instance.getSelectedRow();
            int col = Table_bl_instance.getSelectedColumn();
            String Table_click = (Table_bl_instance.getModel().getValueAt(row, 0).toString());
            String sql = "SELECT distinct(b.nclient), cl.raison_sociale FROM bl b, client cl where b.nclient=cl.nclient and b.nclient= '" + Table_click + "'";
            //JOptionPane.showMessageDialog(null,sql );
            cell_click = Table_bl_instance.getModel().getValueAt(row, col).toString();
           
           // Connection cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/test?useUnicode=yes&amp;characterEncoding=UTF-8", "root", "");
            
            //St = cnx.createStatement();
            Rs = St.executeQuery(sql);

            if (Rs.next()) {
                affiche_champs1();                
            }
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans la table\n" + e.getMessage());
        }                // TODO add your handling code here:
    }//GEN-LAST:event_Table_bl_instanceMouseClicked

    private void Table_bl_instanceKeyReleased(java.awt.event.KeyEvent evt) {//GEN-FIRST:event_Table_bl_instanceKeyReleased
        if (evt.getKeyCode() == KeyEvent.VK_DOWN || evt.getKeyCode() == KeyEvent.VK_UP || evt.getKeyCode() == KeyEvent.VK_PAGE_UP || evt.getKeyCode() == KeyEvent.VK_PAGE_DOWN || evt.getKeyCode() == KeyEvent.VK_HOME || evt.getKeyCode() == KeyEvent.VK_END) {
            try {
                int row = Table_bl_instance.getSelectedRow();
                String Table_click = (Table_bl_instance.getModel().getValueAt(row, 0).toString());                
                String sql = "SELECT distinct(b.nclient), cl.raison_sociale FROM bl b, client cl where b.nclient=cl.nclient and b.nclient= '" + Table_click + "'";
               // Connection cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/test", "root", "");
                //St = cnx.createStatement();
                Rs = St.executeQuery(sql);
                if (Rs.next()) {
                affiche_champs1(); 
                }
            } catch (Exception e) {
                JOptionPane.showMessageDialog(null, "Erreur dans la table\n" + e.getMessage());
            }
        }
        // TODO add your handling code here:
    }//GEN-LAST:event_Table_bl_instanceKeyReleased

    private void btn_tout_selectionnerActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btn_tout_selectionnerActionPerformed
        sele_deselect = true;
        choix_sele_deselect (sele_deselect);
        btn_valider();
    }//GEN-LAST:event_btn_tout_selectionnerActionPerformed

    private void btn_tout_deselectionnerActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btn_tout_deselectionnerActionPerformed
        sele_deselect = false;
        choix_sele_deselect (sele_deselect);
        btn_valider();
    }//GEN-LAST:event_btn_tout_deselectionnerActionPerformed

  private void choix_sele_deselect (boolean sel_des) {
          for ( int j =0; j<nbre_enr; j++) {          
           Table_bl.setValueAt(sel_des, j, rang_champ_select);
           
       }
 }
    
private void btn_valider() {
    boolean ind = false;
    for ( int j =0; j<nbre_enr; j++) {          
        if ((Table_bl.getModel().getValueAt(j, rang_champ_select)).equals(true)) {
            ind = true;            
        } 
    btn_valider.setEnabled(ind);
    }
}  
  
    private void btn_validerActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btn_validerActionPerformed
        // int position = Table_bl.getSelectedRow();
        
        //try{
            
            Object[] options = {"Espèces","Chèque"};                 
            r = JOptionPane.showOptionDialog(null, " Mode de reglement par ?", " Payement",  JOptionPane.YES_NO_OPTION, JOptionPane.QUESTION_MESSAGE,null, options,options[0]);           
              
            //JOptionPane.showMessageDialog(null, r);
           if (r == 1) {
               txt_banq.setText("");
               txt_ncheque.setText(""); 
               jPanel4.setVisible(true);
            } else {
            transferer();
              }     
    }//GEN-LAST:event_btn_validerActionPerformed

private void transferer() {
    
    try{
        String xnbc="", xnom_preneur="", xdate_bc="";
            sql ="truncate table facture";
            St.execute(sql);
            tot_montant_ht =0.00;
            tot_timbre=0.00;
            tot_tva=0.00;
            tot_autre_taxe=0.00;
            ind = false;
            
            Object [][] temp = new Object [nbre_enr][2];
          for ( int j =0; j<nbre_enr; j++) {
                
                if ((Table_bl.getModel().getValueAt(j, rang_champ_select)).equals(true))
                {
                   // JOptionPane.showMessageDialog(null, Table_bl.getModel().getValueAt(j, 0).toString());
                    temp [j][0]= Table_bl.getModel().getValueAt(j, 0).toString();                    
                    ind = true;                   
                    tot_montant_ht = tot_montant_ht + Double.parseDouble(Table_bl.getModel().getValueAt(j, 2).toString());
                    tot_timbre = tot_timbre + Double.parseDouble(Table_bl.getModel().getValueAt(j, 3).toString());
                    if (tot_timbre > 2500.00) {
                        tot_timbre=2500.00;
                    }
                   
                    tot_tva    = tot_tva + Double.parseDouble(Table_bl.getModel().getValueAt(j, 4).toString());
                    tot_autre_taxe = tot_autre_taxe + Double.parseDouble(Table_bl.getModel().getValueAt(j, 5).toString());                    
                   
                    code_cli= txt_code_cli.getText();
                    xdate_fact= Table_bl.getModel().getValueAt(j, 1).toString();
                   //JOptionPane.showMessageDialog(null, txt_code_cli.getText()); 
                    // vérifier que la table facture est vide à faire
                 String sql = "SELECT nbc,DATE_bc,nom_preneur FROM bl where nclient = '"+ txt_code_cli.getText() +"'";  
           // JOptionPane.showMessageDialog(null,sql);
            St.execute(sql);
            Rs=St.executeQuery(sql);
            if (Rs.next()) {
             xnbc = Rs.getString("nbc");
             xdate_bc = Rs.getString("date_bc");
             xnom_preneur = Rs.getString("nom_preneur");
            }
                    sql ="insert into facture (NFact, Narticle, Qte, tva, pr_achat, prix, total_ligne)  select NFact, Narticle, Qte, tva, pr_achat, prix, total_ligne from detail_bl where nfact ='" + Table_bl.getModel().getValueAt(j, 0) +"'" ;                                      
                    St.executeUpdate(sql);
                     String query ="delete from detail_bl where nfact ='" + Table_bl.getModel().getValueAt(j, 0) +"'" ;
                    St.executeUpdate(query);
                    query ="delete from bl where nfact ='" + Table_bl.getModel().getValueAt(j, 0) +"'" ;
                    St.executeUpdate(query);
                
                }
            }
     //     JOptionPane.showMessageDialog(null, "consulter la table facture");
          if (ind) {
          fill_prix_achat();    
          Update_Table_bl_instance();    
          Update_Table_bl();
          txt_code_cli.setText("");
          txt_raison_sociale.setText("");
            calcul_nfact();
            String sql ="update facture set nfact = '" + Integer.toString(int_nfact)+ "'";
            // JOptionPane.showMessageDialog(null,sql );
            St.executeUpdate(sql);
            if (r ==1) {
            tot_timbre=0.00;
            }
            String query = "insert into "+fichier_master+ "(nfact,nclient,date_fact,montant_ht,timbre,tva,autre_taxe,marge, banq,ncheque,nbc,date_bc,nom_preneur) values ('"
            +int_nfact +"','"
            +code_cli+"','"
            +xdate_fact+"','"
            +tot_montant_ht+"','"
            +tot_timbre+"','"
            +tot_tva+"','"
            +tot_autre_taxe+"','"
            +marge+"','"        
            +txt_banq.getText()+"','"
            +txt_ncheque.getText()+"','"
            +xnbc+"','"
            +xdate_bc+"','"
            +xnom_preneur+"')";
            // JOptionPane.showMessageDialog(null,query);
            St.executeUpdate(query);
            //query ="insert into "+ fichier_detail+" (nfact, narticle, qte,tva,prix,total_ligne) SELECT nfact, narticle, sum(qte), tva , prix  , sum( prix*qte ) FROM facture GROUP BY narticle";
            query ="insert into "+ fichier_detail+" (nfact, narticle, qte,tva,pr_achat, prix ,total_ligne) SELECT nfact, narticle, qte, tva , pr_achat, prix  , prix*qte  FROM facture ";
            St.executeUpdate(query);
            String message =" Voulez-vous imprimer la facture N°: "+ int_nfact ;
            Object[] options1 = {"Oui","Non"};                 
            int t = JOptionPane.showOptionDialog(null, message, " Impression",  JOptionPane.YES_NO_OPTION, JOptionPane.QUESTION_MESSAGE,null, options1,options1[0]);
            if ( t == 0) {
            // appel programme d'impression de facture
            //JOptionPane.showMessageDialog(null,"impression en cours...");
            imprimer_fact();
            } else {
            //JOptionPane.showMessageDialog(null,"impression différée...");
            }
            query ="truncate table facture";
            St.execute(query);
            btn_valider();
            
          }
        Update_Table_bl_instance();  
        Update_Table_bl();
        Update_Table_detail();
          // JOptionPane.showMessageDialog(null,"revenir au début...");
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans la table\n" + e.getMessage());
        }
    
}
    
private void fill_prix_achat() {
        try {                        
            sql ="select sum(qte*prix)-sum(qte*pr_achat) as marge FROM facture";
            Rs = St.executeQuery(sql);
            while (Rs.next()) {
                marge = Rs.getString("marge");                
            }            
        } catch (Exception e) {
           JOptionPane.showMessageDialog(null, "Erreur dans la table facture\n" + e.getMessage());
        }
    }    
    
    
    private void btn_rechercherActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btn_rechercherActionPerformed
     try {
      
         if ( txt_code_cli.getText().equals("")) {
          sql = "SELECT distinct(b.nclient), cl.raison_sociale FROM bl b, client cl where b.nclient=cl.nclient and cl.raison_sociale= '" + txt_raison_sociale.getText() + "'";
         } else {
          sql = "SELECT distinct(b.nclient), cl.raison_sociale FROM bl b, client cl where b.nclient=cl.nclient and b.nclient= '" + txt_code_cli.getText() + "'";
         }
         
         Rs = St.executeQuery(sql);
          if (Rs.next()) {
             affiche_champs1(); 
           } else {
               JOptionPane.showMessageDialog(null, " Dossier vide !");
               txt_code_cli.setText("");
             }       
        } catch (Exception e) {
 
     }
    }//GEN-LAST:event_btn_rechercherActionPerformed

    private void Table_blMouseClicked(java.awt.event.MouseEvent evt) {//GEN-FIRST:event_Table_blMouseClicked
        try { 
            int row = Table_bl.getSelectedRow();
            //int col = Table_bl.getSelectedColumn();
            String Table_click = (Table_bl.getModel().getValueAt(row, 0).toString());            
            String sql = "SELECT f.narticle as \"Code Article.\", a.designation as \"Désignation \",f.qte as \"Quantité\",f.tva as \"TVA\",f.prix as \"Prix Untaire\",f.total_ligne as \"Total Ligne\" FROM detail_bl f,article a  where f.narticle = a.narticle and f.nfact= '" + Table_click + "'";
            Rs = St.executeQuery(sql);
           
            //Table_detail.setModel(DbUtils.resultSetToTableModel(Rs));
             tm = new MyTableModel(sql,base);
             Table_detail.setModel(tm);
             Table_detail.setDefaultRenderer(Double.class, new TKMntRenderer());
             btn_valider();
           //}
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans la table\n" + e.getMessage());
        }             
        
        
        
        
    }//GEN-LAST:event_Table_blMouseClicked

    private void btn_ok_chequeActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btn_ok_chequeActionPerformed
       // vérifier les champs banque et ncheque.
        transferer();
        jPanel4.setVisible(false);
    }//GEN-LAST:event_btn_ok_chequeActionPerformed

    private void btn_quitterActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btn_quitterActionPerformed
        this.dispose();
    }//GEN-LAST:event_btn_quitterActionPerformed
private void affiche_champs1() {
               try {
                String add1 = Rs.getString("nclient");
                txt_code_cli.setText(add1);
                String add2 = Rs.getString("raison_sociale");
                txt_raison_sociale.setText(add2);
                Update_Table_bl();
                btn_valider();
                Update_Table_detail();
               } catch (Exception e) {
               JOptionPane.showMessageDialog(null, "Erreur dans la table\n" + e.getMessage());
        }
}
private void imprimer_fact() {

            try {
             
                String query ="truncate table facture_temp";
                St.executeUpdate(query);
                query = "insert into facture_temp (nfact, narticle, qte,tva,pr_achat, prix,total_ligne)  select nfact, narticle, qte,tva,pr_achat,prix,total_ligne from "+fichier_detail+" where nfact ='"+int_nfact+"'" ;
                St.executeUpdate(query);
                                
                String query_a ="select * from activite";
                Rs=St.executeQuery(query_a);
             if (Rs.next()) { 
                txt_domaine_actvite = Rs.getString("domaine_activite");                
                txt_sous_domaine= Rs.getString("sous_domaine");
                txt_raison_sociale_v=Rs.getString("raison_sociale");
                txt_adresse = Rs.getString("adresse");
                txt_commune = Rs.getString("commune");
                txt_wilaya = Rs.getString("wilaya");
                txt_tel_fixe = Rs.getString("tel_fixe");
                txt_tel_port = Rs.getString("tel_port");
                txt_nrcv = Rs.getString("nrc");
                txt_nis = Rs.getString("nis");
                txt_nart = Rs.getString("nart");
                txt_ident_fiscal = Rs.getString("ident_fiscal");
                txt_banq_v = Rs.getString("banq");                                
             }             
            double mnt = tot_montant_ht+tot_timbre+tot_tva;
            exp_spell = Numb_to_Spell.spell(mnt, "");
            //JOptionPane.showMessageDialog(null,exp_spell);
             jd = JRXmlLoader.load("C:\\outil_dev\\report_fact.jrxml");
             sql = "SELECT fact.`NFact` AS fact_NFact,      fact.`Nclient` AS fact_Nclient,      fact.`date_fact` AS fact_date_fact,      fact.`montant_ht` AS fact_montant_ht,      fact.`timbre` AS fact_timbre,      fact.`TVA` AS fact_TVA,      fact.`autre_taxe` AS fact_autre_taxe,      client.`Nclient` AS client_Nclient,      client.`Raison_sociale` AS client_Raison_sociale,      client.`adresse` AS client_adresse,      client.`NRC` AS client_NRC,      client.`Date_RC` AS client_Date_RC,      client.`Lieu_RC` AS client_Lieu_RC,      client.`I_Fiscal` AS client_I_Fiscal,      client.`N_article` AS client_N_article       FROM      `client` client INNER JOIN `fact` fact ON client.`Nclient` = fact.`Nclient` WHERE fact.nfact ='"+int_nfact+"'";
             
            JRDesignQuery newquery = new JRDesignQuery();
            newquery.setText(sql);
            jd.setQuery(newquery);
            HashMap hm = new HashMap();
            hm.put("fact_spell", exp_spell);        
            hm.put("domaine_activite_p",txt_domaine_actvite);
            hm.put("sous_domaine_p",txt_sous_domaine);
            hm.put("raison_sociale_p",txt_raison_sociale_v);
            hm.put("adress_p",txt_adresse);
            hm.put("commune_p",txt_commune);
            hm.put("wilaya_p",txt_wilaya);
            hm.put("tel_fixe_p",txt_tel_fixe);
            hm.put("tel_port_p",txt_tel_port);
            hm.put("nrc_p",txt_nrcv);
            hm.put("nis_p",txt_nis);
            hm.put("art_p",txt_nart);
            hm.put("ident_fiscal_p",txt_ident_fiscal);
            hm.put("banq_p",txt_banq_v);
            JasperReport jr = JasperCompileManager.compileReport(jd);
               JasperPrint jp = JasperFillManager.fillReport(jr,hm,cnx);               
               JasperViewer.viewReport(jp, false); 
            } catch (Exception e) {
                JOptionPane.showMessageDialog(null, "Erreur impression " + e.getMessage());
            }            
    }                                            
    




    /**
     * @param args the command line arguments
     */
    public static void select_client(final String bas) {
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
            java.util.logging.Logger.getLogger(select_client.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (InstantiationException ex) {
            java.util.logging.Logger.getLogger(select_client.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (IllegalAccessException ex) {
            java.util.logging.Logger.getLogger(select_client.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (javax.swing.UnsupportedLookAndFeelException ex) {
            java.util.logging.Logger.getLogger(select_client.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        }
        //</editor-fold>

        /* Create and display the form */
        java.awt.EventQueue.invokeLater(new Runnable() {
            public void run() {
                new select_client(bas).setVisible(true);
            }
        });
    }
    public Statement St;
    public ResultSet Rs;
    public Connection cnx;
    double tot_montant_ht,tot_timbre,tot_tva,tot_autre_taxe;
    public String marge,cell_click,base;
    public int nbre_enr,nbre_enr_sel, rang_champ_select=6,r, int_nfact;
    boolean sele_deselect = false,ind = false;
    String fichier_master,code_cli,xdate_fact,fichier_detail;
    public JasperDesign jd ;
    public String txt_domaine_actvite,txt_sous_domaine,txt_raison_sociale_v,txt_adresse,txt_commune,txt_wilaya,sql;
    public String txt_tel_fixe,txt_tel_port,txt_nrcv,txt_nis,txt_nart,txt_ident_fiscal,txt_banq_v,txt_query,exp_spell;
    MyTableModel tm,tm1;
    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JTable Table_bl;
    private javax.swing.JTable Table_bl_instance;
    private javax.swing.JTable Table_detail;
    private javax.swing.JButton btn_ok_cheque;
    private javax.swing.JButton btn_quitter;
    private javax.swing.JButton btn_rechercher;
    private javax.swing.JButton btn_tout_deselectionner;
    private javax.swing.JButton btn_tout_selectionner;
    private javax.swing.JButton btn_valider;
    private javax.swing.JLabel jLabel1;
    private javax.swing.JLabel jLabel2;
    private javax.swing.JLabel jLabel3;
    private javax.swing.JLabel jLabel4;
    private javax.swing.JPanel jPanel1;
    private javax.swing.JPanel jPanel2;
    private javax.swing.JPanel jPanel3;
    private javax.swing.JPanel jPanel4;
    private javax.swing.JScrollPane jScrollPane1;
    private javax.swing.JScrollPane jScrollPane2;
    private javax.swing.JScrollPane jScrollPane3;
    private javax.swing.JTextField txt_banq;
    private javax.swing.JTextField txt_code_cli;
    private javax.swing.JTextField txt_ncheque;
    private javax.swing.JTextField txt_raison_sociale;
    // End of variables declaration//GEN-END:variables
}
