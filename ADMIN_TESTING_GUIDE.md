# FarmConnect Admin System - Complete Testing Guide

## System Status
✅ **All Components Ready for Testing**
- Backend: Running on port 5001
- Frontend: Running via Expo with ngrok tunnel
- Database: MongoDB with test data
- Admin Dashboard: Fully implemented
- KYC Management: Fully implemented

## Test Environment Setup

### Test Credentials
```
Admin User:
  Phone: 9000000001
  Password: Admin@123
  Role: admin

Farmer User (for KYC submission):
  Phone: 9000000002
  Password: Farmer@123
  Role: farmer
  KYC Status: SUBMITTED (ready for verification)

Trader User:
  Phone: 9000000003
  Password: Trader@123
  Role: trader

Transport User:
  Phone: 9000000004
  Password: Transport@123
  Role: transport
```

### Current Database State
```
Total Users: 4
  - 1 Admin
  - 1 Farmer (with KYC submitted)
  - 1 Trader
  - 1 Transporter

Total Crops: 4
Total KYC Records: 1 (status: submitted, ready for approval/rejection)
```

---

## Testing Workflow

### PHASE 1: Admin Dashboard Verification

#### Test 1.1: Login as Admin
1. Open Expo app on your device/simulator
2. Select **Admin Login** option
3. Enter credentials:
   - Phone: `9000000001`
   - Password: `Admin@123`
4. **Expected**: Login successful, redirected to Admin Dashboard

#### Test 1.2: View Dashboard Statistics
1. On Admin Dashboard, verify the following statistics display:
   - **Users**: 4
   - **Crops**: 4
   - **Proposals**: 0
   - **Orders**: 0
   - **Agreements**: 0
   - **Disputes**: 0

2. Verify **User Distribution** section shows:
   - Farmers: 1
   - Traders: 1
   - Transporters: 1
   - Admins: 1
   - Active: 4

3. Verify **Financial Snapshot** displays correctly (may show 0 if no transactions)

4. Verify **Last 7 Days** metrics display

#### Test 1.3: Dashboard Pull-to-Refresh
1. On Dashboard, pull down to refresh
2. **Expected**: Stats reload with updated data
3. Verify "Loading admin dashboard..." spinner appears briefly

#### Test 1.4: Logout
1. Tap the power icon in dashboard header
2. **Expected**: Logout successful, redirected to login screen

---

### PHASE 2: KYC Management Verification

#### Test 2.1: Navigate to KYC Tab
1. Login as Admin (use credentials from above)
2. On the bottom tab navigation, tap **KYC** tab
3. **Expected**: KYC Verification screen appears
4. **Expected**: List shows 1 KYC record (Ramesh Patil - Farmer)

#### Test 2.2: View KYC Record Details
1. On KYC Verification screen, tap on the KYC record
2. **Expected Modal appears with:
   - Name: Ramesh Patil
   - Phone: 9000000002
   - Role: FARMER
   - Status Badge: "Pending Review" (orange)
   - Submitted Date
   - KYC Information displayed
   - "Reject" and "Approve" buttons visible

3. **Verify all fields display correctly**

#### Test 2.3: Test KYC Approval Workflow
1. On KYC detail modal, tap **Approve** button
2. **Expected**: Confirmation dialog appears
3. Tap "Approve" in confirmation dialog
4. **Expected**:
   - Success alert message
   - Modal closes
   - KYC list updates with status change
   - Status badge changes to "Approved" (green)

#### Test 2.4: Test KYC Rejection Workflow
1. Tap on KYC record again to view details
2. Enter rejection reason in text input:
   ```
   "Document quality not clear. Please resubmit with better photos."
   ```
3. Tap **Reject** button
4. **Expected**:
   - Dialog closes
   - Success alert appears
   - Modal closes
   - KYC list updates with status change
   - Status badge changes to "Rejected" (red)

#### Test 2.5: View Rejected KYC Record
1. Tap on the rejected KYC record
2. **Expected**:
   - Status shows "Rejected"
   - Rejection reason visible
   - Approve/Reject buttons NOT visible (only Close button)

#### Test 2.6: KYC List Refresh
1. Pull down on KYC list to refresh
2. **Expected**: List reloads and shows current KYC status

---

### PHASE 3: Error Handling Verification

#### Test 3.1: Backend Connectivity Error
1. Stop the backend server
2. Try to navigate to Dashboard or KYC tab
3. **Expected**: Error banner appears with helpful message
4. Restart backend and refresh
5. **Expected**: Stats load successfully again

#### Test 3.2: Empty Rejection Reason
1. Navigate to KYC tab
2. If there's a "Pending Review" KYC record, try to reject without entering reason
3. **Expected**: Alert dialog: "Required - Please enter a rejection reason"

---

### PHASE 4: Navigation Verification

#### Test 4.1: Tab Navigation
1. Verify all tabs are present and accessible:
   - ✅ Dashboard
   - ✅ Users
   - ✅ Oversight
   - ✅ Finance
   - ✅ Disputes
   - ✅ KYC (NEW)

2. **Expected**: Can switch between tabs without errors

#### Test 4.2: Tab Persistence
1. Navigate to each tab (one by one)
2. Note the displayed content
3. Navigate back to previous tabs
4. **Expected**: Content persists correctly, no data loss

---

### PHASE 5: Data Consistency Verification

#### Test 5.1: API Response Verification
1. Open browser developer console / API testing tool (curl/Postman)
2. Make a curl request to admin stats:
   ```bash
   curl -X GET "http://localhost:5001/api/admin/stats" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" | jq .
   ```
3. **Expected**: Response matches dashboard display
   - Users should be 4
   - Crops should be 4
   - All other metrics match

