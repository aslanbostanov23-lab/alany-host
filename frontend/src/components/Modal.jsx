import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  // Блокируем скролл страницы при открытом модальном окне
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div 
        style={styles.modal} 
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <h3 style={styles.title}>{title}</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={20} color="var(--text-secondary)" />
          </button>
        </div>
        <div style={styles.body}>
          {children}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 5, 5, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.25s ease-out',
  },
  modal: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    width: '90%',
    maxWidth: '550px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  header: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.25rem',
    borderRadius: '8px',
    transition: 'var(--transition-smooth)',
  },
  body: {
    padding: '1.5rem',
    color: 'var(--text-primary)',
    overflowY: 'auto',
    maxHeight: '75vh',
  },
};
