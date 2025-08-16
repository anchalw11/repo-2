#!/usr/bin/env python3
"""
Debug script to test the 405 error and identify the exact issue
"""
import requests
import json

def test_auth_endpoints():
    base_url = "https://traderedgepro.com"
    
    print("=== Testing Auth Endpoints ===")
    
    # Test 1: Check if auth test endpoint works
    print("\n1. Testing GET /api/auth/test")
    try:
        response = requests.get(f"{base_url}/api/auth/test")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 2: Check OPTIONS request to register
    print("\n2. Testing OPTIONS /api/auth/register")
    try:
        response = requests.options(f"{base_url}/api/auth/register")
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 3: Check POST request to register
    print("\n3. Testing POST /api/auth/register")
    test_data = {
        "firstName": "Test",
        "lastName": "User",
        "email": "test@example.com",
        "password": "testpass123",
        "plan_type": "premium"
    }
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/auth/register", 
            json=test_data,
            headers=headers
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        print(f"Response Headers: {dict(response.headers)}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 4: Check debug routes endpoint
    print("\n4. Testing GET /debug/routes")
    try:
        response = requests.get(f"{base_url}/debug/routes")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("Registered routes:")
            print(response.text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_auth_endpoints()
