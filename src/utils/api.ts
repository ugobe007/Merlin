// Centralized API URL helper for frontend

// @ts-ignore
const API_BASE = (import.meta as any).env.VITE_API_URL || '';

export function apiUrl(path: string) {
  // If path starts with http(s), return as is
  if (/^https?:\/\//.test(path)) return path;
  // Otherwise, prepend API_BASE
  return `${API_BASE}${path}`;
}
