/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package Stock;

import java.text.DecimalFormat;

/**
 *
 * @author habib.belkacemi
 */
class mntFmt {
    public static String mntFmt(double mnt) {
        return (new DecimalFormat("#,##0.00")).format(mnt); }
}
