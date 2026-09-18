import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle, AlertCircle, RefreshCw, UserPlus, UserCheck, ArrowRight, ArrowLeft, Search, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const FaceRegistration = ({ onComplete }) => {
    const navigate = useNavigate();
    const webcamRef = useRef(null);
    const containerRef = useRef(null);

    // Registration flow steps: 'student_info' -> 'camera_scan' -> 'success'
    const [pagePhase, setPagePhase] = useState('student_info'); 

    // Form state
    const [studentForm, setStudentForm] = useState({
        student_code: '',
        full_name: '',
        class_name: '',
        date_of_birth: ''
    });
    const [formError, setFormError] = useState('');
    const [isSavingStudent, setIsSavingStudent] = useState(false);
    const [existingStudents, setExistingStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null); // { id, student_code, full_name, class_name }

    // Camera 3-step state
    const [step, setStep] = useState('straight'); // straight, left, right, registering, error
    const [images, setImages] = useState({ straight: null, left: null, right: null });
    const [box, setBox] = useState(null); // [x, y, w, h] from MTCNN
    const [pose, setPose] = useState('none');
    const [imageSize, setImageSize] = useState([640, 480]);
    const [statusMessage, setStatusMessage] = useState('Vui lòng nhìn thẳng vào camera');
    const [isDetecting, setIsDetecting] = useState(false);

    // Stability counter for pose auto-capture
    const stabilityCounter = useRef(0);
    const STABILITY_THRESHOLD = 12; // ~1.2s of stable pose

    // Load recent students list on mount
    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const res = await api.get('/student-list');
            if (res.data.success) {
                setExistingStudents(res.data.data);
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách sinh viên:', err);
        }
    };

    // Handle student form submission
    const handleStudentSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!studentForm.student_code.trim() || !studentForm.full_name.trim()) {
            setFormError('Vui lòng điền đầy đủ Mã Sinh Viên và Họ và Tên.');
            return;
        }

        setIsSavingStudent(true);
        try {
            const res = await api.post('/student/quick-create', {
                student_code: studentForm.student_code.trim(),
                full_name: studentForm.full_name.trim(),
                class_name: studentForm.class_name.trim(),
                date_of_birth: studentForm.date_of_birth || null
            });

            if (res.data.success && res.data.data) {
                setSelectedStudent(res.data.data);
                setPagePhase('camera_scan');
                setStep('straight');
                setIsDetecting(true);
                setStatusMessage('Vui lòng nhìn thẳng vào camera');
            } else {
                setFormError(res.data.message || 'Không thể tạo thông tin sinh viên');
            }
        } catch (err) {
            console.error('Lỗi lưu thông tin sinh viên:', err);
            setFormError(err.response?.data?.message || 'Lỗi server khi lưu sinh viên');
        } finally {
            setIsSavingStudent(false);
        }
    };

    // Select existing student from list
    const handleSelectExistingStudent = (student) => {
        setSelectedStudent(student);
        setStudentForm({
            student_code: student.student_code,
            full_name: student.full_name,
            class_name: student.class_name || '',
            date_of_birth: ''
        });
        setPagePhase('camera_scan');
        setStep('straight');
        setIsDetecting(true);
        setStatusMessage('Vui lòng nhìn thẳng vào camera');
    };

    // Camera pose detection callback
    const captureFrame = useCallback(async () => {
        if (!isDetecting || pagePhase !== 'camera_scan' || step === 'registering' || step === 'error') return;

        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) return;

            try {
                const response = await api.post('/face/detect-pose', { image_base64: imageSrc });

                if (response.data.success && response.data.box) {
                    setBox(response.data.box);
                    setPose(response.data.pose);
                    if (response.data.image_size) {
                        setImageSize(response.data.image_size);
                    }

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
    }, [isDetecting, pagePhase, step]);

    useEffect(() => {
        let interval;
        if (isDetecting && pagePhase === 'camera_scan') {
            interval = setInterval(captureFrame, 150);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [captureFrame, isDetecting, pagePhase]);

    // Save vector when 3 images captured
    useEffect(() => {
        if (step === 'registering' && images.straight && images.left && images.right && selectedStudent) {
            submitRegistration();
        }
    }, [step, images, selectedStudent]);

    const submitRegistration = async () => {
        try {
            const response = await api.post('/face/register-3step', {
                student_id: selectedStudent.id,
                image_straight: images.straight,
                image_left: images.left,
                image_right: images.right
            });
            if (response.data.success) {
                setPagePhase('success');
                setStatusMessage('Đăng ký khuôn mặt thành công!');
                loadStudents(); // refresh list
                if (onComplete) onComplete(selectedStudent);
            }
        } catch (error) {
            console.error('Registration failed:', error);
            setStep('error');
            setStatusMessage('Đăng ký thất bại. Vui lòng thử lại.');
        }
    };

    const resetProcess = () => {
        setStep('straight');
        setImages({ straight: null, left: null, right: null });
        stabilityCounter.current = 0;
        setIsDetecting(true);
        setStatusMessage('Vui lòng nhìn thẳng vào camera');
    };

    const startNewStudent = () => {
        setSelectedStudent(null);
        setStudentForm({ student_code: '', full_name: '', class_name: '', date_of_birth: '' });
        setImages({ straight: null, left: null, right: null });
        setStep('straight');
        setIsDetecting(false);
        setPagePhase('student_info');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center sm:justify-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-md shadow-primary-200">
                            <Camera size={22} />
                        </div>
                        Đăng Ký Khuôn Mặt Sinh Viên
                    </h1>
                    <p className="text-gray-500 mt-1">
                        BƯỚC 1: Điền thông tin sinh viên ➔ BƯỚC 2: Quét khuôn mặt 3 hướng AI
                    </p>
                </div>

                {/* Flow indicator */}
                <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl text-sm font-medium">
                    <span className={`px-3 py-1.5 rounded-lg transition-all ${pagePhase === 'student_info' ? 'bg-white text-primary-700 shadow-sm font-bold' : 'text-gray-500'}`}>
                        1. Thông tin
                    </span>
                    <ArrowRight size={14} className="text-gray-400" />
                    <span className={`px-3 py-1.5 rounded-lg transition-all ${pagePhase === 'camera_scan' ? 'bg-white text-primary-700 shadow-sm font-bold' : 'text-gray-500'}`}>
                        2. Quét camera
                    </span>
                    <ArrowRight size={14} className="text-gray-400" />
                    <span className={`px-3 py-1.5 rounded-lg transition-all ${pagePhase === 'success' ? 'bg-emerald-500 text-white shadow-sm font-bold' : 'text-gray-500'}`}>
                        3. Hoàn thành
                    </span>
                </div>
            </div>

            {/* PHASE 1: STUDENT INFO FORM */}
            {pagePhase === 'student_info' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Input Form */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3 border-gray-100">
                            <UserPlus size={20} className="text-primary-600" />
                            Nhập Thông Tin Sinh Viên
                        </h2>

                        {formError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleStudentSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Mã Sinh Viên <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: SV001 hoặc 2024001"
                                    value={studentForm.student_code}
                                    onChange={(e) => setStudentForm({ ...studentForm, student_code: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium text-gray-800"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Họ và Tên Sinh Viên <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: Nguyễn Văn A"
                                    value={studentForm.full_name}
                                    onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium text-gray-800"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Lớp Học
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ví dụ: CNTT-K65"
                                        value={studentForm.class_name}
                                        onChange={(e) => setStudentForm({ ...studentForm, class_name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium text-gray-800"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Ngày Sinh
                                    </label>
                                    <input
                                        type="date"
                                        value={studentForm.date_of_birth}
                                        onChange={(e) => setStudentForm({ ...studentForm, date_of_birth: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-gray-800"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isSavingStudent}
                                    className="w-full py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md shadow-primary-200 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSavingStudent ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Đang lưu thông tin...
                                        </>
                                    ) : (
                                        <>
                                            Xác Nhận Thông Tin & Đăng Ký Khuôn Mặt
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right: Quick Select Existing Students */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <User size={16} className="text-gray-500" />
                            Hoặc Chọn Sinh Viên Sẵn Có ({existingStudents.length})
                        </h3>

                        <div className="flex-1 overflow-y-auto max-h-[340px] space-y-2 pr-1">
                            {existingStudents.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6">Chưa có sinh viên trong danh sách</p>
                            ) : (
                                existingStudents.map((s) => (
                                    <div
                                        key={s.id}
                                        onClick={() => handleSelectExistingStudent(s)}
                                        className="p-3 border border-gray-100 rounded-xl hover:bg-primary-50 hover:border-primary-200 cursor-pointer transition-all flex items-center justify-between group"
                                    >
                                        <div>
                                            <div className="font-semibold text-gray-800 group-hover:text-primary-700 text-sm">
                                                {s.full_name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Mã SV: <span className="font-mono text-gray-700">{s.student_code}</span>
                                                {s.class_name && ` • Lớp: ${s.class_name}`}
                                            </div>
                                        </div>
                                        <div>
                                            {s.has_face ? (
                                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                                    Đã có khuôn mặt
                                                </span>
                                            ) : (
                                                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                                    Chưa có khuôn mặt
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* PHASE 2: CAMERA 3-STEP SCAN */}
            {pagePhase === 'camera_scan' && selectedStudent && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full max-w-2xl mx-auto">
                    {/* Selected Student Banner */}
                    <div className="p-4 bg-primary-50 border-b border-primary-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
                                {selectedStudent.full_name?.charAt(0) || 'S'}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">{selectedStudent.full_name}</h4>
                                <p className="text-xs text-gray-600">
                                    Mã SV: <span className="font-mono font-semibold">{selectedStudent.student_code}</span> | Lớp: {selectedStudent.class_name || 'N/A'} (ID: #{selectedStudent.id})
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={startNewStudent}
                            className="text-xs font-semibold text-primary-700 hover:text-primary-800 bg-white border border-primary-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                        >
                            <ArrowLeft size={14} /> Thay đổi
                        </button>
                    </div>

                    <div className="p-6 flex flex-col items-center">
                        {/* 3 Step progress bar */}
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

                        {/* Mirror Video Container */}
                        <div
                            ref={containerRef}
                            className="relative w-full max-w-md bg-gray-900 rounded-xl overflow-hidden shadow-inner"
                            style={{ transform: 'scaleX(-1)' }}
                        >
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                mirrored={false}
                                videoConstraints={{
                                    facingMode: "user",
                                    width: { ideal: 640 },
                                    height: { ideal: 480 }
                                }}
                                className="w-full h-auto block"
                            />

                            {/* Bounding box */}
                            {box && (
                                <div
                                    className="absolute pointer-events-none"
                                    style={{
                                        left: `${(box[0] / imageSize[0]) * 100}%`,
                                        top: `${(box[1] / imageSize[1]) * 100}%`,
                                        width: `${(box[2] / imageSize[0]) * 100}%`,
                                        height: `${(box[3] / imageSize[1]) * 100}%`,
                                    }}
                                >
                                    <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-cyan-400 rounded-tl-md"></div>
                                    <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-cyan-400 rounded-tr-md"></div>
                                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-cyan-400 rounded-bl-md"></div>
                                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-cyan-400 rounded-br-md"></div>
                                </div>
                            )}

                            {/* Inverse text overlays */}
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
                            <button
                                onClick={resetProcess}
                                className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                            >
                                <RefreshCw size={18} /> Thử lại từ đầu
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* PHASE 3: SUCCESS & NEXT ACTIONS */}
            {pagePhase === 'success' && selectedStudent && (
                <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-8 max-w-xl mx-auto text-center animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                        <CheckCircle size={48} />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng Ký Khuôn Mặt Thành Công!</h2>
                    <p className="text-gray-600 mb-6">
                        Dữ liệu khuôn mặt AI đã được lưu trữ cho sinh viên{' '}
                        <strong className="text-gray-800">{selectedStudent.full_name}</strong> (Mã SV: <span className="font-mono font-bold text-primary-700">{selectedStudent.student_code}</span>).
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => navigate(`/admin/face-recognition?student_id=${selectedStudent.id}`)}
                            className="py-3 px-6 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                        >
                            <UserCheck size={20} />
                            Nhận Diện Khuôn Mặt Ngay
                        </button>

                        <button
                            onClick={startNewStudent}
                            className="py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <UserPlus size={18} />
                            Đăng Ký Sinh Viên Khác
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FaceRegistration;
