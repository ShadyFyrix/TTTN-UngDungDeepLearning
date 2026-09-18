import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class AuthService {
  static async verifyAttendance(studentId, imageBase64, scheduleId = null) {
    try {
      const response = await axios.post(`${API_URL}/attendance/verify`, {
        student_id: studentId,
        image_base64: imageBase64,
        schedule_id: scheduleId
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || 'Xác thực thất bại');
      }
      throw new Error('Lỗi kết nối đến máy chủ');
    }
  }

  static async registerFace(studentId, imageBase64) {
    try {
      const response = await axios.post(`${API_URL}/student/register-face`, {
        student_id: studentId,
        image_base64: imageBase64
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || 'Đăng ký thất bại');
      }
      throw new Error('Lỗi kết nối đến máy chủ');
    }
  }
}

export default AuthService;
