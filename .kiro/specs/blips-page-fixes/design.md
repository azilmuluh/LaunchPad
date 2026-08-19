# Blips Page Fixes Bugfix Design

## Overview

The Blips page in LaunchPad has three critical bugs that prevent users from refreshing content, searching for specific blips, and loading additional pages through infinite scroll. This design formalizes the bug conditions and outlines a targeted fix approach that preserves all existing functionality (likes, comments, sharing, deletion, video autoplay) while restoring the refresh, search, and pagination features.

The bugs stem from missing state dependencies in React hooks and incomplete event handling logic. The fix will add proper useEffect dependencies, correct the scroll trigger logic, and ensure the refresh button generates a new nonce value.

## Glossary

- **Bug_Condition (C)**: The conditions that trigger each of the three bugs (refresh not working, search not filtering, infinite scroll not loading)
- **Property (P)**: The desired behavior for each bug condition (refresh fetches new content, search filters results, scroll loads more pages)
- **Preservation**: Existing functionality that must remain unchanged (likes, comments, sharing, deletion, initial load, video autoplay)
- **BlipsPage**: The React component in `src/pages/BlipsPage.tsx` that displays short-form video content
- **fetchBlips**: The async function that fetches blips from the API with pagination, search, and nonce parameters
- **handleRefresh**: The function invoked when the user clicks the refresh button
- **onScroll**: The scroll event handler that detects when the user reaches 70% scroll depth
- **nonce**: A random string used to randomize API results on each refresh
- **debouncedSearch**: The search value after a 450ms debounce delay
- **hasMore**: Boolean state indicating whether additional pages are available to load
- **loadingMore**: Boolean state indicating whether a pagination request is in progress

## Bug Details

### Bug Condition

The bugs manifest in three distinct scenarios within the BlipsPage component:

**Bug 1: Refresh Button** - The refresh button click does not trigger a fresh API request with a new nonce value, causing the same content to be displayed repeatedly.

**Bug 2: Search Bar** - The search input updates the `debouncedSearch` state, but no useEffect hook responds to this change by calling `fetchBlips` with the search parameter.

**Bug 3: Infinite Scroll** - The `onScroll` handler calculates scroll percentage but does not call `loadMore()` when the threshold is reached, or the logic is incorrectly structured.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type UserAction
  OUTPUT: boolean
  
  RETURN (
    (input.type == 'button_click' AND input.target == 'refresh_button' AND nonce_not_regenerated)
    OR
    (input.type == 'text_input' AND input.target == 'search_bar' AND search_value_changed AND NOT api_called_with_search)
    OR
    (input.type == 'scroll_event' AND scroll_percentage >= 0.7 AND hasMore == true AND NOT next_page_loaded)
  )
