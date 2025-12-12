/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package Stock;

/**
 *
 * @author habib.belkacemi
 */
import java.awt.Color;
import java.awt.Component;
import java.awt.Font;
import javax.swing.JOptionPane;
import javax.swing.JTable;
import javax.swing.SwingConstants;
import javax.swing.border.Border;
import javax.swing.border.MatteBorder;
import javax.swing.table.DefaultTableCellRenderer;

public class TKMntRenderer extends DefaultTableCellRenderer {
    private static Border matBdr;
                
    public TKMntRenderer() {      
      //super();
      setFont(getFont().deriveFont(Font.PLAIN));
      
      setHorizontalAlignment(SwingConstants.RIGHT);
    }

    public Component getTableCellRendererComponent(JTable table, Object value, 
                      boolean isSelected, boolean hasFocus, int row, int column) {
      if (matBdr==null) matBdr = new MatteBorder(1,1,1,1, table.getGridColor());
      setBackground((isSelected) ? table.getSelectionBackground() : table.getBackground());
      setBorder((hasFocus) ? matBdr : null);
      if (value==null)
                  setText("");
      else if (!(value instanceof Double))
                  setText(value.toString());
      else {
                  //JOptionPane.showMessageDialog(null,table.getForeground() );
                  double mnt = ((Double)value).doubleValue();               
                  
             //setText(mntFmt.mntFmt(mnt));
                  setText(mntFmt.mntFmt(mnt));
                  setForeground(mnt<0 ? Color.red : table.getGridColor());
                  if (mnt <0) {
                  
                   setForeground(mnt<0 ? Color.red : Color.LIGHT_GRAY);
                  } 
               else {
                 table.setGridColor(table.getGridColor());
             //     setForeground(mnt>0 ? Color.MAGENTA : table.getForeground());
             //    table.setForeground(table.getForeground());
                  }

      }
      return this;
    }
}

