-- phpMyAdmin SQL Dump
-- version 4.0.4
-- http://www.phpmyadmin.net
--
-- Client: localhost
-- Généré le: Ven 03 Juillet 2015 à 00:09
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
-- Structure de la table `user_info`
--

CREATE TABLE IF NOT EXISTS `user_info` (
  `username` varchar(30) NOT NULL,
  `pass_word` varchar(30) NOT NULL,
  `profil` varchar(20) DEFAULT NULL,
  `has_login` varchar(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Contenu de la table `user_info`
--

INSERT INTO `user_info` (`username`, `pass_word`, `profil`, `has_login`) VALUES
('habib', 'habibo', 'USER', 'Yes'),
('sana', 'sanouna', 'USER', ''),
('kam', 'kam', 'USER', ''),
('aymen', 'habibo', 'USER', ''),
('douaa', 'amina', 'ADMIN', '');

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
