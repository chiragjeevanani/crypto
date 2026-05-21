import { useUserStore } from '../modules/user/store/useUserStore';
import { createContext } from 'react';

export const ThemeContext = createContext({ isDarkMode: false });

export const ThemeProvider = ({ children }) => {
  const darkMode = useUserStore(s => s.darkMode);
  return <ThemeContext.Provider value={{ isDarkMode: darkMode }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const darkMode = useUserStore(s => s.darkMode);
  return { isDarkMode: darkMode };
};
