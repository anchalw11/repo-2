import React from 'react';

const themes = [
  { id: 'concept1', name: 'Default' },
  { id: 'concept2', name: 'Quantum Glass' },
  { id: 'concept3', name: 'Cyberpunk Neon' },
  { id: 'concept4', name: 'Organic Flow' },
];

const ThemeSwitcher = ({ onThemeChange }: { onThemeChange: (theme: string) => void }) => {
  return (
    <div className="fixed top-4 right-4 z-50">
      <select
        onChange={(e) => onThemeChange(e.target.value)}
        className="bg-gray-800 text-white p-2 rounded"
        defaultValue={localStorage.getItem('dashboard-theme') || 'concept1'}
      >
        {themes.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ThemeSwitcher;
