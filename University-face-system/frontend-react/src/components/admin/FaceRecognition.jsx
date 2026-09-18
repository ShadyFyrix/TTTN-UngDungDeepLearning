import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle, XCircle, Search, UserCheck, AlertTriangle, User, BookOpen, Calendar, MapPin, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const FaceRecognition = () => {
    const [searchParams] = useSearchParams();
    const webcamRef = useRef(null);

    // Mode: 'auto' (1:N automatic scan) vs 'manual' (1:1 specific student pick)
    const [mode, setMode] = useState('auto');

    // Auto-scan state
    const [isAutoScanning, setIsAutoScanning] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastRecognized, setLastRecognized] = useState(null); // { student, class_attendance, exam_attendance, confidence }
    const cooldownRef = useRef(false);

    // Camera visual feedback
    const [box, setBox] = useState(null);
    const [imageSize, setImageSize] = useState([640, 480]);
    const [faceDetected, setFaceDetected] = useState(false);

    // Manual mode state
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [studentInput, setStudentInput] = useState('');
    const [matchedStudentInfo, setMatchedStudentInfo] = useState(null);
    const [manualResult, setManualResult] = useState(null);

    // Load student list for manual mode option
    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const res = await api.get('/student-list');
            if (res.data.success) {
                setStudents(res.data.data);
                const paramStudentId = searchParams.get('student_id');
                if (paramStudentId) {
                    const found = res.data.data.find(s => s.id === parseInt(paramStudentId));
                    if (found) {
                        setSelectedStudentId(found.id.toString());
                        setStudentInput(found.student_code);
                        setMatchedStudentInfo(found);
                        setMode('manual');
                    }
                }
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách sinh viên:', err);
        }
    };

    const isProcessingRef = useRef(false);

    // Continuous face detection & auto-identification loop
    const processCameraFrame = useCallback(async () => {
        if (isProcessingRef.current || !webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        isProcessingRef.current = true;
        setIsProcessing(true);

        try {
            if (mode === 'auto' && isAutoScanning) {
                // Single unified API call for 1:N auto-verification and pose bounding box
                const autoRes = await api.post('/attendance/auto-verify', { image_base64: imageSrc });

                if (autoRes.data.success) {
                    if (autoRes.data.box) {
                        setBox(autoRes.data.box);
                        setFaceDetected(true);
                        if (autoRes.data.image_size) {
                            setImageSize(autoRes.data.image_size);
                        }
                    } else {
                        setBox(null);
                        setFaceDetected(false);
                    }

                    if (autoRes.data.match && !cooldownRef.current) {
                        setLastRecognized({
                            student: autoRes.data.student,
                            class_attendance: autoRes.data.class_attendance,
                            exam_attendance: autoRes.data.exam_attendance,
                            confidence: autoRes.data.confidence,
                            time: new Date().toLocaleTimeString('vi-VN')
                        });

                        // 3.5s cooldown after successful identification
                        cooldownRef.current = true;
                        setTimeout(() => {
                            cooldownRef.current = false;
                        }, 3500);
                    }
                }
            } else if (mode === 'manual') {
                // Manual mode: only detect pose for box
                const poseRes = await api.post('/face/detect-pose', { image_base64: imageSrc });
                if (poseRes.data.success && poseRes.data.box) {
                    setBox(poseRes.data.box);
                    setFaceDetected(true);
                    if (poseRes.data.image_size) setImageSize(poseRes.data.image_size);
                } else {
                    setBox(null);
                    setFaceDetected(false);
                }
            }
        } catch (err) {
            // Ignore transient frame errors
        } finally {
            isProcessingRef.current = false;
            setIsProcessing(false);
        }
    }, [mode, isAutoScanning]);

    useEffect(() => {
        const interval = setInterval(processCameraFrame, mode === 'auto' ? 650 : 300);
        return () => clearInterval(interval);
    }, [processCameraFrame, mode]);

    // Manual verify button click
    const handleManualVerify = async () => {
        const targetId = selectedStudentId || studentInput;
        if (!targetId || !webcamRef.current) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setIsProcessing(true);
        setManualResult(null);

        try {
            const response = await api.post('/attendance/verify', {
                student_id: parseInt(targetId),
                image_base64: imageSrc
            });

            if (response.data.success) {
                setManualResult({
                    match: true,
                    confidence: response.data.confidence,
                    message: `Xác thực thành công! Độ chính xác: ${(response.data.confidence * 100).toFixed(1)}%`
                });
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Lỗi kết nối server';
            const confidence = error.response?.data?.confidence || 0;
            setManualResult({
                match: false,
                confidence: confidence,
                message: msg
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.8) return 'text-emerald-500';
        if (confidence >= 0.68) return 'text-emerald-600';
        if (confidence >= 0.5) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white shadow-md shadow-violet-200">
                            <Sparkles size={22} />
                        </div>
                        Nhận Diện Khuôn Mặt & Điểm Danh Tự Động
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Hệ thống AI tự động quét nhận diện sinh viên (1:N) và thực hiện điểm danh lớp / điểm danh thi
                    </p>
                </div>

                {/* Mode Switcher */}
                <div className="flex items-center bg-gray-100 p-1.5 rounded-xl self-start md:self-auto">
                    <button
                        onClick={() => setMode('auto')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                            mode === 'auto' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <Sparkles size={16} /> Tự Động 1:N
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                            mode === 'manual' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <Search size={16} /> Chọn Sinh Viên Cụ Thể
                    </button>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Camera Feed (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <span className="font-bold text-gray-800 flex items-center gap-2">
                            <Camera size={18} className="text-primary-600" />
                            Camera Live Scan AI
                        </span>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                                faceDetected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                                {faceDetected ? (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Đã phát hiện khuôn mặt
                                    </>
                                ) : (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                        Chưa có khuôn mặt
                                    </>
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-center">
                        <div
                            className="relative w-full bg-gray-900 rounded-xl overflow-hidden shadow-inner"
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

                            {/* Bounding Box Overlay */}
                            {box && (
                                <div
                                    className="absolute pointer-events-none transition-all duration-150"
                                    style={{
                                        left: `${(box[0] / imageSize[0]) * 100}%`,
                                        top: `${(box[1] / imageSize[1]) * 100}%`,
                                        width: `${(box[2] / imageSize[0]) * 100}%`,
                                        height: `${(box[3] / imageSize[1]) * 100}%`,
                                    }}
                                >
                                    <div className={`absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] rounded-tl-md ${lastRecognized ? 'border-emerald-400' : 'border-cyan-400'}`}></div>
                                    <div className={`absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] rounded-tr-md ${lastRecognized ? 'border-emerald-400' : 'border-cyan-400'}`}></div>
                                    <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] rounded-bl-md ${lastRecognized ? 'border-emerald-400' : 'border-cyan-400'}`}></div>
                                    <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] rounded-br-md ${lastRecognized ? 'border-emerald-400' : 'border-cyan-400'}`}></div>
                                </div>
                            )}

                            {/* Status Overlay Indicator */}
                            {isProcessing && (
                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-2" style={{ transform: 'scaleX(-1)' }}>
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Đang đối soát AI...
                                </div>
                            )}
                        </div>

                        {mode === 'auto' && (
                            <div className="mt-3 text-center">
                                <p className="text-xs text-gray-500 font-medium">
                                    💡 <strong className="text-gray-700">Chế độ Tự Động:</strong> Chỉ cần đưa mặt vào camera, hệ thống sẽ tự động tìm thông tin sinh viên và ghi nhận điểm danh.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Information & Attendance Results (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* MODE 1: AUTO RECOGNIZED RESULT DISPLAY */}
                    {mode === 'auto' && (
                        <>
                            {lastRecognized ? (
                                <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 overflow-hidden animate-in zoom-in-95 duration-300">
                                    {/* Student Card Header */}
                                    <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-bold text-2xl shadow-inner shrink-0">
                                            {lastRecognized.student.full_name?.charAt(0) || 'S'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                    Đã Xác Thực
                                                </span>
                                                <span className="text-xs text-emerald-100 ml-auto font-mono">
                                                    {lastRecognized.time}
                                                </span>
                                            </div>
                                            <h2 className="text-xl font-bold truncate mt-0.5">
                                                {lastRecognized.student.full_name}
                                            </h2>
                                            <p className="text-xs text-emerald-100 font-medium">
                                                Mã SV: <span className="font-mono font-bold">{lastRecognized.student.student_code}</span> | Lớp: {lastRecognized.student.class_name || 'CNTT'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Confidence Score Bar */}
                                    <div className="p-4 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-700">Độ tin cậy AI:</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-emerald-500 h-2 rounded-full"
                                                    style={{ width: `${Math.min(lastRecognized.confidence * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-extrabold text-emerald-600 font-mono">
                                                {(lastRecognized.confidence * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Attendance Details Section */}
                                    <div className="p-5 space-y-4">
                                        {/* Course Attendance Card */}
                                        {lastRecognized.class_attendance && (
                                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                                        <BookOpen size={14} className="text-primary-600" />
                                                        Điểm Danh Môn Học Ngày Hôm Nay
                                                    </span>
                                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                                        ✓ Thành công
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-gray-900 text-sm">
                                                    {lastRecognized.class_attendance.course_code} - {lastRecognized.class_attendance.course_name}
                                                </h4>
                                                <div className="flex justify-between items-center text-xs text-gray-600 pt-1">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={12} className="text-gray-400" />
                                                        {lastRecognized.class_attendance.room_name}
                                                    </span>
                                                    <span>Thời gian vào: <strong className="text-gray-800 font-mono">{lastRecognized.class_attendance.check_in_time}</strong></span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Exam Attendance Card */}
                                        {lastRecognized.exam_attendance && (
                                            <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-xl space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                                                        <Calendar size={14} className="text-purple-600" />
                                                        Điểm Danh Thi
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        lastRecognized.exam_attendance.is_eligible ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {lastRecognized.exam_attendance.is_eligible ? '✓ Đủ điều kiện thi' : '✕ Không đủ điều kiện'}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-gray-900 text-sm">
                                                    {lastRecognized.exam_attendance.course_code} - {lastRecognized.exam_attendance.course_name}
                                                </h4>
                                                <div className="flex justify-between items-center text-xs text-purple-900 pt-1">
                                                    <span className="font-semibold">{lastRecognized.exam_attendance.exam_room}</span>
                                                    <span className="font-bold bg-white px-2 py-0.5 rounded border border-purple-200">
                                                        Chỗ ngồi: {lastRecognized.exam_attendance.seat}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center flex flex-col items-center justify-center min-h-[320px]">
                                    <div className="w-16 h-16 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
                                        <UserCheck size={32} />
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-lg mb-1">Sẵn Sàng Nhận Diện</h3>
                                    <p className="text-gray-500 text-sm max-w-xs">
                                        Vui lòng đưa mặt sinh viên vào camera. Hệ thống sẽ tự động quét và hiển thị thông tin điểm danh.
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {/* MODE 2: MANUAL SPECIFIC STUDENT PICK */}
                    {mode === 'manual' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2 border-b pb-3 border-gray-100">
                                <Search size={18} className="text-primary-600" />
                                Chọn Sinh Viên Để Xác Thực
                            </h3>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                                    Chọn từ danh sách sinh viên
                                </label>
                                <select
                                    value={selectedStudentId}
                                    onChange={(e) => {
                                        setSelectedStudentId(e.target.value);
                                        const found = students.find(s => s.id === parseInt(e.target.value));
                                        setMatchedStudentInfo(found || null);
                                    }}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                                >
                                    <option value="">-- Chọn sinh viên --</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.full_name} ({s.student_code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleManualVerify}
                                disabled={isProcessing || (!selectedStudentId && !studentInput)}
                                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <UserCheck size={18} />
                                Xác Thực Khuôn Mặt Thủ Công
                            </button>

                            {manualResult && (
                                <div className={`p-4 rounded-xl border text-sm ${
                                    manualResult.match ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                                }`}>
                                    <div className="font-bold flex items-center gap-2">
                                        {manualResult.match ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                        {manualResult.match ? 'Xác thực thành công' : 'Thất bại'}
                                    </div>
                                    <p className="mt-1 text-xs">{manualResult.message}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FaceRecognition;
