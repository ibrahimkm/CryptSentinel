import React from 'react';

export function PageContainer({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  children,
  maxWidth = '1600px'
}) {
  return (
    <div className="page-scroll-container">
      <div style={{ maxWidth, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Breadcrumb and Top Page Title Bar */}
        {(title || breadcrumbs.length > 0) && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            paddingBottom: '4px'
          }}>
            <div>
              {breadcrumbs.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginBottom: '4px'
                }}>
                  {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={idx}>
                      <span>{crumb}</span>
                      {idx < breadcrumbs.length - 1 && <span>/</span>}
                    </React.Fragment>
                  ))}
                </div>
              )}
              {title && (
                <h2 style={{
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: 'var(--text-bright)',
                  fontFamily: 'var(--font-sans)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  {title}
                </h2>
              )}
              {subtitle && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {subtitle}
                </p>
              )}
            </div>

            {actions && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {actions}
              </div>
            )}
          </div>
        )}

        {/* Page Main Content */}
        {children}
      </div>
    </div>
  );
}
