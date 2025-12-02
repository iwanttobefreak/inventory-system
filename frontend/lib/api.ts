import axios from 'axios';

// Determinar la URL de la API
let API_URL = 'http://localhost:4000/api'; // Default para desarrollo

if (typeof window !== 'undefined') {
  // Código del cliente (navegador)
  // Intentar obtener el puerto del backend desde las variables de entorno o usar el default
  const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || '4000';
  API_URL = `http://localhost:${backendPort}/api`;
  console.log('🔧 API URL (cliente):', API_URL);
} else {
  // Código del servidor (SSR) - usar el nombre del servicio Docker
  const backendPort = process.env.BACKEND_PORT || '4000';
  API_URL = `http://backend:${backendPort}/api`;
  console.log('🔧 API URL (servidor):', API_URL);
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
