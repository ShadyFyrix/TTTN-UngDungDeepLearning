import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor để thêm token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor để xử lý refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Nếu lỗi 401 và chưa thử refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Bỏ qua interceptor cho các endpoint liên quan đến auth (login, face-login,...)
            if (originalRequest.url?.includes('/auth/')) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }
                
                // Gọi API refresh token
                const response = await axios.post('http://localhost:5000/api/auth/refresh-token', {
                    refreshToken: refreshToken
                });
                
                const { accessToken: new_access_token, refreshToken: new_refresh_token } = response.data.data;
                
                // Cập nhật token mới vào storage mà user đã chọn
                if (localStorage.getItem('refresh_token')) {
                    localStorage.setItem('access_token', new_access_token);
                    localStorage.setItem('refresh_token', new_refresh_token);
                } else {
                    sessionStorage.setItem('access_token', new_access_token);
                    sessionStorage.setItem('refresh_token', new_refresh_token);
                }
                
                // Cập nhật header và gọi lại request cũ
                originalRequest.headers.Authorization = `Bearer ${new_access_token}`;
                return api(originalRequest);
                
            } catch (refreshError) {
                // Nếu refresh thất bại, xóa token ở cả 2 nơi và buộc đăng nhập lại
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                sessionStorage.removeItem('access_token');
                sessionStorage.removeItem('refresh_token');
                window.location.href = '/admin/login';
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;
