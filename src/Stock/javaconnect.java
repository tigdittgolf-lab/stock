/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package Stock;

/**
 *
 * @author IT
*/

import java.sql.*;
import javax.swing.*;

class javaconnect {
    
    Connection conn = null;
    //private Statement St;
    public static Connection ConnecrDb() {
     try {
         Class.forName("com.mysql.jdbc.Driver");
         Connection cnx = DriverManager.getConnection("jdbc:mysql://localhost:3306/mysql", "root", "");
            Statement St = cnx.createStatement();  
            String sql1 = "select db_name from stock_table_parameter";
            ResultSet Rs = St.executeQuery(sql1);
            if (Rs.next()) {
            String var_cnx= "jdbc:mysql://localhost:3306/"+Rs.getString("db_name");
            String user_bd="root";
            String passwd_bd="";
            cnx = DriverManager.getConnection(var_cnx, user_bd, passwd_bd);
            St = cnx.createStatement();
            }
            Connection conn = cnx;
        return conn;  
     
     } catch (Exception e ) {
     JOptionPane.showMessageDialog(null, e);
       return null;
     }
    }
    
    
    
    
}
