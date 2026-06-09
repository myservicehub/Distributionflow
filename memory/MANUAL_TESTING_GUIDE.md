# Date Range Filter - Manual Testing Guide

## Test Credentials
- **Email**: eseimieghandoris@yahoo.com
- **Password**: Doris@1981

---

## Testing Checklist

### ✅ Pre-Testing Verification (COMPLETED)
All 7 pages have been verified to contain:
- ✅ DateRangeFilter component import
- ✅ rangeLabel helper function
- ✅ DateRangeFilter UI component
- ✅ Range labels in titles/headers
- ✅ Contextual empty states

---

## Page-by-Page Testing Instructions

### 1. Orders Page (`/dashboard/orders`)

**What to Test:**
- [ ] Date filter dropdown shows: Today, Last 7 Days, Last 30 Days, Last 90 Days, All Time
- [ ] Default selection is "Last 30 Days"
- [ ] Page title shows "All Orders · Last 30 Days"
- [ ] Changing the filter updates the title (e.g., "All Orders · Last 7 Days")
- [ ] URL updates when filter changes (e.g., `?range=7d`)
- [ ] Orders list updates when filter changes
- [ ] Empty state says "No orders in the selected period" (if no data)
- [ ] Search bar works alongside date filter

**Server-Side Filtering:** ✅ Yes (API calls with `from` parameter)

---

### 2. Payments Page (`/dashboard/payments`)

**What to Test:**
- [ ] Date filter dropdown present
- [ ] Default selection is "Last 30 Days"
- [ ] Card title shows "Payment History · Last 30 Days"
- [ ] Title updates when filter changes
- [ ] URL updates when filter changes (e.g., `?range=90d`)
- [ ] Payments list updates when filter changes
- [ ] Empty state says "No payments in the selected period" (if no data)
- [ ] Search bar works alongside date filter

**Server-Side Filtering:** ✅ Yes (API calls with `from` parameter)

---

### 3. Activity Log Page (`/dashboard/activity-log`)

**What to Test:**
- [ ] Date filter dropdown present
- [ ] Default selection is "Last 30 Days"
- [ ] Page headers show "Recent Activity · Last 30 Days" (mobile & desktop)
- [ ] Title updates when filter changes
- [ ] URL updates when filter changes
- [ ] Activity logs update when filter changes
- [ ] Empty state says "No activity logs in the selected period" (if no data)
- [ ] Search bar works alongside date filter
- [ ] "Refresh" button works with date filter

**Server-Side Filtering:** ✅ Yes (API calls with `from` parameter)

**Note:** Admin-only page - requires admin role

---

### 4. Reports Page (`/dashboard/reports`)

**What to Test:**
- [ ] Navigate to "Sales by Rep" tab
- [ ] Date filter dropdown present on Sales tab
- [ ] Default selection is "Last 30 Days"
- [ ] Header shows "Sales Performance by Representative (Last 30 Days)"
- [ ] Changing filter updates the header
- [ ] Sales data updates when filter changes
- [ ] Product breakdown table shows filtered data
- [ ] "Export CSV" button exports filtered data
- [ ] Date filter does NOT appear on "Debt Aging" tab (snapshot data)
- [ ] Date filter does NOT appear on "Inventory Report" tab (snapshot data)

**Server-Side Filtering:** ✅ Yes (Sales tab only)

---

### 5. Notifications Page (`/dashboard/notifications`)

**What to Test:**
- [ ] Date filter dropdown present above notification list
- [ ] Default selection is "All Time"
- [ ] Card header shows "All Notifications · All Time"
- [ ] Changing filter updates the header (e.g., "All Notifications · Last 7 Days")
- [ ] Notification list filters client-side (no page reload)
- [ ] Stats cards (Total, Unread, Read, Today) remain unchanged (snapshots)
- [ ] Search bar works alongside date filter
- [ ] "Mark all read" button works with filtered view

**Server-Side Filtering:** ❌ No (Client-side filtering)

**Note:** URL does NOT update (low-priority page)

---

### 6. Manufacturer Supply Page (`/dashboard/manufacturer-supply`)

**What to Test:**
- [ ] Scroll down to "Recent Manufacturer Transactions" section
- [ ] Date filter dropdown present above the transactions table
- [ ] Default selection is "Last 30 Days"
- [ ] Changing filter updates the transactions history (client-side)
- [ ] Empty state says "No transactions in the selected period" (if no data)
- [ ] "Receive Empties" and "Return Empties" tabs work independently
- [ ] Warehouse inventory table is NOT filtered (snapshot data)

**Server-Side Filtering:** ❌ No (Client-side filtering on history only)

**Note:** Date filter only applies to transaction history, not warehouse inventory

---

