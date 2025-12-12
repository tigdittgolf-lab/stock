-- phpMyAdmin SQL Dump
-- version 4.0.4
-- http://www.phpmyadmin.net
--
-- Client: localhost
-- Généré le: Mer 20 Novembre 2013 à 00:00
-- Version du serveur: 5.6.12-log
-- Version de PHP: 5.4.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Base de données: `test`
--
CREATE DATABASE IF NOT EXISTS `test` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `test`;

-- --------------------------------------------------------

--
-- Structure de la table `article`
--

CREATE TABLE IF NOT EXISTS `article` (
  `Narticle` varchar(10) NOT NULL,
  `famille` varchar(20) NOT NULL,
  `designation` varchar(30) NOT NULL,
  `Nfournisseur` varchar(10) NOT NULL,
  `prix_unitaire` double NOT NULL,
  `marge` int(11) NOT NULL,
  `tva` double NOT NULL,
  `prix_vente` double NOT NULL,
  `seuil` int(11) NOT NULL,
  `stock_f` int(11) NOT NULL,
  `stock_bl` int(11) NOT NULL,
  PRIMARY KEY (`Narticle`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Contenu de la table `article`
--

INSERT INTO `article` (`Narticle`, `famille`, `designation`, `Nfournisseur`, `prix_unitaire`, `marge`, `tva`, `prix_vente`, `seuil`, `stock_f`, `stock_bl`) VALUES
('01', 'Electricité', 'lampe', '1234', 12, 20, 12, 14.399999999999999, 12, 12, -98),
('011', 'Habillement', 'COMPRESSEUR', '12434', 1233450, 10, 12, 1356795, 1, 2, -1),
('10', 'Outillage', 'TV GRAND ECRAN1 ', '1434', 100, 10, 100, 110.00000000000001, 10, 12, 6),
('100', 'Menage', 'TV GRAND ECRAN100', '1234', 10, 10, 100, 100, 10, 100, 100),
('1000', 'Menage', 'TV GRAND ECRAN1000', '1234', 10000.23, 15, 100, 150003.44999999998, 10, 100, 90),
('1001', 'Droguerie', 'dorguerie', '1212', 5000.22, 12, 12, 5600.246400000001, 12, 12, 12),
('1010', 'Electro menager', '1211', '12', 123.12, 23, 12, 2831.76, 12, 12, 12),
('11', 'Electricité', '11', '11', 1101, 11, 11, 12111, 11, 11, 0),
('111', 'Droguerie', '122', '12', 12, 12, 12, 144, 12, 12, 12),
('1111', 'Peinture', '111', '111', 1111, 11, 11, 12221, 11, 11, 11),
('11221', 'Droguerie', '11', '111', 11, 11, 11, 121, 11, 11, 11),
('1133', 'Electro menager', '111', '111', 11, 11, 11, 121, 11, 11, 11),
('12', 'null', 'azdkamz', 'azd', 1234, 12, 12, 14808, 12, 8, 8),
('120', 'Outillage', '122', '1234', 120, 12, 10, 134.4, 10, 12, 13),
('121', 'Habillement', '121', '121', 1000, 21, 12, 21000, 12, 12, 12),
('12113', 'Peinture', 'AZQSDC', 'AZD', 121141, 12, 12, 1453692, 123, 123, 123),
('1212', 'Peinture', 'QDQ', 'qsd', 1234, 10, 12, 12340, 12, 12, 12),
('1231', 'Outillage', 'qsc,q;cmql', 'Dsd', 123123.1233, 12, 10, 123124.23, 10, 12, 13),
('14', 'Plomberie', 'cinture de sécurité ', '1234', 12345.21, 12, 10, 148142.52, 10, 8, 13),
('20', 'Peinture', 'TV PETIT ECRAN', '', 100000, 5, 10, 105000, 0, 8, 4),
('2222', 'Outillage', 'cinture de sécurité ', '1234', 2222.23, 12, 10, 48889.06, 10, 12, 13),
('231', 'Habillement', 'cinture de sécurité ', '1234', 1231.12, 12, 10, 1233.34, 10, 12, 13),
('30', 'Peinture', 'LAC 500', '120434', 120, 10, 10, 134.4, 10, 10, 8),
('34', 'Peinture', 'LAC 500', '1234', 100, 10, 10, 124, 10, 10, 10),
('401', 'Peinture', 'Vetement de securité', '1234', 100, 12, 10, 24.23, 10, 12, 8);

-- --------------------------------------------------------

--
-- Structure de la table `bl`
--

CREATE TABLE IF NOT EXISTS `bl` (
  `NFact` int(11) NOT NULL,
  `Nclient` varchar(10) NOT NULL,
  `date_fact` date NOT NULL,
  `montant_ht` double NOT NULL,
  `timbre` double NOT NULL,
  `TVA` double NOT NULL,
  `autre_taxe` double NOT NULL,
  `facturer` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Contenu de la table `bl`
--

INSERT INTO `bl` (`NFact`, `Nclient`, `date_fact`, `montant_ht`, `timbre`, `TVA`, `autre_taxe`, `facturer`) VALUES
(1, '15', '2013-11-19', 105220, 1052.2, 10720, 105000, 0),
(2, '10', '2013-11-19', 389.95000000000005, 3.8995000000000006, 38.995, 121.15, 0),
(3, '20', '2013-11-19', 1358235, 2500, 162988.19999999998, 1356795, 0),
(4, '10', '2013-11-20', 144, 1.44, 17.28, 144, 0);

-- --------------------------------------------------------

--
-- Structure de la table `client`
--

CREATE TABLE IF NOT EXISTS `client` (
  `Nclient` varchar(10) NOT NULL,
  `Raison_sociale` varchar(30) DEFAULT NULL,
  `adresse` varchar(60) DEFAULT NULL,
  `contact_person` varchar(30) DEFAULT NULL,
  `C_affaire_fact` double DEFAULT NULL,
  `C_affaire_bl` double DEFAULT NULL,
  `NRC` varchar(20) DEFAULT NULL,
  `Date_RC` date DEFAULT NULL,
  `Lieu_RC` varchar(20) DEFAULT NULL,
  `I_Fiscal` varchar(20) DEFAULT NULL,
  `N_article` varchar(20) DEFAULT NULL,
  `Tel` varchar(12) DEFAULT NULL,
  `email` varchar(20) DEFAULT NULL,
  `Commentaire` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`Nclient`),
  KEY `ncli_raison` (`Nclient`,`Raison_sociale`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Contenu de la table `client`
--

INSERT INTO `client` (`Nclient`, `Raison_sociale`, `adresse`, `contact_person`, `C_affaire_fact`, `C_affaire_bl`, `NRC`, `Date_RC`, `Lieu_RC`, `I_Fiscal`, `N_article`, `Tel`, `email`, `Commentaire`) VALUES
('10', 'Sana', 'mosta', 'SANA', 0, 0, '109238', '2013-10-26', 'MOSTA', '1231123', '123123', '045212112', 'SANA@JJ.COM', 'mosta'),
('11', 'Habib', 'mosta', 'SANA', 0, 0, '101010', '2013-10-26', 'MOSTA', '1231123', '123123', '045212112', 'SANA@JJ.COM', 'mosta'),
('12', 'Habib', 'mosta', 'habib', 0, 0, '109238', '2013-10-26', 'MOSTA', '1231123', '123123', '045212112', 'HABIB@JJ.COM', 'mosta'),
('15', 'Aymen', 'mosta', 'OUMEYA', 0, 0, '109238', '2013-10-26', 'MOSTA', '1231123', '123123', '045212112', 'KAM@JJ.COM', 'mosta'),
('20', 'KAM', 'mosta', 'OUMEYA', 0, 0, '109238', '2013-10-11', 'MOSTA', '1231123', '123123', '045212112', 'KAM@JJ.COM', 'mosta');

-- --------------------------------------------------------

--
-- Structure de la table `detail_bl`
--

CREATE TABLE IF NOT EXISTS `detail_bl` (
  `NFact` int(11) NOT NULL,
  `Narticle` varchar(10) NOT NULL,
  `Qte` int(11) NOT NULL,
  `tva` double DEFAULT NULL,
  `prix` double NOT NULL,
  `total_ligne` double NOT NULL,
  `facturer` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`NFact`,`Narticle`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Contenu de la table `detail_bl`
--

INSERT INTO `detail_bl` (`NFact`, `Narticle`, `Qte`, `tva`, `prix`, `total_ligne`, `facturer`) VALUES
(1, '10', 2, 100, 110, 220, NULL),
(1, '20', 1, 10, 105000, 105000, NULL),
(2, '30', 2, 10, 134.4, 268.8, NULL),
(2, '401', 5, 10, 24.23, 121.15, NULL),
(3, '01', 100, 12, 14.4, 1440, NULL),
(3, '011', 1, 12, 1356795, 1356795, NULL),
(4, '01', 10, 12, 14.4, 144, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `detail_fact`
--

CREATE TABLE IF NOT EXISTS `detail_fact` (
  `NFact` int(11) NOT NULL,
  `Narticle` varchar(10) NOT NULL,
  `Qte` int(11) NOT NULL,
  `tva` double DEFAULT NULL,
  `prix` double NOT NULL,
  `total_ligne` double NOT NULL,
  PRIMARY KEY (`NFact`,`Narticle`),
  KEY `NFact` (`NFact`),
  KEY `Narcticle` (`Narticle`),
  KEY `Narcticle_2` (`Narticle`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Contenu de la table `detail_fact`
--

INSERT INTO `detail_fact` (`NFact`, `Narticle`, `Qte`, `tva`, `prix`, `total_ligne`) VALUES
(3, '011', 1, 12, 1356795, 1356795),
(3, '10', 2, 100, 110, 220),
(3, '1000', 10, 100, 150003.45, 1500034.5),
(4, '10', 3, 100, 110, 330),
(4, '1000', 10, 100, 150003.45, 1500034.5),
(5, '011', 1, 12, 1356795, 1356795),
(5, '10', 2, 100, 110, 220),
(5, '1000', 10, 100, 150003.45, 1500034.5),
(6, '011', 1, 12, 1356795, 1356795),
(6, '10', 2, 100, 110, 220),
(6, '1000', 10, 100, 150003.45, 1500034.5),
(7, '011', 1, 12, 1356795, 1356795),
(7, '10', 2, 100, 110, 220),
(7, '1000', 10, 100, 150003.45, 1500034.5),
(8, '011', 1, 12, 1356795, 1356795),
(8, '10', 2, 100, 110, 220),
(8, '1000', 10, 100, 150003.45, 1500034.5),
(11, '011', 1, 12, 1356795, 1356795),
(11, '10', 2, 100, 110, 220),
(11, '1000', 10, 100, 150003.45, 1500034.5),
(12, '011', 1, 12, 1356795, 1356795),
(12, '10', 2, 100, 110, 220),
(12, '1000', 10, 100, 150003.45, 1500034.5),
(13, '011', 1, 12, 1356795, 1356795),
(13, '10', 2, 100, 110, 220),
(13, '1000', 10, 100, 150003.45, 1500034.5),
(14, '011', 1, 12, 1356795, 1356795),
(14, '10', 2, 100, 110, 220),
(14, '1000', 10, 100, 150003.45, 1500034.5),
(15, '011', 1, 12, 1356795, 1356795),
(15, '10', 2, 100, 110, 220),
(15, '1000', 10, 100, 150003.45, 1500034.5),
(16, '011', 1, 12, 1356795, 1356795),
(16, '10', 2, 100, 110, 220),
(16, '1000', 10, 100, 150003.45, 1500034.5),
(17, '011', 1, 12, 1356795, 1356795),
(17, '10', 2, 100, 110, 220),
(17, '1000', 10, 100, 150003.45, 1500034.5),
(18, '011', 1, 12, 1356795, 1356795),
(18, '10', 2, 100, 110, 220),
(18, '1000', 10, 100, 150003.45, 1500034.5),
(19, '011', 1, 12, 1356795, 1356795),
(19, '10', 2, 100, 110, 220),
(19, '1000', 10, 100, 150003.45, 1500034.5);

-- --------------------------------------------------------

--
-- Structure de la table `fact`
--

CREATE TABLE IF NOT EXISTS `fact` (
  `NFact` int(11) NOT NULL,
  `Nclient` varchar(10) NOT NULL,
  `date_fact` date NOT NULL,
  `montant_ht` double NOT NULL,
  `timbre` double NOT NULL,
  `TVA` double NOT NULL,
  `autre_taxe` double NOT NULL,
  PRIMARY KEY (`NFact`),
  KEY `fact_ibfk_2` (`Nclient`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Contenu de la table `fact`
--

INSERT INTO `fact` (`NFact`, `Nclient`, `date_fact`, `montant_ht`, `timbre`, `TVA`, `autre_taxe`) VALUES
(2, '10', '2013-11-09', 1000, 0, 0, 0),
(3, '10', '2013-11-15', 2857049.5, 2500, 1663069.9, 1500034.5),
(4, '15', '2013-11-18', 1500364.5, 2500, 1500364.5, 1500034.5),
(5, '10', '2013-11-15', 2858049.5, 2500, 1663069.9, 1500034.5),
(6, '10', '2013-11-15', 2857049.5, 2500, 1663069.9, 1500034.5),
(7, '10', '2013-11-15', 2858049.5, 2500, 1663069.9, 1500034.5),
(8, '10', '2013-11-15', 2857049.5, 2500, 1663069.9, 1500034.5),
(9, '10', '2013-11-09', 1000, 0, 0, 0),
(11, '10', '2013-11-15', 2858049.5, 2500, 1663069.9, 1500034.5),
(12, '10', '2013-11-15', 2858049.5, 2500, 1663069.9, 1500034.5),
(13, '10', '2013-11-15', 2858049.5, 2500, 1663069.9, 1500034.5),
(14, '10', '2013-11-15', 2858049.5, 2500, 1663069.9, 1500034.5),
(15, '10', '2013-11-15', 2858049.5, 2500, 1663069.9, 1500034.5),
(16, '10', '2013-11-15', 2857049.5, 2500, 1663069.9, 1500034.5),
(17, '10', '2013-11-15', 2857049.5, 2500, 1663069.9, 1500034.5),
(18, '10', '2013-11-15', 2858049.5, 2500, 1663069.9, 1500034.5),
(19, '10', '2013-11-15', 2857049.5, 2500, 1663069.9, 1500034.5);

-- --------------------------------------------------------

--
-- Structure de la table `facture`
--

CREATE TABLE IF NOT EXISTS `facture` (
  `id` mediumint(9) NOT NULL AUTO_INCREMENT,
  `NFact` int(11) NOT NULL,
  `Narticle` varchar(10) NOT NULL,
  `Qte` int(11) NOT NULL,
  `tva` double DEFAULT NULL,
  `prix` double NOT NULL,
  `total_ligne` double NOT NULL,
  `type_fact` varchar(10) DEFAULT NULL,
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `Narticle` (`Narticle`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `facture_model`
--

CREATE TABLE IF NOT EXISTS `facture_model` (
  `id` mediumint(9) NOT NULL AUTO_INCREMENT,
  `NFact` int(11) NOT NULL,
  `Narticle` varchar(10) NOT NULL,
  `Qte` int(11) NOT NULL,
  `prix` double NOT NULL,
  `total_ligne` double NOT NULL,
  UNIQUE KEY `facture_model_idx` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `facture_temp`
--

CREATE TABLE IF NOT EXISTS `facture_temp` (
  `id` mediumint(9) NOT NULL AUTO_INCREMENT,
  `NFact` int(11) NOT NULL,
  `Narticle` varchar(10) NOT NULL,
  `Qte` int(11) NOT NULL,
  `tva` double DEFAULT NULL,
  `prix` double NOT NULL,
  `total_ligne` double NOT NULL,
  `type_fact` varchar(10) DEFAULT NULL,
  UNIQUE KEY `id` (`id`),
  KEY `Narticle` (`Narticle`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `facture_temp`
--

INSERT INTO `facture_temp` (`id`, `NFact`, `Narticle`, `Qte`, `tva`, `prix`, `total_ligne`, `type_fact`) VALUES
(1, 3, '01', 100, 12, 14.4, 1440, 'stock_bl'),
(2, 3, '011', 1, 12, 1356795, 1356795, 'stock_bl');

-- --------------------------------------------------------

--
-- Structure de la table `famille_art`
--

CREATE TABLE IF NOT EXISTS `famille_art` (
  `famille` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Contenu de la table `famille_art`
--

INSERT INTO `famille_art` (`famille`) VALUES
('Electricité'),
('Electro menager'),
('Droguerie'),
('Outillage'),
('Habillement'),
('Peinture'),
('Quincaillerie'),
('Plomberie'),
('Menage'),
('Electronique');

-- --------------------------------------------------------

--
-- Structure de la table `fournisseur`
--

CREATE TABLE IF NOT EXISTS `fournisseur` (
  `Nfournisseur` varchar(10) NOT NULL,
  `Nom_fournisseur` varchar(30) NOT NULL,
  `Resp_fournisseur` varchar(30) NOT NULL,
  `Adresse_fourni` varchar(50) NOT NULL,
  `Tel` varchar(11) NOT NULL,
  `tel1` varchar(20) DEFAULT NULL,
  `tel2` varchar(20) DEFAULT NULL,
  `CAF` double DEFAULT NULL,
  `CABL` double DEFAULT NULL,
  `EMAIL` varchar(30) DEFAULT NULL,
  `commentaire` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`Nfournisseur`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='EMAIL';

--
-- Contenu de la table `fournisseur`
--

INSERT INTO `fournisseur` (`Nfournisseur`, `Nom_fournisseur`, `Resp_fournisseur`, `Adresse_fourni`, `Tel`, `tel1`, `tel2`, `CAF`, `CABL`, `EMAIL`, `commentaire`) VALUES
('120434', 'Sana', 'Belkacemi', 'Ain Benian', '21311407', '0770901660', '06602776607', 509040, 40981025, 'Sana_fr2001@yahoo.fr', ''),
('1234', 'Habib', 'Belkacemi', 'Ain Benian', '21311407', '0770901660', '06602776607', 5090400, 40981000, 'habib_fr2001@yahoo.fr', 'Je lui doit une somme de 14 000 000'),
('12345', 'Habib', 'Belkacemi', 'Ain Benian', '21311407', '0770901660', '06602776607', 5090400, 40981000, 'habib_fr2001@yahoo.fr', 'Je lui doit une somme de 14 000 000'),
('12434', 'Sana', 'Belkacemi', 'Ain Benian', '21311407', '0770901660', '06602776607', 509040, 40981025, 'Sana_fr2001@yahoo.fr', ''),
('124340', 'Sana', 'Belkacemi', 'Ain Benian', '21311407', '0770901660', '06602776607', 509040, 40981025, 'Sana_fr2001@yahoo.fr', 'CAF et CABL non editable'),
('1434', 'Sana', 'Belkacemi', 'Ain Benian', '21311407', '0770901660', '06602776607', 5090.43, 409810.25, 'Sana_fr2001@yahoo.fr', '');

-- --------------------------------------------------------

--
-- Structure de la table `stagiaire`
--

CREATE TABLE IF NOT EXISTS `stagiaire` (
  `mat` int(6) NOT NULL,
  `nom` varchar(20) NOT NULL,
  `prenom` varchar(20) NOT NULL,
  `moyenne` double NOT NULL,
  `dateNaiss` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Contenu de la table `stagiaire`
--

INSERT INTO `stagiaire` (`mat`, `nom`, `prenom`, `moyenne`, `dateNaiss`) VALUES
(5623, 'Ahmed', 'Tlemçani', 14.5, '2014-07-16'),
(5623, 'Ahmed', 'Tlemçani', 14.5, '2014-07-16'),
(18, 'Oumeya', 'Mazouz', 18, '1974-03-06'),
(20, 'Omar', 'Zinga', 16, '1963-09-25'),
(24, 'Lahcen', 'Abdou', 16, '1970-03-06');

-- --------------------------------------------------------

--
-- Structure de la table `table1`
--

CREATE TABLE IF NOT EXISTS `table1` (
  `code` int(5) NOT NULL,
  `designation` varchar(20) NOT NULL,
  `date_fact` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Contenu de la table `table1`
--

INSERT INTO `table1` (`code`, `designation`, `date_fact`) VALUES
(1, 'Habib', NULL),
(2, 'Habib', NULL),
(3, 'Habib', NULL),
(4, 'Habib', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `table2`
--

CREATE TABLE IF NOT EXISTS `table2` (
  `code` int(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Structure de la table `user_info`
--

CREATE TABLE IF NOT EXISTS `user_info` (
  `username` varchar(30) NOT NULL,
  `pass_word` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Contenu de la table `user_info`
--

INSERT INTO `user_info` (`username`, `pass_word`) VALUES
('habib', 'habibo'),
('sana', 'sanouna'),
('kam', 'kam'),
('aymen', 'habibo'),
('douaa', 'amina');

--
-- Contraintes pour les tables exportées
--

--
-- Contraintes pour la table `detail_fact`
--
ALTER TABLE `detail_fact`
  ADD CONSTRAINT `detail_fact_ibfk_2` FOREIGN KEY (`Narticle`) REFERENCES `article` (`Narticle`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `detail_fact_ibfk_3` FOREIGN KEY (`NFact`) REFERENCES `fact` (`NFact`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `fact`
--
ALTER TABLE `fact`
  ADD CONSTRAINT `fact_ibfk_2` FOREIGN KEY (`Nclient`) REFERENCES `client` (`Nclient`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
