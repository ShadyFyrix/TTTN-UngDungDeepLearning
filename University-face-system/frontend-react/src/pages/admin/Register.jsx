import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Lock, Mail, User as UserIcon, CheckCircle, FileText, Users, ArrowRight, RefreshCw, AlertTriangle, Inbox, Eye, EyeOff } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({ email: '', password: '', full_name: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState('');
    
    const { register, user } = useAuth();
    const navigate = useNavigate();

    // If already logged in, go to admin
    if (user && user.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        const result = await register(formData);
        
        if (result.success) {
            setSuccessMessage(result.message);
            setRegisteredEmail(formData.email);
            setEmailSent(result.data?.emailSent ?? true);
            setIsRegistered(true);
        } else {
            setError(result.message);
        }
        
        setIsLoading(false);
    };

    const handleResendEmail = async () => {
        setIsResending(true);
        setResendMessage('');
        try {
            const response = await api.post('/auth/resend-verification-email', { email: registeredEmail });
            setResendMessage(response.data.message || 'Đã gửi lại email xác thực!');
            setEmailSent(true);
        } catch (error) {
            setResendMessage(error.response?.data?.message || 'Gửi lại email thất bại. Vui lòng thử lại sau.');
        }
        setIsResending(false);
    };

    // Show success screen after registration
    if (isRegistered) {
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

                {/* Right Column - Success / Verification Info */}
                <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#f8fafc] p-6 relative">
                    <div className="w-full max-w-[420px]">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-[#1e293b] mb-2 tracking-tight">Đăng ký thành công!</h2>
                            <p className="text-slate-500 font-medium text-sm">Tài khoản đã được tạo cho <strong className="text-slate-700">{registeredEmail}</strong></p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            {emailSent ? (
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                                        <Inbox className="text-emerald-500" size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">Kiểm tra hộp thư email</h3>
                                    <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                                        Chúng tôi đã gửi một email xác thực đến <strong className="text-slate-700">{registeredEmail}</strong>. 
                                        Vui lòng click vào link trong email để kích hoạt tài khoản.
                                    </p>
                                    <div className="w-full p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-xs font-medium mb-4">
                                        💡 Nếu không thấy email, hãy kiểm tra thư mục <strong>Spam/Junk</strong>
                                    </div>

                                    {resendMessage && (
                                        <div className="w-full mb-4 p-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl text-sm font-medium">
                                            {resendMessage}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleResendEmail}
                                        disabled={isResending}
                                        className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors text-sm disabled:opacity-50"
                                    >
                                        <RefreshCw className={isResending ? 'animate-spin' : ''} size={16} />
                                        {isResending ? 'Đang gửi lại...' : 'Gửi lại email xác thực'}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
                                        <AlertTriangle className="text-amber-500" size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">Không thể gửi email xác thực</h3>
                                    <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                                        Tài khoản đã được tạo thành công, nhưng hệ thống không thể gửi email xác thực. 
                                        Vui lòng nhấn nút bên dưới để thử gửi lại.
                                    </p>

                                    {resendMessage && (
                                        <div className="w-full mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-sm font-medium">
                                            ✅ {resendMessage}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleResendEmail}
                                        disabled={isResending}
                                        className="w-full flex items-center justify-center gap-2 bg-[#175b9f] hover:bg-[#124a82] text-white font-semibold py-3.5 rounded-xl shadow-md shadow-blue-900/20 transition-all disabled:opacity-50"
                                    >
                                        <RefreshCw className={isResending ? 'animate-spin' : ''} size={16} />
                                        {isResending ? 'Đang gửi...' : 'Gửi email xác thực'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex items-center gap-4 before:flex-1 before:h-px before:bg-slate-200 after:flex-1 after:h-px after:bg-slate-200">
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">hoặc</span>
                        </div>

                        <div className="mt-8 flex flex-col gap-4">
                            <Link to="/admin/login" className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition-colors shadow-sm text-sm">
                                <span className="text-[#175b9f]">Đăng nhập</span> quay lại hệ thống
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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

            {/* Right Column - Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#f8fafc] p-6 relative">
                <div className="w-full max-w-[420px]">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-[#1e293b] mb-2 tracking-tight">Tạo tài khoản</h2>
                        <p className="text-slate-500 font-medium text-sm">Đăng ký để trở thành người quản trị hệ thống.</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50/80 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-start gap-2">
                                <span className="mt-0.5 text-lg">⚠️</span>
                                {error}
                            </div>
                        )}
                        
                        {successMessage && (
                            <div className="mb-6 p-4 bg-emerald-50/80 border border-emerald-100 text-emerald-600 rounded-xl text-sm font-medium flex items-start gap-2">
                                <span className="mt-0.5 text-lg">✅</span>
                                {successMessage}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Họ và tên</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                                        placeholder="Nguyễn Văn A"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Email Cán bộ / Giảng viên</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                                        placeholder="gv.nguyenvana@university.edu.vn"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Mật khẩu</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                                        placeholder="Nhập mật khẩu an toàn"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
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
                                        → Đăng ký ngay
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="mt-8 flex items-center gap-4 before:flex-1 before:h-px before:bg-slate-200 after:flex-1 after:h-px after:bg-slate-200">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">đã có tài khoản?</span>
                    </div>

                    <div className="mt-8 flex flex-col gap-4">
                        <Link to="/admin/login" className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition-colors shadow-sm text-sm">
                            <span className="text-[#175b9f]">Đăng nhập</span> quay lại hệ thống
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Register;
