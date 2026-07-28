export const formatImageUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path
    .replace(/^\/storage\//, '')
    .replace(/^storage\//, '')
    .replace(/^\/api\/images\//, '')
    .replace(/^api\/images\//, '');
  return `/api/images/${cleanPath}`;
};
