'use client';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingSpinner({ 
  message = 'Chargement...', 
  size = 'medium' 
}: LoadingSpinnerProps) {
  const sizes = {
    small: '24px',
    medium: '40px',
    large: '60px'
  };

  const spinnerSize = sizes[size];

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '40px',
      color: 'var(--text-primary)'
    }}>
      <div style={{
        width: spinnerSize,
        height: spinnerSize,
        border: '4px solid var(--border-color)',
        borderTop: '4px solid var(--primary-color)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px'
      }}></div>
      <p style={{ 
        color: 'var(--text-secondary)',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        {message}
      </p>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
