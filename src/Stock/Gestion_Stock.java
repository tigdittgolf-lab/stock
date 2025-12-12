/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package Stock;

import java.awt.Toolkit;
import java.awt.event.WindowEvent;
import static java.lang.System.exit;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Date;
import javax.swing.JOptionPane;
import java.text.SimpleDateFormat;
import java.util.logging.Level;
import java.util.logging.Logger;


/**
 *
 * @author IT
 */
public class Gestion_Stock extends javax.swing.JFrame {

    /**
     * Creates new form Gestion_Stock
     */
    public Gestion_Stock( String par, String activ,String yr) {
       try {
        initComponents();       
        base = par;
        activite=activ;
        year =yr;
        jPanel1.setVisible(false);
        jPanel3.setVisible(false);
        //txt_context.setText(activite+":"+year);
        pilote = "com.mysql.jdbc.Driver";
        //String affiche = fill_tableau();
        connect_db();
        txt_context.setText(fill_tableau());
       // xind =fill_tableau().substring(0, 4);
        //JOptionPane.showMessageDialog(null,xind);
       //connect_db();
       remplir_stock_table_parameter();
                        
            } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur de connexcion\n" + e.getMessage());
        }
    }
    
private void remplir_stock_table_parameter() {
try {
       
            //JOptionPane.showMessageDialog(null, base);
            String sql = "select db_name from mysql.stock_table_parameter where code_activite='"+base+"'";
            Rs = St.executeQuery(sql);            
            // try {
            if (Rs.next()) {
            String var_cnx= "jdbc:mysql://localhost:3306/"+Rs.getString("db_name");
            var_cnx=var_cnx+"_"+base;
            String user_bd="root";
            String passwd_bd="";
           // JOptionPane.showMessageDialog(null, var_cnx);
            cnx = DriverManager.getConnection(var_cnx, user_bd, passwd_bd);
            St = cnx.createStatement();
            
            String query = "select count(*) as nbre_enr FROM fact";
            St.execute(query);
            Rs = St.executeQuery(query);
            
            
            if (Rs.next()) {
                String add1 = Rs.getString("nbre_enr");
                if (Integer.parseInt(add1) > 0) {
                    query = "select max(nfact) as nfact_max FROM fact";
                    // JOptionPane.showMessageDialog(null, query);
                    Rs = St.executeQuery(query);
                    if (Rs.next()) {
                        String add2 = Rs.getString("nfact_max");
                        //JOptionPane.showMessageDialog(null, add2);
                        int_nfact = Integer.parseInt(add2) + 1;
                    }                    
                } else {
                    int_nfact = 1;
                }        
            //    JOptionPane.showMessageDialog(null, int_nfact);
            }
            query = "select count(*) as nbre_enr FROM bl";
            St.execute(query);
            Rs = St.executeQuery(query);
                        
            if (Rs.next()) {
                String add1 = Rs.getString("nbre_enr");
                if (Integer.parseInt(add1) > 0) {
                    query = "select max(nfact) as nfact_max FROM bl";
              //       JOptionPane.showMessageDialog(null, query);
                    Rs = St.executeQuery(query);
                    if (Rs.next()) {
                        String add2 = Rs.getString("nfact_max");
                //        JOptionPane.showMessageDialog(null, add2);
                        int_nbl = Integer.parseInt(add2) + 1;
                    }                    
                } else {
                    int_nbl = 1;
                }           
               // JOptionPane.showMessageDialog(null, int_nbl);
            }
            query = "select count(*) as nbre_enr FROM fprof";
            St.execute(query);
            Rs = St.executeQuery(query);
            
            
            if (Rs.next()) {
                String add1 = Rs.getString("nbre_enr");
                if (Integer.parseInt(add1) > 0) {
                    query = "select max(nfact) as nfact_max FROM fprof";
                 //    JOptionPane.showMessageDialog(null, query);
                    Rs = St.executeQuery(query);
                    if (Rs.next()) {
                        String add2 = Rs.getString("nfact_max");
                   //     JOptionPane.showMessageDialog(null, add2);
                        int_nprof = Integer.parseInt(add2) + 1;
                    }                    
                } else {
                    int_nprof = 1;
                } 
                
            }
            //JOptionPane.showMessageDialog(null, );
            }
             //JOptionPane.showMessageDialog(null, base);
            sql = "update mysql.stock_table_parameter set n_bl="+int_nbl+", n_fact="+int_nfact+", n_prof="+int_nprof+ "  where code_activite='"+base+"'";
            //update stock_table_parameter set n_bl=3, n_fact=7, n_prof = 9 where code_activite="BU01";
            // JOptionPane.showMessageDialog(null, sql);
            St.executeUpdate(sql);            
            } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur de connexcion\n" + e.getMessage());
        }
    }

        
private String fill_tableau() {
    
    
        try {
                   
        String par =" ";     
        String sql ="select count(*) as \"dimention\"  from stock_table_parameter";
        Rs = St.executeQuery(sql);
        if (Rs.next()) {
           // JOptionPane.showMessageDialog(null, Rs.getString("dimention"));
            dim= Integer.valueOf(Rs.getString("dimention"));
            //xind=Rs.getString("db_name");
            
            
        }
        
           tableau = new String[dim][2]; 
           
           sql =" select * from  stock_table_parameter";
            Rs = St.executeQuery(sql);
            int i=0;
            while (Rs.next()) {
                
                tableau[i][0]= Rs.getString("db_name");
                tableau[i][1]= Rs.getString("code_activite");
                i++;
                //JOptionPane.showMessageDialog(null, "Salam "+i);
            } 
        for (int j=0;j<dim; j++) {
       //JOptionPane.showMessageDialog(null, tableau[j][1]+base);
        if ( base.equals(tableau[j][1]) ) {
            ind = tableau [j][0];
            //txt_context.setText(activite+":"+tableau [j][0]);//+tableau [j][1]);
            par=activite+":"+tableau[j][0]; //+tableau [j][1];
         //JOptionPane.showMessageDialog(null, par);
            return (par);
            //JOptionPane.showMessageDialog(null, "Je me retrouve ! "+tableau [j][0]+tableau[j][1]+base);
        }
    }  
        //if ( base.equals(tableau[j][1]) ) {
            //txt_context.setText(activite+":"+tableau [j][0]+tableau [j][1]);
            
        //}
   // }
            //JOptionPane.showMessageDialog(null, tableau);
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans le tableau" + e.getMessage());
        }
        //JOptionPane.showMessageDialog(null, "Je suis à la fin ! "+par);
        return (par);
    }


