import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type Theme = 'light' | 'dark';

// Tema disimpan lewat useLocalStorage, lalu dipasang ke <html data-theme="...">
// supaya CSS (src/extras.css) bisa menimpa warna tanpa menyentuh index.css.
export function useTheme(): [Theme, () => void] {
  const [stored, setStored] = useLocalStorage<Theme>('amm:theme', 'light');
  const theme: Theme = stored === 'dark' ? 'dark' : 'light'; // nilai rusak di storage -> light

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = () => setStored(theme === 'dark' ? 'light' : 'dark');
  return [theme, toggle];
}
