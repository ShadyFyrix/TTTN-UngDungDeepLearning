import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle, AlertCircle, RefreshCw, ArrowRight, Shield } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AdminFaceRegistration = () => {
    const webcamRef = useRef(null);
    const { user } = useAuth();

    // Flow: 'intro' -> 'camera_scan' -> 'success'
    const [phase, setPhase] = useState('intro');

    // Camera 3-step state
    const [step, setStep] = useState('straight');
    const [images, setImages] = useState({ straight: null, left: null, right: null });
    const [box, setBox] = useState(null);
    const [pose, setPose] = useState('none');
    const [imageSize, setImageSize] = useState([640, 480]);
    const [statusMessage, setStatusMessage] = useState('Vui lòng nhìn thẳng vào camera');
    const [isDetecting, setIsDetecting] = useState(false);
    const [error, setError] = useState('');

    const stabilityCounter = useRef(0);
    const STABILITY_THRESHOLD = 12;

    // Camera pose detection
    const captureFrame = useCallback(async () => {
        if (!isDetecting || phase !== 'camera_scan' || step === 'registering' || step === 'error') return;

        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) return;

            try {
                const response = await api.post('/face/detect-pose', { image_base64: imageSrc });

                if (response.data.success && response.data.box) {
                    setBox(response.data.box);
                    setPose(response.data.pose);
                    if (response.data.image_size) setImageSize(response.data.image_size);

                    if (step === 'straight' && response.data.pose === 'straight') {
                        stabilityCounter.current += 1;
                        setStatusMessage(`Đang giữ góc mặt thẳng... ${Math.round((stabilityCounter.current / STABILITY_THRESHOLD) * 100)}%`);
                        if (stabilityCounter.current >= STABILITY_THRESHOLD) {
                            setImages(prev => ({ ...prev, straight: imageSrc }));
                            setStep('left');
                            stabilityCounter.current = 0;
                            setStatusMessage('Tốt! Bây giờ vui lòng quay mặt từ từ sang TRÁI');
                        }
                    } else if (step === 'left' && response.data.pose === 'left') {
                        stabilityCounter.current += 1;
                        setStatusMessage(`Đang giữ góc mặt trái... ${Math.round((stabilityCounter.current / STABILITY_THRESHOLD) * 100)}%`);
                        if (stabilityCounter.current >= STABILITY_THRESHOLD) {
                            setImages(prev => ({ ...prev, left: imageSrc }));
                            setStep('right');
                            stabilityCounter.current = 0;
                            setStatusMessage('Tốt! Cuối cùng, vui lòng quay mặt từ từ sang PHẢI');
                        }
                    } else if (step === 'right' && response.data.pose === 'right') {
                        stabilityCounter.current += 1;
                        setStatusMessage(`Đang giữ góc mặt phải... ${Math.round((stabilityCounter.current / STABILITY_THRESHOLD) * 100)}%`);
                        if (stabilityCounter.current >= STABILITY_THRESHOLD) {
                            setImages(prev => ({ ...prev, right: imageSrc }));
                            setStep('registering');
                            setIsDetecting(false);
                            stabilityCounter.current = 0;
                            setStatusMessage('Đang xử lý và lưu dữ liệu vector khuôn mặt...');
                        }
                    } else {
                        stabilityCounter.current = Math.max(0, stabilityCounter.current - 2);
                        if (stabilityCounter.current === 0) {
                            if (step === 'straight') setStatusMessage('Vui lòng nhìn thẳng vào camera');
                            else if (step === 'left') setStatusMessage('Vui lòng quay mặt sang TRÁI');
                            else if (step === 'right') setStatusMessage('Vui lòng quay mặt sang PHẢI');
                        }
                    }
                } else {
                    setBox(null);
                    setPose('none');
                    stabilityCounter.current = 0;
                    setStatusMessage('Không tìm thấy khuôn mặt trong khung hình');
                }
            } catch (err) {
                console.error('Lỗi khi phân tích pose:', err);
            }
        }
    }, [isDetecting, phase, step]);

    useEffect(() => {
        let interval;
        if (isDetecting && phase === 'camera_scan') {
            interval = setInterval(captureFrame, 150);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [captureFrame, isDetecting, phase]);

    // Submit when all 3 images captured
    useEffect(() => {
        if (step === 'registering' && images.straight && images.left && images.right) {
            submitRegistration();
        }
    }, [step, images]);

    const submitRegistration = async () => {
        try {
            const response = await api.post('/auth/register-face', {
                image_straight: images.straight,
                image_left: images.left,
                image_right: images.right
            });
            if (response.data.success) {
                setPhase('success');
                setStatusMessage('Đăng ký khuôn mặt thành công!');
            }
        } catch (err) {
            console.error('Registration failed:', err);
            setStep('error');
            setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
            setStatusMessage('Đăng ký thất bại. Vui lòng thử lại.');
        }
    };

    const startScan = () => {
        setPhase('camera_scan');
        setStep('straight');
        setImages({ straight: null, left: null, right: null });
        stabilityCounter.current = 0;
        setIsDetecting(true);
        setError('');
        setStatusMessage('Vui lòng nhìn thẳng vào camera');
    };

    const resetProcess = () => {
        setStep('straight');
        setImages({ straight: null, left: null, right: null });
        stabilityCounter.current = 0;
        setIsDetecting(true);
        setError('');
        setStatusMessage('Vui lòng nhìn thẳng vào camera');
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center sm:justify-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-md shadow-primary-200">
                            <Shield size={22} />
                        </div>
                        Đăng Ký Khuôn Mặt Admin
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Đăng ký khuôn mặt để sử dụng tính năng đăng nhập bằng khuôn mặt
                    </p>
                </div>

                {/* Flow indicator */}
                <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl text-sm font-medium">
                    <span className={`px-3 py-1.5 rounded-lg transition-all ${phase === 'intro' ? 'bg-white text-primary-700 shadow-sm font-bold' : 'text-gray-500'}`}>
                        1. Giới thiệu
                    </span>
                    <ArrowRight size={14} className="text-gray-400" />
                    <span className={`px-3 py-1.5 rounded-lg transition-all ${phase === 'camera_scan' ? 'bg-white text-primary-700 shadow-sm font-bold' : 'text-gray-500'}`}>
                        2. Quét camera
                    </span>
                    <ArrowRight size={14} className="text-gray-400" />
                    <span className={`px-3 py-1.5 rounded-lg transition-all ${phase === 'success' ? 'bg-emerald-500 text-white shadow-sm font-bold' : 'text-gray-500'}`}>
                        3. Hoàn thành
                    </span>
                </div>
            </div>

            {/* PHASE 1: INTRO */}
            {phase === 'intro' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-xl mx-auto">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Camera className="text-[#175b9f]" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">Đăng ký khuôn mặt</h2>
                    <p className="text-gray-500 text-sm mb-2 leading-relaxed">
                        Hệ thống sẽ yêu cầu bạn quét khuôn mặt ở <strong>3 góc</strong>: thẳng, trái, phải.
                        Dữ liệu sẽ được mã hóa và lưu trữ an toàn.
                    </p>
                    
                    {user && (
                        <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-left">
                            <p className="text-sm text-slate-600">
                                <strong>Tài khoản:</strong> {user.full_name} ({user.email})
                            </p>
                            <p className="text-sm text-slate-600">
                                <strong>Vai trò:</strong> {user.role === 'admin' ? 'Quản trị viên' : user.role}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={startScan}
                        className="w-full py-3.5 px-6 bg-[#175b9f] hover:bg-[#124a82] text-white font-semibold rounded-xl shadow-md shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Camera size={20} /> Bắt đầu quét khuôn mặt
                    </button>
                </div>
            )}

            {/* PHASE 2: CAMERA SCAN */}
            {phase === 'camera_scan' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-2xl mx-auto">
                    {/* User info banner */}
                    {user && (
                        <div className="p-4 bg-primary-50 border-b border-primary-100 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
                                {user.full_name?.charAt(0) || 'A'}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">{user.full_name}</h4>
                                <p className="text-xs text-gray-600">{user.email} • {user.role}</p>
                            </div>
                        </div>
                    )}

                    <div className="p-6 flex flex-col items-center">
                        {/* 3 Step progress */}
                        <div className="w-full flex justify-between items-center mb-6 px-8 relative">
                            <div className="absolute top-1/2 left-8 right-8 h-1 bg-gray-200 -z-10 rounded-full transform -translate-y-1/2"></div>
                            <div className={`absolute top-1/2 left-8 h-1 bg-primary-500 -z-10 rounded-full transform -translate-y-1/2 transition-all duration-500 ${step === 'straight' ? 'w-0' : step === 'left' ? 'w-1/2' : 'w-full'}`}></div>

                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step === 'straight' ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 'bg-primary-600 text-white'}`}>1</div>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step === 'left' ? 'bg-primary-600 text-white ring-4 ring-primary-100' : step === 'right' || step === 'registering' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step === 'right' ? 'bg-primary-600 text-white ring-4 ring-primary-100' : step === 'registering' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
                        </div>

                        <div className="text-center mb-4">
                            <p className={`text-base font-semibold ${step === 'error' ? 'text-red-600' : 'text-gray-800'}`}>
                                {statusMessage}
                            </p>
                        </div>

                        {/* Webcam */}
                        <div className="relative w-full max-w-md bg-gray-900 rounded-xl overflow-hidden shadow-inner" style={{ transform: 'scaleX(-1)' }}>
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                mirrored={false}
                                videoConstraints={{ facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }}
                                className="w-full h-auto block"
                            />

                            {/* Bounding box */}
                            {box && (
                                <div className="absolute pointer-events-none" style={{
                                    left: `${(box[0] / imageSize[0]) * 100}%`,
                                    top: `${(box[1] / imageSize[1]) * 100}%`,
                                    width: `${(box[2] / imageSize[0]) * 100}%`,
                                    height: `${(box[3] / imageSize[1]) * 100}%`,
                                }}>
                                    <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-cyan-400 rounded-tl-md"></div>
                                    <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-cyan-400 rounded-tr-md"></div>
                                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-cyan-400 rounded-bl-md"></div>
                                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-cyan-400 rounded-br-md"></div>
                                </div>
                            )}

                            {/* Pose hints */}
                            {box && step === 'straight' && pose !== 'straight' && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center" style={{ transform: 'scaleX(-1)' }}>
                                    <p className="text-white font-bold text-lg px-4 py-2 bg-red-500/80 rounded-lg">Hãy nhìn thẳng!</p>
                                </div>
                            )}
                            {box && step === 'left' && pose !== 'left' && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center" style={{ transform: 'scaleX(-1)' }}>
                                    <p className="text-white font-bold text-lg px-4 py-2 bg-red-500/80 rounded-lg">Quay đầu sang trái ←</p>
                                </div>
                            )}
                            {box && step === 'right' && pose !== 'right' && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center" style={{ transform: 'scaleX(-1)' }}>
                                    <p className="text-white font-bold text-lg px-4 py-2 bg-red-500/80 rounded-lg">Quay đầu sang phải →</p>
                                </div>
                            )}

                            {step === 'registering' && (
                                <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center" style={{ transform: 'scaleX(-1)' }}>
                                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
                                    <p className="text-white font-medium">Đang trích xuất vector khuôn mặt AI...</p>
                                </div>
                            )}
                        </div>

                        {step === 'error' && (
                            <div className="mt-4 w-full max-w-md">
                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}
                                <button
                                    onClick={resetProcess}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                                >
                                    <RefreshCw size={18} /> Thử lại từ đầu
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PHASE 3: SUCCESS */}
            {phase === 'success' && (
                <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-8 max-w-xl mx-auto text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                        <CheckCircle size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng Ký Khuôn Mặt Thành Công!</h2>
                    <p className="text-gray-600 mb-6">
                        Dữ liệu khuôn mặt AI đã được lưu trữ cho tài khoản{' '}
                        <strong className="text-gray-800">{user?.full_name}</strong>.
                        Bạn có thể sử dụng khuôn mặt để đăng nhập từ bây giờ.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => { setPhase('intro'); }}
                            className="py-3 px-6 bg-[#175b9f] hover:bg-[#124a82] text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} /> Đăng ký lại
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFaceRegistration;
