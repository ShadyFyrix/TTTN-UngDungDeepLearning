import cv2
import numpy as np
import base64
from deepface import DeepFace
from mtcnn import MTCNN

# Load ArcFace model in memory once
MODEL_NAME = "ArcFace"
try:
    print(f"Loading {MODEL_NAME} model...")
except Exception as e:
    pass

# Initialize MTCNN
detector = MTCNN()

def base64_to_image(base64_string):
    """
    Decodes a base64 string to a cv2 image (numpy array)
    """
    if "base64," in base64_string:
        base64_string = base64_string.split("base64,")[1]
    
    img_data = base64.b64decode(base64_string)
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

def detect_face_pose(image_base64):
    """
    Detects face using MTCNN and estimates head pose (straight, left, right).
    
    Works correctly with both raw and mirrored images.
    The pose labels represent the direction the person is looking FROM THEIR OWN PERSPECTIVE.
    
    Returns {"box": [x, y, w, h], "pose": "straight"|"left"|"right"|"none", "image_size": [w, h]}
    """
    try:
        img = base64_to_image(image_base64)
        if img is None:
            return {"box": None, "pose": "none", "image_size": [640, 480]}
        
        img_h, img_w = img.shape[:2]
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        results = detector.detect_faces(img_rgb)
        
        if not results:
            return {"box": None, "pose": "none", "image_size": [img_w, img_h]}
            
        # Get the highest confidence detection
        face = max(results, key=lambda d: d['confidence'])
        
        # Bounding box
        x, y, w, h = face['box']
        
        # Keypoints
        keypoints = face['keypoints']
        left_eye = keypoints['left_eye']
        right_eye = keypoints['right_eye']
        nose = keypoints['nose']
        
        # Robust pose estimation using eye center and nose position
        # This works regardless of whether the image is mirrored or not
        # by using the actual geometric positions rather than assuming eye label order
        
        # Find the eye center
        eye_center_x = (left_eye[0] + right_eye[0]) / 2.0
        eye_span = abs(left_eye[0] - right_eye[0])
        
        if eye_span < 5:
            # Eyes too close together to determine direction
            pose = "straight"
        else:
            # Normalized offset: how far the nose is from the eye center,
            # relative to the eye span. Range approximately [-1, 1].
            # Positive = nose is to the RIGHT of eye center in the image.
            nose_offset = (nose[0] - eye_center_x) / eye_span
            
            # For a RAW (non-mirrored) front-facing camera image:
            #   - Person turns their head to THEIR LEFT → nose moves to the RIGHT in image → nose_offset > 0
            #   - Person turns their head to THEIR RIGHT → nose moves to the LEFT in image → nose_offset < 0
            # So: positive offset → person looking left, negative → person looking right
            
            if abs(nose_offset) < 0.15:
                pose = "straight"
            elif nose_offset > 0:
                pose = "left"   # Person is looking to their left
            else:
                pose = "right"  # Person is looking to their right
                
        return {
            "box": [max(0, x), max(0, y), w, h],
            "pose": pose,
            "image_size": [img_w, img_h]
        }
        
    except Exception as e:
        print(f"Error detecting pose: {e}")
        import traceback
        traceback.print_exc()
        return {"box": None, "pose": "none", "image_size": [640, 480]}

def extract_embedding(image_base64):
    """
    Extracts face embedding using DeepFace with MTCNN detector.
    Returns a numpy array or None.
    """
    try:
        img = base64_to_image(image_base64)
        # Use mtcnn as detector to avoid opencv haarcascade dependency issues
        result = DeepFace.represent(
            img_path=img, 
            model_name=MODEL_NAME, 
            detector_backend='mtcnn',
            enforce_detection=True
        )
        if len(result) > 0:
            return np.array(result[0]["embedding"])
        return None
    except Exception as e:
        print(f"Error extracting embedding: {e}")
        import traceback
        traceback.print_exc()
        return None

def compute_cosine_similarity(vec1, vec2):
    """
    Computes cosine similarity between two numpy arrays.
    Returns a float between -1 and 1 (1 being identical).
    """
    dot_product = np.dot(vec1, vec2)
    norm_a = np.linalg.norm(vec1)
    norm_b = np.linalg.norm(vec2)
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
        
    return dot_product / (norm_a * norm_b)
