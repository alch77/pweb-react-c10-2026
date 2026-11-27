import '../extras.css';
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const [theme, toggle] = useTheme();
  const dark = theme === 'dark';
  return (
    <button type="button" className="btn" onClick={toggle} aria-pressed={dark} title="Ganti tema terang/gelap">
      {dark ? '☀ Terang' : '🌙 Gelap'}
    </button>
  );
}
