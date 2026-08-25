import axios from 'axios';

// All API requests now pass through the Next.js API route proxy
// which automatically attaches the secure HttpOnly cookie.
export const api = axios.create({
  baseURL: '/api/proxy',
});
