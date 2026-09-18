import mysql.connector
from mysql.connector import Error
import os
import json
import base64
import numpy as np

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "appuser"),
            password=os.getenv("DB_PASSWORD", "apppassword"),
            database=os.getenv("DB_NAME", "face_attendance_db")
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def update_student_embedding(student_id, embedding):
    """
    Save the embedding (numpy array) to the students table as Base64 string in BLOB
    """
    connection = get_db_connection()
    if connection:
        try:
            cursor = connection.cursor()
            
            # Convert numpy array to bytes, then base64 encode
            if not isinstance(embedding, np.ndarray):
                embedding = np.array(embedding)
                
            embedding_bytes = embedding.tobytes()
            embedding_base64 = base64.b64encode(embedding_bytes).decode('utf-8')
            
            # Store as bytes for BLOB
            cursor.execute(
                "UPDATE students SET face_embedding = %s WHERE id = %s",
                (embedding_base64.encode('utf-8'), student_id)
            )
            connection.commit()
            return True
        except Error as e:
            print(f"Error updating embedding: {e}")
            return False
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    return False

def get_student_embedding(student_id):
    """
    Fetch the embedding for a student from MySQL
    """
    connection = get_db_connection()
    if connection:
        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute(
                "SELECT face_embedding FROM students WHERE id = %s",
                (student_id,)
            )
            row = cursor.fetchone()
            if row and row['face_embedding']:
                embedding_bytes = row['face_embedding']
                
                # Try decoding base64 first (new format)
                try:
                    embedding_base64_str = embedding_bytes.decode('utf-8')
                    # Decode base64
                    decoded_bytes = base64.b64decode(embedding_base64_str)
                    # Convert to float64 numpy array
                    embedding = np.frombuffer(decoded_bytes, dtype=np.float64)
                    return embedding
                except Exception as e:
                    # Fallback to old JSON format for backwards compatibility
                    try:
                        embedding_json = embedding_bytes.decode('utf-8')
                        embedding_list = json.loads(embedding_json)
                        return np.array(embedding_list, dtype=np.float64)
                    except Exception as e2:
                        print(f"Failed to parse embedding format: {e2}")
                        return None
        except Error as e:
            print(f"Error fetching embedding: {e}")
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    return None

def get_all_student_embeddings():
    """
    Fetch all registered student embeddings from MySQL
    """
    connection = get_db_connection()
    students_list = []
    if connection:
        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute(
                "SELECT id, student_code, full_name, face_embedding FROM students WHERE face_embedding IS NOT NULL"
            )
            rows = cursor.fetchall()
            for row in rows:
                if row['face_embedding']:
                    embedding_bytes = row['face_embedding']
                    emb = None
                    try:
                        embedding_base64_str = embedding_bytes.decode('utf-8')
                        decoded_bytes = base64.b64decode(embedding_base64_str)
                        emb = np.frombuffer(decoded_bytes, dtype=np.float64)
                    except Exception:
                        try:
                            embedding_json = embedding_bytes.decode('utf-8')
                            embedding_list = json.loads(embedding_json)
                            emb = np.array(embedding_list, dtype=np.float64)
                        except Exception:
                            pass

                    if emb is not None and len(emb) > 0:
                        students_list.append({
                            "id": row['id'],
                            "student_code": row['student_code'],
                            "full_name": row['full_name'],
                            "embedding": emb
                        })
        except Error as e:
            print(f"Error fetching all embeddings: {e}")
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    return students_list

