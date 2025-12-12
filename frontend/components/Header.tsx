'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, signOut } from '@/utils/supabase';
import styles from './Header.module.css';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1>Système de Gestion de Stock</h1>
        
        <div className={styles.userSection}>
          {user && (
            <div className={styles.userInfo}>
              <span className={styles.userEmail}>{user.email}</span>
              <div className={styles.userMenu}>
                <button 
                  className={styles.userButton}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  👤
                </button>
                {showUserMenu && (
                  <div className={styles.dropdown}>
                    <button onClick={() => {
                      router.push('/users');
                      setShowUserMenu(false);
                    }}>
                      👥 Utilisateurs
                    </button>
                    <button onClick={handleLogout} className={styles.logoutButton}>
                      🚪 Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className={styles.nav}>
        <button
          className={activeTab === 'dashboard' ? styles.active : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Tableau de Bord
        </button>
        <button
          className={activeTab === 'articles' ? styles.active : ''}
          onClick={() => setActiveTab('articles')}
        >
          Articles
        </button>
        <button
          className={activeTab === 'clients' ? styles.active : ''}
          onClick={() => setActiveTab('clients')}
        >
          Clients
        </button>
        <button
          className={activeTab === 'suppliers' ? styles.active : ''}
          onClick={() => setActiveTab('suppliers')}
        >
          Fournisseurs
        </button>
        <button
          className={activeTab === 'sales' ? styles.active : ''}
          onClick={() => setActiveTab('sales')}
        >
          Ventes
        </button>
        <button
          className={activeTab === 'purchases' ? styles.active : ''}
          onClick={() => setActiveTab('purchases')}
        >
          Achats
        </button>
        <button
          className={activeTab === 'financial' ? styles.active : ''}
          onClick={() => setActiveTab('financial')}
        >
          Finances
        </button>
        <button
          className={activeTab === 'stock' ? styles.active : ''}
          onClick={() => setActiveTab('stock')}
        >
          Stock
        </button>
      </nav>
    </header>
  );
}