END FUNCTION
```

### Examples

**Bug 1 Examples:**
- User clicks refresh button → Same blips displayed (nonce value unchanged)
- User clicks refresh 3 times in a row → No variation in content order or selection

**Bug 2 Examples:**
- User types "scholarship" in search bar → All blips still displayed instead of filtered results
- User types "engineering" and waits 1 second → No API request made with `search=engineering` parameter
- User clears search by clicking X button → Full list not reloaded

**Bug 3 Examples:**
- User scrolls to 80% of page height → Next page not loaded despite `hasMore: true`
- User reaches end of 10 blips (first page) → Loading spinner not shown, no additional blips fetched
- User scrolls multiple times after API returns 5 blips → System continues showing loading spinner incorrectly

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Liking a blip must continue to update optimistically and sync with backend
- Opening comments must continue to fetch and display comments correctly
- Sharing a blip must continue to generate the correct shareable URL
- Creating a new blip must continue to add it to the top of the feed
- Deleting a user's own blip must continue to remove it from the feed
- Initial page load must continue to fetch and display the first page of blips
- Vertical scrolling must continue to track active blip index and update video autoplay
- Failed video loads must continue to display fallback error UI with retry option

**Scope:**
All inputs that do NOT involve the refresh button click, search bar input changes, or scrolling to 70%+ depth should be completely unaffected by this fix. This includes:
- Mouse clicks on like, comment, share, bookmark, and delete buttons
- Video interaction (play, pause, mute, unmute)
- Modal interactions (roadmap modal, create blip modal, comments panel)
- Keyboard navigation within input fields
- URL sharing and clipboard operations

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Bug 1 - Missing Refresh Logic**: The `handleRefresh` function may not be properly calling `fetchBlips` with the `refresh=true` parameter, or the nonce is not being regenerated before the API call.
   - Current code: `handleRefresh` creates a new nonce and sets state, but state updates are asynchronous
   - The `fetchBlips` call may be using the old nonce value because the state hasn't updated yet

2. **Bug 2 - Missing Search Effect**: There is no useEffect hook that listens to `debouncedSearch` and triggers `fetchBlips` when the search value changes.
   - The debounce mechanism is implemented but nothing consumes the `debouncedSearch` value
   - The search input updates state but doesn't trigger a re-fetch

3. **Bug 3 - Incorrect Scroll Logic**: The `onScroll` function calculates scroll percentage but may not be calling `loadMore()`, or the conditions prevent it from firing.
   - The scroll handler may have incorrect threshold logic
   - The `hasMore` flag may not be updated correctly when API returns fewer than 10 items
   - Duplicate blips may not be filtered when appending new pages

4. **State Management Issues**: React state updates are asynchronous, so calling `setNonce(n)` followed immediately by `fetchBlips(..., nonce)` will use the old nonce value.
   - Need to pass the new nonce directly to `fetchBlips` instead of relying on state

## Correctness Properties

Property 1: Bug Condition - Refresh Generates New Content

_For any_ button click on the refresh button, the fixed BlipsPage component SHALL generate a new nonce value, pass it directly to fetchBlips with refresh=true, reset the blips array to empty, reset page to 1, reset hasMore to true, and scroll to the top, causing fresh randomized content to be fetched and displayed.

**Validates: Requirements 2.1, 2.2**

Property 2: Bug Condition - Search Filters Blips

_For any_ change to the debouncedSearch value (after the 450ms debounce delay), the fixed BlipsPage component SHALL call fetchBlips with the search parameter, reset the page to 1, reset hasMore to true, and display only blips matching the search term. When the search is cleared (empty string), the component SHALL reload the full unfiltered list.

**Validates: Requirements 2.3, 2.4, 2.5**

Property 3: Bug Condition - Infinite Scroll Loads More Pages

_For any_ scroll event where the scroll percentage reaches 70% or more AND hasMore is true AND not currently loading, the fixed BlipsPage component SHALL increment the page counter, call fetchBlips with the next page number, append deduplicated results to the blips array, and set hasMore to false when the API returns fewer than 10 blips or an empty array.

**Validates: Requirements 2.6, 2.7, 2.8**

Property 4: Preservation - Non-Buggy Interactions Unchanged

_For any_ user interaction that is NOT a refresh button click, search input change, or scroll event (including likes, comments, shares, deletes, video controls, modal interactions), the fixed BlipsPage component SHALL produce exactly the same behavior as the original component, preserving all existing functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/pages/BlipsPage.tsx`

**Function**: Multiple hooks and event handlers

**Specific Changes**:

1. **Add Search Effect Hook**: Create a useEffect that listens to `debouncedSearch` and triggers a fresh fetch when the search value changes
   - Add `useEffect(() => { /* reset and fetch */ }, [debouncedSearch])`
   - Reset page to 1, hasMore to true, blips to empty array
   - Call `fetchBlips(1, false, debouncedSearch, newNonce())`

2. **Fix Refresh Handler**: Ensure the new nonce is passed directly to `fetchBlips` instead of relying on state update
   - The current code already does this: `fetchBlips(1, true, debouncedSearch, n)` where `n` is the new nonce
   - Verify that `refresh=true` parameter is correctly handled in the API call

3. **Fix Infinite Scroll Logic**: Ensure `loadMore()` is called when scroll threshold is reached
   - The `onScroll` handler already has the logic to call `loadMore()`
   - Verify that the conditions `hasMore && !loadingMore && !loading` are not preventing the call
   - Ensure `hasMore` is set to false when API returns < 10 items

