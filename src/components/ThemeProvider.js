'use client';

import React, { useEffect, useState } from 'react';

// In a real app, this would be fetched from the database based on the tenant (institution)
const DEFAULT_THEME = {
  primaryColor: '#1a365d',
  primaryLight: '#2b6cb0',
  accentColor: '#4d7c0f', // Olive-ish green as seen in the user's mockups
  schoolName: 'מכינה קד"צ טכנולוגית אמי"ת',
  slogan: 'באמונה הם עושים'
};

// We export the context so components can access the school name/slogan directly
export const ThemeContext = React.createContext(DEFAULT_THEME);

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(DEFAULT_THEME);

  return (
    <ThemeContext.Provider value={theme}>
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --primary-color: ${theme.primaryColor};
            --primary-light: ${theme.primaryLight};
            --accent-color: ${theme.accentColor};
          }
        `
      }} />
      {children}
    </ThemeContext.Provider>
  );
}
