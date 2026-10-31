import { useTheme } from '../context/ThemeContext';
import Icon from './Icon';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const next = theme === 'light' ? 'dark' : 'light';
  return (
    <button type="button" className="icon-btn" onClick={toggleTheme} title={`Switch to ${next} theme`} aria-label={`Switch to ${next} theme`}>
      <Icon name={theme === 'light' ? 'moon' : 'sun'} />
    </button>
  );
}
