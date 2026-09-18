const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

class AiService {
    /**
     * Send base64 image to AI service to verify against a specific student's embedding
     */
    static async verifyFace(studentId, base64Image) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/api/v1/verify`, {
                student_id: studentId,
                image_base64: base64Image
            });
            return response.data; // Expected { match: true/false, confidence: 0.95 }
        } catch (error) {
            console.error('AI Service Error (verifyFace):', error.message);
            throw new Error('Could not verify face with AI service');
        }
    }

    /**
     * Send base64 image to AI service to register face embedding for a student
     */
    static async registerFace(studentId, base64Image) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/api/v1/register`, {
                student_id: studentId,
                image_base64: base64Image
            });
            return response.data; // Expected { success: true }
        } catch (error) {
            console.error('AI Service Error (registerFace):', error.message);
            throw new Error('Could not register face embedding with AI service');
        }
    }

    /**
     * Send base64 image to AI service to detect face and head pose
     */
    static async detectPose(base64Image) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/api/v1/detect_pose`, {
                image_base64: base64Image
            });
            return response.data; // Expected { success, box, pose }
        } catch (error) {
            console.error('AI Service Error (detectPose):', error.message);
            throw new Error('Could not detect face pose');
        }
    }

    /**
     * Send 3 base64 images to AI service to register 3-step face embedding
     */
    static async registerFace3Step(studentId, imgStraight, imgLeft, imgRight) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/api/v1/register_3step`, {
                student_id: studentId,
                image_straight: imgStraight,
                image_left: imgLeft,
                image_right: imgRight
            });
            return response.data; // Expected { success: true }
        } catch (error) {
            console.error('AI Service Error (registerFace3Step):', error.message);
            throw new Error('Could not register 3-step face embedding with AI service');
        }
    }
    /**
     * Send base64 image to AI service to identify matching student from database (1:N)
     */
    static async identifyFace(base64Image) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/api/v1/identify`, {
                image_base64: base64Image
            });
            return response.data; // Expected { match: true/false, student_id: 12, confidence: 0.92 }
        } catch (error) {
            console.error('AI Service Error (identifyFace):', error.message);
            throw new Error('Could not identify face with AI service');
        }
    }
}

module.exports = AiService;

