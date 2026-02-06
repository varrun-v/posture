"""
MediaPipe-based posture detection module.
Analyzes pose landmarks to determine posture quality using Tasks API.
"""

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from typing import Optional, Dict, Tuple
import base64
import os


class PostureDetector:
    """Detects and analyzes posture from camera frames using MediaPipe Tasks API."""
    
    def __init__(self):
        # Path to the pre-trained model
        current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        model_path = os.path.join(current_dir, 'models', 'pose_landmarker_lite.task')
        
        if not os.path.exists(model_path):
            print(f"✗ MediaPipe model file not found at {model_path}")
            # Try to download if missing (already done in setup but for robustness)
            self.detector = None
            return

        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.detector = vision.PoseLandmarker.create_from_options(options)
        
    def decode_frame(self, base64_frame: str) -> Optional[np.ndarray]:
        """Decode base64 image to numpy array."""
        try:
            # Remove data URL prefix if present
            if ',' in base64_frame:
                base64_frame = base64_frame.split(',')[1]
            
            # Decode base64 to bytes
            img_bytes = base64.b64decode(base64_frame)
            
            # Convert to numpy array
            nparr = np.frombuffer(img_bytes, np.uint8)
            
            # Decode image
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            return img
        except Exception as e:
            print(f"Error decoding frame: {e}")
            return None
    
    def calculate_angle(self, a: Tuple[float, float], b: Tuple[float, float], c: Tuple[float, float]) -> float:
        """Calculate angle between three points."""
        a = np.array(a)
        b = np.array(b)
        c = np.array(c)
        
        radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
        angle = np.abs(radians * 180.0 / np.pi)
        
        if angle > 180.0:
            angle = 360 - angle
            
        return angle
    
    def analyze_posture(self, frame_base64: str) -> Dict:
        """
        Analyze posture from a base64-encoded frame.
        """
        if self.detector is None:
            return {
                'posture_status': 'ERROR',
                'confidence': 0.0,
                'error': 'MediaPipe detector not initialized'
            }

        # Decode frame
        frame = self.decode_frame(frame_base64)
        if frame is None:
            return {
                'posture_status': 'NO_PERSON',
                'confidence': 0.0,
                'error': 'Failed to decode frame'
            }
        
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Convert to MediaPipe Image object
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        
        # Process with MediaPipe Landmarker
        detection_result = self.detector.detect(mp_image)
        
        if not detection_result.pose_landmarks:
            return {
                'posture_status': 'NO_PERSON',
                'confidence': 0.0,
                'message': 'No person detected in frame'
            }
        
        # Get the first pose detected
        landmarks = detection_result.pose_landmarks[0]
        
        # Landmark indices (legacy mapping still applies)
        # 0: nose, 11: left_shoulder, 12: right_shoulder, 23: left_hip, 24: right_hip, 7: left_ear
        
        # Extract coordinates
        # Nose
        nose = (landmarks[0].x, landmarks[0].y)
        
        # Shoulders
        left_shoulder = (landmarks[11].x, landmarks[11].y)
        right_shoulder = (landmarks[12].x, landmarks[12].y)
        
        # Hips
        left_hip = (landmarks[23].x, landmarks[23].y)
        right_hip = (landmarks[24].x, landmarks[24].y)
        
        # Ears (for head tilt)
        left_ear = (landmarks[7].x, landmarks[7].y)
        
        # Calculate midpoints
        shoulder_mid = ((left_shoulder[0] + right_shoulder[0]) / 2,
                       (left_shoulder[1] + right_shoulder[1]) / 2)
        hip_mid = ((left_hip[0] + right_hip[0]) / 2,
                  (left_hip[1] + right_hip[1]) / 2)
        
        # Calculate angles
        # Neck angle: ear -> shoulder -> hip (should be close to 180° for good posture)
        neck_angle = self.calculate_angle(left_ear, shoulder_mid, hip_mid)
        
        # Torso angle: shoulder -> hip -> vertical reference
        vertical_ref = (hip_mid[0], hip_mid[1] + 0.2)
        torso_angle = self.calculate_angle(shoulder_mid, hip_mid, vertical_ref)
        
        # Estimate distance from camera (using shoulder width as reference)
        shoulder_width = abs(left_shoulder[0] - right_shoulder[0])
        distance_score = shoulder_width / 0.20  # 1.0 is ideal
        
        # Get average confidence
        confidence = np.mean([lm.presence for lm in landmarks])
        
        # Determine posture status
        posture_status = self._classify_posture(neck_angle, torso_angle, distance_score)
        
        # Extract landmarks for skeleton visualization (normalized coordinates)
        # We only need a subset for the basic skeleton
        skeleton_landmarks = {}
        relevant_indices = [0, 7, 8, 11, 12, 23, 24] # nose, ears, shoulders, hips
        for idx in relevant_indices:
            skeleton_landmarks[str(idx)] = {
                'x': float(landmarks[idx].x),
                'y': float(landmarks[idx].y),
                'presence': float(landmarks[idx].presence)
            }
        
        return {
            'posture_status': posture_status,
            'neck_angle': float(180 - neck_angle),
            'torso_angle': float(abs(90 - torso_angle)),
            'distance_score': float(distance_score),
            'confidence': float(confidence),
            'shoulder_width': float(shoulder_width),
            'landmarks': skeleton_landmarks
        }
    
    def _classify_posture(self, neck_angle: float, torso_angle: float, distance_score: float) -> str:
        """Classify posture based on angles and distance."""
        # More relaxed thresholds for accuracy
        if distance_score > 1.4: # Was 1.3
            return 'TOO_CLOSE'
        
        if neck_angle < 155: # Was 160
            return 'SLOUCHING'
        
        if torso_angle < 70: # Was 75
            return 'SLOUCHING'
        
        return 'GOOD'
    
    def __del__(self):
        """Cleanup detector."""
        if hasattr(self, 'detector') and self.detector:
            self.detector.close()


# Global instance
_detector = None

def get_detector() -> PostureDetector:
    """Get or create global PostureDetector instance."""
    global _detector
    if _detector is None:
        _detector = PostureDetector()
    return _detector
