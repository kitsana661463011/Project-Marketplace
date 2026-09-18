export const formatImageUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }
  // If it's a static public file like /logo.png, /splash_logo.png, /vite.svg
  if (path.startsWith('/') && !path.startsWith('/storage/') && !path.startsWith('/api/')) {
    return path;
  }
  const cleanPath = path
    .replace(/^\/storage\//, '')
    .replace(/^storage\//, '')
    .replace(/^\/api\/images\//, '')
    .replace(/^api\/images\//, '');
  return `/api/images/${cleanPath}`;
};

