import React from 'react';

export default function StatCard({ title, value, icon: Icon, description, iconColor = 'var(--accent-primary)' }) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.textContainer}>
          <span style={styles.title}>{title}</span>
          <h3 style={styles.value}>{value}</h3>
        </div>
        <div style={{ ...styles.iconWrapper, backgroundColor: `${iconColor}15`, border: `1px solid ${iconColor}30` }}>
          <Icon size={22} color={iconColor} />
        </div>
      </div>
      {description && (
        <div style={styles.footer}>
          <span style={styles.description}>{description}</span>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    transition: 'var(--transition-smooth)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  title: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  value: {
    fontSize: '1.6rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  iconWrapper: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    borderTop: '1px solid var(--border-color)',
    paddingTop: '0.5rem',
  },
  description: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
};
