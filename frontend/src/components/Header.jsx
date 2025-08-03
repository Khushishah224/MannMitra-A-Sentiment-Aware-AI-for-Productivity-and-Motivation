import React from 'react';

const Header = ({ title, subtitle }) => {
  return (
    <header className="text-center mb-6">
      <h1 className="text-3xl font-bold text-pink-600 flex items-center justify-center">
        <span className="mr-2">🌸</span> {title || 'MannMitra'}
      </h1>
      {subtitle && <p className="text-gray-600 mt-1 italic">{subtitle}</p>}
    </header>
  );
};

export default Header;
