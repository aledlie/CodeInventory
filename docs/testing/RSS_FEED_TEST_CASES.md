# RSS Feed Integration - Comprehensive Test Cases

**Document Version:** 1.0
**Last Updated:** 2025-11-01
**Test Environment:** Jekyll PersonalSite + Static Football Feed

---

## Table of Contents
1. [Feed Generation Tests](#feed-generation-tests)
2. [Feed Validation Tests](#feed-validation-tests)
3. [Feed Content Tests](#feed-content-tests)
4. [Feed Accessibility Tests](#feed-accessibility-tests)
5. [RSS Reader Compatibility Tests](#rss-reader-compatibility-tests)
6. [Landing Page Tests](#landing-page-tests)
7. [Navigation Integration Tests](#navigation-integration-tests)
8. [Performance Tests](#performance-tests)
9. [Security Tests](#security-tests)
10. [Error Handling Tests](#error-handling-tests)
11. [Edge Case Tests](#edge-case-tests)
12. [Regression Tests](#regression-tests)

---

## Feed Generation Tests

### TC-FG-001: Jekyll Dynamic Feed Generation
**Objective:** Verify feed.xml generates correctly from Jekyll posts
**Prerequisites:**
- Jekyll installed and configured
- Blog posts exist in _posts directory
- feed.xml template exists

**Test Steps:**
1. Create test posts in _posts directory with varying metadata
2. Run `npm run build` to build Jekyll site
3. Check _site/feed.xml for generated content
4. Verify XML structure and content

**Expected Results:**
- feed.xml generated in _site directory
- Contains up to 20 most recent posts
- Each entry includes:
  - Title (CDATA wrapped)
  - Link (alternate URL)
  - ID (unique identifier)
  - Published date (ISO 8601 format)
  - Updated date
  - Author information
  - Full post content (XML escaped)
  - Feed footer included
- Atom 1.0 namespace: `https://www.w3.org/2005/Atom`
- Valid XML structure

**Test Data:**
```yaml
# Test post front matter
---
title: "Test Post Title"
date: 2025-01-01
author: test_author
modified: 2025-01-02
---
```

**Status:** ⏳ Pending

**Reference:** `/Users/alyshialedlie/code/PersonalSite/feed.xml:18-42`

---

### TC-FG-002: Static Football Feed Structure
**Objective:** Verify football-rss.xml has correct static structure
**Prerequisites:** football-rss.xml exists in PersonalSite root

**Test Steps:**
1. Open /Users/alyshialedlie/code/PersonalSite/football-rss.xml
2. Validate XML structure
3. Check required Atom elements
4. Verify namespaces

**Expected Results:**
- Valid XML declaration: `<?xml version="1.0" encoding="UTF-8"?>`
- Atom namespace: `xmlns="http://www.w3.org/2005/Atom"`
- Thread namespace: `xmlns:thr="http://purl.org/syndication/thread/1.0"`
- Language attribute: `xml:lang="en-US"`
- Required elements present:
  - `<title>`: "Burnt Orange Nation - Sumedh Joshi"
  - `<link rel="alternate">`: Points to burntorangenation.com
  - `<link rel="self">`: Points to RSS stream
  - `<id>`: Unique feed identifier
  - `<updated>`: Last update timestamp
  - `<subtitle>`: Feed description

**Status:** ✅ Pass (verified in existing tests)

**Reference:** `/Users/alyshialedlie/code/PersonalSite/football-rss.xml:1-9`

---

### TC-FG-003: Feed Update Timestamp
**Objective:** Verify feed timestamps update correctly
**Prerequisites:** Jekyll site with feed.xml

**Test Steps:**
1. Note current timestamp in feed.xml
2. Create new blog post
3. Rebuild Jekyll site
4. Check updated timestamp in _site/feed.xml

**Expected Results:**
- `<updated>` element reflects latest build time
- Format: ISO 8601 (e.g., `2025-01-01T12:00:00-00:00`)
- Timestamp updates on every build
- Individual entry timestamps reflect post dates

**Status:** ⏳ Pending

---

### TC-FG-004: Post Limit Enforcement
**Objective:** Verify feed only includes 20 most recent posts
**Prerequisites:**
- More than 20 blog posts exist
- feed.xml template with `limit:20`

**Test Steps:**
1. Create 25 test blog posts with sequential dates
2. Build Jekyll site
3. Count entries in generated feed.xml
4. Verify only newest 20 posts included

**Expected Results:**
- Exactly 20 `<entry>` elements in feed
- Posts sorted by date (newest first)
- Oldest post in feed is the 20th most recent
- Posts 21-25 not included

**Test Data:**
- Create posts dated from 2025-01-01 to 2025-01-25

**Status:** ⏳ Pending

**Reference:** `/Users/alyshialedlie/code/PersonalSite/feed.xml:18`

---

### TC-FG-005: Author Attribution
**Objective:** Verify author information populates correctly
**Prerequisites:**
- Posts with author metadata
- _data/authors.yml configured
- feed.xml template

**Test Steps:**
1. Create post with `author: test_author` in front matter
2. Add test_author to _data/authors.yml with name and email
3. Build site and check feed.xml
4. Create post without author field
5. Verify fallback to site.owner

**Expected Results:**
- Post with author: Uses data from _data/authors.yml
- Post without author: Uses site.owner from _config.yml
- Author block includes:
  - `<name>`: Author name
  - `<uri>`: Site URL
  - `<email>`: Author email (if present)

**Test Data:**
```yaml
# _data/authors.yml
test_author:
  name: "Test Author Name"
  email: "test@example.com"
```

**Status:** ⏳ Pending

**Reference:** `/Users/alyshialedlie/code/PersonalSite/feed.xml:19-36`

---

### TC-FG-006: Content Escaping
**Objective:** Verify post content is properly XML-escaped
**Prerequisites:** Blog post with special characters

**Test Steps:**
1. Create post with content containing:
   - HTML tags: `<div>`, `<script>`
   - Special characters: `&`, `<`, `>`, `"`, `'`
   - Code blocks with syntax
2. Build site and check feed.xml
3. Verify all content is properly escaped

**Expected Results:**
- `&` becomes `&amp;`
- `<` becomes `&lt;`
- `>` becomes `&gt;`
- `"` becomes `&quot;`
- HTML preserved but escaped
- Code blocks maintain formatting
- No raw HTML in content element

**Test Data:**
```markdown
# Post with special characters
Here's some code: `<script>alert("test");</script>`
And some entities: A & B < C > D
```

**Status:** ⏳ Pending

**Reference:** `/Users/alyshialedlie/code/PersonalSite/feed.xml:38`

---

## Feed Validation Tests

### TC-FV-001: XML Well-Formedness
**Objective:** Verify feed is well-formed XML
**Prerequisites:** Generated feed.xml or football-rss.xml

**Test Steps:**
1. Use XML validator (xmllint, online validator, etc.)
2. Parse feed.xml
3. Check for XML errors

**Expected Results:**
- No XML parsing errors
- All tags properly closed
- Valid XML declaration
- Proper nesting of elements
- No unescaped special characters

**Validation Command:**
```bash
xmllint --noout /Users/alyshialedlie/code/PersonalSite/_site/feed.xml
# Should return no errors
```

**Status:** ⏳ Pending

---

### TC-FV-002: Atom 1.0 Compliance
**Objective:** Verify feed conforms to Atom 1.0 specification
**Prerequisites:** Feed validator tool

**Test Steps:**
1. Submit feed to W3C Feed Validation Service (validator.w3.org/feed/)
2. Or use feed-validator library
3. Review validation results

**Expected Results:**
- Valid Atom 1.0 feed
- All required elements present:
  - `<feed>` root element
  - `<id>` element
  - `<title>` element
  - `<updated>` element
- Each entry has required elements:
  - `<id>`, `<title>`, `<updated>`
- Namespace URI correct
- No validation warnings

**Status:** ⏳ Pending

---

### TC-FV-003: Link Relations Validation
**Objective:** Verify link relations are correctly specified
**Prerequisites:** Generated feed

**Test Steps:**
1. Check feed.xml for link elements
2. Verify rel attributes
3. Check type attributes
4. Verify href values

**Expected Results:**
- Self link present: `<link rel="self" type="application/atom+xml">`
- Alternate link present: `<link rel="alternate" type="text/html">`
- Each entry has alternate link to post
- URLs are absolute and valid
- Self link points to feed URL

**Status:** ⏳ Pending

**Reference:** `/Users/alyshialedlie/code/PersonalSite/feed.xml:9-10`

---

### TC-FV-004: Date Format Validation
**Objective:** Verify all dates use ISO 8601 format
**Prerequisites:** Feed with entries

**Test Steps:**
1. Extract all date elements from feed
2. Validate format using regex or parser
3. Check for timezone information

**Expected Results:**
- Format: `YYYY-MM-DDTHH:MM:SS±HH:MM`
- Examples: `2025-01-01T12:00:00-00:00`
- All dates parseable by standard libraries
- Timezone always included
- No relative dates

**Validation Pattern:**
```regex
^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$
```

**Status:** ⏳ Pending

---

### TC-FV-005: ID Uniqueness
**Objective:** Verify all entry IDs are unique
**Prerequisites:** Feed with multiple entries

**Test Steps:**
1. Parse feed.xml
2. Extract all `<id>` elements
3. Check for duplicates
4. Verify ID format

**Expected Results:**
- No duplicate IDs in feed
- IDs are stable (don't change on rebuild)
- Format follows convention: `{site.url}{post.id}`
- IDs are URIs (or URNs)

**Status:** ⏳ Pending

**Reference:** `/Users/alyshialedlie/code/PersonalSite/feed.xml:27`

---

## Feed Content Tests

### TC-FC-001: Title Rendering
**Objective:** Verify post titles render correctly in feed
**Prerequisites:** Posts with various title formats

**Test Steps:**
1. Create posts with titles containing:
   - Plain text
   - Special characters
   - HTML entities
   - Unicode characters
   - Very long titles (>100 chars)
2. Build and check feed

**Expected Results:**
- Titles wrapped in CDATA: `<![CDATA[...]]>`
- Special characters preserved
- HTML rendered as text (not tags)
- Unicode characters display correctly
- No truncation of long titles

**Test Data:**
```yaml
title: "Test & Special <chars> \"Quotes\" 'Single' €¥£"
title: "🔥 Emoji Test 🎉"
title: "Very Long Title That Exceeds Normal Length Expectations And Tests Rendering"
```

**Status:** ⏳ Pending

**Reference:** `/Users/alyshialedlie/code/PersonalSite/feed.xml:25`

---

### TC-FC-002: Content Inclusion
**Objective:** Verify full post content is included in feed
**Prerequisites:** Posts with various content types

**Test Steps:**
1. Create posts with:
   - Markdown formatting
   - Images
   - Code blocks
   - Links
   - Lists
2. Build and check feed

**Expected Results:**
- Full content included (not excerpt)
- Markdown converted to HTML
- Images have proper src URLs (absolute)
- Links are absolute URLs
- Code blocks preserved with proper formatting
- Lists rendered as HTML

**Status:** ⏳ Pending

---

### TC-FC-003: Feed Footer Inclusion
**Objective:** Verify _feed-footer.html is included in entries
**Prerequisites:**
- _includes/_feed-footer.html exists
- feed.xml template includes it

**Test Steps:**
1. Check _includes/_feed-footer.html content
2. Build site
3. Check entry content in feed.xml
4. Verify footer appears after post content

**Expected Results:**
- Footer content appended to each entry
- Footer HTML properly escaped
- Footer appears consistently across all entries

**Status:** ⏳ Pending

**Reference:** `/Users/alyshialedlie/code/PersonalSite/feed.xml:39`

---

### TC-FC-004: Modified Date Handling
**Objective:** Verify posts with modified dates use correct timestamps
**Prerequisites:** Posts with and without modified date

**Test Steps:**
1. Create post with `modified: 2025-01-15` (newer than publish date)
2. Create post without modified field
3. Build and check feed

**Expected Results:**
- Post with modified:
  - `<published>`: Original date
  - `<updated>`: Modified date
- Post without modified:
  - `<published>`: Post date
  - `<updated>`: Post date (same as published)

**Status:** ⏳ Pending

**Reference:** `/Users/alyshialedlie/code/PersonalSite/feed.xml:28-31`

---

### TC-FC-005: Empty Feed Handling
**Objective:** Verify feed works when no posts exist
**Prerequisites:** Empty _posts directory

**Test Steps:**
1. Remove all posts from _posts
2. Build Jekyll site
3. Check feed.xml

**Expected Results:**
- Feed.xml still generates
- Contains valid Atom structure
- No `<entry>` elements
- No errors during build

**Status:** ⏳ Pending

---

## Feed Accessibility Tests

### TC-FA-001: HTTP Feed Access
**Objective:** Verify feed is accessible via HTTP
**Prerequisites:** Jekyll site running on localhost:4000

**Test Steps:**
1. Start server: `npm run serve`
2. Access http://localhost:4000/feed.xml
3. Access http://localhost:4000/football-rss.xml
4. Check HTTP response

**Expected Results:**
- Both feeds return HTTP 200 OK
- Content-Type: `application/atom+xml` or `text/xml`
- No authentication required
- Feed content displays in browser

**Status:** ⏳ Pending (requires server rebuild)

---

### TC-FA-002: Feed Discovery
**Objective:** Verify feed is discoverable from site homepage
**Prerequisites:** HTML head contains feed link

**Test Steps:**
1. View site homepage source
2. Check `<head>` section for feed link
3. Verify auto-discovery tag

**Expected Results:**
- Contains: `<link rel="alternate" type="application/atom+xml" href="/feed.xml" />`
- RSS readers can auto-discover feed
- Link appears in HTML head

**Status:** ⏳ Pending

---

### TC-FA-003: Direct URL Access
**Objective:** Verify feeds accessible at expected URLs
**Prerequisites:** Deployed site

**Test Steps:**
1. Access https://yoursite.com/feed.xml
2. Access https://yoursite.com/football-rss.xml
3. Verify no redirects
4. Check response headers

**Expected Results:**
- Both URLs return 200 OK
- No 404 errors
- No authentication challenges
- Correct MIME type returned

**Status:** ⏳ Pending

---

### TC-FA-004: CORS Headers
**Objective:** Verify feed can be accessed cross-origin
**Prerequisites:** Server with CORS configuration

**Test Steps:**
1. Make XHR request to feed from different origin
2. Check CORS headers in response
3. Verify access granted

**Expected Results:**
- Access-Control-Allow-Origin header present
- Feed accessible from JavaScript
- No CORS errors in browser console

**Status:** ⏳ Pending

---

## RSS Reader Compatibility Tests

### TC-RC-001: Feedly Compatibility
**Objective:** Verify feed works in Feedly
**Prerequisites:** Feedly account

**Test Steps:**
1. Add feed URL to Feedly
2. Check feed discovery
3. Verify posts display correctly
4. Check images and formatting

**Expected Results:**
- Feedly successfully subscribes to feed
- All entries appear
- Images load correctly
- Titles and content properly formatted
- Author attribution shows

**Status:** ⏳ Pending

---

### TC-RC-002: NewsBlur Compatibility
**Objective:** Verify feed works in NewsBlur
**Prerequisites:** NewsBlur account

**Test Steps:**
1. Add feed URL to NewsBlur
2. Verify subscription
3. Check entry rendering

**Expected Results:**
- NewsBlur accepts feed
- Posts display with full content
- Dates show correctly
- No parsing errors

**Status:** ⏳ Pending

---

### TC-RC-003: Inoreader Compatibility
**Objective:** Verify feed works in Inoreader
**Prerequisites:** Inoreader account

**Test Steps:**
1. Add feed to Inoreader
2. Check feed parsing
3. Verify content display

**Expected Results:**
- Feed added successfully
- All content accessible
- Proper formatting maintained
- Updates detected correctly

**Status:** ⏳ Pending

---

### TC-RC-004: Apple Podcasts/Safari Compatibility
**Objective:** Verify feed displays in Safari RSS viewer
**Prerequisites:** Safari browser

**Test Steps:**
1. Open feed URL in Safari
2. Check RSS rendering
3. Verify subscribe options

**Expected Results:**
- Safari displays feed in readable format
- Subscribe button appears
- All entries visible
- No JavaScript errors

**Status:** ⏳ Pending

---

### TC-RC-005: Feed Parser Library Compatibility
**Objective:** Verify feed parses with common libraries
**Prerequisites:** Python with feedparser installed

**Test Steps:**
1. Parse feed using feedparser:
   ```python
   import feedparser
   d = feedparser.parse('http://localhost:4000/feed.xml')
   print(d.feed.title)
   print(len(d.entries))
   ```
2. Check for parsing errors
3. Verify data extraction

**Expected Results:**
- No parsing errors
- All entries accessible
- Metadata correctly extracted
- Content available in d.entries[0].content

**Status:** ⏳ Pending

---

## Landing Page Tests

### TC-LP-001: Landing Page Rendering
**Objective:** Verify RSS landing page renders correctly
**Prerequisites:**
- rss/index.md exists
- Server running

**Test Steps:**
1. Visit http://localhost:4000/rss/
2. Check page rendering
3. Verify all content elements

**Expected Results:**
- Page loads with "Sumedh's Football RSS Feed" title
- Layout: page template applied
- Contains feed description
- Subscription instructions visible
- "View Raw Feed" button present
- Button styled with #bf5700 background

**Status:** ⏳ Pending (requires server rebuild)

**Reference:** `/Users/alyshialedlie/code/PersonalSite/rss/index.md`

---

### TC-LP-002: Feed URL Link
**Objective:** Verify feed URL is clickable and correct
**Prerequisites:** Landing page accessible

**Test Steps:**
1. Visit /rss/ page
2. Click feed URL link
3. Verify destination

**Expected Results:**
- Link displays: `{{ site.url }}/football-rss.xml`
- Clicking opens football-rss.xml
- URL is absolute (includes domain)
- Link is copyable

**Status:** ⏳ Pending

**Reference:** `/Users/alyshialedlie/code/PersonalSite/rss/index.md:15`

---

### TC-LP-003: View Raw Feed Button
**Objective:** Verify "View Raw Feed" button works
**Prerequisites:** Landing page accessible

**Test Steps:**
1. Visit /rss/ page
2. Click "View Raw Feed" button
3. Check destination

**Expected Results:**
- Button styled correctly:
  - Background: #bf5700 (Burnt Orange)
  - Text color: white
  - Padding: 10px 20px
  - Border radius: 5px
- RSS icon displays (Font Awesome)
- Clicking opens football-rss.xml
- Opens in same or new tab

**Status:** ⏳ Pending

**Reference:** `/Users/alyshialedlie/code/PersonalSite/rss/index.md:33-37`

---

### TC-LP-004: Subscription Instructions
**Objective:** Verify subscription instructions are clear
**Prerequisites:** Landing page content

**Test Steps:**
1. Read landing page content
2. Verify instructions completeness
3. Check readability

**Expected Results:**
- Step-by-step instructions present
- Lists Feedly, NewsBlur, Inoreader as examples
- Instructions are clear and actionable
- Covers copying URL and adding to reader

**Status:** ✅ Pass

**Reference:** `/Users/alyshialedlie/code/PersonalSite/rss/index.md:17-22`

---

### TC-LP-005: Feed Content Description
**Objective:** Verify feed content is described accurately
**Prerequisites:** Landing page

**Test Steps:**
1. Read "What's in the Feed?" section
2. Verify accuracy of description

**Expected Results:**
- Mentions Texas Longhorns football
- Lists content types:
  - Football analysis
  - Game previews/recaps
  - Recruiting updates
  - College football commentary
- Attribution to Sumedh Joshi
- Source: Burnt Orange Nation

**Status:** ✅ Pass

**Reference:** `/Users/alyshialedlie/code/PersonalSite/rss/index.md:23-29`

---

### TC-LP-006: Mobile Responsiveness
**Objective:** Verify landing page works on mobile devices
**Prerequisites:** Mobile browser or responsive testing tool

**Test Steps:**
1. Open /rss/ on mobile device or emulator
2. Check layout responsiveness
3. Test button interaction

**Expected Results:**
- Page layout adapts to mobile screen
- Text readable without zooming
- Button tappable with finger
- No horizontal scrolling required

**Status:** ⏳ Pending

---

## Navigation Integration Tests

### TC-NI-001: Navigation Menu Entry
**Objective:** Verify RSS link appears in navigation
**Prerequisites:**
- navigation.yml configured
- Server running

**Test Steps:**
1. Visit any page on PersonalSite
2. Check navigation menu
3. Look for "Sumedh's Football RSS Feed"

**Expected Results:**
- Entry visible in navigation bar
- Text: "Sumedh's Football RSS Feed"
- Link points to /rss/
- Clickable
- Appears with other nav items

**Status:** ⏳ Pending (requires server rebuild)

---

### TC-NI-002: Navigation Configuration
**Objective:** Verify navigation.yml contains RSS entry
**Prerequisites:** navigation.yml file

**Test Steps:**
1. Open _data/navigation.yml
2. Search for RSS entry
3. Verify configuration

**Expected Results:**
```yaml
- title: "Sumedh's Football RSS Feed"
  url: /rss/
```
- Entry exists in navigation array
- Title and URL correct
- No syntax errors in YAML

**Status:** ✅ Pass

**Reference:** `/Users/alyshialedlie/code/PersonalSite/_data/navigation.yml`

---

### TC-NI-003: Navigation Link Click
**Objective:** Verify clicking nav link goes to landing page
**Prerequisites:** Site running

**Test Steps:**
1. Click "Sumedh's Football RSS Feed" in navigation
2. Verify page loads
3. Check URL

**Expected Results:**
- Redirects to /rss/ page
- Landing page content displays
- URL updates to /rss/
- No 404 error

**Status:** ⏳ Pending

---

### TC-NI-004: Breadcrumb Navigation
**Objective:** Verify breadcrumbs work on RSS pages
**Prerequisites:** Site with breadcrumb support

**Test Steps:**
1. Visit /rss/ page
2. Check for breadcrumb trail
3. Test breadcrumb links

**Expected Results:**
- Breadcrumbs show: Home > RSS
- Each breadcrumb clickable
- Correct navigation hierarchy

**Status:** ⏳ Pending

---

## Performance Tests

### TC-PF-001: Feed Generation Time
**Objective:** Measure time to generate feed during build
**Prerequisites:** Jekyll site with 20+ posts

**Test Steps:**
1. Run `time npm run build`
2. Note total build time
3. Isolate feed generation time if possible

**Expected Results:**
- Feed generates in < 1 second
- Doesn't significantly impact build time
- Scales reasonably with post count

**Benchmarks:**
- 20 posts: < 0.5s
- 100 posts: < 2s
- 500 posts: < 10s

**Status:** ⏳ Pending

---

### TC-PF-002: Feed File Size
**Objective:** Verify feed size is reasonable
**Prerequisites:** Generated feed with 20 entries

**Test Steps:**
1. Build site
2. Check size of _site/feed.xml
3. Compare with expectations

**Expected Results:**
- File size reasonable for content
- 20 entries: typically 50-200 KB
- Not excessively large
- Compressible with gzip

**Status:** ⏳ Pending

---

### TC-PF-003: Feed Load Time
**Objective:** Measure HTTP response time for feed
**Prerequisites:** Running server

**Test Steps:**
1. Use curl to time feed request:
   ```bash
   curl -w "@curl-format.txt" -o /dev/null -s http://localhost:4000/feed.xml
   ```
2. Measure response time
3. Test with slow connection simulation

**Expected Results:**
- Response time < 500ms on localhost
- Time to first byte < 100ms
- Works on slow connections (3G)

**Status:** ⏳ Pending

---

### TC-PF-004: Concurrent Feed Requests
**Objective:** Verify server handles multiple feed requests
**Prerequisites:** Server running

**Test Steps:**
1. Send 10 concurrent requests to feed.xml
2. Monitor server performance
3. Check all responses

**Expected Results:**
- All 10 requests succeed
- No timeouts
- Response times similar to single request
- No server errors

**Status:** ⏳ Pending

---

## Security Tests

### TC-SE-001: XSS Prevention in Feed Content
**Objective:** Verify feed content doesn't enable XSS attacks
**Prerequisites:** Post with malicious content

**Test Steps:**
1. Create post with XSS attempt:
   ```markdown
   <script>alert('XSS')</script>
   <img src=x onerror="alert('XSS')">
   ```
2. Build feed
3. Check XML output
4. Test in feed reader

**Expected Results:**
- Script tags escaped: `&lt;script&gt;`
- No executable JavaScript in feed
- Feed readers don't execute scripts
- Content rendered as text, not code

**Status:** ⏳ Pending

---

### TC-SE-002: XML Injection Prevention
**Objective:** Verify no XML injection vulnerabilities
**Prerequisites:** Post with XML entities

**Test Steps:**
1. Create post attempting XML injection:
   ```markdown
   Title: ]]></title><script>alert('XSS')</script><title><![CDATA[
   Content: &xxe; <!ENTITY xxe "test">
   ```
2. Build and check feed

**Expected Results:**
- CDATA sections properly closed
- Entities properly escaped
- No XML structure injection
- Feed structure remains intact

**Status:** ⏳ Pending

---

### TC-SE-003: External Entity Injection (XXE) Prevention
**Objective:** Verify feed doesn't enable XXE attacks
**Prerequisites:** XML parser

**Test Steps:**
1. Try to parse feed with external entities
2. Check if external resources loaded
3. Verify parser configuration

**Expected Results:**
- External entity resolution disabled
- No external file access
- No network requests from XML parsing
- DTD processing disabled

**Status:** ⏳ Pending

---

### TC-SE-004: HTTPS Enforcement
**Objective:** Verify feeds use HTTPS in production
**Prerequisites:** Deployed site with SSL

**Test Steps:**
1. Check all URLs in feed
2. Verify protocol
3. Test mixed content

**Expected Results:**
- All links use https://
- No http:// links in feed
- No mixed content warnings
- Self link uses HTTPS

**Status:** ⏳ Pending

---

### TC-SE-005: Information Disclosure
**Objective:** Verify feed doesn't leak sensitive information
**Prerequisites:** Feed content review

**Test Steps:**
1. Review feed.xml for sensitive data
2. Check for:
   - Internal paths
   - System information
   - Email addresses (if private)
   - API keys or tokens
3. Verify only public info included

**Expected Results:**
- No server paths disclosed
- No private email addresses
- No sensitive metadata
- Only intended public content

**Status:** ⏳ Pending

---

## Error Handling Tests

### TC-EH-001: Invalid Post Metadata
**Objective:** Verify feed handles posts with invalid metadata
**Prerequisites:** Post with missing/invalid fields

**Test Steps:**
1. Create post missing required field (title)
2. Create post with invalid date format
3. Build site and check for errors

**Expected Results:**
- Build completes (with warnings)
- Feed still generates
- Invalid posts skipped or use defaults
- Error messages logged

**Status:** ⏳ Pending

---

### TC-EH-002: Special Characters in Title
**Objective:** Verify special characters don't break feed
**Prerequisites:** Post with special title

**Test Steps:**
1. Create post with title: `</title><script>alert(1)</script>`
2. Build and check feed.xml
3. Verify XML validity

**Expected Results:**
- XML remains valid
- Special chars properly escaped
- Feed structure not broken
- Title rendered as text

**Status:** ⏳ Pending

---

### TC-EH-003: Large Content Posts
**Objective:** Verify feed handles very large posts
**Prerequisites:** Post with 10,000+ words

**Test Steps:**
1. Create extremely long post (10K+ words)
2. Build feed
3. Check feed size and validity

**Expected Results:**
- Feed builds successfully
- Full content included (not truncated)
- XML remains valid
- Reasonable file size increase

**Status:** ⏳ Pending

---

### TC-EH-004: Binary Content in Posts
**Objective:** Verify feed handles embedded images correctly
**Prerequisites:** Post with images

**Test Steps:**
1. Create post with images using Markdown/HTML
2. Build feed
3. Check image URLs in feed

**Expected Results:**
- Images converted to `<img>` tags
- Image URLs are absolute
- No binary data in XML
- Images accessible from feed

**Status:** ⏳ Pending

---

### TC-EH-005: Feed Access During Build
**Objective:** Verify graceful handling if feed accessed during build
**Prerequisites:** Server running during build

**Test Steps:**
1. Start build process
2. Access feed.xml during build
3. Check response

**Expected Results:**
- Either old version served OR
- Temporary unavailable error OR
- Build completes before serving
- No corrupted feed served

**Status:** ⏳ Pending

---

## Edge Case Tests

### TC-EC-001: Empty Title Post
**Objective:** Verify handling of posts without titles
**Prerequisites:** Post with empty/missing title

**Test Steps:**
1. Create post with `title: ""`
2. Build and check feed

**Expected Results:**
- Feed generates
- Entry included with empty title OR
- Uses fallback (filename, date)
- No XML syntax errors

**Status:** ⏳ Pending

---

### TC-EC-002: Future-Dated Posts
**Objective:** Verify handling of posts dated in future
**Prerequisites:** Post with future date

**Test Steps:**
1. Create post dated 2030-01-01
2. Build feed
3. Check if included

**Expected Results:**
- Behavior depends on Jekyll config
- Either included in feed OR
- Excluded until date passes
- Documented behavior

**Status:** ⏳ Pending

---

### TC-EC-003: Timezone Handling
**Objective:** Verify correct timezone handling in dates
**Prerequisites:** Posts with various timezones

**Test Steps:**
1. Create posts with different timezone offsets
2. Build feed
3. Check timestamp conversions

**Expected Results:**
- All times converted to consistent timezone
- ISO 8601 format with offset
- Correct chronological ordering
- Daylight savings handled

**Status:** ⏳ Pending

---

### TC-EC-004: Unicode in Content
**Objective:** Verify Unicode content renders correctly
**Prerequisites:** Post with various Unicode

**Test Steps:**
1. Create post with:
   - Emoji: 🚀 🎉 ⚡
   - CJK characters: 日本語, 中文, 한국어
   - Special symbols: ™ © ® € ¥
   - Accented chars: café, naïve, über
2. Build and check feed

**Expected Results:**
- All Unicode preserved
- Proper UTF-8 encoding
- Characters display correctly in readers
- No mojibake or corruption

**Status:** ⏳ Pending

---

### TC-EC-005: Very Old Posts
**Objective:** Verify handling of posts from many years ago
**Prerequisites:** Post dated 2000-01-01

**Test Steps:**
1. Create post with very old date
2. Build feed
3. Check ordering

**Expected Results:**
- Old posts included if in limit:20
- Date format handles old dates
- Correct chronological sorting
- No date parsing errors

**Status:** ⏳ Pending

---

### TC-EC-006: Draft Posts
**Objective:** Verify draft posts excluded from feed
**Prerequisites:** Post with `published: false`

**Test Steps:**
1. Create draft post
2. Build feed
3. Verify not included

**Expected Results:**
- Draft posts not in feed
- Feed only includes published posts
- Draft state respected

**Status:** ⏳ Pending

---

## Regression Tests

### TC-RG-001: Existing Feed Backward Compatibility
**Objective:** Verify new feed changes don't break existing subscriptions
**Prerequisites:**
- Feed subscribed to in reader
- Feed changes deployed

**Test Steps:**
1. Subscribe to feed in reader before changes
2. Deploy feed updates
3. Check if reader still works

**Expected Results:**
- Existing subscriptions continue working
- Feed ID unchanged
- New entries appear
- No re-subscription needed

**Status:** ⏳ Pending

---

### TC-RG-002: Feed URL Stability
**Objective:** Verify feed URLs remain constant
**Prerequisites:** Deployed feed

**Test Steps:**
1. Note current feed URLs
2. Make unrelated site changes
3. Verify URLs unchanged

**Expected Results:**
- /feed.xml path stable
- /football-rss.xml path stable
- No unexpected redirects
- Permalinks consistent

**Status:** ⏳ Pending

---

### TC-RG-003: Site Build Compatibility
**Objective:** Verify feed doesn't break site build
**Prerequisites:** Working Jekyll build

**Test Steps:**
1. Run full site build
2. Check for errors
3. Verify all pages build

**Expected Results:**
- No build errors
- Feed generation doesn't interfere with pages
- Build completes successfully
- All content accessible

**Status:** ⏳ Pending

---

### TC-RG-004: Theme Compatibility
**Objective:** Verify feed works with theme updates
**Prerequisites:** Jekyll theme

**Test Steps:**
1. Update Jekyll theme
2. Rebuild site
3. Check feed generation

**Expected Results:**
- Feed still generates correctly
- Theme changes don't affect feed
- Feed template compatibility maintained

**Status:** ⏳ Pending

---

## Test Execution Guidelines

### Priority Levels
- **P0 (Critical):** Feed generation, XML validity, content accuracy
- **P1 (High):** Reader compatibility, accessibility, security
- **P2 (Medium):** Performance, edge cases
- **P3 (Low):** Nice-to-have features, extended compatibility

### Testing Order
1. Feed generation and validation (TC-FG-*, TC-FV-*)
2. Content accuracy (TC-FC-*)
3. Accessibility (TC-FA-*)
4. Reader compatibility (TC-RC-*)
5. Landing page (TC-LP-*)
6. Security (TC-SE-*)
7. Edge cases and regression (TC-EC-*, TC-RG-*)

### Automated Testing
Recommended tools:
- **XML Validation:** xmllint, W3C Feed Validator
- **Feed Parsing:** feedparser (Python), rss-parser (JavaScript)
- **HTTP Testing:** curl, httpie, Postman
- **Reader Testing:** feedbro browser extension, test accounts

### Manual Testing Checklist
- [ ] Subscribe to feed in at least 2 RSS readers
- [ ] Verify feed in W3C Feed Validator
- [ ] Check feed on mobile device
- [ ] Test all navigation links
- [ ] Review feed in browser XML view
- [ ] Verify post updates appear in feed

---

## Test Summary

### By Category
- **Feed Generation:** 6 tests
- **Feed Validation:** 5 tests
- **Feed Content:** 5 tests
- **Feed Accessibility:** 4 tests
- **RSS Reader Compatibility:** 5 tests
- **Landing Page:** 6 tests
- **Navigation Integration:** 4 tests
- **Performance:** 4 tests
- **Security:** 5 tests
- **Error Handling:** 5 tests
- **Edge Cases:** 6 tests
- **Regression:** 4 tests

**Total Test Cases:** 59

### Status Overview
- ✅ **Passed:** 4 (from existing TEST_CASES.md)
- ⏳ **Pending:** 55 (new comprehensive tests)
- ❌ **Failed:** 0

### Coverage Analysis
- XML/Feed Structure: ✅ Comprehensive
- Content Rendering: ✅ Comprehensive
- Reader Compatibility: ✅ Comprehensive
- Security: ✅ Comprehensive
- Performance: ✅ Good
- Edge Cases: ✅ Excellent

---

## Recommended Test Environment

### Local Testing
```bash
# Build Jekyll site
npm run build

# Serve locally
npm run serve

# Validate feed
xmllint --noout _site/feed.xml

# Parse with feedparser
python3 -c "import feedparser; d=feedparser.parse('_site/feed.xml'); print(d.feed.title, len(d.entries))"
```

### CI/CD Integration
```yaml
# .github/workflows/test-rss.yml
name: RSS Feed Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Jekyll
        run: npm run build
      - name: Validate XML
        run: xmllint --noout _site/feed.xml
      - name: Test Feed Parsing
        run: |
          pip install feedparser
          python3 -c "import feedparser; assert feedparser.parse('_site/feed.xml').bozo == False"
```

---

**Document End**

*For questions or issues, refer to:*
- Jekyll Feed Plugin: https://github.com/jekyll/jekyll-feed
- Atom Spec: https://www.rfc-editor.org/rfc/rfc4287
- W3C Feed Validator: https://validator.w3.org/feed/
