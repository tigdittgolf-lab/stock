'use client';

import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function ConditionalThemeToggle() {
  const pathname = usePathname();
  
  // Ne pas afficher le ThemeToggle sur le dashboard car il est dans la sidebar
  if (pathname === '/dashboard') {
    return null;
  }
  
  // Afficher le ThemeToggle en position fixe pour toutes les autres pages
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999
    }}>
      <ThemeToggle />
    </div>
  );
}
