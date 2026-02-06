#!/usr/bin/env python3
"""
API Test Script
Tests all API endpoints to verify they work correctly.
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"


def print_response(title, response):
    """Pretty print API response."""
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")


def test_api():
    """Test all API endpoints."""
    
    print("\n🧪 Testing Posture Monitor API")
    print("="*60)
    
    # Test 1: Health check
    print("\n1️⃣  Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print_response("Health Check", response)
    
    # Test 2: Get default user
    print("\n2️⃣  Getting default user...")
    user_id = 1  # Default user ID
    response = requests.get(f"{API_URL}/users/{user_id}")
    print_response("Get Default User", response)
    
    if response.status_code != 200:
        print("\n❌ Default user not found. Did you run setup_db.py?")
        return
    
    print(f"\n✅ Using default user (ID: {user_id})")
    
    # Test 3: Start session
    print(f"\n3️⃣  Starting monitoring session for user {user_id}...")
    session_data = {"user_id": user_id}
    response = requests.post(f"{API_URL}/sessions/start", json=session_data)
    print_response("Start Session", response)
    
    if response.status_code == 200:
        session_id = response.json()["id"]
        print(f"\n✅ Session started with ID: {session_id}")
    else:
        print("\n❌ Failed to start session")
        return
    
    # Test 4: Log posture data
    print(f"\n4️⃣  Logging posture data...")
    posture_logs = [
        {
            "session_id": session_id,
            "posture_status": "GOOD",
            "neck_angle": 10.5,
            "torso_angle": 5.2,
            "distance_score": 0.75,
            "confidence": 0.95
        },
        {
            "session_id": session_id,
            "posture_status": "SLOUCHING",
            "neck_angle": 35.2,
            "torso_angle": 25.8,
            "distance_score": 0.65,
            "confidence": 0.92
        },
        {
            "session_id": session_id,
            "posture_status": "GOOD",
            "neck_angle": 8.3,
            "torso_angle": 4.1,
            "distance_score": 0.80,
            "confidence": 0.97
        }
    ]
    
    for i, log in enumerate(posture_logs, 1):
        response = requests.post(f"{API_URL}/posture/log", json=log)
        if response.status_code == 200:
            print(f"  ✓ Log {i} created")
        else:
            print(f"  ✗ Log {i} failed")
    
    # Test 5: Get current posture
    print(f"\n5️⃣  Getting current posture status...")
    response = requests.get(f"{API_URL}/posture/session/{session_id}/current")
    print_response("Current Posture", response)
    
    # Test 6: Get session stats
    print(f"\n6️⃣  Getting session statistics...")
    response = requests.get(f"{API_URL}/posture/session/{session_id}/stats")
    print_response("Session Stats", response)
    
    # Test 7: Get posture history
    print(f"\n7️⃣  Getting posture history...")
    response = requests.get(f"{API_URL}/posture/session/{session_id}/history")
    print_response("Posture History", response)
    
    # Test 8: Get active session
    print(f"\n8️⃣  Getting active session for user {user_id}...")
    response = requests.get(f"{API_URL}/sessions/user/{user_id}/active")
    print_response("Active Session", response)
    
    # Test 9: Stop session
    print(f"\n9️⃣  Stopping session {session_id}...")
    response = requests.post(f"{API_URL}/sessions/{session_id}/stop")
    print_response("Stop Session", response)
    
    # Test 10: Get session details
    print(f"\n🔟 Getting final session details...")
    response = requests.get(f"{API_URL}/sessions/{session_id}")
    print_response("Session Details", response)
    
    print("\n" + "="*60)
    print("✅ All tests completed!")
    print("="*60)
    print(f"\nAPI Documentation: {BASE_URL}/docs")


if __name__ == "__main__":
    try:
        test_api()
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to API")
        print("Make sure the backend is running: uvicorn app.main:app --reload")
    except Exception as e:
        print(f"\n❌ Error: {e}")
