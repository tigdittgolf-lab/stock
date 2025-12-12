/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package Stock;

// new class. This is the table model
import javax.swing.table.*;
import java.sql.*;
import java.text.DecimalFormat;
import java.util.Vector;
import javax.swing.JOptionPane;


public class MyTableModel extends AbstractTableModel {
Connection con;
Statement stat;
ResultSet rs;
public String base;
int li_cols = 0;
Vector allRows;
Vector row;
Vector newRow;
Vector colNames;
String dbColNames[];
String pkValues[];
String tableName;
ResultSetMetaData myM;
String pKeyCol;
String sql;
Vector deletedKeys;
Vector newRows;
boolean ibRowNew = false;
boolean ibRowInserted = false;

   MyTableModel(String sql, String bas){
      try{
        Class.forName("com.mysql.jdbc.Driver");
        base = bas;
        // DecimalFormat patternFormatter = new DecimalFormat("#,###.00");
      }
      catch (ClassNotFoundException e){
            System.out.println("Cannot Load Driver!");
      }
      try{
         
        //
            con = DriverManager.getConnection("jdbc:mysql://localhost:3306/mysql", "root", "");
            stat = con.createStatement();  
            String sql1 = "select db_name from stock_table_parameter where code_activite = '"+base+"'";
            rs = stat.executeQuery(sql1);
            if (rs.next()) {
            String var_cnx= "jdbc:mysql://localhost:3306/"+rs.getString("db_name");
            var_cnx=var_cnx+"_"+base;
            String user_bd="root";
            String passwd_bd="";
            con = DriverManager.getConnection(var_cnx, user_bd, passwd_bd);
            }
        //  
         //con = DriverManager.getConnection("jdbc:mysql://localhost:3306/test", "root", "");
         stat = con.createStatement();
         rs = stat.executeQuery(sql);
         deletedKeys = new Vector();
         newRows = new Vector();
         myM = rs.getMetaData();
         tableName = myM.getTableName(1);
         li_cols = myM.getColumnCount();
         dbColNames = new String[li_cols];
         
         for(int col = 0; col < li_cols; col ++){
         dbColNames[col] = myM.getColumnName(col + 1);
         }
         allRows = new Vector();
         while(rs.next()){
            newRow = new Vector();
            for(int i = 1; i <= li_cols; i++){
              // if (myM.getColumnClassName(i)== "java.lang.Double") 
               //{ 
             //  Object aa = rs.getObject(i);
               
             //  Double jj = Double.parseDouble(aa.toString());
               
               //newRow.addElement(Double.parseDouble(patternFormatter.format(rs.getObject(i))));
               //newRow.addElement(jj);
              // } 
              //  else {
               newRow.addElement(rs.getObject(i));
              // }
               //JOptionPane.showMessageDialog(null, myM.getColumnClassName(i));
            } // for
            allRows.addElement(newRow);
         } // while
      } 
      catch(SQLException e){
         System.out.println(e.getMessage());
      } 
   }
   
@Override

public Class getColumnClass(int col){
        return getValueAt(0,col).getClass();
      
   }
   public boolean isCellEditable(int row, int col){
      if (ibRowNew){
         return true;
      }
      if (col == 0){
         return  false;
      } else {
         return true;
      }
   }
@Override
   public String getColumnName(int col){
      return dbColNames[col];
   }
   public int getRowCount(){
      return allRows.size();
   } 
@Override
   public int getColumnCount(){
      return li_cols;
   }
@Override
   public Object getValueAt(int arow, int col){
      row = (Vector) allRows.elementAt(arow);
      return row.elementAt(col);
   }
   public void setValueAt(Object aValue, int aRow, int aCol) {
      Vector dataRow = (Vector) allRows.elementAt(aRow);
      dataRow.setElementAt(aValue, aCol);
      fireTableCellUpdated(aRow, aCol);
   }
   
}
