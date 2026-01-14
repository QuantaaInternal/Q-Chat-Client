import axios, { AxiosInstance } from 'axios';

const isDevMode = process.env.NODE_ENV !== 'production';

export const getApiBaseUrl = () => {
  const devUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const prodUrl = process.env.NEXT_PUBLIC_PRODUCTION_URL;

  return (isDevMode ? devUrl : prodUrl) || devUrl || '';
};

const axiosInstance: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 5000, // 5 seconds
  withCredentials: true,
});

export async function checkServerStatus({
  apiUrl,
}: {
  apiUrl: string;
}): Promise<boolean> {
  try {
    const res = await fetch(apiUrl + '/health', {
      method: 'GET',
      cache: 'no-store',
    });
    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export default axiosInstance;
