/** Colours for chart libraries (they need real strings, not CSS variables). Light theme only. */
export const colors = {
  accent: '#1d3f6e',
  hit: '#b3261e',
  bar: '#8fa2b7',
  muted: '#5b6472',
  line: '#e3e6ea',
  ink: '#14181f',
  surface: '#ffffff',
  good: '#1f6b45',
};

export function useThemeColors() {
  return colors;
}