public void connect_db() {
try {
            Class.forName(pilote);
            cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/information_schema", "root", "");
            St = cnx.createStatement();             
            //JOptionPane.showMessageDialog(null, cnx);      
            fillCombo1_an();
            cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/mysql", "root", "");
            St = cnx.createStatement();
            
Thread Envirment = new Thread() {
public void run() {
for (;;){
    for (int i=0;i<dim; i++) {
        
        if ( base.equals(tableau[i][1]) ) {
            txt_context.setText(activite+":"+tableau [i][0]+tableau [i][1]);
            
        }
    }
}
}

};
  //JOptionPane.showMessageDialog(null, xind+" : " +year);      
  //Envirment.start();
  
}        
catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur de connection\n" + e.getMessage());
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

        jMenu1 = new javax.swing.JMenu();
        jPanel1 = new javax.swing.JPanel();
        jProgressBar1 = new javax.swing.JProgressBar();
        jLabel1 = new javax.swing.JLabel();
        txt_context = new javax.swing.JTextField();
        jPanel3 = new javax.swing.JPanel();
        jComboBox1_an1 = new javax.swing.JComboBox();
        jLabel3 = new javax.swing.JLabel();
        jButton2 = new javax.swing.JButton();
        jMenuBar1 = new javax.swing.JMenuBar();
        Quitter_menu = new javax.swing.JMenu();
        Article_menu = new javax.swing.JMenuItem();
        jSeparator1 = new javax.swing.JPopupMenu.Separator();
        Client_Menu = new javax.swing.JMenuItem();
        jSeparator2 = new javax.swing.JPopupMenu.Separator();
        Fournisseur_menu = new javax.swing.JMenuItem();
        jSeparator3 = new javax.swing.JPopupMenu.Separator();
        jSeparator4 = new javax.swing.JPopupMenu.Separator();
        quitter_menu = new javax.swing.JMenuItem();
        jMenu2 = new javax.swing.JMenu();
        achat_bl = new javax.swing.JMenuItem();
        jSeparator6 = new javax.swing.JPopupMenu.Separator();
        achat_fact = new javax.swing.JMenuItem();
        jSeparator13 = new javax.swing.JPopupMenu.Separator();
        jSeparator14 = new javax.swing.JPopupMenu.Separator();
        rappel_bachat = new javax.swing.JMenuItem();
        jSeparator15 = new javax.swing.JPopupMenu.Separator();
        rappel_fachat = new javax.swing.JMenuItem();
        jMenu3 = new javax.swing.JMenu();
        BL_appl = new javax.swing.JMenuItem();
        jSeparator5 = new javax.swing.JPopupMenu.Separator();
        Facture_appl = new javax.swing.JMenuItem();
        jSeparator9 = new javax.swing.JPopupMenu.Separator();
        rappel_bl = new javax.swing.JMenuItem();
        jSeparator10 = new javax.swing.JPopupMenu.Separator();
        rappel_facture = new javax.swing.JMenuItem();
        jSeparator11 = new javax.swing.JPopupMenu.Separator();
        passage_en_facture = new javax.swing.JMenuItem();
        jSeparator7 = new javax.swing.JPopupMenu.Separator();
        jSeparator8 = new javax.swing.JPopupMenu.Separator();
        facture_prof = new javax.swing.JMenuItem();
        jSeparator12 = new javax.swing.JPopupMenu.Separator();
        rappel_fprof = new javax.swing.JMenuItem();
        jMenu4 = new javax.swing.JMenu();
        list_facture = new javax.swing.JMenuItem();
        jSeparator20 = new javax.swing.JPopupMenu.Separator();
        list_bl = new javax.swing.JMenuItem();
        jSeparator21 = new javax.swing.JPopupMenu.Separator();
        list_prof = new javax.swing.JMenuItem();
        jSeparator22 = new javax.swing.JPopupMenu.Separator();
        list_fact_achat = new javax.swing.JMenuItem();
        jSeparator23 = new javax.swing.JPopupMenu.Separator();
        jMenuItem1 = new javax.swing.JMenuItem();
        jSeparator24 = new javax.swing.JPopupMenu.Separator();
        jSeparator25 = new javax.swing.JPopupMenu.Separator();
        liste_banq = new javax.swing.JMenuItem();
        jSeparator26 = new javax.swing.JPopupMenu.Separator();
        list_term = new javax.swing.JMenuItem();
        jSeparator27 = new javax.swing.JPopupMenu.Separator();
        list_espece = new javax.swing.JMenuItem();
        jSeparator28 = new javax.swing.JPopupMenu.Separator();
        jSeparator29 = new javax.swing.JPopupMenu.Separator();
        vente_periode = new javax.swing.JMenuItem();
        jSeparator31 = new javax.swing.JPopupMenu.Separator();
        achat_periiode = new javax.swing.JCheckBoxMenuItem();
        jSeparator32 = new javax.swing.JPopupMenu.Separator();
        jSeparator33 = new javax.swing.JPopupMenu.Separator();
        nouvelle_an = new javax.swing.JMenu();
        change_exercice = new javax.swing.JMenuItem();
        jSeparator16 = new javax.swing.JPopupMenu.Separator();
        jSeparator17 = new javax.swing.JPopupMenu.Separator();
        nouvel_an = new javax.swing.JMenuItem();
        jSeparator18 = new javax.swing.JPopupMenu.Separator();
        jSeparator19 = new javax.swing.JPopupMenu.Separator();
        menu_exporter = new javax.swing.JMenuItem();
        jSeparator30 = new javax.swing.JPopupMenu.Separator();
        annexe01 = new javax.swing.JMenuItem();

        jMenu1.setText("jMenu1");

        setDefaultCloseOperation(javax.swing.WindowConstants.DISPOSE_ON_CLOSE);
        setTitle("Gestion de Stock");
        setExtendedState(javax.swing.JFrame.MAXIMIZED_BOTH);
        setFont(new java.awt.Font("Arial", 1, 18)); // NOI18N

        jProgressBar1.setStringPainted(true);

        jLabel1.setFont(new java.awt.Font("Verdana", 0, 12)); // NOI18N
        jLabel1.setHorizontalAlignment(javax.swing.SwingConstants.CENTER);
        jLabel1.setText("Export progression");

        javax.swing.GroupLayout jPanel1Layout = new javax.swing.GroupLayout(jPanel1);
        jPanel1.setLayout(jPanel1Layout);
        jPanel1Layout.setHorizontalGroup(
            jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, jPanel1Layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jProgressBar1, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                .addContainerGap())
            .addGroup(jPanel1Layout.createSequentialGroup()
                .addGap(103, 103, 103)
                .addComponent(jLabel1, javax.swing.GroupLayout.PREFERRED_SIZE, 137, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addContainerGap(120, Short.MAX_VALUE))
        );
        jPanel1Layout.setVerticalGroup(
            jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, jPanel1Layout.createSequentialGroup()
                .addGap(7, 7, 7)
                .addComponent(jLabel1, javax.swing.GroupLayout.DEFAULT_SIZE, 21, Short.MAX_VALUE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.UNRELATED)
                .addComponent(jProgressBar1, javax.swing.GroupLayout.PREFERRED_SIZE, 31, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addContainerGap())
        );

        txt_context.setEditable(false);
        txt_context.setBackground(new java.awt.Color(0, 0, 204));
        txt_context.setFont(new java.awt.Font("Arial", 1, 14)); // NOI18N
        txt_context.setForeground(new java.awt.Color(255, 255, 0));
        txt_context.setHorizontalAlignment(javax.swing.JTextField.RIGHT);
        txt_context.setAutoscrolls(false);
        txt_context.setFocusable(false);
        txt_context.setRequestFocusEnabled(false);
        txt_context.setSelectionColor(new java.awt.Color(153, 255, 255));

        jComboBox1_an1.addPopupMenuListener(new javax.swing.event.PopupMenuListener() {
            public void popupMenuCanceled(javax.swing.event.PopupMenuEvent evt) {
            }
            public void popupMenuWillBecomeInvisible(javax.swing.event.PopupMenuEvent evt) {
                jComboBox1_an1PopupMenuWillBecomeInvisible(evt);
            }
            public void popupMenuWillBecomeVisible(javax.swing.event.PopupMenuEvent evt) {
            }
        });

        jLabel3.setText("Choisir l'année :");

        jButton2.setText("Quitter ");
        jButton2.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jButton2ActionPerformed(evt);
            }
        });

        javax.swing.GroupLayout jPanel3Layout = new javax.swing.GroupLayout(jPanel3);
        jPanel3.setLayout(jPanel3Layout);
        jPanel3Layout.setHorizontalGroup(
            jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel3Layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jLabel3, javax.swing.GroupLayout.PREFERRED_SIZE, 89, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(jComboBox1_an1, javax.swing.GroupLayout.PREFERRED_SIZE, 81, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addContainerGap(108, Short.MAX_VALUE))
            .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, jPanel3Layout.createSequentialGroup()
                .addContainerGap(javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                .addComponent(jButton2, javax.swing.GroupLayout.PREFERRED_SIZE, 93, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addContainerGap())
        );
        jPanel3Layout.setVerticalGroup(
            jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel3Layout.createSequentialGroup()
                .addGap(19, 19, 19)
                .addGroup(jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jComboBox1_an1, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel3))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, 146, Short.MAX_VALUE)
                .addComponent(jButton2)
                .addGap(19, 19, 19))
        );

        Quitter_menu.setText("Gérer");
        Quitter_menu.setFont(new java.awt.Font("Segoe UI", 0, 24)); // NOI18N

        Article_menu.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        Article_menu.setText("Articles");
        Article_menu.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                Article_menuActionPerformed(evt);
            }
        });
        Quitter_menu.add(Article_menu);
        Quitter_menu.add(jSeparator1);

        Client_Menu.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        Client_Menu.setText("Clients");
        Client_Menu.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                Client_MenuActionPerformed(evt);
            }
        });
        Quitter_menu.add(Client_Menu);
        Quitter_menu.add(jSeparator2);

        Fournisseur_menu.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        Fournisseur_menu.setText("Fournisseurs");
        Fournisseur_menu.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                Fournisseur_menuActionPerformed(evt);
            }
        });
        Quitter_menu.add(Fournisseur_menu);
        Quitter_menu.add(jSeparator3);
        Quitter_menu.add(jSeparator4);

        quitter_menu.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        quitter_menu.setText("Quitter ");
        quitter_menu.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                quitter_menuActionPerformed(evt);
            }
        });
        Quitter_menu.add(quitter_menu);

        jMenuBar1.add(Quitter_menu);

        jMenu2.setText("Achats");
        jMenu2.setFont(new java.awt.Font("Segoe UI", 0, 24)); // NOI18N
        jMenu2.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jMenu2ActionPerformed(evt);
            }
        });

        achat_bl.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        achat_bl.setText("Achat en Bon de Livraison");
        achat_bl.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                achat_blActionPerformed(evt);
            }
        });
        jMenu2.add(achat_bl);
        jMenu2.add(jSeparator6);

        achat_fact.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        achat_fact.setText("Achat en Facture");
        achat_fact.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                achat_factActionPerformed(evt);
            }
        });
        jMenu2.add(achat_fact);
        jMenu2.add(jSeparator13);
        jMenu2.add(jSeparator14);

        rappel_bachat.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        rappel_bachat.setText("Rappel de Bon de Livraison d'achat");
        rappel_bachat.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                rappel_bachatActionPerformed(evt);
            }
        });
        jMenu2.add(rappel_bachat);
        jMenu2.add(jSeparator15);

        rappel_fachat.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        rappel_fachat.setText("Rappel de Facture d'achat");
        rappel_fachat.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                rappel_fachatActionPerformed(evt);
            }
        });
        jMenu2.add(rappel_fachat);

        jMenuBar1.add(jMenu2);

        jMenu3.setText("Ventes");
        jMenu3.setFont(new java.awt.Font("Segoe UI", 0, 24)); // NOI18N

        BL_appl.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        BL_appl.setText("Bon de livraison");
        BL_appl.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                BL_applActionPerformed(evt);
            }
        });
        jMenu3.add(BL_appl);
        jMenu3.add(jSeparator5);

        Facture_appl.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        Facture_appl.setText("Facturation");
        Facture_appl.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                Facture_applActionPerformed(evt);
            }
        });
        jMenu3.add(Facture_appl);
        jMenu3.add(jSeparator9);

        rappel_bl.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        rappel_bl.setText("Rappel de Bon de livraison");
        rappel_bl.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                rappel_blActionPerformed(evt);
            }
        });
        jMenu3.add(rappel_bl);
        jMenu3.add(jSeparator10);

        rappel_facture.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        rappel_facture.setText("Rappel de Facture");
        rappel_facture.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                rappel_factureActionPerformed(evt);
            }
        });
        jMenu3.add(rappel_facture);
        jMenu3.add(jSeparator11);

        passage_en_facture.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        passage_en_facture.setText("Passage de Bon de livraison en Facture ");
        passage_en_facture.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                passage_en_factureActionPerformed(evt);
            }
        });
        jMenu3.add(passage_en_facture);
        jMenu3.add(jSeparator7);
        jMenu3.add(jSeparator8);

        facture_prof.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        facture_prof.setText("Facture Proformat");
        facture_prof.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                facture_profActionPerformed(evt);
            }
        });
        jMenu3.add(facture_prof);
        jMenu3.add(jSeparator12);

        rappel_fprof.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        rappel_fprof.setText("Rappel de Facture Proformat");
        rappel_fprof.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                rappel_fprofActionPerformed(evt);
            }
        });
        jMenu3.add(rappel_fprof);

        jMenuBar1.add(jMenu3);

        jMenu4.setText("Listes");
        jMenu4.setFont(new java.awt.Font("Segoe UI", 0, 24)); // NOI18N

        list_facture.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        list_facture.setText("Factures de Vente");
        list_facture.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                list_factureActionPerformed(evt);
            }
        });
        jMenu4.add(list_facture);
        jMenu4.add(jSeparator20);

        list_bl.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        list_bl.setText("Bons de Livraison de vente");
        list_bl.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                list_blActionPerformed(evt);
            }
        });
        jMenu4.add(list_bl);
        jMenu4.add(jSeparator21);

        list_prof.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        list_prof.setText("Factures Proformat");
        list_prof.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                list_profActionPerformed(evt);
            }
        });
        jMenu4.add(list_prof);
        jMenu4.add(jSeparator22);

        list_fact_achat.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        list_fact_achat.setText("Factures d'achat");
        list_fact_achat.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                list_fact_achatActionPerformed(evt);
            }
        });
        jMenu4.add(list_fact_achat);
        jMenu4.add(jSeparator23);

        jMenuItem1.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        jMenuItem1.setText("B.L d'achat");
        jMenuItem1.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jMenuItem1ActionPerformed(evt);
            }
        });
        jMenu4.add(jMenuItem1);
        jMenu4.add(jSeparator24);
        jMenu4.add(jSeparator25);

        liste_banq.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        liste_banq.setText("Banques");
        liste_banq.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                liste_banqActionPerformed(evt);
            }
        });
        jMenu4.add(liste_banq);
        jMenu4.add(jSeparator26);

        list_term.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        list_term.setText("TERM");
        list_term.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                list_termActionPerformed(evt);
            }
        });
        jMenu4.add(list_term);
        jMenu4.add(jSeparator27);

        list_espece.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        list_espece.setText("Espèces");
        list_espece.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                list_especeActionPerformed(evt);
            }
        });
        jMenu4.add(list_espece);
        jMenu4.add(jSeparator28);
        jMenu4.add(jSeparator29);

        vente_periode.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        vente_periode.setText("Vente de la période");
        vente_periode.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                vente_periodeActionPerformed(evt);
            }
        });
        jMenu4.add(vente_periode);
        jMenu4.add(jSeparator31);

        achat_periiode.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        achat_periiode.setText("Achat de la période");
        achat_periiode.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                achat_periiodeActionPerformed(evt);
            }
        });
        jMenu4.add(achat_periiode);
        jMenu4.add(jSeparator32);
        jMenu4.add(jSeparator33);

        jMenuBar1.add(jMenu4);

        nouvelle_an.setText("Utilitaire");
        nouvelle_an.setFont(new java.awt.Font("Segoe UI", 0, 24)); // NOI18N

        change_exercice.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        change_exercice.setText("Changement d'exercice");
        change_exercice.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                change_exerciceActionPerformed(evt);
            }
        });
        nouvelle_an.add(change_exercice);
        nouvelle_an.add(jSeparator16);
        nouvelle_an.add(jSeparator17);

        nouvel_an.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        nouvel_an.setText("Nouvelle Année.");
        nouvel_an.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                nouvel_anActionPerformed(evt);
            }
        });
        nouvelle_an.add(nouvel_an);
        nouvelle_an.add(jSeparator18);
        nouvelle_an.add(jSeparator19);

        menu_exporter.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        menu_exporter.setText("Exporter les données");
        menu_exporter.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                menu_exporterActionPerformed(evt);
            }
        });
        nouvelle_an.add(menu_exporter);
        nouvelle_an.add(jSeparator30);

        annexe01.setFont(new java.awt.Font("Segoe UI", 0, 18)); // NOI18N
        annexe01.setText("Annexe");
        annexe01.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                annexe01ActionPerformed(evt);
            }
        });
        nouvelle_an.add(annexe01);

        jMenuBar1.add(nouvelle_an);

        setJMenuBar(jMenuBar1);

        javax.swing.GroupLayout layout = new javax.swing.GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addGap(222, 222, 222)
                .addComponent(jPanel1, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addGap(28, 28, 28)
                .addComponent(jPanel3, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addContainerGap(151, Short.MAX_VALUE))
            .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                .addContainerGap(javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                .addComponent(txt_context, javax.swing.GroupLayout.PREFERRED_SIZE, 235, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addGap(23, 23, 23))
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(txt_context, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, 29, Short.MAX_VALUE)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(jPanel1, javax.swing.GroupLayout.Alignment.TRAILING, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(jPanel3, javax.swing.GroupLayout.Alignment.TRAILING, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addGap(180, 180, 180))
        );

        pack();
    }// </editor-fold>//GEN-END:initComponents

    private void Article_menuActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_Article_menuActionPerformed
       Articles Ar = new Articles(base);
       Ar.setVisible(true);
    }//GEN-LAST:event_Article_menuActionPerformed

    private void Fournisseur_menuActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_Fournisseur_menuActionPerformed
        Fournisseur fourni = new Fournisseur(base);
       fourni.setVisible(true);
    }//GEN-LAST:event_Fournisseur_menuActionPerformed

    private void Client_MenuActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_Client_MenuActionPerformed
      Clients Client = new Clients(base);
       Client.setVisible(true);
    }//GEN-LAST:event_Client_MenuActionPerformed
  
    private void quitter_menuActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_quitter_menuActionPerformed
        exit(0);
        //close();
    }//GEN-LAST:event_quitter_menuActionPerformed

    private void BL_applActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_BL_applActionPerformed
        par = "stock_bl";
        detail="detail_bl";
        master = "bl";
        Facture bl = new Facture(par,detail,master,base);
        bl.setVisible(true);
    }//GEN-LAST:event_BL_applActionPerformed

    private void Facture_applActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_Facture_applActionPerformed
        par = "stock_f";
        detail="detail_fact";
        master = "fact";
        Facture fact = new Facture(par,detail,master,base);
        fact.setVisible(true);
    }//GEN-LAST:event_Facture_applActionPerformed

    private void rappel_blActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_rappel_blActionPerformed
        par = "stock_bl";
        detail="detail_bl";
        master = "bl";
        rappel_facture rappel_bl = new rappel_facture(par,detail,master,base);
        rappel_bl.setVisible(true);
    }//GEN-LAST:event_rappel_blActionPerformed

    private void rappel_factureActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_rappel_factureActionPerformed
        par = "stock_f";
        detail="detail_fact";
        master = "fact";
        rappel_facture rappel_fact = new rappel_facture(par,detail,master,base);
        rappel_fact.setVisible(true);
        
        
    }//GEN-LAST:event_rappel_factureActionPerformed

    private void passage_en_factureActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_passage_en_factureActionPerformed
       // liste_bl passage_en_facture = new liste_bl();
        //passage_en_facture.setVisible(true);
        select_client passage = new select_client(base);
        passage.setVisible(true);
        
    }//GEN-LAST:event_passage_en_factureActionPerformed

    private void achat_blActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_achat_blActionPerformed
        par = "stock_bl";
        detail="bachat_detail";
        master = "bachat";
        Achat entree_bl = new Achat(par,detail,master, base);
       entree_bl.setVisible(true);
    }//GEN-LAST:event_achat_blActionPerformed

    private void achat_factActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_achat_factActionPerformed
        par = "stock_f";
        detail="fachat_detail";
        master = "fachat";
        Achat entree_fac = new Achat(par,detail,master,base);
       entree_fac.setVisible(true);
        
    }//GEN-LAST:event_achat_factActionPerformed

    private void facture_profActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_facture_profActionPerformed
        par = "";
        detail="detail_fprof";
        master = "fprof";
        Facture fact = new Facture(par,detail,master,base);
        fact.setVisible(true);
    }//GEN-LAST:event_facture_profActionPerformed

    private void rappel_fprofActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_rappel_fprofActionPerformed
        par = "";
        detail="detail_fprof";
        master = "fprof";     
        rappel_facture rappel_fact = new rappel_facture(par,detail,master,base);
        rappel_fact.setVisible(true);
        
    }//GEN-LAST:event_rappel_fprofActionPerformed

    private void rappel_bachatActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_rappel_bachatActionPerformed
        par = "stock_bl";
        detail="bachat_detail";
        master = "bachat";
        rappel_fa_achat rappel_bla = new rappel_fa_achat(par,detail,master,base);
        rappel_bla.setVisible(true);
    }//GEN-LAST:event_rappel_bachatActionPerformed

    private void rappel_fachatActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_rappel_fachatActionPerformed
       par = "stock_f";
        detail="fachat_detail";
        master = "fachat";
        rappel_fa_achat rappel_bla = new rappel_fa_achat(par,detail,master,base);
        rappel_bla.setVisible(true);
        
        
    }//GEN-LAST:event_rappel_fachatActionPerformed

    private void change_exerciceActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_change_exerciceActionPerformed
        if (jComboBox1_an1.getItemCount()> 0)
        {
        jPanel3.setVisible(true);
        } else 
        {
        JOptionPane.showMessageDialog(null, " Pas de donneés pour les autres années !");      
        }
    }//GEN-LAST:event_change_exerciceActionPerformed

    private void nouvel_anActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_nouvel_anActionPerformed
                            
                        
         String sql = "SELECT SCHEMA_NAME FROM SCHEMATA where schema_name like '2%' and schema_name like '%" +base +"' order by schema_name desc";       
         //JOptionPane.showMessageDialog(null, sql);
         try {
            cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/information_schema", "root", "");
            St = cnx.createStatement();                        
            Rs = St.executeQuery(sql);
            if (Rs.next()) {
                //JOptionPane.showMessageDialog(null, base);
                nme = Rs.getString("schema_name").substring(0, 4);
                int nme1 = Integer.parseInt(nme)+1;                
                nme_old=nme+"_"+base;
                nme= Integer.toString(nme1);                
               }
            Object[] options_f = {"je confirme le passage à :"+nme, "Non"};
        int rf = JOptionPane.showOptionDialog(null, " Est-vous sûr ?", "Oui", JOptionPane.YES_NO_OPTION, JOptionPane.QUESTION_MESSAGE, null, options_f, options_f[1]);                        
                        
         if (rf == 0) {                                                        
            JOptionPane.showMessageDialog(null, "Passage à "+nme+" Très bonne année "+nme);
            String nouveau_base=nme+"_"+base;
             //création de la base de données
            cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/", "root", "");
            St = cnx.createStatement();                        
            sql="create database `"+nouveau_base+"`" ;
            
            St.executeUpdate(sql);
            cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/mysql", "root", "");
            St = cnx.createStatement();
            sql =" update stock_table_parameter set db_name ='"+nme+"' where code_activite= '"+base+"'";
            St.executeUpdate(sql);
            cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/"+nouveau_base, "root", "");
            St = cnx.createStatement();
            sql="create table fournisseur as select * from `"+nme_old+"`.fournisseur" ;                        
            St.executeUpdate(sql);
            sql="ALTER TABLE fournisseur ADD PRIMARY KEY ( `Nfournisseur` )" ;
            St.executeUpdate(sql);
            sql="create table article as select * from `"+nme_old+"`.article";
            St.executeUpdate(sql);
            sql="ALTER TABLE article ADD PRIMARY KEY ( `Narticle` )" ;
            St.executeUpdate(sql);
            sql="create table client as select * from `"+nme_old+"`.client";           
            St.executeUpdate(sql);
            sql="ALTER TABLE client ADD PRIMARY KEY ( `nclient` )" ;
            St.executeUpdate(sql);
            sql="create table famille_art as select * from `"+nme_old+"`.famille_art";
            St.executeUpdate(sql);
            sql="create table user_info as select * from `"+nme_old+"`.user_info";
            St.executeUpdate(sql);
            sql="create table fprof as select * from `"+nme_old+"`.fprof where 0";
            St.executeUpdate(sql);
            sql="create table detail_fprof as select * from `"+nme_old+"`.detail_fprof where 0";
            St.executeUpdate(sql);
            sql="create table bl as select * from `"+nme_old+"`.bl where 0";
            St.executeUpdate(sql);
            sql="create table detail_bl as select * from `"+nme_old+"`.detail_bl where 0";
            St.executeUpdate(sql);
            sql="create table fact as select * from `"+nme_old+"`.fact where 0";
            St.executeUpdate(sql);
            sql="create table detail_fact as select * from `"+nme_old+"`.detail_fact where 0";
            St.executeUpdate(sql);
            sql="create table activite as select * from `"+nme_old+"`.activite";
            St.executeUpdate(sql);
            sql="create table bachat as select * from `"+nme_old+"`.bachat where 0";
            St.executeUpdate(sql);
            sql="create table bachat_detail as select * from `"+nme_old+"`.bachat_detail where 0";
            St.executeUpdate(sql);
            sql="create table fachat as select * from `"+nme_old+"`.fachat where 0";
            St.executeUpdate(sql);
            sql="create table fachat_detail as select * from `"+nme_old+"`.fachat_detail where 0";
            St.executeUpdate(sql);
            sql="create table facture as select * from `"+nme_old+"`.facture where 0";
            St.executeUpdate(sql);
            sql="ALTER TABLE `facture` ADD PRIMARY KEY (`id`) ";
            St.executeUpdate(sql);
            sql="ALTER TABLE `facture` CHANGE `id` `id` MEDIUMINT( 9 ) NOT NULL AUTO_INCREMENT ";
            St.executeUpdate(sql);
            sql="create table facture_temp as select * from `"+nme_old+"`.facture_temp where 0";
            St.executeUpdate(sql);
            sql="ALTER TABLE `facture_temp` ADD PRIMARY KEY (`id`) ";
            St.executeUpdate(sql);
            sql="ALTER TABLE `facture_temp` CHANGE `id` `id` MEDIUMINT( 9 ) NOT NULL AUTO_INCREMENT ";
            St.executeUpdate(sql);
             sql="create table facture_a as select * from `"+nme_old+"`.facture_a where 0";
            St.executeUpdate(sql);
            sql="ALTER TABLE `facture_a` ADD PRIMARY KEY (`id`) ";
            St.executeUpdate(sql);
            sql="ALTER TABLE `facture_a` CHANGE `id` `id` MEDIUMINT( 9 ) NOT NULL AUTO_INCREMENT ";
            St.executeUpdate(sql);
            sql="create table ventes as select * from `"+nme_old+"`.ventes where 0";
            St.executeUpdate(sql);
             sql="create table fact_tmp as select * from `"+nme_old+"`.fact_tmp where 0";             
            St.executeUpdate(sql);
             sql="create table tmp_banq as select * from `"+nme_old+"`.tmp_banq where 0";
            St.executeUpdate(sql);
             sql="create table tmp_bnq as select * from `"+nme_old+"`.tmp_bnq where 0";
            St.executeUpdate(sql);
            JOptionPane.showMessageDialog(null, "Passage à "+nme+" terminé avec succès, très bonne année "+nme);
            txt_context.setText(activite+":"+nme);            
            //base=nme;
             sql = "update mysql.stock_table_parameter set n_bl=1, n_fact=1, n_prof=1  where code_activite='"+base+"'";
            //update stock_table_parameter set n_bl=3, n_fact=7, n_prof = 9 where code_activite="BU01";
            // JOptionPane.showMessageDialog(null, sql);
            St.executeUpdate(sql);  
            jComboBox1_an1.addItem(nme);
            
         }
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans la liste des années" + e.getMessage());        
        }
    }//GEN-LAST:event_nouvel_anActionPerformed

    private void menu_exporterActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_menu_exporterActionPerformed
            try { 
            Class.forName(pilote);
            cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/mysql", "root", "");
            St = cnx.createStatement();  
            String sql = "select * from stock_table_parameter where code_activite = '"+base+"'";
            Rs = St.executeQuery(sql);
            if (Rs.next()) {
             chemin_backup= Rs.getString("lieu_backup");
             db_name= Rs.getString("db_name")+"_"+base+"_"+(f.format(dt));   
             String var_cnx= "jdbc:mysql://localhost:3306/"+Rs.getString("db_name");
             var_cnx=var_cnx+"_"+base;   
             user_bd="root";
            String passwd_bd="";
            cnx = DriverManager.getConnection(var_cnx, user_bd, passwd_bd);
            St = cnx.createStatement();
            }
            jPanel1.setVisible(true);
            int progress = 0;
            jProgressBar1.setValue(progress);
            String query = "SELECT 'Narticle','famille','designation','Nfournisseur','prix_unitaire','marge','tva',  'prix_vente','seuil','stock_f','stock_bl'\n" +
             "UNION\n" +
             "SELECT Narticle,famille,designation,Nfournisseur,prix_unitaire,marge,tva,prix_vente,seuil,stock_f,stock_bl FROM article\n" +
             "INTO OUTFILE '"+chemin_backup +db_name+"_article.csv'\n" +
             "FIELDS TERMINATED BY ','\n" +
             "ENCLOSED BY '\"'\n" +
             "LINES TERMINATED BY '\\n'";
            //JOptionPane.showMessageDialog(null, query); 
            St.executeQuery(query);
            progress=progress+7;
            jProgressBar1.setValue(progress);
            // je viens d'ajouter un export de toute la table avec la totlite de ses colonnes
            query = "SELECT * FROM article\n" +
             "INTO OUTFILE '"+chemin_backup +db_name+"_articleBis.csv'\n" +
             "FIELDS TERMINATED BY ','\n" +
             "ENCLOSED BY '\"'\n" +
             "LINES TERMINATED BY '\\n'";
            //JOptionPane.showMessageDialog(null, query); 
            St.executeQuery(query);
            progress=progress+7;
            jProgressBar1.setValue(progress);
           // fin de l'ajout  
             query = "SELECT 'Nclient' , 'Raison_sociale' , 'adresse' , 'contact_person' , 'C_affaire_fact' , 'C_affaire_bl' , 'NRC' , 'Date_RC' , 'Lieu_RC' , 'I_Fiscal' , 'N_article' , 'Tel' , 'email' , 'Commentaire' \n" +
             "UNION\n" +
             "SELECT `Nclient` , `Raison_sociale` , `adresse` , `contact_person` , `C_affaire_fact` , `C_affaire_bl` , `NRC` , `Date_RC` , `Lieu_RC` , `I_Fiscal` , `N_article` , `Tel` , `email` , `Commentaire` \n" +
             "FROM `client`\n" +
             "INTO OUTFILE '"+chemin_backup +db_name+"_client.csv'\n" +
             "FIELDS TERMINATED BY ','\n" +
             "ENCLOSED BY '\"'\n" +
             "LINES TERMINATED BY '\\n'";
             St.executeQuery(query);
             progress=progress+6;
             jProgressBar1.setValue(progress);
             query = "SELECT 'Nfournisseur','Nom_fournisseur','Resp_fournisseur','Adresse_fourni','Tel','tel1','tel2','CAF','CABL','EMAIL','commentaire'\n" +
            "UNION\n" +
            "SELECT `Nfournisseur`,`Nom_fournisseur`,`Resp_fournisseur`,`Adresse_fourni`,`Tel`,`tel1`,`tel2`,`CAF`,`CABL`,`EMAIL`,`commentaire` \n" +
            "FROM `fournisseur`\n" +
            "INTO OUTFILE '"+chemin_backup +db_name+"_fournisseur.csv'\n" +
            "FIELDS TERMINATED BY ','\n" +
            "ENCLOSED BY '\"'\n" +
            "LINES TERMINATED BY '\\n'";
             St.executeQuery(query);
             progress=progress+6;
            jProgressBar1.setValue(progress);
             query = "SELECT 'NFact' ,  'Nclient' ,  'date_fact' ,'montant_ht','timbre','TVA' ,'autre_taxe','banq' ,'ncheque','nbc','date_bc','nom_preneur'\n" +
            "UNION\n" +
            "SELECT `NFact`,`Nclient`,`date_fact`,`montant_ht`,`timbre`,`TVA`,`autre_taxe`,`banq`,`ncheque`,`nbc`,`date_bc`,`nom_preneur`\n" +
            "FROM `fact`\n" +
            "INTO OUTFILE '"+chemin_backup +db_name+"_fact.csv'\n" +
            "FIELDS TERMINATED BY ','\n" +
            "ENCLOSED BY '\"'\n" +
             "LINES TERMINATED BY '\\n'";
             St.executeQuery(query);
             progress=progress+6;
            jProgressBar1.setValue(progress);
            query = "SELECT 'NFact' ,  'Nclient' ,  'date_fact' ,'montant_ht','timbre','TVA' ,'autre_taxe','banq' ,'ncheque','nbc','date_bc','nom_preneur'\n" +
            "UNION\n" +
            "SELECT `NFact`,`Nclient`,`date_fact`,`montant_ht`,`timbre`,`TVA`,`autre_taxe`,`banq`,`ncheque`,`nbc`,`date_bc`,`nom_preneur`\n" +
            "FROM `bl`\n" +
            "INTO OUTFILE '"+chemin_backup +db_name+"_bl.csv'\n" +
            "FIELDS TERMINATED BY ','\n" +
            "ENCLOSED BY '\"'\n" +
            "LINES TERMINATED BY '\\n'";
             St.executeQuery(query);
             progress=progress+6;
            jProgressBar1.setValue(progress);
            query = "SELECT 'NFact', 'Narticle',  'Qte',  'tva',  'prix' ,  'total_ligne'\n" +
            "UNION\n" +
            "SELECT `NFact`, `Narticle`,  `Qte`,  `tva`,  `prix` ,  `total_ligne`\n" +
            "FROM `detail_fact`\n" +
            "INTO OUTFILE '"+chemin_backup +db_name+"_detail_fact.csv'\n" +
            "FIELDS TERMINATED BY ','\n" +
            "ENCLOSED BY '\"'\n" +
            "LINES TERMINATED BY '\\n'";
             St.executeQuery(query);
             progress=progress+6;
            jProgressBar1.setValue(progress);
            query = "SELECT 'NFact', 'Narticle',  'Qte',  'tva',  'prix' ,  'total_ligne'\n" +
            "UNION\n" +
            "SELECT `NFact`, `Narticle`,  `Qte`,  `tva`,  `prix` ,  `total_ligne`\n" +
            "FROM `detail_bl`\n" +
            "INTO OUTFILE '"+chemin_backup +db_name+"_detail_bl.csv'\n" +
            "FIELDS TERMINATED BY ','\n" +
            "ENCLOSED BY '\"'\n" +
            "LINES TERMINATED BY '\\n'";
             St.executeQuery(query);
             progress=progress+6;
            jProgressBar1.setValue(progress);
            query = "SELECT 'NFact' ,  'Nclient' ,  'date_fact' ,'montant_ht','timbre','TVA' ,'autre_taxe','banq' ,'ncheque','nbc','date_bc','nom_preneur'\n" +
            "UNION\n" +
            "SELECT `NFact`,`Nclient`,`date_fact`,`montant_ht`,`timbre`,`TVA`,`autre_taxe`,`banq`,`ncheque`,`nbc`,`date_bc`,`nom_preneur`\n" +
            "FROM `fprof`\n" +
            "INTO OUTFILE '"+chemin_backup +db_name+"_fprof.csv'\n" +
            "FIELDS TERMINATED BY ','\n" +
            "ENCLOSED BY '\"'\n" +
            "LINES TERMINATED BY '\\n'";
             St.executeQuery(query);
             progress=progress+6;
            jProgressBar1.setValue(progress);            
            query = "SELECT 'NFact', 'Narticle',  'Qte',  'tva',  'prix' ,  'total_ligne'\n" +
            "UNION\n" +
            "SELECT `NFact`, `Narticle`,  `Qte`,  `tva`,  `prix` ,  `total_ligne`\n" +
            "FROM `detail_fprof`\n" +
            "INTO OUTFILE '"+chemin_backup +db_name+"_detail_fprof.csv'\n" +
            "FIELDS TERMINATED BY ','\n" +
            "ENCLOSED BY '\"'\n" +
            "LINES TERMINATED BY '\\n'";
             St.executeQuery(query);
             progress=progress+6;
            jProgressBar1.setValue(progress);
            
            query = "select 'nfact', 'date_fact', 'nfournisseur', 'montant_ht', 'ncheque', 'banque', 'tva', 'timbre', 'autre_taxe'\n" +
            "UNION\n" +
            "select `nfact`, `date_fact`, `nfournisseur`, `montant_ht`, `ncheque`, `banque`, `tva`, `timbre`, `autre_taxe` \n" +
            "FROM `fachat`\n" +
            "INTO OUTFILE '"+chemin_backup +db_name+"_fachat.csv'\n" +
            "FIELDS TERMINATED BY ','\n" +
            "ENCLOSED BY '\"'\n" +
            "LINES TERMINATED BY '\\n'";
             St.executeQuery(query);
             progress=progress+6;
            jProgressBar1.setValue(progress);
            query ="SELECT 'domaine_activite', 'sous_domaine', 'raison_sociale', 'adresse', 'commune', 'wilaya', 'tel_fixe', 'tel_port', 'nrc', 'nis', 'nart', 'ident_fiscal', 'banq', 'entete_bon'  \n" +
            "UNION\n" +
            "SELECT `domaine_activite`, `sous_domaine`, `raison_sociale`, `adresse`, `commune`, `wilaya`, `tel_fixe`, `tel_port`, `nrc`, `nis`, `nart`, `ident_fiscal`, `banq` , `entete_bon` \n" +
            "FROM `activite`\n" +
            "INTO OUTFILE '"+chemin_backup +db_name+"_activite.csv'\n" +
            "FIELDS TERMINATED BY ','\n" +
            "ENCLOSED BY '\"'\n" +
            "LINES TERMINATED BY '\\n'";
             St.executeQuery(query);
             progress=progress+6;
            jProgressBar1.setValue(progress);
           
            query ="select 'id', 'NFact', 'Narticle', 'Qte', 'tva', 'prix', 'total_ligne', 'type_fact' \n" +
            "UNION\n" +
            "SELECT `id`, `NFact`, `Narticle`, `Qte`, `tva`, `prix`, `total_ligne`, `type_fact` \n" +
            "FROM `facture`\n" +
            "INTO OUTFILE '"+chemin_backup +db_name+"_facture.csv'\n" +
            "FIELDS TERMINATED BY ','\n" +
            "ENCLOSED BY '\"'\n" +
            "LINES TERMINATED BY '\\n'";
           // JOptionPane.showMessageDialog(null, query);
             St.executeQuery(query);
             progress=progress+6;
            jProgressBar1.setValue(progress);
       
            query ="select 'id', 'NFact', 'nfournisseur', 'Narticle', 'Qte', 'tva', 'prix', 'total_ligne', 'type_fact' \n" +
            "UNION\n" +
            "SELECT `id`, `NFact`, `nfournisseur`, `Narticle`, `Qte`, `tva`, `prix`, `total_ligne`, `type_fact` \n" +
            "FROM `facture_a`\n" +
            "INTO OUTFILE '"+chemin_backup +db_name+"_facture_a.csv'\n" +
            "FIELDS TERMINATED BY ','\n" +
            "ENCLOSED BY '\"'\n" +
            "LINES TERMINATED BY '\\n'";
           // JOptionPane.showMessageDialog(null, query);
             St.executeQuery(query);
             progress=progress+6;
            jProgressBar1.setValue(progress);
       
            
            
            query = "select 'nfact', 'date_fact', 'nfournisseur', 'montant_ht', 'ncheque', 'banque', 'tva', 'timbre', 'autre_taxe'\n" +
            "UNION\n" +
            "select `nfact`, `date_fact`, `nfournisseur`, `montant_ht`, `ncheque`, `banque`, `tva`, `timbre`, `autre_taxe` \n" +
            "FROM `bachat`\n" +
            "INTO OUTFILE '"+chemin_backup +db_name+"_bachat.csv'\n" +
            "FIELDS TERMINATED BY ','\n" +
            "ENCLOSED BY '\"'\n" +
            "LINES TERMINATED BY '\\n'";
             St.executeQuery(query);
             progress=progress+6;
            jProgressBar1.setValue(progress);
            query = "select 'NFact', 'nfournisseur', 'Narticle', 'Qte', 'tva', 'prix', 'total_ligne'\n" +
            "UNION\n" +
            "select `NFact`, `nfournisseur`, `Narticle`, `Qte`, `tva`, `prix`, `total_ligne` \n" +
            "FROM `fachat_detail`\n" +
            "INTO OUTFILE '"+chemin_backup +db_name+"_fachat_detail.csv'\n" +
            "FIELDS TERMINATED BY ','\n" +
            "ENCLOSED BY '\"'\n" +
            "LINES TERMINATED BY '\\n'";
             St.executeQuery(query);
             progress=progress+6;
            jProgressBar1.setValue(progress);
            query = "select 'NFact', 'nfournisseur', 'Narticle', 'Qte', 'tva', 'prix', 'total_ligne'\n" +
            "UNION\n" +
            "select `NFact`, `nfournisseur`, `Narticle`, `Qte`, `tva`, `prix`, `total_ligne` \n" +
            "FROM `bachat_detail`\n" +
            "INTO OUTFILE '"+chemin_backup +db_name+"_bachat_detail.csv'\n" +
            "FIELDS TERMINATED BY ','\n" +
            "ENCLOSED BY '\"'\n" +
            "LINES TERMINATED BY '\\n'";
             St.executeQuery(query);
             progress=progress+6;
            jProgressBar1.setValue(progress);
            query = "select 'famille'\n" +
            "UNION\n" +
            "select `famille`\n" +
            "FROM `famille_art`\n" +
            "INTO OUTFILE '"+chemin_backup +db_name+"_famille_art.csv'\n" +
            "FIELDS TERMINATED BY ','\n" +
            "ENCLOSED BY '\"'\n" +
            "LINES TERMINATED BY '\\n'";
             St.executeQuery(query);
             progress=progress+6;
            jProgressBar1.setValue(progress);
             query = "SELECT 'db_name', 'user_bd', 'passwd_bd', 'lieu_backup', ' from stock_table_parameter'"+
            "INTO OUTFILE '"+chemin_backup +db_name+"_stock_table_parameter.csv'\n" +
            "FIELDS TERMINATED BY ','\n" +
            "ENCLOSED BY '\"'\n" +
            "LINES TERMINATED BY '\\n'";
             St.executeQuery(query);
             progress=progress+6;
            jProgressBar1.setValue(progress);
            query = "select 'username', 'pass_word', 'profil', 'has_login', ' from user_info ' "+
            "INTO OUTFILE '"+chemin_backup +db_name+"_user_info.csv'\n" +
            "FIELDS TERMINATED BY ','\n" +
            "ENCLOSED BY '\"'\n" +
            "LINES TERMINATED BY '\\n'";
             St.executeQuery(query);
             progress=100;
            jProgressBar1.setValue(progress);
            JOptionPane.showMessageDialog(null, "Export terminé sur le répertoire :"+chemin_backup);
            jPanel1.setVisible(false);
            //query = "select count(*) as nbre_enr FROM"; 
          } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans la liste des années" + e.getMessage());        
        }
        
        
    }//GEN-LAST:event_menu_exporterActionPerformed

    private void list_factureActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_list_factureActionPerformed
        par = "stock_f";
        detail="detail_fact";
        master = "fact";
        liste_bl list_f = new liste_bl(par,detail,master,base);
        list_f.setVisible(true);
    }//GEN-LAST:event_list_factureActionPerformed

    private void list_profActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_list_profActionPerformed
        par = "";
        detail="detail_fprof";
        master = "fprof";
        liste_bl list_fprof = new liste_bl(par,detail,master,base);
        list_fprof.setVisible(true);
    }//GEN-LAST:event_list_profActionPerformed

    private void list_blActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_list_blActionPerformed
        par = "stock_bl";
        detail="detail_bl";
        master = "bl";
        liste_bl list_bl = new liste_bl(par,detail,master,base);
        list_bl.setVisible(true);
    }//GEN-LAST:event_list_blActionPerformed

    private void list_fact_achatActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_list_fact_achatActionPerformed
        // Liste des factures d'achats
        par = "stock_f";
        detail="fachat_detail";
        master = "fachat";
        List_fachat list_fachat = new List_fachat(par,detail,master,base);
        list_fachat.setVisible(true);
    }//GEN-LAST:event_list_fact_achatActionPerformed

    private void jMenuItem1ActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jMenuItem1ActionPerformed
        par = "stock_bl";
        detail="bachat_detail";
        master = "bachat";
        List_fachat list_fachat = new List_fachat(par,detail,master,base);
        list_fachat.setVisible(true);
    }//GEN-LAST:event_jMenuItem1ActionPerformed

    private void liste_banqActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_liste_banqActionPerformed
        par = "banque";
        detail="bachat_detail";
        master = "bachat";
        list_banq list_bq = new list_banq(par,detail,master,base);
        list_bq.setVisible(true);      
    }//GEN-LAST:event_liste_banqActionPerformed

    private void list_termActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_list_termActionPerformed
        par = "TERM";
        detail="bachat_detail";
        master = "bachat";
        list_banq list_term = new list_banq(par,detail,master,base);
        list_term.setVisible(true);  
    }//GEN-LAST:event_list_termActionPerformed

    private void list_especeActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_list_especeActionPerformed
        par = "Espece";
        detail="bachat_detail";
        master = "bachat";
        list_banq list_es = new list_banq(par,detail,master,base);
        list_es.setVisible(true);          
    }//GEN-LAST:event_list_especeActionPerformed

    private void vente_periodeActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_vente_periodeActionPerformed
       par = "periode";
        detail="bachat_detail";
        master = "bachat";
        list_banq list_vente_periode = new list_banq(par,detail,master,base);
        list_vente_periode.setVisible(true); 
    }//GEN-LAST:event_vente_periodeActionPerformed

    private void jComboBox1_an1PopupMenuWillBecomeInvisible(javax.swing.event.PopupMenuEvent evt) {//GEN-FIRST:event_jComboBox1_an1PopupMenuWillBecomeInvisible

        tmp = (String) jComboBox1_an1.getSelectedItem();
        try {

            cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/mysql", "root", "");
            St = cnx.createStatement();
            String sql =" update stock_table_parameter set db_name ="+tmp+" where code_activite= '"+base+"'";
            St.executeUpdate(sql);
            remplir_stock_table_parameter();
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans le comboBox \n" + e.getMessage());
        }

    }//GEN-LAST:event_jComboBox1_an1PopupMenuWillBecomeInvisible
    private void fillCombo1_an() {
        String sql = "SELECT SCHEMA_NAME FROM SCHEMATA where schema_name like '2%' and substr(schema_name,6,4)='"+base+"' order by schema_name desc";        
        try {
            
            Rs = St.executeQuery(sql);
            while (Rs.next()) {
            
                String nme = Rs.getString("schema_name").substring(0,4);
                jComboBox1_an1.addItem(nme);               
            } 
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans la liste jComboBox1\n" + e.getMessage());
        }
    }

    
    private void jButton2ActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jButton2ActionPerformed
        if (tmp.isEmpty()){
            tmp="en cours !";
        }
        JOptionPane.showMessageDialog(null, "Vous avez choisi l'année : "+tmp);
        jPanel3.setVisible(false);;
        txt_context.setText(activite+":"+tmp);
        //return;

    }//GEN-LAST:event_jButton2ActionPerformed

    private void annexe01ActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_annexe01ActionPerformed
        annexe01 annexe1 = new annexe01();
       annexe1.setVisible(true);
    }//GEN-LAST:event_annexe01ActionPerformed

    private void achat_periiodeActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_achat_periiodeActionPerformed
        par = "periode";
        //par = "stock_f";
        detail="fachat_detail";
        master = "fachat";
        list_banq1 list_achat_p = new list_banq1(par,detail,master,base);
        list_achat_p.setVisible(true);
    }//GEN-LAST:event_achat_periiodeActionPerformed

    private void jMenu2ActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jMenu2ActionPerformed
        // TODO add your handling code here:
    }//GEN-LAST:event_jMenu2ActionPerformed

       public void close() {
        WindowEvent winClosingEvent = new WindowEvent(this,WindowEvent.WINDOW_CLOSING);
        Toolkit.getDefaultToolkit().getSystemEventQueue().postEvent(winClosingEvent);
    }
    /**
     * @param args the command line arguments
     */
    public static void Gestion_Stock (final String par, final String act, final String yr) {
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
            java.util.logging.Logger.getLogger(Gestion_Stock.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (InstantiationException ex) {
            java.util.logging.Logger.getLogger(Gestion_Stock.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (IllegalAccessException ex) {
            java.util.logging.Logger.getLogger(Gestion_Stock.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (javax.swing.UnsupportedLookAndFeelException ex) {
            java.util.logging.Logger.getLogger(Gestion_Stock.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        }
        //</editor-fold>

        /* Create and display the form */
        java.awt.EventQueue.invokeLater(new Runnable() {
            public void run() {
                new Gestion_Stock(par,act,yr).setVisible(true);
            }
        });
    }
    public String par, detail,master;
    public  int int_nprof,int_nfact, int_nbl =0;
    private Statement St;  
    private ResultSet Rs;
    public Connection cnx;
    public String[][] tableau;
    public String pilote,nme,nme_old,var_cnx,user_bd,db_name,chemin_backup,base,activite,year,xind,ind,tmp; 
    public Integer dim;
    Date dt = new Date();
    public SimpleDateFormat f = new SimpleDateFormat("dd-MM-yyyy");
    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JMenuItem Article_menu;
    private javax.swing.JMenuItem BL_appl;
    private javax.swing.JMenuItem Client_Menu;
    private javax.swing.JMenuItem Facture_appl;
    private javax.swing.JMenuItem Fournisseur_menu;
    private javax.swing.JMenu Quitter_menu;
    private javax.swing.JMenuItem achat_bl;
    private javax.swing.JMenuItem achat_fact;
    private javax.swing.JCheckBoxMenuItem achat_periiode;
    private javax.swing.JMenuItem annexe01;
    private javax.swing.JMenuItem change_exercice;
    private javax.swing.JMenuItem facture_prof;
    private javax.swing.JButton jButton2;
    private javax.swing.JComboBox jComboBox1_an1;
    private javax.swing.JLabel jLabel1;
    private javax.swing.JLabel jLabel3;
    private javax.swing.JMenu jMenu1;
    private javax.swing.JMenu jMenu2;
    private javax.swing.JMenu jMenu3;
    private javax.swing.JMenu jMenu4;
    private javax.swing.JMenuBar jMenuBar1;
    private javax.swing.JMenuItem jMenuItem1;
    private javax.swing.JPanel jPanel1;
    private javax.swing.JPanel jPanel3;
    private javax.swing.JProgressBar jProgressBar1;
    private javax.swing.JPopupMenu.Separator jSeparator1;
    private javax.swing.JPopupMenu.Separator jSeparator10;
    private javax.swing.JPopupMenu.Separator jSeparator11;
    private javax.swing.JPopupMenu.Separator jSeparator12;
    private javax.swing.JPopupMenu.Separator jSeparator13;
    private javax.swing.JPopupMenu.Separator jSeparator14;
    private javax.swing.JPopupMenu.Separator jSeparator15;
    private javax.swing.JPopupMenu.Separator jSeparator16;
    private javax.swing.JPopupMenu.Separator jSeparator17;
    private javax.swing.JPopupMenu.Separator jSeparator18;
    private javax.swing.JPopupMenu.Separator jSeparator19;
    private javax.swing.JPopupMenu.Separator jSeparator2;
    private javax.swing.JPopupMenu.Separator jSeparator20;
    private javax.swing.JPopupMenu.Separator jSeparator21;
    private javax.swing.JPopupMenu.Separator jSeparator22;
    private javax.swing.JPopupMenu.Separator jSeparator23;
    private javax.swing.JPopupMenu.Separator jSeparator24;
    private javax.swing.JPopupMenu.Separator jSeparator25;
    private javax.swing.JPopupMenu.Separator jSeparator26;
    private javax.swing.JPopupMenu.Separator jSeparator27;
    private javax.swing.JPopupMenu.Separator jSeparator28;
    private javax.swing.JPopupMenu.Separator jSeparator29;
    private javax.swing.JPopupMenu.Separator jSeparator3;
    private javax.swing.JPopupMenu.Separator jSeparator30;
    private javax.swing.JPopupMenu.Separator jSeparator31;
    private javax.swing.JPopupMenu.Separator jSeparator32;
    private javax.swing.JPopupMenu.Separator jSeparator33;
    private javax.swing.JPopupMenu.Separator jSeparator4;
    private javax.swing.JPopupMenu.Separator jSeparator5;
    private javax.swing.JPopupMenu.Separator jSeparator6;
    private javax.swing.JPopupMenu.Separator jSeparator7;
    private javax.swing.JPopupMenu.Separator jSeparator8;
    private javax.swing.JPopupMenu.Separator jSeparator9;
    private javax.swing.JMenuItem list_bl;
    private javax.swing.JMenuItem list_espece;
    private javax.swing.JMenuItem list_fact_achat;
    private javax.swing.JMenuItem list_facture;
    private javax.swing.JMenuItem list_prof;
    private javax.swing.JMenuItem list_term;
    private javax.swing.JMenuItem liste_banq;
    private javax.swing.JMenuItem menu_exporter;
    private javax.swing.JMenuItem nouvel_an;
    private javax.swing.JMenu nouvelle_an;
    private javax.swing.JMenuItem passage_en_facture;
    private javax.swing.JMenuItem quitter_menu;
    private javax.swing.JMenuItem rappel_bachat;
    private javax.swing.JMenuItem rappel_bl;
    private javax.swing.JMenuItem rappel_fachat;
    private javax.swing.JMenuItem rappel_facture;
    private javax.swing.JMenuItem rappel_fprof;
    public javax.swing.JTextField txt_context;
    private javax.swing.JMenuItem vente_periode;
    // End of variables declaration//GEN-END:variables
}
