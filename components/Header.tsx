import React from 'react';

const Header: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-white tracking-tight">{title}</h2>
      {subtitle && <p className="text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
};

export default Header;