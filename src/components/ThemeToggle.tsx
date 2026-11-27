import { Moon, Sun } from 'lucide-react';
import '../extras.css';
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const [theme, toggle] = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className="nova-icon-btn"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
      title={dark ? 'Mode Terang' : 'Mode Gelap'}
    >
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
