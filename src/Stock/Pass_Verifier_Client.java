package Stock;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import javax.swing.InputVerifier;
import javax.swing.JComponent;
import javax.swing.JOptionPane;
import javax.swing.JTextField;

/**
 *
 * @author IT
 */

    public class Pass_Verifier_Client extends InputVerifier {
     String base;
        public Pass_Verifier_Client(String xbase) {
        base = xbase;
        }
         @Override
         public boolean verify(JComponent input)
        
         {
               JTextField tf = (JTextField) input;
               String sql = "select * from client where nclient = '" + tf.getText() + "'";             
        Statement St;
        ResultSet Rs;
        boolean retour = false;
        try {
        Connection cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/mysql", "root", "");
            St = cnx.createStatement();  
            String sql1 = "select db_name from stock_table_parameter where code_activite='"+base+"'";
            Rs = St.executeQuery(sql1);
            if (Rs.next()) {
            String var_cnx= "jdbc:mysql://localhost:3306/"+Rs.getString("db_name");
            var_cnx=var_cnx+"_"+base;    
            String user_bd="root";
            String passwd_bd="";
            cnx = DriverManager.getConnection(var_cnx, user_bd, passwd_bd);
            St = cnx.createStatement();
            }
        //Connection cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/test", "root", "");
        //St = cnx.createStatement();
        
        Rs = St.executeQuery(sql);
        
        if (Rs.next()) {
             
             retour = true;
        }                
        else {
            JOptionPane.showMessageDialog(null, "client inexistant");
             retour = false;          
        }
        } catch (Exception e) {
            JOptionPane.showMessageDialog(null, "Erreur dans le champ client \n" + e.getMessage());
        }
             return retour;     
         
    }
    }