import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import AuthService from '../services/AuthService';

const videoConstraints = {
  width: 720,
  height: 720,
  facingMode: "user"
};

const WebcamCapture = () => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
    setResult(null);
  }, [webcamRef, setImgSrc]);

  const retake = () => {
    setImgSrc(null);
    setResult(null);
  };

  const handleVerify = async () => {
    if (!studentId) {
      setResult({ type: 'error', message: 'Vui lòng nhập Mã Số Sinh Viên (MSSV)' });
      return;
    }
    
    setIsProcessing(true);
    setResult(null);
    
    try {
      const response = await AuthService.verifyAttendance(studentId, imgSrc);
      setResult({ 
        type: 'success', 
        message: `${response.message} (Độ chính xác: ${(response.confidence * 100).toFixed(2)}%)` 
      });
    } catch (error) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegister = async () => {
    if (!studentId) {
      setResult({ type: 'error', message: 'Vui lòng nhập Mã Số Sinh Viên (MSSV)' });
      return;
    }
    
    setIsProcessing(true);
    setResult(null);
    
    try {
      const response = await AuthService.registerFace(studentId, imgSrc);
      setResult({ type: 'success', message: response.message });
    } catch (error) {
      setResult({ type: 'error', message: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass-card">
      <div className="input-group">
        <label htmlFor="studentId">Mã Số Sinh Viên (MSSV)</label>
        <input 
          id="studentId"
          type="text" 
          className="input-field"
          placeholder="Nhập MSSV của bạn (Ví dụ: 1)..."
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />
      </div>

      <div className="webcam-container">
        {!imgSrc ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="webcam-video"
              mirrored={true}
            />
            <div className="webcam-overlay"></div>
          </>
        ) : (
          <img src={imgSrc} alt="Captured" className="webcam-video" />
        )}
      </div>

      <div className="controls">
        {!imgSrc ? (
          <button className="btn btn-primary" onClick={capture}>
            <Camera size={20} />
            Chụp Ảnh
          </button>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={retake} disabled={isProcessing}>
              <RefreshCw size={20} />
              Chụp Lại
            </button>
            <button className="btn btn-primary" onClick={handleVerify} disabled={isProcessing}>
              {isProcessing ? <Loader2 size={20} className="loader" /> : <CheckCircle size={20} />}
              Xác Thực Thi Cử
            </button>
            <button className="btn btn-secondary" onClick={handleRegister} disabled={isProcessing} style={{borderColor: 'var(--accent-color)', color: 'var(--accent-color)'}}>
              Đăng Ký Khuôn Mặt
            </button>
          </>
        )}
      </div>

      {result && (
        <div style={{textAlign: 'center'}}>
          <div className={`status-badge ${result.type === 'success' ? 'status-success' : 'status-error'}`}>
            {result.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            {result.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebcamCapture;
