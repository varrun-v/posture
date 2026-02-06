"""
MediaPipe-based posture detection module.
Analyzes pose landmarks to determine posture quality.
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Optional, Dict, Tuple
import base64


class PostureDetector:
    """Detects and analyzes posture from camera frames using MediaPipe."""
    
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
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
        
        Returns:
            dict with posture_status, angles, confidence, etc.
        """
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
        
        # Process with MediaPipe
        results = self.pose.process(rgb_frame)
        
        if not results.pose_landmarks:
            return {
                'posture_status': 'NO_PERSON',
                'confidence': 0.0,
                'message': 'No person detected in frame'
            }
        
        # Extract key landmarks
        landmarks = results.pose_landmarks.landmark
        
        # Get coordinates (normalized 0-1)
        # Nose
        nose = (landmarks[self.mp_pose.PoseLandmark.NOSE].x,
                landmarks[self.mp_pose.PoseLandmark.NOSE].y)
        
        # Shoulders
        left_shoulder = (landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER].x,
                        landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER].y)
        right_shoulder = (landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER].x,
                         landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER].y)
        
        # Hips
        left_hip = (landmarks[self.mp_pose.PoseLandmark.LEFT_HIP].x,
                   landmarks[self.mp_pose.PoseLandmark.LEFT_HIP].y)
        right_hip = (landmarks[self.mp_pose.PoseLandmark.RIGHT_HIP].x,
                    landmarks[self.mp_pose.PoseLandmark.RIGHT_HIP].y)
        
        # Ears (for head tilt)
        left_ear = (landmarks[self.mp_pose.PoseLandmark.LEFT_EAR].x,
                   landmarks[self.mp_pose.PoseLandmark.LEFT_EAR].y)
        
        # Calculate midpoints
        shoulder_mid = ((left_shoulder[0] + right_shoulder[0]) / 2,
                       (left_shoulder[1] + right_shoulder[1]) / 2)
        hip_mid = ((left_hip[0] + right_hip[0]) / 2,
                  (left_hip[1] + right_hip[1]) / 2)
        
        # Calculate angles
        # Neck angle: ear -> shoulder -> hip (should be close to 180° for good posture)
        neck_angle = self.calculate_angle(left_ear, shoulder_mid, hip_mid)
        
        # Torso angle: shoulder -> hip -> vertical reference
        # Create a vertical reference point below hip
        vertical_ref = (hip_mid[0], hip_mid[1] + 0.2)
        torso_angle = self.calculate_angle(shoulder_mid, hip_mid, vertical_ref)
        
        # Estimate distance from camera (using shoulder width as reference)
        shoulder_width = abs(left_shoulder[0] - right_shoulder[0])
        # Normalize: typical shoulder width in frame should be ~0.15-0.25
        distance_score = shoulder_width / 0.20  # 1.0 is ideal
        
        # Get average confidence
        confidence = np.mean([lm.visibility for lm in landmarks])
        
        # Determine posture status
        posture_status = self._classify_posture(neck_angle, torso_angle, distance_score)
        
        return {
            'posture_status': posture_status,
            'neck_angle': float(180 - neck_angle),  # Convert to forward lean angle
            'torso_angle': float(abs(90 - torso_angle)),  # Deviation from vertical
            'distance_score': float(distance_score),
            'confidence': float(confidence),
            'shoulder_width': float(shoulder_width)
        }
    
    def _classify_posture(self, neck_angle: float, torso_angle: float, distance_score: float) -> str:
        """
        Classify posture based on angles and distance.
        
        Thresholds:
        - Good posture: neck ~180°, torso ~90°, distance 0.75-1.25
        - Slouching: neck < 160° or torso < 75°
        - Too close: distance > 1.3
        """
        # Check distance first
        if distance_score > 1.3:
            return 'TOO_CLOSE'
        
        # Check neck forward lean (180° is straight, lower means leaning forward)
        if neck_angle < 160:
            return 'SLOUCHING'
        
        # Check torso alignment (90° is vertical, lower means slouching)
        if torso_angle < 75:
            return 'SLOUCHING'
        
        return 'GOOD'
    
    def __del__(self):
        """Cleanup MediaPipe resources."""
        if hasattr(self, 'pose'):
            self.pose.close()


# Global instance
_detector = None

def get_detector() -> PostureDetector:
    """Get or create global PostureDetector instance."""
    global _detector
    if _detector is None:
        _detector = PostureDetector()
    return _detector
