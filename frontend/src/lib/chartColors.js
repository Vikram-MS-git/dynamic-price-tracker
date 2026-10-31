import { useTheme } from '../context/ThemeContext';

export function useChartColors() {
  const { theme } = useTheme();
  return theme === 'dark'
    ? { accent: '#818CF8', grid: '#222B49', axis: '#7F8BA8', amazon: '#FBBF24', flipkart: '#60A5FA', good: '#34D399', bad: '#F87171' }
    : { accent: '#4F46E5', grid: '#E6E8EC', axis: '#8390A6', amazon: '#F59E0B', flipkart: '#2563EB', good: '#0E9F6E', bad: '#DC2626' };
}
