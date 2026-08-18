# 📊 StockApp — Présentation de la plateforme

> Document de synthèse à destination des **actionnaires et du comité de
> direction**. Présente la plateforme, sa valeur métier, ses
> fonctionnalités, son architecture et ses bénéfices.

**Version :** 1.0 — Juin 2026

---

## 1. Vue d'ensemble

**StockApp** est une plateforme intégrée de **gestion de stock et de
commercialisation** destinée aux commerces et PME. Elle couvre l'ensemble
du cycle métier, de la **référence des articles** jusqu'à la **facturation**,
en passant par les **achats**, les **livraisons**, les **paiements** et la
**reporting fiscal**.

Conçue pour fonctionner aussi bien **dans le cloud** que **100 % en local,
sans aucune connexion Internet**, elle répond aux contraintes réelles des
terrains où la connectivité est faible, instable ou inexistante.

| Caractéristique | Détail |
|-----------------|--------|
| **Cœur métier** | Articles, achats, ventes, livraison, facturation, paiements, stock |
| **Multi-activité** | Plusieurs business units (multi-tenant) sur une même plateforme |
| **Modes de déploiement** | ☁️ Cloud **ou** 📦 Hors-ligne (1 PC seul ou réseau LAN) |
| **Accès** | Interface web responsive (poste fixe, portable, tablette, mobile) |
| **Utilisateurs** | Gestion fine des rôles (admin / utilisateur), authentification sécurisée |

---

## 2. La proposition de valeur

> **« Gérer son commerce de bout en bout, partout, même sans Internet. »**

Trois bénéfices clés pour l'entreprise :

### 2.1. Autonomie totale vis-à-vis d'Internet

- Fonctionnement **sans aucune dépendance réseau**.
- **Aucune donnée métier ne quitte le site** (parfait pour la
  confidentialité et les zones à faible connectivité).
- Choix entre un **PC unique** (standalone), un **réseau local**
  (plusieurs postes), ou le **cloud** — sans changer de code.

### 2.2. Couverture complète du cycle opérationnel

- Un **seul logiciel** couvre les achats, le stock, les ventes, les
  paiements et la fiscalité — fini les tableurs multiples et la
  double saisie.
- Les données sont **cohérentes** entre elles (le stock évolue avec
  les bons de livraison ; le CA client avec les paiements, etc.).

### 2.3. Maîtrise et sécurité des données

- **Souveraineté des données** : tout reste chez le client en mode offline.
- **Sauvegardes planifiables**, restauration maîtrisée.
- Authentification par utilisateur, avec profils différenciés.

---

## 3. Les modules fonctionnels

La plateforme s'articule autour de **9 grands domaines** :

```
┌──────────────────────────────────────────────────────────────┐
│                    📊 TABLEAU DE BORD                         │
│        Indicateurs clés, CA, stock, valorisation              │
└──────────────────────────────────────────────────────────────┘
        │           │           │           │           │
        ▼           ▼           ▼           ▼           ▼
  📦 ARTICLES   👥 TIERS    🛒 COMMERCE   💶 FINANCE   📑 FISCAL
  Catalogue      Clients     BL &         Paiements    G50
  Familles       Fournisseurs Factures    Échéances    Déclarations
  Marges         Encours     Proforma     Avoirs
  Stock          Coût        Retours      Dettes
                              Achats
```

### 3.1. 📊 Tableau de bord (Dashboard)

- Vue synthétique : chiffre d'affaires, stock global, valorisation.
- Indicateurs en temps réel, **lignes de totaux dynamiques**
  (prix unitaire, prix de vente, stocks, valorisation) tenant compte
  des filtres.
- Sélection de la **business unit** et de l'exercice.

### 3.2. 📦 Articles & Stock

- **Catalogue produits** : désignation, famille, fournisseur, prix
  d'achat, **marge**, TVA, prix de vente, seuil d'alerte.
- Gestion des **familles d'articles**.
- Gestion du **stock** (physique, en BL), alertes de seuil.
- **Étiquettes** produits imprimables.

