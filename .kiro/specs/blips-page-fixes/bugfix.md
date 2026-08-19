# Bugfix Requirements Document

## Introduction

The Blips page in the LaunchPad application has three critical bugs affecting user experience:
1. The refresh button does not properly reload fresh content from the server
2. The search bar does not filter blips based on user input
3. Infinite scroll does not load additional pages of content when scrolling to the bottom

These bugs prevent users from discovering new content, finding specific blips, and accessing the full catalog of available videos. This bugfix will restore the intended functionality of content refresh, search filtering, and pagination.

## Bug Analysis

### Current Behavior (Defect)

#### Bug 1: Refresh Button Does Not Reload Content

1.1 WHEN the user clicks the refresh button THEN the system displays the same blips without fetching fresh content from the API

1.2 WHEN the user clicks refresh multiple times THEN the system does not show different content on each refresh despite the nonce mechanism being designed to randomize results

#### Bug 2: Search Bar Does Not Filter Blips

1.3 WHEN the user types a search query in the search bar THEN the system does not filter the displayed blips to match the search term

1.4 WHEN the user enters a search term and waits for the debounce delay THEN the system does not make an API request with the search parameter

1.5 WHEN the user clears the search input by clicking the X button THEN the system does not reload the full unfiltered list of blips

#### Bug 3: Infinite Scroll Does Not Load More Content

1.6 WHEN the user scrolls to 70% or more of the page height THEN the system does not load the next page of blips

1.7 WHEN the user scrolls to the bottom and the API returns fewer than 10 blips THEN the system incorrectly continues showing the loading spinner on subsequent scroll attempts

1.8 WHEN multiple pages are loaded THEN the system may display duplicate blips with the same embed_id or id

### Expected Behavior (Correct)

#### Bug 1: Refresh Button Should Reload Fresh Content

2.1 WHEN the user clicks the refresh button THEN the system SHALL generate a new nonce value and fetch fresh blips from the API with the refresh=true parameter

2.2 WHEN the user clicks refresh multiple times THEN the system SHALL display different randomized content on each refresh by using a unique nonce for each request

#### Bug 2: Search Bar Should Filter Blips

2.3 WHEN the user types a search query in the search bar THEN the system SHALL wait for the debounce delay and then fetch blips matching the search term from the API

2.4 WHEN the debounced search value changes THEN the system SHALL make an API request with the search parameter and display only matching blips

2.5 WHEN the user clears the search input by clicking the X button THEN the system SHALL reset the search state and reload the full unfiltered list of blips

#### Bug 3: Infinite Scroll Should Load More Content

2.6 WHEN the user scrolls to 70% or more of the page height and hasMore is true THEN the system SHALL increment the page counter and fetch the next page of blips

2.7 WHEN the API returns fewer than 10 blips OR returns an empty array THEN the system SHALL set hasMore to false and stop attempting to load additional pages

2.8 WHEN appending new pages of blips THEN the system SHALL deduplicate by both id and embed_id to prevent duplicate content from appearing

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user likes a blip THEN the system SHALL CONTINUE TO update the like status optimistically and sync with the backend

3.2 WHEN the user opens comments on a blip THEN the system SHALL CONTINUE TO fetch and display comments correctly

3.3 WHEN the user shares a blip THEN the system SHALL CONTINUE TO generate the correct shareable URL

3.4 WHEN the user creates a new blip THEN the system SHALL CONTINUE TO add it to the top of the feed

3.5 WHEN the user deletes their own blip THEN the system SHALL CONTINUE TO remove it from the feed

3.6 WHEN the blips page initially loads THEN the system SHALL CONTINUE TO fetch and display the first page of blips correctly

3.7 WHEN the user navigates between blips using vertical scrolling THEN the system SHALL CONTINUE TO track the active blip index and update video autoplay behavior

3.8 WHEN videos fail to load THEN the system SHALL CONTINUE TO display the fallback error UI with retry option
