#!/usr/bin/env python3
"""
Test script to verify Razorpay credentials and API connectivity
"""
import razorpay
import os

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Get Razorpay credentials
key_id = os.getenv("RAZORPAY_KEY_ID", "rzp_test_XwigzkMzvBU19Q")
key_secret = os.getenv("RAZORPAY_KEY_SECRET", "vENWqX0XZE8RNzC4R6R5hxzr")

print(f"Testing Razorpay credentials:")
print(f"Key ID: {key_id}")
print(f"Key Secret: {key_secret[:10]}...")

try:
    # Initialize Razorpay client
    client = razorpay.Client(auth=(key_id, key_secret))
    
    # Test API connectivity by creating a test order
    order_data = {
        "amount": 100,  # 1 rupee in paise
        "currency": "INR",
        "receipt": "test_order_001",
        "notes": {
            "test": "true"
        }
    }
    
    print("\nCreating test order...")
    order = client.order.create(data=order_data)
    
    print("✅ SUCCESS: Razorpay credentials are working!")
    print(f"Order ID: {order['id']}")
    print(f"Order Status: {order['status']}")
    print(f"Amount: {order['amount']} paise")
    
except Exception as e:
    print(f"❌ ERROR: Razorpay test failed")
    print(f"Error: {str(e)}")
    print(f"Error type: {type(e).__name__}")
    
    # Additional debugging
    if "Authentication failed" in str(e):
        print("\n🔍 Authentication failed - check your credentials")
    elif "Connection" in str(e):
        print("\n🔍 Connection error - check your internet connection")
    else:
        print(f"\n🔍 Other error: {e}")
