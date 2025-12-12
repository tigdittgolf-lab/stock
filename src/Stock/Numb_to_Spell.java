

package Stock;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import javax.swing.JOptionPane;

/**
 *
 * @author IT
 */
public class Numb_to_Spell {

     private static final String[] dizaineNames = {
    "",
    "",
    "vingt",
    "trente",
    "quarante",
    "cinquante",
    "soixante",
    "soixante",
    "quatre-vingt",
    "quatre-vingt"
  };

    
private static final String[] uniteNames1 = {
    "",
    "un",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf",
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize",
    "dix-sept",
    "dix-huit",
    "dix-neuf"
  };

  private static final String[] uniteNames2 = {
    "",
    "",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf",
    "dix"
  };

  private static String convertZeroToHundred(int number) {

    int laDizaine = number / 10;
    int lUnite = number % 10;
    String resultat = "";

    switch (laDizaine) {
    case 1 :
    case 7 :
    case 9 :
      lUnite = lUnite + 10;
      break;
    default:
    }

    // séparateur "-" "et"  ""
    String laLiaison = "";
    if (laDizaine > 1) {
      laLiaison = "-";
    }
    // cas particuliers
    switch (lUnite) {
    case 0:
      laLiaison = "";
      break;
    case 1 :
      if (laDizaine == 8) {
        laLiaison = "-";
      }
      else {
        laLiaison = " et ";
      }
      break;
    case 11 :
      if (laDizaine==7) {
        laLiaison = " et ";
      }
      break;
    default:
    }

    // dizaines en lettres
    switch (laDizaine) {
    case 0:
      resultat = uniteNames1[lUnite];
      break;
    case 8 :
      if (lUnite == 0) {
        resultat = dizaineNames[laDizaine];
      }
      else {
        resultat = dizaineNames[laDizaine] 
                                + laLiaison + uniteNames1[lUnite];
      }
      break;
    default :
      resultat = dizaineNames[laDizaine] 
                              + laLiaison + uniteNames1[lUnite];
    }
    return resultat;
  }

  private static String convertLessThanOneThousand(int number) {

    int lesCentaines = number / 100;
    int leReste = number % 100;
    String sReste = convertZeroToHundred(leReste);

    String resultat;
    switch (lesCentaines) {
    case 0:
      resultat = sReste;
      break;
    case 1 :
      if (leReste > 0) {
        resultat = "cent " + sReste;
      }
      else {
        resultat = "cent";
      }
      break;
    default :
      if (leReste > 0) {
        resultat = uniteNames2[lesCentaines] + " cent " + sReste;
      }
      else {
        resultat = uniteNames2[lesCentaines] + " cents";
      }
    }
    return resultat;
  }

