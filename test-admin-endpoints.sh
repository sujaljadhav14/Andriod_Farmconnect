#!/bin/bash

# Test script for Admin Dashboard and KYC Management
# This script tests all admin endpoints to verify they are working correctly

API_BASE="http://localhost:5001/api"
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MDAwMDAwMDAxIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjk0NzcwNDAwfQ.fake"

echo "==========================================="
echo "FarmConnect Admin API Test Suite"
echo "==========================================="
echo ""

# Test 1: Admin Stats Endpoint
echo "TEST 1: Admin Stats Endpoint"
echo "GET /api/admin/stats"
curl -s -X GET "$API_BASE/admin/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq .
echo ""
echo ""

# Test 2: Get All KYC Records
echo "TEST 2: Get All KYC Records"
echo "GET /api/auth/get-all-kyc"
curl -s -X GET "$API_BASE/auth/get-all-kyc" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq .
echo ""
echo ""

# Test 3: Test KYC Approval (using first KYC record)
echo "TEST 3: KYC Approval (example - needs valid KYC ID)"
echo "PUT /api/auth/kyc-approve/:kycId"
echo "NOTE: This is a demo - actual KYC ID needed from Test 2"
echo ""
echo ""

# Test 4: Test KYC Rejection (using first KYC record)
echo "TEST 4: KYC Rejection (example - needs valid KYC ID)"
echo "PUT /api/auth/kyc-reject/:kycId"
echo "NOTE: This is a demo - actual KYC ID needed from Test 2"
echo ""
echo ""

echo "==========================================="
echo "Test Suite Complete"
echo "==========================================="
