import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (token) {
                try {
                    const response = await api.get('/auth/me');
                    setUser(response.data.data);
                } catch (error) {
                    console.error("Lỗi khi lấy thông tin người dùng", error);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    sessionStorage.removeItem('access_token');
                    sessionStorage.removeItem('refresh_token');
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const login = async (email, password, rememberMe = false) => {
        try {
            const response = await api.post('/auth/signin', { email, password });
            const { accessToken, refreshToken, user: userData } = response.data.data;
            
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('access_token', accessToken);
            storage.setItem('refresh_token', refreshToken);
            
            setUser(userData);
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || 'Đăng nhập thất bại' 
            };
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/signout');
        } catch (err) {
            console.error("Lỗi khi đăng xuất:", err);
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        setUser(null);
    };

    const register = async (userData) => {
        try {
            const response = await api.post('/auth/signup', userData);
            return { 
                success: true, 
                message: response.data.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực.',
                data: response.data.data,
            };
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || 'Đăng ký thất bại' 
            };
        }
    };

    const forgotPassword = async (email) => {
        try {
            const response = await api.post('/auth/forgot-password', { email });
            return { success: true, message: response.data.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Có lỗi xảy ra' };
        }
    };

    const verifyForgotPassword = async (token) => {
        try {
            const response = await api.post('/auth/verify-forgot-password', { token });
            return { success: true, message: response.data.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Mã xác thực không hợp lệ' };
        }
    };

    const resetPassword = async (token, newPassword) => {
        try {
            const response = await api.post('/auth/reset-password', { token, newPassword });
            return { success: true, message: response.data.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu' };
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, forgotPassword, verifyForgotPassword, resetPassword, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
