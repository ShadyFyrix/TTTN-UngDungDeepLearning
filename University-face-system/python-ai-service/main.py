from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import numpy as np
import db_mysql
import face_processor

app = FastAPI(title="Face Attendance AI Service")

class VerifyRequest(BaseModel):
    student_id: int
    image_base64: str

class DetectPoseRequest(BaseModel):
    image_base64: str

class IdentifyRequest(BaseModel):
    image_base64: str

class Register3StepRequest(BaseModel):
    student_id: int
    image_straight: str
    image_left: str
    image_right: str

class AdminRegister3StepRequest(BaseModel):
    admin_id: int
    image_straight: str
    image_left: str
    image_right: str

MATCH_THRESHOLD = 0.68

@app.post("/api/v1/identify")
async def identify_face(req: IdentifyRequest):
    pose_res = face_processor.detect_face_pose(req.image_base64)
    if pose_res["box"] is None:
        return {"match": False, "box": None, "student_id": None, "confidence": 0, "message": "No face detected"}

    current_embedding = face_processor.extract_embedding(req.image_base64)
    if current_embedding is None:
        return {"match": False, "box": pose_res["box"], "image_size": pose_res.get("image_size"), "student_id": None, "confidence": 0, "message": "No embedding"}

    all_students = db_mysql.get_all_student_embeddings()
    if not all_students:
        return {"match": False, "box": pose_res["box"], "image_size": pose_res.get("image_size"), "student_id": None, "confidence": 0, "message": "No registered face embeddings in database"}

    best_student_id = None
    best_similarity = -1.0

    for s in all_students:
        sim = face_processor.compute_cosine_similarity(s["embedding"], current_embedding)
        if sim > best_similarity:
            best_similarity = sim
            best_student_id = s["id"]

    is_match = bool(best_similarity >= MATCH_THRESHOLD)

    return {
        "match": is_match,
        "box": pose_res["box"],
        "image_size": pose_res.get("image_size"),
        "student_id": best_student_id if is_match else None,
        "confidence": float(best_similarity) if best_similarity > 0 else 0.0
    }



@app.post("/api/v1/detect_pose")
async def detect_pose(req: DetectPoseRequest):
    result = face_processor.detect_face_pose(req.image_base64)
    if result["box"] is None:
        return {"success": False, "message": "No face detected"}
    
    return {
        "success": True,
        "box": result["box"],
        "pose": result["pose"],
        "image_size": result.get("image_size")
    }

@app.post("/api/v1/verify")
async def verify_face(req: VerifyRequest):
    stored_embedding = db_mysql.get_student_embedding(req.student_id)
    
    if stored_embedding is None:
        raise HTTPException(status_code=404, detail="Student embedding not found")
        
    current_embedding = face_processor.extract_embedding(req.image_base64)
    
    if current_embedding is None:
        raise HTTPException(status_code=400, detail="Could not detect face in image")
        
    similarity = face_processor.compute_cosine_similarity(stored_embedding, current_embedding)
    is_match = bool(similarity >= MATCH_THRESHOLD)
    
    return {
        "match": is_match,
        "confidence": float(similarity)
    }

@app.post("/api/v1/register_3step")
async def register_face_3step(req: Register3StepRequest):
    # Extract embeddings for all 3 images
    emb_straight = face_processor.extract_embedding(req.image_straight)
    emb_left = face_processor.extract_embedding(req.image_left)
    emb_right = face_processor.extract_embedding(req.image_right)
    
    if emb_straight is None or emb_left is None or emb_right is None:
        raise HTTPException(status_code=400, detail="Could not detect face in one or more images")
        
    # Calculate the mean embedding to represent the user robustly
    mean_embedding = np.mean([emb_straight, emb_left, emb_right], axis=0)
    
    # Save to database (will be converted to Base64 in db_mysql)
    success = db_mysql.update_student_embedding(req.student_id, mean_embedding)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save embedding to database")
        
    return {"success": True}

# Legacy route for backward compatibility if needed
@app.post("/api/v1/register")
async def register_face(req: VerifyRequest):
    embedding = face_processor.extract_embedding(req.image_base64)
    if embedding is None:
        raise HTTPException(status_code=400, detail="Could not detect face")
        
    success = db_mysql.update_student_embedding(req.student_id, embedding)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save")
    return {"success": True}


@app.post("/api/v1/admin/register_face")
async def admin_register_face(req: AdminRegister3StepRequest):
    """Register face for an administrator (3-step: straight, left, right)"""
    emb_straight = face_processor.extract_embedding(req.image_straight)
    emb_left = face_processor.extract_embedding(req.image_left)
    emb_right = face_processor.extract_embedding(req.image_right)

    if emb_straight is None or emb_left is None or emb_right is None:
        raise HTTPException(status_code=400, detail="Could not detect face in one or more images")

    mean_embedding = np.mean([emb_straight, emb_left, emb_right], axis=0)
    success = db_mysql.update_admin_embedding(req.admin_id, mean_embedding)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to save admin embedding to database")

    return {"success": True}


@app.post("/api/v1/admin/identify")
async def admin_identify_face(req: IdentifyRequest):
    """Identify an administrator by face - used for face login"""
    pose_res = face_processor.detect_face_pose(req.image_base64)
    if pose_res["box"] is None:
        return {"match": False, "box": None, "admin_id": None, "confidence": 0, "message": "No face detected"}

    current_embedding = face_processor.extract_embedding(req.image_base64)
    if current_embedding is None:
        return {"match": False, "box": pose_res["box"], "admin_id": None, "confidence": 0, "message": "No embedding extracted"}

    all_admins = db_mysql.get_all_admin_embeddings()
    if not all_admins:
        return {"match": False, "box": pose_res["box"], "admin_id": None, "confidence": 0, "message": "No registered admin faces in database"}

    best_admin_id = None
    best_similarity = -1.0
    best_admin = None

    for a in all_admins:
        sim = face_processor.compute_cosine_similarity(a["embedding"], current_embedding)
        if sim > best_similarity:
            best_similarity = sim
            best_admin_id = a["id"]
            best_admin = a

    is_match = bool(best_similarity >= MATCH_THRESHOLD)

    return {
        "match": is_match,
        "box": pose_res["box"],
        "image_size": pose_res.get("image_size"),
        "admin_id": best_admin_id if is_match else None,
        "full_name": best_admin["full_name"] if is_match else None,
        "role": best_admin["role"] if is_match else None,
        "confidence": float(best_similarity) if best_similarity > 0 else 0.0
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
