'use client';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ 
  icon = '📭', 
  title, 
  message, 
  actionLabel, 
  onAction 
}: EmptyStateProps) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 20px',
      background: 'var(--card-background)',
      borderRadius: '12px',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{ 
        fontSize: '64px', 
        marginBottom: '16px',
        opacity: 0.5
      }}>
        {icon}
      </div>
      <h3 style={{ 
        margin: '0 0 8px 0',
        fontSize: '18px',
        fontWeight: '600',
        color: 'var(--text-primary)'
      }}>
        {title}
      </h3>
      <p style={{ 
        margin: '0 0 24px 0',
        fontSize: '14px',
        color: 'var(--text-secondary)',
        maxWidth: '400px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary-color-hover)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary-color)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
