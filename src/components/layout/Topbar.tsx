import React from 'react';

interface TopbarProps {
  title: string;
}

export const Topbar: React.FC<TopbarProps> = ({ title }) => {
  return (
    <header className="fixed left-0 right-0 top-0 z-30 h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:left-64 lg:h-20">
      <div className="flex h-full items-center justify-between px-4 lg:px-8">
        <div>
          <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">{title}</h1>
        </div>
      </div>
    </header>
  );
};
