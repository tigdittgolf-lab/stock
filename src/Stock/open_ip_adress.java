/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package Stock;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import javax.swing.JOptionPane;

/**
 *
 * @author User
 */
public class open_ip_adress {

    private String ip_adress;
        public static String ouverture() {                   
        try            
        {
            File file = new File("C:\\Users\\User\\Documents\\St_Article_2\\src\\Stock\\adress_ip.txt");                                  
            FileReader reader = new FileReader(file);
            BufferedReader br = new BufferedReader(reader);            
            String ip_adress = br.readLine();
            return ip_adress;
            //JOptionPane.showMessageDialog(null, ip_adress);
        }
        catch(Exception e){
        JOptionPane.showMessageDialog(null, e);
        }
      return null;
    }   
        
}