  public static String convert(long number) {
    // 0 à 999 999 999 999
    if (number == 0) { return "zéro"; }

    String snumber = Long.toString(number);

    // pad des "0"
    String mask = "000000000000";
    DecimalFormat df = new DecimalFormat(mask);
    snumber = df.format(number);
    //JOptionPane.showMessageDialog(null,snumber);
    // XXXnnnnnnnnn 
    int lesMilliards = Integer.parseInt(snumber.substring(0,3));
    // nnnXXXnnnnnn
    int lesMillions  = Integer.parseInt(snumber.substring(3,6)); 
    // nnnnnnXXXnnn
    int lesCentMille = Integer.parseInt(snumber.substring(6,9)); 
    // nnnnnnnnnXXX
    int lesMille = Integer.parseInt(snumber.substring(9,12));    

    String tradMilliards;
    switch (lesMilliards) {
    case 0:
      tradMilliards = "";
      break;
    case 1 :
      tradMilliards = convertLessThanOneThousand(lesMilliards) 
      + " milliard ";
      break;
    default :
      tradMilliards = convertLessThanOneThousand(lesMilliards) 
      + " milliards ";
    }
    String resultat =  tradMilliards;

    String tradMillions;
    switch (lesMillions) {
    case 0:
      tradMillions = "";
      break;
    case 1 :
      tradMillions = convertLessThanOneThousand(lesMillions) 
      + " million ";
      break;
    default :
      tradMillions = convertLessThanOneThousand(lesMillions) 
      + " millions ";
    }
    resultat =  resultat + tradMillions;

    String tradCentMille;
    switch (lesCentMille) {
    case 0:
      tradCentMille = "";
      break;
    case 1 :
      tradCentMille = "mille ";
      break;
    default :
      tradCentMille = convertLessThanOneThousand(lesCentMille) 
      + " mille ";
    }
    resultat =  resultat + tradCentMille;

    String tradMille;
    tradMille = convertLessThanOneThousand(lesMille);
    resultat =  resultat + tradMille;
    return resultat;
  }
/*
  public static String spell( double nombre , String txt_spell) { 
                DecimalFormat patternFormatter = new DecimalFormat ("############.00");
                String x=patternFormatter.format(nombre).replace(",", ".");
                JOptionPane.showMessageDialog(null,x);
                nombre=Double.parseDouble(x);
               JOptionPane.showMessageDialog(null,nombre);
               
    BigDecimal var2 = new BigDecimal(BigDecimal.valueOf(nombre).toPlainString());
    txt_spell = ""; 
    //System.out.println(var2);
     //nombre=var2;
	 String var1= var2.toString().substring((var2.toString().length()-2)).substring(0,1);
	 int long1 = (var2.toString().length()-3);
	 int long2 = (var2.toString().length());
	 int partie1;
	 int partie2;
	 
	if (var1.equals( "."))
	 {
	   long1 = (var2.toString().length()-2);	 
	   partie1 = Integer.parseInt(var2.toString().substring(0,long1));
	   partie2 = Integer.parseInt(var2.toString().substring((long1+1))+"0");
	 } 
	else
	 {
	 long1 = (var2.toString().length()-3);
	 partie1 = Integer.parseInt(var2.toString().substring(0,long1));
         
         partie2 = Integer.parseInt(var2.toString().substring(long1+1));
		
	 }
          txt_spell = "*** " + Numb_to_Spell.convert(partie1)+" Da et "+ Numb_to_Spell.convert(partie2)+ " centimes." ;
	 return txt_spell;
          //System.out.println("*** " + Numb_to_Spell.convert(partie1)+" Da et "+ Numb_to_Spell.convert(partie2)+ " centimes.");
    //System.out.println("*** " + Number_to_Spell.convert(partie2));
  } 
*/
  public static String spell( double nombre , String txt_spell) { 
                DecimalFormat patternFormatter = new DecimalFormat ("############.00");
                String x=patternFormatter.format(nombre).replace(",", ".");
                //JOptionPane.showMessageDialog(null,x);
                nombre=Double.parseDouble(x);
               //JOptionPane.showMessageDialog(null,nombre);
               
    //BigDecimal var2 = new BigDecimal(BigDecimal.valueOf(nombre).toPlainString());
    txt_spell = ""; 
    //System.out.println(var2);
     //nombre=var2;
	 String var1= x.substring((x.length()-2)).substring(0,1);
	 int long1 = (x.length()-3);
	 int long2 = (x.length());
	 int partie1;
	 int partie2;
	 
	if (var1.equals( "."))
	 {
	   long1 = (x.length()-2);	 
	   partie1 = Integer.parseInt(x.substring(0,long1));
	   partie2 = Integer.parseInt(x.substring((long1+1))+"0");
	 } 
	else
	 {
	 long1 = (x.length()-3);
	 partie1 = Integer.parseInt(x.substring(0,long1));
         
         partie2 = Integer.parseInt(x.substring(long1+1));
		
	 }
          txt_spell = "*** " + Numb_to_Spell.convert(partie1)+" Da et "+ Numb_to_Spell.convert(partie2)+ " centimes." ;
	 return txt_spell;
          //System.out.println("*** " + Numb_to_Spell.convert(partie1)+" Da et "+ Numb_to_Spell.convert(partie2)+ " centimes.");
    //System.out.println("*** " + Number_to_Spell.convert(partie2));
  } 

}

  
  