### 3.3. 👥 Tiers — Clients & Fournisseurs

- Fiches clients (raison sociale, adresse, contact, téléphone, e-mail,
  **chiffre d'affaires**).
- Fiches fournisseurs.
- **Encours et historique** par client.
- Suivi des **dettes** fournisseurs.

### 3.4. 🛒 Commerce — Ventes & Achats

- **Bons de livraison (BL)** : création, modification, détail, impression PDF.
- **Factures** : émission, suivi, lien avec les BL.
- **Proforma** : devis/devis proforma.
- **Retours** (avoirs).
- **Achats** : bons de livraison fournisseurs, factures d'achat, statistiques.
- **Génération PDF** professionnelle (BL, facture, proforma) avec
  montant en lettres, coordonnées société.

### 3.5. 💶 Finances & Paiements

- **Encaissements** : ajout, historique, échéancier.
- Suivi des **impayés** et du **retard de paiement**.
- **Avoirs** déduits du solde en retard et intégrés au CA client.
- États **récapitulatifs des paiements** (montant net).

### 3.6. 📑 Fiscalité

- **État G50** (déclaration fiscale).
- Paramètres fiscaux et exercices.

### 3.7. ⚙️ Administration & Paramètres

- Gestion des **utilisateurs** (création, profils ADMIN/USER).
- Gestion des **business units** (multi-activité / multi-tenant).
- **Migration de bases**, tests de schéma, journaux (outils admin).
- Paramètres généraux (société, fiscalité, thème clair/sombre).

### 3.8. 📱 Accès mobile

- Interfaces dédiées **mobile** (bons de livraison, factures) pour une
  utilisation sur tablette ou smartphone.

### 3.9. 💬 Intégrations

- Connectivité **WhatsApp Business** (envoi de documents).
- Support multi-base : **Supabase** (cloud) et **MySQL/MariaDB** (local).

---

## 4. Architecture technique

### 4.1. Une application web 3 tiers

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  FRONTEND    │ ──►  │   BACKEND    │ ──►  │ BASE DE      │
│  Next.js     │      │   Hono (API) │      │ DONNÉES      │
│  (interface  │ ◄──  │   Node/Bun   │ ◄──  │ Supabase ou  │
│   web)       │      │              │      │ MySQL/MariaDB│
└──────────────┘      └──────────────┘      └──────────────┘
   Navigateur           Logique métier         Persistance
```

| Couche | Technologie |
|--------|-------------|
| **Frontend** | Next.js (React) — interface web responsive |
| **Backend** | Hono sur Node.js / Bun — API REST |
| **Base cloud** | Supabase (PostgreSQL managé) |
| **Base locale** | MySQL / MariaDB (mode hors-ligne) |
| **Documents** | Génération PDF côté client (jsPDF) |

### 4.2. Le double mode : cloud ou hors-ligne

La force technique de StockApp réside dans sa capacité à basculer entre
deux architectures **sans modifier le code métier** :

```
MODE CLOUD                           MODE HORS-LIGNE
┌───────────────┐                    ┌───────────────────────┐
│ Vercel        │                    │ PC serveur / PC seul  │
│ Navigateur    │                    │ Navigateur            │
│      │        │                    │      │                │
│      ▼        │                    │      ▼                │
│ Backend (API) │                    │ Backend local (API)   │
│      │        │                    │      │                │
│      ▼        │                    │      ▼                │
│ Supabase      │                    │ MySQL/MariaDB local   │
│ (Internet)    │                    │ (Aucun Internet)      │
└───────────────┘                    └───────────────────────┘
```

- En mode **cloud** : hébergement Vercel, base Supabase, accès depuis
  n'importe où via un tunnel sécurisé.
- En mode **hors-ligne** : tout est embarqué sur le poste (ou le réseau
  LAN), dans un installeur Windows autonome.

### 4.3. Le mode hors-ligne en détail

Trois configurations possibles, **selon le matériel disponible** :

| Mode | Description | Idéal pour |
|------|-------------|------------|
| **Standalone** | 1 seul PC, tout en `localhost` | Petit commerce, point de vente unique |
| **Serveur LAN** | 1 PC serveur + N PC clients | Magasin multi-postes, entrepôt |
| **Client LAN** | PC léger se connectant au serveur | Poste de saisie supplémentaire |

> 💡 Le client final **n'a rien à installer** : l'installeur Windows
> embarque la base de données, les runtimes et l'application. Un
> simple double-clic démarre tout.

### 4.4. Stack technique synthétique

- **Frontend** : Next.js, React, TypeScript, CSS modulaire, mode sombre/clair.
- **Backend** : Hono, TypeScript, exécution Node ou Bun.
- **Bases de données** : Supabase (cloud), MySQL/MariaDB (offline).
- **PDF** : jsPDF.
- **Déploiement cloud** : Vercel.
- **Déploiement offline** : installeur Inno Setup, scripts PowerShell,
  MariaDB portable, Node portable.

---

## 5. Bénéfices pour l'entreprise

| Bénéfice | Concret sur le terrain |
|----------|------------------------|
| ⏱️ **Gain de temps** | Fin de la double saisie ; facturation et BL générés en quelques clics. |
| 🎯 **Fiabilité** | Données cohérentes, calculs automatiques (marges, TTC, stock). |
| 🌍 **Résilience réseau** | Travaille même quand Internet coupe — **aucune interruption**. |
| 🔐 **Confidentialité** | Les données restent chez le client (mode offline). |
| 📈 **Pilotage** | Tableau de bord et états financiers (G50) en temps réel. |
| 💶 **Trésorerie** | Suivi fin des impayés, échéances, avoirs. |
| 🧩 **Évolutivité** | Multi-tenant, multi-postes, passage cloud ↔ offline sans rupture. |

---

## 6. Sécurité et conformité

- **Authentification** par utilisateur, mots de passe hachés (SHA-256).
- **Profils** différenciés (ADMIN / USER) avec permissions.
- **Souveraineté des données** : en mode offline, aucune donnée ne sort
  du site du client.
- **Sauvegardes** automatisables (planification quotidienne, purge des
  anciennes sauvegardes, restauration maîtrisée).
- **Pare-feu** : ouverture maîtrisée des ports, uniquement sur les
  profils réseau Privé/Domaine.

---

## 7. Roadmap & points d'attention

### Points forts actuels

- ✅ Couverture fonctionnelle large et cohérente.
- ✅ Double déploiement cloud / offline opérationnel.
- ✅ Génération PDF professionnelle.
- ✅ Multi-tenant et multi-postes.

### Limitations connues

- ⚠️ Pas de **synchronisation automatique** entre une base cloud et une
  base locale (chaque installation est indépendante).
- ⚠️ Le mode LAN nécessite que le PC serveur reste **allumé** tant que
  les clients travaillent.
- ⚠️ Récupération de mot de passe offline **manuelle** (pas d'e-mail
  automatique — par conception, puisqu'il n'y a pas d'Internet).

### Pistes d'évolution

- Synchronisation cloud ↔ offline (réplication planifiée).
- Application mobile native.
- Tableaux de bord analytiques avancés.
- API publique pour intégrations comptables.

---

## 8. En résumé

StockApp est une plateforme **complète, souveraine et résiliente** de
gestion commerciale. Elle se démarque par sa capacité à **fonctionner
indifféremment dans le cloud ou totalement hors-ligne**, sans compromis
sur les fonctionnalités. Elle apporte à l'entreprise **productivité,
fiabilité et maîtrise de ses données**, qu'elle soit exploitée sur un
seul poste, sur un réseau de magasin, ou dans le cloud.

---

## 📎 Annexes

- **Guide utilisateur & installation** : `docs/GUIDE_UTILISATION_OFFLINE.md`
  et `docs/GUIDE_INSTALLATION_OFFLINE.md`
- **Architecture technique** : `docs/ARCHITECTURE.md`
- **Dépannage** : `docs/GUIDE_DEPANNAGE_OFFLINE.md`