### 7. Issue Empties Page (`/dashboard/issue-empties`)

**What to Test:**
- [ ] Scroll down to see "Movement History Filter" card (emerald-colored info card)
- [ ] Date filter dropdown present
- [ ] Default selection is "Last 30 Days"
- [ ] Help text explains: "When you click 'View History', you'll see movements from..."
- [ ] Click "View History" button on any warehouse item
- [ ] Movement History dialog shows filtered data
- [ ] Summary cards in dialog reflect the filtered range
- [ ] Movement table shows only movements in selected range
- [ ] Warehouse inventory table is NOT filtered (snapshot data)

**Server-Side Filtering:** ❌ No (Client-side filtering on movement history only)

**Note:** Date filter applies to "View History" dialog, not main inventory table

---

## Advanced Testing Scenarios

### Scenario 1: Date Range Transitions
1. Go to Orders page
2. Select "Last 7 Days"
3. Note the count of orders
4. Change to "Last 30 Days"
5. Verify order count increases (or stays same if no older data)
6. Change to "Today"
7. Verify only today's orders show

### Scenario 2: Empty States
1. Go to Orders page
2. Select "Today" filter
3. If no orders today, verify message says "No orders in the selected period"
4. Verify suggestion mentions trying a longer date range

### Scenario 3: URL Persistence (Orders/Payments/Activity Log only)
1. Go to Orders page
2. Select "Last 7 Days"
3. Copy the URL (should contain `?range=7d`)
4. Open URL in new tab
5. Verify page loads with "Last 7 Days" pre-selected
6. Verify title shows "All Orders · Last 7 Days"

### Scenario 4: Search + Date Filter Combination
1. Go to Orders page
2. Select "Last 30 Days"
3. Enter a search term (retailer name)
4. Verify results are filtered by BOTH date AND search
5. Change date to "Last 7 Days"
6. Verify search term persists and results update

### Scenario 5: Reports Tab Navigation
1. Go to Reports page (lands on "Debt Aging" tab)
2. Verify NO date filter present (snapshot data)
3. Click "Sales by Rep" tab
4. Verify date filter appears
5. Change filter and verify data updates
6. Click "Inventory Report" tab
7. Verify date filter disappears (snapshot data)

---

## Expected Behavior Summary

### Server-Side Pages (Orders, Payments, Activity Log, Reports Sales)
- ✅ Changing filter triggers API call
- ✅ URL updates with `?range=XXX` parameter
- ✅ Page reloads data from server
- ✅ Browser back/forward buttons work correctly
- ✅ Shareable URLs maintain filter state

### Client-Side Pages (Notifications, Manufacturer Supply, Issue Empties)
- ✅ Changing filter instantly updates display (no loading)
- ⚠️ URL does NOT update (by design)
- ✅ Filter state persists during page session
- ✅ Faster performance (no network calls)

---

## Common Issues to Watch For

### ❌ Potential Issues
1. **Date filter not visible**: Might need to scroll down (Manufacturer Supply, Issue Empties)
2. **Title doesn't update**: Check if rangeLabel is correctly displayed
3. **Filter doesn't work**: Check browser console for errors
4. **Old data still showing**: Hard refresh page (Ctrl+Shift+R)
5. **Empty state wrong**: Should mention "selected period", not generic message

### ✅ Expected Visual Indicators
- Date filter dropdown is clearly visible with emerald/green styling
- Selected range is highlighted in dropdown
- Page titles/headers show range label after " · " separator
- Empty states are contextual and helpful

---

## Testing Completion Checklist

- [ ] All 7 pages tested individually
- [ ] Date filters work on all pages
- [ ] Range labels display correctly in titles
- [ ] Empty states are contextual
- [ ] URL persistence works (Orders, Payments, Activity Log)
- [ ] Client-side filtering is instant (Notifications, etc.)
- [ ] Search + Filter combination works
- [ ] No console errors
- [ ] Mobile view tested (responsive design)

---

## Reporting Issues

If you find any issues, please document:
1. **Page Name**: Which page has the issue
2. **Filter Selection**: What date range you selected
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happened
5. **Screenshots**: If applicable
6. **Browser Console Errors**: Check developer tools

---

## Success Criteria ✅

The date range filter implementation is successful if:
1. ✅ All 7 pages have functional date filters
2. ✅ Filters update data correctly (server or client-side)
3. ✅ Range labels display in titles/headers
4. ✅ Empty states mention "the selected period"
5. ✅ URL persistence works on main pages
6. ✅ User experience is consistent across pages
7. ✅ No breaking bugs or console errors

---

**Testing Estimated Time**: 15-20 minutes for comprehensive testing
**Priority**: High (core feature affecting all dashboard pages)
**Status**: Ready for User Acceptance Testing
