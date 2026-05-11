export function generateTracking(prefix = "SLS") {
  const token = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${prefix}-${token}`;
}

