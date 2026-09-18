import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, User as UserIcon, CheckCircle, FileText, Users } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    
    const { login, user } = useAuth();
    const navigate = useNavigate();

    if (user && user.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(email, password, rememberMe);
        
        if (result.success) {
            navigate('/admin');
        } else {
            setError(result.message);
        }
        
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex w-full bg-white font-sans">
            {/* Left Column - Image & Stats (Hidden on small screens) */}
            <div className="hidden lg:flex w-1/2 relative bg-gray-900 overflow-hidden flex-col justify-between">
                {/* Background Image */}
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/bg-university.png')" }}
                ></div>
                
                {/* Overlay overlay */}
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full p-12">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-xl text-white font-bold">F</span>
                        </div>
                        <div>
                            <div className="text-white/80 text-xs font-semibold tracking-wider uppercase">Hệ thống</div>
                            <div className="text-white font-bold text-lg leading-tight">Face Attendance</div>
                        </div>
                    </div>

                    {/* Main Text */}
                    <div className="mt-auto mb-16">
                        <h2 className="text-white/90 text-sm font-semibold tracking-widest uppercase mb-4 flex items-center gap-4">
                            Hệ Thống Quản Lý
                            <div className="h-px bg-white/30 flex-1"></div>
                        </h2>
                        <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                            Nhận diện <br/> khuôn mặt
                        </h1>
                        <p className="text-white/80 text-lg max-w-md font-medium leading-relaxed">
                            Ứng dụng Deep Learning phục vụ công tác đào tạo & khảo thí với độ chính xác cao.
                        </p>
                        <div className="mt-6 flex items-center gap-4 text-white/50 text-sm italic">
                            <div className="w-8 h-px bg-white/30"></div>
                            "Nơi thực hiện ước mơ của thầy và trò"
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:bg-white/15 transition-colors">
                            <Users className="text-purple-400 mb-2" size={24} />
                            <div className="text-white font-bold text-xl">12K+</div>
                            <div className="text-white/70 text-xs font-medium">Sinh viên</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:bg-white/15 transition-colors">
                            <FileText className="text-orange-400 mb-2" size={24} />
                            <div className="text-white font-bold text-xl">840</div>
                            <div className="text-white/70 text-xs font-medium">Kỳ thi</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:bg-white/15 transition-colors">
                            <CheckCircle className="text-emerald-400 mb-2" size={24} />
                            <div className="text-white font-bold text-xl">99%</div>
                            <div className="text-white/70 text-xs font-medium">Chính xác</div>
                        </div>
                    </div>
                    
                    <div className="absolute bottom-6 left-12 text-white/40 text-xs">
                        Phòng Đào tạo & Khảo thí - NTU © 2026
                    </div>
                </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#f8fafc] p-6 relative">
                <div className="w-full max-w-[420px]">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-[#1e293b] mb-2 tracking-tight">Đăng nhập</h2>
                        <p className="text-slate-500 font-medium text-sm">Chào mừng bạn đến với hệ thống quản lý đào tạo và khảo thí.</p>
                    </div>

                    {/* Tabs simulate */}
                    <div className="flex p-1 bg-slate-100 rounded-xl mb-8 border border-slate-200">
                        <button className="flex-1 py-2.5 bg-white text-primary-700 font-semibold text-sm rounded-lg shadow-sm flex items-center justify-center gap-2">
                            <UserIcon size={16} /> Tài khoản
                        </button>
                        <button className="flex-1 py-2.5 text-slate-500 hover:text-slate-700 font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2" title="Chức năng đang phát triển">
                            <span className="opacity-50 flex items-center gap-2">😊 Khuôn mặt</span>
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50/80 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-start gap-2">
                                <span className="mt-0.5 text-lg">⚠️</span>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Mã số sinh viên / Cán bộ / Email</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                                        placeholder="VD: admin@system.com hoặc CB001"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="block text-sm font-semibold text-slate-700">Mật khẩu</label>
                                    <Link to="/admin/forgot-password" className="text-sm font-semibold text-primary-600 hover:text-primary-700">Quên mật khẩu?</Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                                        placeholder="Nhập mật khẩu"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input 
                                    type="checkbox" 
                                    id="remember" 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" 
                                />
                                <label htmlFor="remember" className="text-sm font-medium text-slate-600 cursor-pointer">Ghi nhớ đăng nhập</label>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#175b9f] hover:bg-[#124a82] text-white font-semibold py-3.5 rounded-xl shadow-md shadow-blue-900/20 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        → Đăng nhập
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="mt-8 flex items-center gap-4 before:flex-1 before:h-px before:bg-slate-200 after:flex-1 after:h-px after:bg-slate-200">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">hoặc</span>
                    </div>

                    <div className="mt-8 flex flex-col gap-4">
                        <button className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition-colors shadow-sm text-sm">
                            <span className="text-[#175b9f]">📚</span> Đăng nhập qua Cổng thông tin HCMUT
                        </button>
                    </div>

                    <div className="mt-10 text-center text-sm font-medium text-slate-500">
                        Chưa có tài khoản quản trị?{' '}
                        <Link to="/admin/register" className="text-[#175b9f] hover:underline font-semibold">
                            Liên hệ Phòng Đào tạo (Đăng ký)
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
