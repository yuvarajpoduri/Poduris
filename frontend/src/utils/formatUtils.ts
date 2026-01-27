/**
 * Formats a name by removing the leading "Poduri" (case-insensitive) if present.
 * @param name The name to format
 * @returns The name without the leading "Poduri"
 */
export const formatPoduriName = (name: string): string => {
  if (!name) return '';
  const prefix = 'poduri';
  if (name.toLowerCase().startsWith(prefix)) {
    const remaining = name.substring(prefix.length).trim();
    return remaining || name; // Return remaining if not empty, otherwise original name
  }
  return name;
};
