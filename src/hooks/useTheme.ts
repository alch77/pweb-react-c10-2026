import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type Theme = 'light' | 'dark';

// Tema disimpan lewat useLocalStorage, lalu dipasang ke <html data-theme="...">
// Default NOVA Mission Control adalah 'dark', dan pengguna dapat beralih ke 'light'.
export function useTheme(): [Theme, () => void] {
  const [stored, setStored] = useLocalStorage<Theme>('amm:theme', 'dark');
  const theme: Theme = stored === 'light' ? 'light' : 'dark';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = () => setStored(theme === 'dark' ? 'light' : 'dark');
  return [theme, toggle];
}
