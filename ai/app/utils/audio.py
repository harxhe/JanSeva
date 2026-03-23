import os
import requests
import uuid
from typing import Optional

TEMP_DIR = "temp"

if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

def download_audio(url: str) -> str:
    """Downloads audio from a URL and returns the local file path."""
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    file_extension = url.split('.')[-1] if '.' in url else 'mp3'
    # Sanitize extension
    if len(file_extension) > 5:
        file_extension = 'mp3'
        
    file_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}.{file_extension}")
    
    with open(file_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
            
    return file_path

def save_upload(file_content: bytes, filename: str) -> str:
    """Saves uploaded file bytes and returns the local file path."""
    file_extension = filename.split('.')[-1] if '.' in filename else 'mp3'
    file_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}.{file_extension}")
    
    with open(file_path, 'wb') as f:
        f.write(file_content)
        
    return file_path

def delete_temp_file(file_path: str):
    """Safely deletes a temporary file."""
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Error deleting temp file {file_path}: {e}")
