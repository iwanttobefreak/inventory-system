import axios from 'axios';

// Determinar la URL de la API basándose en las variables de entorno
let API_URL: string;

// Prioridad 1: NEXT_PUBLIC_API_URL definida explícitamente (producción/nginx)
if (process.env.NEXT_PUBLIC_API_URL) {
  API_URL = process.env.NEXT_PUBLIC_API_URL;
  console.log('🔧 API URL (from NEXT_PUBLIC_API_URL):', API_URL);
} 
// Prioridad 2: Cliente (navegador) - construir con puerto configurado o default
else if (typeof window !== 'undefined') {
  const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || '4000';
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https' : 'http';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  API_URL = `${protocol}://${hostname}:${backendPort}/api`;
  console.log('🔧 API URL (cliente construida):', API_URL);
} 
// Prioridad 3: Servidor (SSR) - usar nombre del servicio Docker
else {
  const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || '4000';
  API_URL = `http://backend:${backendPort}/api`;
  console.log('🔧 API URL (SSR Docker):', API_URL);
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const storage = localStorage.getItem('auth-storage');
    if (storage) {
      const { state } = JSON.parse(storage);
      if (state.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    }
  }
  return config;
});

// Auth
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
};

// Items
export const itemsAPI = {
  getAll: (params?: any) => api.get('/items', { params }),
  getByCode: (code: string, isPublic?: boolean) => {
    if (isPublic) {
      return axios.get(`${API_URL}/items/${code}`);
    }
    return api.get(`/items/${code}`);
  },
  getNextCode: () => api.get('/items/next-code'),
  create: (data: any) => api.post('/items', data),
  update: (code: string, data: any) => api.put(`/items/${code}`, data),
  delete: (code: string) => api.delete(`/items/${code}`),
  getQR: (code: string) => api.get(`/items/${code}/qr`),
};

// Categories
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Category Attributes
export const categoryAttributesAPI = {
  getAll: (categoryId: string) => api.get(`/categories/${categoryId}/attributes`),
  create: (categoryId: string, data: any) => api.post(`/categories/${categoryId}/attributes`, data),
  update: (categoryId: string, id: string, data: any) => api.put(`/categories/${categoryId}/attributes/${id}`, data),
  delete: (categoryId: string, id: string) => api.delete(`/categories/${categoryId}/attributes/${id}`),
};

// Users
export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  updatePassword: (id: string, newPassword: string) => api.put(`/users/${id}/password`, { newPassword }),
  updateMyPassword: (currentPassword: string, newPassword: string) => 
    api.put('/users/me/password', { currentPassword, newPassword }),
};