4. **Ensure Deduplication**: Confirm that appending logic filters duplicates by both `id` and `embed_id`
   - Current code already implements this in `fetchBlips` when `pageNum > 1`
   - Verify the logic is correct

5. **Verify hasMore Logic**: Ensure `hasMore` is set to false when fewer than 10 blips are returned
   - Current code: `if (!data || data.length === 0 || data.length < 10) { setHasMore(false); }`
   - This looks correct but needs testing

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fixes work correctly and preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate user interactions (button clicks, text input, scroll events) and observe the component's behavior on UNFIXED code. Use React Testing Library to mount the component, simulate events, and assert on API calls and rendered output.

**Test Cases**:
1. **Refresh Button Test**: Click refresh button twice, observe that the nonce parameter in API calls is identical (will fail on unfixed code)
2. **Search Input Test**: Type "test" in search bar, wait 500ms, observe that no API call is made with `search=test` parameter (will fail on unfixed code)
3. **Search Clear Test**: Type "test", then clear by clicking X, observe that full list is not reloaded (will fail on unfixed code)
4. **Infinite Scroll Test**: Render component with 15 blips, scroll to 75% depth, observe that page 2 is not fetched (will fail on unfixed code)
5. **HasMore False Test**: Mock API to return 5 blips, scroll to bottom twice, observe that loading spinner continues showing (will fail on unfixed code)

**Expected Counterexamples**:
- Refresh button clicks do not change nonce value
- Search input changes do not trigger API calls
- Scroll events do not increment page counter
- Possible causes: missing useEffect dependency, incorrect state management, faulty scroll logic

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := BlipsPage_fixed(input)
  ASSERT expectedBehavior(result)
END FOR
```

**Specific Assertions**:
- Bug 1: After refresh click, assert API called with new nonce and `refresh=true`
- Bug 2: After search input change, assert API called with `search=<value>` parameter
- Bug 3: After scroll to 70%+, assert API called with `page=<next>` parameter

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT BlipsPage_original(input) = BlipsPage_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for likes, comments, shares, and other interactions, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Like Preservation**: Click like button, observe optimistic update and API call behavior on unfixed code, then verify same behavior after fix
2. **Comment Preservation**: Open comments panel, observe fetch and render behavior on unfixed code, then verify same behavior after fix
3. **Share Preservation**: Click share button, observe URL generation and share API behavior on unfixed code, then verify same behavior after fix
4. **Delete Preservation**: Click delete button (as creator), observe confirmation and removal behavior on unfixed code, then verify same behavior after fix
5. **Initial Load Preservation**: Mount component, observe first page fetch on unfixed code, then verify same behavior after fix
6. **Video Autoplay Preservation**: Scroll between blips, observe active index tracking on unfixed code, then verify same behavior after fix

### Unit Tests

- Test `handleRefresh` function directly to verify nonce regeneration and API call
- Test search debounce mechanism to verify 450ms delay
- Test `onScroll` handler to verify scroll percentage calculation and `loadMore` trigger
- Test `fetchBlips` function to verify deduplication logic when appending pages
- Test `hasMore` state updates based on API response length
- Test edge cases: empty search, out-of-range scroll, API errors

### Property-Based Tests

- Generate random sequences of user actions (clicks, scrolls, text input) and verify component state consistency
- Generate random API response sizes (0-20 blips) and verify pagination logic handles all cases correctly
- Generate random search terms and verify filtering behavior across many scenarios
- Test that all non-refresh, non-search, non-scroll interactions produce identical behavior before and after fix

### Integration Tests

- Test full user flow: load page → search for term → scroll to load more → refresh → verify new randomized content
- Test search clearing: type search → click X → verify full list reloaded
- Test infinite scroll until no more pages: scroll repeatedly → verify loading stops when hasMore becomes false
- Test refresh during search: type search → wait for results → click refresh → verify search is preserved and new results fetched
- Test video autoplay during pagination: scroll to page 2 → verify active video continues playing correctly
