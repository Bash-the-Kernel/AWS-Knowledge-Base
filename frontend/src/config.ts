export const config = {
  userPoolId: import.meta.env.VITE_USER_POOL_ID || '',
  userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
  region: import.meta.env.VITE_REGION || 'us-east-1',
  apiUrl: import.meta.env.VITE_API_URL || '',
};