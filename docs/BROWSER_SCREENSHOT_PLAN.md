# Browser Screenshot Plan

## Current Status

### ✅ Fixed Issues
1. **Storage Permission Issue**: Fixed `/storage/app` directory permissions in Docker container
2. **API Connectivity**: API is returning 200 status with test data (20+ video jobs)
3. **JavaScript Error**: Fixed `TypeError: $setup.selection.selected.has is not a function` by updating template to use `selection.selected.value.has()`
4. **Filter Bar Styling**: Successfully implemented smaller, more elegant filter bar

### ❌ Remaining Issues
1. **Data Not Rendering**: API returns data successfully, but videos are not displaying in the browser grid
2. **Empty State**: Browser shows "Scroll to load" message but no video cards are visible
3. **Authentication**: User may not be authenticated (404 on `/api/v1/auth/me`)

## Issues to Fix

### Issue 1: Data Not Rendering in Browser Grid
**Problem**: API returns video jobs data (200 status), but the browser grid is empty.

**Possible Causes**:
- Data not being properly stored in Vuex store
- `videos` computed property not correctly processing the data
- Template conditional rendering preventing display
- Missing authentication causing data to be filtered out

**Investigation Steps**:
1. Check Vuex store state after API call
2. Verify `rawJobs` computed property is receiving data
3. Check `normalizedFiles` and `videos` computed properties
4. Verify authentication state
5. Check browser console for any errors during data processing

**Fix Plan**:
1. Add console logging to track data flow
2. Verify `store.dispatch("videojobs/list")` is storing data correctly
3. Check if `normalizeVideoJob` function is working correctly
4. Ensure `orderedVideos` computed property is correctly filtering/sorting
5. Verify template conditions (`v-if="videos.length === 0"`) are not preventing render

### Issue 2: Authentication Required
**Problem**: `/api/v1/auth/me` returns 404, suggesting user is not authenticated.

**Fix Plan**:
1. Check if authentication is required for `/api/v1/video-jobs` endpoint
2. If auth is optional, ensure unauthenticated users can still see data
3. If auth is required, implement login flow or use test user credentials
4. Verify API endpoint permissions

### Issue 3: Progressive Loading
**Problem**: Browser shows "Scroll to load" but data should be visible immediately.

**Fix Plan**:
1. Check if `onMounted` hook is calling `refreshData()` correctly
2. Verify `loadJobs()` function is being called
3. Check if intersection observer is preventing initial render
4. Ensure `renderLimit` is not set too low
5. Verify `orderedVideos` is not empty due to filtering

## Screenshot States to Capture

Once data is rendering, capture screenshots of:

1. **Default State**: Browser with test data loaded (grid view with video cards)
2. **With Selection**: One or more video cards selected
3. **Metadata Panel Open**: Metadata panel visible with selected video(s)
4. **Filters Applied**: Filter popover open with active filters
5. **Different Sort Orders**: Name ↑, Name ↓, Created ↑, Created ↓, Random
6. **Different Zoom Levels**: Minimum, medium, maximum zoom
7. **Files View Mode**: Switch to files view (if applicable)
8. **Grouped by Tags**: Tag grouping enabled (if applicable)
9. **Empty State**: No data available (for documentation)

## Implementation Steps

### Step 1: Debug Data Loading
```javascript
// Add to Browser.vue onMounted
console.log('Raw jobs:', rawJobs.value);
console.log('Normalized videos:', videos.value);
console.log('Ordered videos:', orderedVideos.value);
```

### Step 2: Verify Store State
```javascript
// Check Vuex store
console.log('Store state:', store.state.videojobs);
```

### Step 3: Check API Response
- Verify API response structure matches expected format
- Check if data is in `data.data` or `data` directly
- Verify JSON:API format is being parsed correctly

### Step 4: Fix Authentication (if needed)
- Add test user login or make endpoint public for testing
- Verify JWT token is being sent with requests

### Step 5: Test Rendering
- Manually set test data in component to verify template works
- Check if video cards render with hardcoded data
- Verify CSS/styling is not hiding content

## Files to Check/Modify

1. `/home/jani/workspace/mage-app/src/views/pages/Browser.vue`
   - `onMounted` hook
   - `loadJobs()` function
   - `videos` computed property
   - Template rendering conditions

2. `/home/jani/workspace/mage-app/src/store/videojobs.module.js`
   - `SET_LIST` mutation
   - `list` getter
   - Data structure

3. `/home/jani/workspace/mage-app/src/services/videojobs.service.js`
   - API response parsing
   - Data transformation

4. `/home/jani/workspace/mage-app/src/browser/utils/normalizeVideoJob.js`
   - Video job normalization logic

## Next Actions

1. ✅ Fix JavaScript error (completed)
2. ⏳ Debug why data isn't rendering
3. ⏳ Fix authentication if needed
4. ⏳ Verify data flow from API → Store → Component
5. ⏳ Capture screenshots in different states

