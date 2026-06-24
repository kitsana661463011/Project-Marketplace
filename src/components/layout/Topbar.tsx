import React from 'react';

interface TopbarProps {
  title: string;
}

export const Topbar: React.FC<TopbarProps> = ({ title }) => {
  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 lg:h-20 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 z-30">
      <div className="flex h-full items-center justify-between px-4 lg:px-8">
        <div>
          <p className="text-sm font-medium text-slate-500">Marketplace Admin</p>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        </div>
      </div>
    </header>
  );
};