#### Test 5.2: KYC API Response Verification
1. Make a curl request to get-all-kyc:
   ```bash
   curl -X GET "http://localhost:5001/api/auth/get-all-kyc" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" | jq .
   ```
2. **Expected**: Response includes all fields (id, _id, name, phone, role, kycStatus, kycDetails, etc.)

---

### PHASE 6: Complete End-to-End Workflow

#### Test 6.1: Full KYC Lifecycle
1. **Start**: KYC submitted by farmer
2. Admin logs in and navigates to KYC tab
3. Admin reviews KYC record details
4. Admin approves KYC
5. **Verify**: Status updates to "Approved"
6. **Farmer Impact**: Farmer account now has `kycStatus: approved`

#### Test 6.2: Full Rejection Workflow
1. **Start**: Another KYC submitted (or test reject the approved one)
2. Admin navigates to KYC tab
3. Admin reviews and rejects with reason
4. **Verify**: Status updates to "Rejected"
5. **Verify**: Rejection reason stored and visible
6. **Expected**: Farmer cannot proceed with certain operations until KYC resubmitted

---

## Performance Checklist

- [ ] Dashboard loads within 2-3 seconds
- [ ] KYC list loads within 2-3 seconds
- [ ] Scroll is smooth (60 FPS)
- [ ] No lag when scrolling KYC list
- [ ] Pull-to-refresh completes smoothly
- [ ] Modal opens/closes smoothly
- [ ] No console errors or warnings
- [ ] API responses under 1 second
- [ ] Images load properly
- [ ] Buttons respond to taps immediately

---

## UI/UX Checklist

- [ ] All text is readable (good contrast)
- [ ] Layout is responsive on different screen sizes
- [ ] Icons display correctly
- [ ] Color coding is clear (submitted=orange, approved=green, rejected=red)
- [ ] Status badges are visible and readable
- [ ] Buttons are tap-friendly (min 44xi44 px)
- [ ] Error messages are helpful
- [ ] Success notifications display
- [ ] Loading spinners appear appropriately
- [ ] Empty states show helpful messages

---

## Regression Testing

### Existing Features Still Working?
- [ ] Farmer can login and view dashboard
- [ ] Farmer can create crops
- [ ] Farmer can view submitted proposals
- [ ] Trader can login and browse crops
- [ ] Trader can submit proposals
- [ ] Trader can view their proposals
- [ ] Transport can login
- [ ] All role-based navigations work

---

## Console Logging Verification

When running the above tests, verify console logs appear with appropriate prefixes:

```
✅ Stats loaded: { success: true, data: {...} }
📊 Admin stats response: {...}
📋 KYC records: [...]
✅ KYC approved: {...}
❌ KYC rejected: {...}
```

These indicate all API calls are working and can be used for debugging.

---

## Troubleshooting Guide

### Issue: Admin dashboard shows 0 for all stats
**Solution**: 
1. Verify backend is running: `curl http://localhost:5001/api/health`
2. Check network connectivity
3. Clear Expo cache: `expo r -c`
4. Verify JWT token is valid

### Issue: KYC list is empty
**Solution**:
1. Verify there are KYC records in database
2. Check if user is logged in as admin
3. Verify backend `/api/auth/get-all-kyc` endpoint
4. Test with curl: `curl -H "Authorization: Bearer TOKEN" http://localhost:5001/api/auth/get-all-kyc`

### Issue: Approval/rejection not working
**Solution**:
1. Verify KYC ID is correct
2. Check rejection reason is not empty
3. Verify admin has proper permissions
4. Check backend console for errors
5. Test API directly with curl

### Issue: Authorization errors
**Solution**:
1. Re-login to get fresh token
2. Verify token is not expired
3. Check Authorization header format: `Authorization: Bearer TOKEN`
4. Verify backend JWT_SECRET matches

---

## API Test Commands

### Get Admin Token
```bash
ADMIN_TOKEN=$(curl -s -X POST "http://localhost:5001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"9000000001","password":"Admin@123"}' | jq -r '.token')
echo $ADMIN_TOKEN
```

### Test Admin Stats
```bash
curl -X GET "http://localhost:5001/api/admin/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq '.data.totals'
```

### Test Get All KYC
```bash
curl -X GET "http://localhost:5001/api/auth/get-all-kyc" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq '.data'
```

### Test Approve KYC
```bash
KYC_ID="69de27c679a93c6c538d9f9b"
curl -X PUT "http://localhost:5001/api/auth/kyc-approve/$KYC_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.data.kycStatus'
```

### Test Reject KYC
```bash
KYC_ID="69de27c679a93c6c538d9f9b"
curl -X PUT "http://localhost:5001/api/auth/kyc-reject/$KYC_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Document quality poor"}' | jq '.data.kycStatus'
```

---

## Success Criteria

### ✅ All tests should pass:
1. Admin can login successfully
2. Dashboard statistics display correctly (users=4, crops=4, etc.)
3. Pull-to-refresh works on dashboard
4. KYC tab appears in navigation
5. KYC list shows all pending applications
6. Admin can approve KYC with single click
7. Admin can reject KYC with reason input
8. Status updates immediately after action
9. No errors in console
10. All UI elements are aligned and readable
11. API responses are fast (<1s)
12. Data persists correctly in database

---

## Sign-Off

Once all tests pass:
- [ ] Frontend tests completed
- [ ] Backend tests completed
- [ ] Integration tests completed
- [ ] Performance acceptable
- [ ] UI/UX acceptable
- [ ] No blocking bugs

**Ready for**: Production Deployment ✅

---

**Last Updated**: April 16, 2026
**Test Environment**: Expo + Backend (localhost:5001)
**Frontend Network**: ngrok tunnel (https://kina-hypersubtle-irremeably.ngrok-free.dev/api)
