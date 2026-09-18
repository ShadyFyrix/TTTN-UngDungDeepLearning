import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, ArrowLeft, Shield, Key, CheckCircle, FileText, Users } from 'lucide-react';

const ForgotPassword = () => {
    // Step: 'email' -> 'otp' -> 'reset' -> 'success'
    const [step, setStep] = useState('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [otpToken, setOtpToken] = useState('');
    const [countdown, setCountdown] = useState(0);

    const { forgotPassword, verifyForgotPassword, resetPassword } = useAuth();
    const navigate = useNavigate();
    const otpRefs = useRef([]);

    // Countdown timer for resend OTP
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    // ========== STEP 1: Send OTP to email ==========
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await forgotPassword(email);

        if (result.success) {
            setStep('otp');
            setCountdown(60);
        } else {
            setError(result.message);
        }

        setIsLoading(false);
    };

    // ========== Resend OTP ==========
    const handleResendOTP = async () => {
        if (countdown > 0) return;
        setError('');
        setIsLoading(true);
        setOtp(['', '', '', '', '', '']);

        const result = await forgotPassword(email);

        if (result.success) {
            setCountdown(60);
        } else {
            setError(result.message);
        }

        setIsLoading(false);
    };

    // ========== OTP Input Handling ==========
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // Only accept digits

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // Only take last digit
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasteData.length > 0) {
            const newOtp = [...otp];
            for (let i = 0; i < pasteData.length && i < 6; i++) {
                newOtp[i] = pasteData[i];
            }
            setOtp(newOtp);
            // Focus the next empty input or last input
            const nextIndex = Math.min(pasteData.length, 5);
            otpRefs.current[nextIndex]?.focus();
        }
    };

    // ========== STEP 2: Verify OTP ==========
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');

        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setError('Vui lòng nhập đủ 6 chữ số');
            return;
        }

        setIsLoading(true);

        const result = await verifyForgotPassword(otpCode);

        if (result.success) {
            setOtpToken(otpCode);
            setStep('reset');
        } else {
            setError(result.message);
        }

        setIsLoading(false);
    };

    // ========== STEP 3: Reset Password ==========
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setIsLoading(true);

        const result = await resetPassword(otpToken, newPassword);

        if (result.success) {
            setStep('success');
        } else {
            setError(result.message);
        }

        setIsLoading(false);
    };

    // ========== Step Indicator ==========
    const renderStepIndicator = () => {
        const steps = [
            { key: 'email', label: 'Nhập email', icon: Mail },
            { key: 'otp', label: 'Xác minh', icon: Shield },
            { key: 'reset', label: 'Đặt lại', icon: Key },
        ];

        const currentIndex = steps.findIndex(s => s.key === step);

        return (
            <div className="flex items-center justify-center gap-2 mb-8">
                {steps.map((s, i) => {
                    const Icon = s.icon;
                    const isActive = i <= currentIndex && step !== 'success';
                    const isDone = i < currentIndex || step === 'success';

                    return (
                        <React.Fragment key={s.key}>
                            <div className="flex flex-col items-center gap-1">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                                    isDone
                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                                        : isActive
                                            ? 'bg-[#175b9f] text-white shadow-md shadow-blue-200'
                                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                                }`}>
                                    {isDone ? <CheckCircle size={16} /> : <Icon size={16} />}
                                </div>
                                <span className={`text-[10px] font-semibold ${isActive || isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                                    {s.label}
                                </span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`w-10 h-0.5 rounded-full mb-4 transition-all duration-300 ${
                                    i < currentIndex || step === 'success' ? 'bg-emerald-400' : 'bg-slate-200'
                                }`}></div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    // ========== Render Step Content ==========
    const renderStepContent = () => {
        switch (step) {
            case 'email':
                return (
                    <>
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Mail className="text-[#175b9f]" size={28} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">Quên mật khẩu?</h3>
                            <p className="text-slate-500 text-sm">Nhập email đã đăng ký để nhận mã xác minh.</p>
                        </div>

                        <form onSubmit={handleSendOTP} className="space-y-5">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                                        placeholder="admin@example.com"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#175b9f] hover:bg-[#124a82] text-white font-semibold py-3.5 rounded-xl shadow-md shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>→ Gửi mã xác minh</>
                                )}
                            </button>
                        </form>
                    </>
                );

            case 'otp':
                return (
                    <>
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Shield className="text-amber-500" size={28} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">Nhập mã xác minh</h3>
                            <p className="text-slate-500 text-sm">
                                Mã 6 chữ số đã được gửi đến{' '}
                                <strong className="text-slate-700">{email}</strong>
                            </p>
                        </div>

                        <form onSubmit={handleVerifyOTP} className="space-y-5">
                            {/* OTP Input Boxes */}
                            <div className="flex justify-center gap-2.5">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={el => otpRefs.current[index] = el}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        onPaste={index === 0 ? handleOtpPaste : undefined}
                                        className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                                            digit
                                                ? 'border-[#175b9f] bg-blue-50/50 text-[#175b9f]'
                                                : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-[#175b9f] focus:bg-white'
                                        }`}
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>

                            {/* Countdown / Resend */}
                            <div className="text-center">
                                {countdown > 0 ? (
                                    <p className="text-slate-500 text-sm">
                                        Gửi lại sau <span className="font-bold text-[#175b9f]">{countdown}s</span>
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResendOTP}
                                        disabled={isLoading}
                                        className="text-[#175b9f] hover:text-[#124a82] text-sm font-semibold hover:underline transition-colors disabled:opacity-50"
                                    >
                                        Gửi lại mã xác minh
                                    </button>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || otp.join('').length !== 6}
                                className="w-full bg-[#175b9f] hover:bg-[#124a82] text-white font-semibold py-3.5 rounded-xl shadow-md shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>→ Xác minh mã</>
                                )}
                            </button>
                        </form>
                    </>
                );

            case 'reset':
                return (
                    <>
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Key className="text-emerald-500" size={28} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">Đặt lại mật khẩu</h3>
                            <p className="text-slate-500 text-sm">Nhập mật khẩu mới cho tài khoản của bạn.</p>
                        </div>

                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Mật khẩu mới</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                                        placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Xác nhận mật khẩu</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                                        placeholder="Nhập lại mật khẩu"
                                    />
                                </div>
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p className="text-red-500 text-xs font-medium mt-1">⚠️ Mật khẩu không khớp</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !newPassword || !confirmPassword}
                                className="w-full bg-[#175b9f] hover:bg-[#124a82] text-white font-semibold py-3.5 rounded-xl shadow-md shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>→ Đặt lại mật khẩu</>
                                )}
                            </button>
                        </form>
                    </>
                );

            case 'success':
                return (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="text-emerald-500" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Đặt lại mật khẩu thành công!</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.
                        </p>
                        <Link
                            to="/admin/login"
                            className="w-full inline-flex items-center justify-center gap-2 bg-[#175b9f] hover:bg-[#124a82] text-white font-semibold py-3.5 rounded-xl shadow-md shadow-blue-900/20 transition-all"
                        >
                            → Đăng nhập ngay
                        </Link>
                    </div>
                );

            default:
                return null;
        }
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
                
                {/* Overlay */}
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

            {/* Right Column - Forgot Password Flow */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#f8fafc] p-6 relative">
                <div className="w-full max-w-[420px]">
                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold text-[#1e293b] mb-2 tracking-tight">Khôi phục mật khẩu</h2>
                        <p className="text-slate-500 font-medium text-sm">Làm theo các bước để đặt lại mật khẩu tài khoản.</p>
                    </div>

                    {/* Step Indicator */}
                    {renderStepIndicator()}

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50/80 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-start gap-2">
                                <span className="mt-0.5 text-lg">⚠️</span>
                                {error}
                            </div>
                        )}

                        {renderStepContent()}
                    </div>

                    {/* Back to Login */}
                    <div className="mt-8 text-center">
                        <Link
                            to="/admin/login"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#175b9f] transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Quay lại Đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
