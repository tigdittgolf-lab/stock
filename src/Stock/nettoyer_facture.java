/*
 * ça sert à rétablir le stock dans le cas d'un sortie anormale lors de l'établissement d'une facture.  
 * 
 */
package Stock;

import java.awt.HeadlessException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import javax.swing.JOptionPane;

/**
 *
 * @author IT
 */


public class nettoyer_facture {
    
public static Connection cnx;
public static Statement St1,St,St3,St4;
public static ResultSet Rs1,Rs3, Rs,Rs2;
public String base;    
    
    /**
     *
     */
@SuppressWarnings("empty-statement")
    public static void nettoyer_facture( String par, String par2) {   
         
    try {
                
        String query = "select id, Narticle , prix, tva, qte , total_ligne,type_fact from "+par2+"" ;
            //cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/test", "root", "");
            Connection cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/mysql", "root", "");
            St = cnx.createStatement();
            String sql = "select db_name from stock_table_parameter where code_activite='"+par+"'";            
                      
            Rs = St.executeQuery(sql);
            if (Rs.next()) {
            String var_cnx= "jdbc:mysql://localhost:3306/"+Rs.getString("db_name");
            var_cnx=var_cnx+"_"+par;            
            String user_bd="root";
            String passwd_bd="";
            cnx = DriverManager.getConnection(var_cnx, user_bd, passwd_bd);
            
            St = cnx.createStatement();
            }
            St1 = cnx.createStatement();
            St3 = cnx.createStatement();
            St = cnx.createStatement();
            St4 = cnx.createStatement();
            Rs1 = St1.executeQuery(query);
           //JOptionPane.showMessageDialog(null,par2);
            while(Rs1.next())
            { 
                String add1 = Rs1.getString("Narticle");
                String add2 = Rs1.getString("qte");
                String add3 = Rs1.getString("type_fact");
             if (! add3.equals("")) {           
                mettre_jour_stock_debut(add1 , "restituer", add2,add3, par2);
             }
            }
               query ="truncate table "+par2+"";
               // JOptionPane.showMessageDialog(null, par2);
               St1.executeUpdate(query);
               } catch (SQLException | HeadlessException e) {
               JOptionPane.showMessageDialog(null, "Erreur dans la table\n" + e.getMessage());
        }
    finally{
    try{if(Rs1!=null){Rs1.close();}}catch(Exception e){};
    try{if(St1!=null){St1.close();}}catch(Exception e){};
    try{if(cnx!=null){cnx.close();}}catch(Exception e){};
    try{if(Rs!=null){Rs.close();}}catch(Exception e){};
    try{if(St3!=null){St3.close();}}catch(Exception e){};
    try{if(Rs2!=null){Rs2.close();}}catch(Exception e){};
    try{if(St4!=null){St4.close();}}catch(Exception e){};
    
}
    
}

    
    public static void mettre_jour_stock_debut(String xcode_art, String oper, String qte, String type_fact, String par2)
    {
     int x_resultat = 0; 
    try {
        String sql= "select stock_f,stock_bl from article where narticle = '" + xcode_art + "'";    
        //JOptionPane.showMessageDialog(null, sql);  
        //JOptionPane.showMessageDialog(null, type_fact);  
        Rs2 = St.executeQuery(sql);       
        if (Rs2.next()) {        
        String xstock_f = Rs2.getString(type_fact);
        int v_xstock_f = Integer.parseInt(xstock_f);
        int xqte = Integer.parseInt(qte);
       if (!"ajouter".equals(oper) ) {
        if ("facture_a".equals(par2) ) {            
           xqte=-1*xqte;
        }  
        x_resultat = v_xstock_f+xqte;
       } else 
       {
        x_resultat = v_xstock_f-xqte;
        
       }      
       //JOptionPane.showMessageDialog(null, x_resultat);
                                         
       String query = "update article set "+type_fact +" = '" +x_resultat +"' where narticle = '" +xcode_art+"'";                               
       //JOptionPane.showMessageDialog(null, query);      
        St3.executeUpdate(query);
       }     
    }catch (HeadlessException | SQLException | NumberFormatException e) {
            JOptionPane.showMessageDialog(null, "Erreur" + e.getMessage());    
    }    
}
    
}
