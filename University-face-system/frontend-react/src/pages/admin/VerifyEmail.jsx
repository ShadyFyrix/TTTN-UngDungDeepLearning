import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    
    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [message, setMessage] = useState('Đang xác thực tài khoản của bạn...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Không tìm thấy mã xác thực (token).');
            return;
        }

        const verify = async () => {
            try {
                const response = await api.post('/auth/verify-email', { token });
                setStatus('success');
                setMessage(response.data.message || 'Xác thực tài khoản thành công!');
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Xác thực thất bại. Mã có thể đã hết hạn hoặc không hợp lệ.');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary-200/50 blur-[100px]"></div>
            
            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10 text-center">
                    
                    {status === 'loading' && (
                        <div className="flex flex-col items-center">
                            <Loader2 className="w-16 h-16 text-primary-500 animate-spin mb-4" />
                            <h2 className="text-xl font-bold text-gray-900">Đang xử lý...</h2>
                            <p className="text-gray-500 mt-2">{message}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center">
                            <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
                            <h2 className="text-xl font-bold text-gray-900">Thành công!</h2>
                            <p className="text-gray-500 mt-2">{message}</p>
                            <Link 
                                to="/admin/login" 
                                className="mt-8 w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-all"
                            >
                                Đi đến trang Đăng nhập
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center">
                            <XCircle className="w-16 h-16 text-red-500 mb-4" />
                            <h2 className="text-xl font-bold text-gray-900">Lỗi xác thực</h2>
                            <p className="text-gray-500 mt-2">{message}</p>
                            <Link 
                                to="/admin/login" 
                                className="mt-8 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-all"
                            >
                                Quay lại Đăng nhập
                            </Link>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
