import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const labels: Record<string, string> = {
  dashboard: 'Dashboard',
  stores: 'Store Management',
  sellers: 'Seller Management',
  verifications: 'Verification Requests',
  payments: 'Payment Management',
  'market-map': 'Market Map',
  reports: 'Reports',
  announcements: 'Announcements',
  users: 'User Management',
  settings: 'Settings',
  profile: 'Profile',
  notifications: 'Notification Center',
};

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    const label = labels[segment] ?? segment.replace(/-/g, ' ');

    return {
      href,
      label: label.charAt(0).toUpperCase() + label.slice(1),
    };
  });

  if (crumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-600">
      <Link to="/dashboard" className="font-medium text-blue-600 transition hover:text-blue-700">
        Dashboard
      </Link>
      {crumbs.map((crumb, index) => (
        <React.Fragment key={crumb.href}>
          <span>/</span>
          {index === crumbs.length - 1 ? (
            <span className="font-semibold text-slate-900">{crumb.label}</span>
          ) : (
            <Link to={crumb.href} className="transition hover:text-slate-900">
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
