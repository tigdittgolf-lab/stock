-- phpMyAdmin SQL Dump
-- version 4.0.4
-- http://www.phpmyadmin.net
--
-- Client: localhost
-- Généré le: Jeu 02 Juillet 2015 à 23:16
-- Version du serveur: 5.6.12-log
-- Version de PHP: 5.4.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Base de données: `mysql`
--

-- --------------------------------------------------------

--
-- Structure de la table `stock_table_parameter`
--

CREATE TABLE IF NOT EXISTS `stock_table_parameter` (
  `db_name` varchar(20) NOT NULL,
  `user_bd` varchar(20) NOT NULL,
  `passwd_bd` varchar(20) NOT NULL,
  `lieu_backup` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Contenu de la table `stock_table_parameter`
--

INSERT INTO `stock_table_parameter` (`db_name`, `user_bd`, `passwd_bd`, `lieu_backup`) VALUES
('2014', 'root', '', 'c:/dev11/');

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
