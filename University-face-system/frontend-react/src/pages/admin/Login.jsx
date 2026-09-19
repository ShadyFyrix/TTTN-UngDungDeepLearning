import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, User as UserIcon, CheckCircle, FileText, Users, Eye, EyeOff, Camera, Scan } from 'lucide-react';
import Webcam from 'react-webcam';

const Login = () => {
    // ===== ALL HOOKS MUST BE AT THE TOP - NO EXCEPTIONS =====
    const [loginTab, setLoginTab] = useState('account');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [faceStatus, setFaceStatus] = useState('idle');
    const [faceMessage, setFaceMessage] = useState('Nhấn nút bên dưới để bắt đầu nhận diện');
    const [isScanning, setIsScanning] = useState(false);

    const webcamRef = useRef(null);
    const scanIntervalRef = useRef(null);

    const { login, faceLogin, user } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in (safe - inside useEffect)
    useEffect(() => {
        if (user && user.role === 'admin') {
            navigate('/admin', { replace: true });
        }
    }, [user, navigate]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
            }
        };
    }, []);
    // ===== END OF HOOKS SECTION =====

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

    const stopFaceScan = () => {
        setIsScanning(false);
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
    };

    const startFaceScan = () => {
        setIsScanning(true);
        setFaceStatus('scanning');
        setFaceMessage('Đang quét khuôn mặt...');
        setError('');

        let attempts = 0;
        const maxAttempts = 30;

        scanIntervalRef.current = setInterval(async () => {
            attempts++;
            if (attempts > maxAttempts) {
                stopFaceScan();
                setFaceStatus('error');
                setFaceMessage('Hết thời gian. Vui lòng thử lại.');
                return;
            }

            if (!webcamRef.current) return;
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) return;

            try {
                const result = await faceLogin(imageSrc);
                if (result.success) {
                    stopFaceScan();
                    setFaceStatus('success');
                    setFaceMessage('Xác nhận thành công! Đang chuyển hướng...');
                    // useEffect above will handle the navigation when user state updates
                } else if (result.message) {
                    setFaceMessage(result.message);
                }
            } catch (err) {
                // Keep scanning silently on errors
            }
        }, 1000);
    };

    const handleRetryFace = () => {
        setFaceStatus('idle');
        setFaceMessage('Nhấn nút bên dưới để bắt đầu nhận diện');
        setError('');
    };

    const handleTabSwitch = (tab) => {
        setLoginTab(tab);
        setError('');
        setFaceStatus('idle');
        setFaceMessage('Nhấn nút bên dưới để bắt đầu nhận diện');
        stopFaceScan();
    };

    return (
        <div className="min-h-screen flex w-full bg-white font-sans">
            {/* Left Column */}
            <div className="hidden lg:flex w-1/2 relative bg-gray-900 overflow-hidden flex-col justify-between">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/bg-university.png')" }}
                />
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" />
                <div className="relative z-10 flex flex-col h-full p-12">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-xl text-white font-bold">F</span>
                        </div>
                        <div>
                            <div className="text-white/80 text-xs font-semibold tracking-wider uppercase">Hệ thống</div>
                            <div className="text-white font-bold text-lg leading-tight">Face Attendance</div>
                        </div>
                    </div>

                    <div className="mt-auto mb-16">
                        <h2 className="text-white/90 text-sm font-semibold tracking-widest uppercase mb-4 flex items-center gap-4">
                            Hệ Thống Quản Lý
                            <div className="h-px bg-white/30 flex-1" />
                        </h2>
                        <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                            Nhận diện <br /> khuôn mặt
                        </h1>
                        <p className="text-white/80 text-lg max-w-md font-medium leading-relaxed">
                            Ứng dụng Deep Learning phục vụ công tác đào tạo &amp; khảo thí với độ chính xác cao.
                        </p>
                        <div className="mt-6 flex items-center gap-4 text-white/50 text-sm italic">
                            <div className="w-8 h-px bg-white/30" />
                            &quot;Nơi thực hiện ước mơ của thầy và trò&quot;
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                            <Users className="text-purple-400 mb-2" size={24} />
                            <div className="text-white font-bold text-xl">12K+</div>
                            <div className="text-white/70 text-xs font-medium">Sinh viên</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                            <FileText className="text-orange-400 mb-2" size={24} />
                            <div className="text-white font-bold text-xl">840</div>
                            <div className="text-white/70 text-xs font-medium">Kỳ thi</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                            <CheckCircle className="text-emerald-400 mb-2" size={24} />
                            <div className="text-white font-bold text-xl">99%</div>
                            <div className="text-white/70 text-xs font-medium">Chính xác</div>
                        </div>
                    </div>
                    <div className="absolute bottom-6 left-12 text-white/40 text-xs">
                        Phòng Đào tạo &amp; Khảo thí - NTU © 2026
                    </div>
                </div>
            </div>

            {/* Right Column - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#f8fafc] p-6">
                <div className="w-full max-w-[420px]">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-[#1e293b] mb-2 tracking-tight">Đăng nhập</h2>
                        <p className="text-slate-500 font-medium text-sm">Chào mừng bạn đến với hệ thống quản lý đào tạo và khảo thí.</p>
                    </div>

                    {/* Tab switcher */}
                    <div className="flex p-1 bg-slate-100 rounded-xl mb-8 border border-slate-200">
                        <button
                            onClick={() => handleTabSwitch('account')}
                            className={`flex-1 py-2.5 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all ${
                                loginTab === 'account' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <UserIcon size={16} /> Tài khoản
                        </button>
                        <button
                            onClick={() => handleTabSwitch('face')}
                            className={`flex-1 py-2.5 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all ${
                                loginTab === 'face' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Camera size={16} /> Khuôn mặt
                        </button>
                    </div>

                    {/* Account tab */}
                    {loginTab === 'account' && (
                        <>
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-start gap-2">
                                        <span className="mt-0.5">⚠️</span>
                                        {error}
                                    </div>
                                )}
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-slate-700">Email</label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                                                placeholder="VD: admin@system.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="block text-sm font-semibold text-slate-700">Mật khẩu</label>
                                            <Link to="/admin/forgot-password" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                                                Quên mật khẩu?
                                            </Link>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                                                placeholder="Nhập mật khẩu"
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

                                    <div className="flex items-center gap-2 pt-1">
                                        <input
                                            type="checkbox"
                                            id="remember"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <label htmlFor="remember" className="text-sm font-medium text-slate-600 cursor-pointer">
                                            Ghi nhớ đăng nhập
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-[#175b9f] hover:bg-[#124a82] text-white font-semibold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            '→ Đăng nhập'
                                        )}
                                    </button>
                                </form>
                            </div>

                            <div className="mt-8 flex items-center gap-4 before:flex-1 before:h-px before:bg-slate-200 after:flex-1 after:h-px after:bg-slate-200">
                                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">hoặc</span>
                            </div>
                            <div className="mt-6">
                                <button className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition-colors shadow-sm text-sm">
                                    <span className="text-[#175b9f]">📚</span> Đăng nhập qua Cổng thông tin HCMUT
                                </button>
                            </div>
                        </>
                    )}

                    {/* Face tab */}
                    {loginTab === 'face' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            {/* Webcam */}
                            <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-xl overflow-hidden mb-5">
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    mirrored={true}
                                    videoConstraints={{ facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }}
                                    className="w-full h-full object-cover"
                                />

                                {/* Scan overlay */}
                                {isScanning && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div
                                            className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"
                                            style={{ top: '50%', boxShadow: '0 0 15px 3px rgba(34,211,238,0.4)' }}
                                        />
                                        <div className="absolute top-4 left-4 w-12 h-12 border-t-[3px] border-l-[3px] border-cyan-400 rounded-tl-xl" />
                                        <div className="absolute top-4 right-4 w-12 h-12 border-t-[3px] border-r-[3px] border-cyan-400 rounded-tr-xl" />
                                        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-[3px] border-l-[3px] border-cyan-400 rounded-bl-xl" />
                                        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-[3px] border-r-[3px] border-cyan-400 rounded-br-xl" />
                                    </div>
                                )}

                                {/* Success overlay */}
                                {faceStatus === 'success' && (
                                    <div className="absolute inset-0 bg-emerald-900/70 backdrop-blur-sm flex flex-col items-center justify-center">
                                        <CheckCircle className="text-emerald-400 mb-3" size={48} />
                                        <p className="text-white font-bold text-lg">Nhận diện thành công!</p>
                                    </div>
                                )}

                                {/* Status badge */}
                                <div
                                    className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md ${
                                        faceStatus === 'scanning' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' :
                                        faceStatus === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' :
                                        faceStatus === 'error' ? 'bg-red-500/20 text-red-300 border border-red-400/30' :
                                        'bg-white/10 text-white/70 border border-white/20'
                                    }`}
                                >
                                    {faceStatus === 'scanning' && '🔍 Đang quét...'}
                                    {faceStatus === 'success' && '✅ Thành công'}
                                    {faceStatus === 'error' && '❌ Thất bại'}
                                    {faceStatus === 'idle' && '📷 Sẵn sàng'}
                                </div>
                            </div>

                            <p className={`text-center text-sm font-medium mb-5 ${
                                faceStatus === 'error' ? 'text-red-500' :
                                faceStatus === 'success' ? 'text-emerald-600' :
                                'text-slate-600'
                            }`}>
                                {faceMessage}
                            </p>

                            {faceStatus === 'idle' && (
                                <button
                                    onClick={startFaceScan}
                                    className="w-full bg-[#175b9f] hover:bg-[#124a82] text-white font-semibold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    <Scan size={20} /> Bắt đầu nhận diện khuôn mặt
                                </button>
                            )}

                            {faceStatus === 'scanning' && (
                                <button
                                    onClick={() => { stopFaceScan(); setFaceStatus('idle'); setFaceMessage('Nhấn nút bên dưới để bắt đầu nhận diện'); }}
                                    className="w-full bg-slate-500 hover:bg-slate-600 text-white font-semibold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Đang quét... (Nhấn để hủy)
                                </button>
                            )}

                            {faceStatus === 'error' && (
                                <button
                                    onClick={handleRetryFace}
                                    className="w-full bg-[#175b9f] hover:bg-[#124a82] text-white font-semibold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    <Scan size={20} /> Thử lại
                                </button>
                            )}

                            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                <p className="text-amber-700 text-xs font-medium">
                                    💡 Bạn cần đăng ký khuôn mặt trước khi sử dụng tính năng này. Vào <strong>KM Admin/Giảng Viên</strong> trong sidebar.
                                </p>
                            </div>
                        </div>
                    )}

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
