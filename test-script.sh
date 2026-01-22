#!/bin/bash

# Node-ECX API Test Script
# This script tests all API endpoints

BASE_URL="http://localhost:3000"

echo "================================"
echo "Node-ECX API Test Script"
echo "================================"
echo ""

# Step 1: Login to get token
echo "1. LOGIN - Getting authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

echo "Response: $LOGIN_RESPONSE"
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token: $TOKEN"
echo ""

# Step 2: Get all cars
echo "2. GET ALL CARS..."
curl -s $BASE_URL/api/cars
echo ""
echo ""

# Step 3: Get car by ID
echo "3. GET CAR BY ID (ID=1)..."
curl -s $BASE_URL/api/cars/1
echo ""
echo ""

# Step 4: Add new car (Protected)
echo "4. ADD NEW CAR (Protected)..."
curl -s -X POST $BASE_URL/api/cars \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -d '{"brand":"Porsche","model":"911","year":2024,"color":"Red"}'
echo ""
echo ""

# Step 5: Delete car (Protected)
echo "5. DELETE CAR BY ID (ID=2) (Protected)..."
curl -s -X DELETE $BASE_URL/api/cars/2 \
  -H "Authorization: $TOKEN"
echo ""
echo ""

# Step 6: Logout
echo "6. LOGOUT..."
curl -s -X POST $BASE_URL/api/logout \
  -H "Authorization: $TOKEN"
echo ""
echo ""

echo "================================"
echo "Test Script Completed"
echo "================================"
