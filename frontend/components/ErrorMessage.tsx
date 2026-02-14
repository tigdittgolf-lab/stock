'use client';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div style={{
      background: 'var(--error-color-light)',
      color: 'var(--text-primary)',
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '20px',
      textAlign: 'center',
      border: '1px solid var(--error-color)'
    }}>
      <div style={{ 
        fontSize: '32px', 
        marginBottom: '12px' 
      }}>
        ❌
      </div>
      <p style={{ 
        margin: '0 0 16px 0',
        fontSize: '15px',
        fontWeight: '500',
        color: 'var(--text-primary)'
      }}>
        {message}
      </p>
      {onRetry && (
        <button 
          onClick={onRetry}
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--error-color)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          🔄 Réessayer
        </button>
      )}
    </div>
  );
}
