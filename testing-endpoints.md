# Testing WordPress Endpoints for Webinar Data

## Quick Test Commands

Use these commands to test different WordPress REST API endpoints for your webinar data:

### 1. Test Standard WordPress REST API Endpoints

```bash
# Test basic posts endpoint
curl "https://klinegroup.com/wp-json/wp/v2/posts"

# Test for webinar-related posts
curl "https://klinegroup.com/wp-json/wp/v2/posts?search=webinar"

# Test custom post types (common names for events)
curl "https://klinegroup.com/wp-json/wp/v2/webinars"
curl "https://klinegroup.com/wp-json/wp/v2/events"
curl "https://klinegroup.com/wp-json/wp/v2/seminars"

# Test pages endpoint
curl "https://klinegroup.com/wp-json/wp/v2/pages"

# Test with meta queries
curl "https://klinegroup.com/wp-json/wp/v2/posts?meta_key=webinar_date"
curl "https://klinegroup.com/wp-json/wp/v2/posts?meta_key=event_date"
```

### 2. Test Categories and Tags

```bash
# Get all categories
curl "https://klinegroup.com/wp-json/wp/v2/categories"

# Get all tags
curl "https://klinegroup.com/wp-json/wp/v2/tags"

# Filter posts by category (replace ID with actual category ID)
curl "https://klinegroup.com/wp-json/wp/v2/posts?categories=CATEGORY_ID"
```

### 3. Discover Available Endpoints

```bash
# Get all available endpoints
curl "https://klinegroup.com/wp-json/"

# Get WordPress REST API routes
curl "https://klinegroup.com/wp-json/wp/v2/"
```

### 4. Test with Postman

Import these requests into Postman:

**Collection: Kline Group Webinar API Tests**

1. **GET Basic Posts**
   - URL: `https://klinegroup.com/wp-json/wp/v2/posts`
   - Method: GET

2. **GET Webinar Search**
   - URL: `https://klinegroup.com/wp-json/wp/v2/posts?search=webinar`
   - Method: GET

3. **GET Custom Post Type - Webinars**
   - URL: `https://klinegroup.com/wp-json/wp/v2/webinars`
   - Method: GET

4. **GET Custom Post Type - Events**
   - URL: `https://klinegroup.com/wp-json/wp/v2/events`
   - Method: GET

5. **GET All Routes**
   - URL: `https://klinegroup.com/wp-json/`
   - Method: GET

## Expected Response Format

If successful, you should get JSON responses like this:

```json
[
  {
    "id": 123,
    "date": "2024-10-20T10:00:00",
    "slug": "webinar-slug",
    "link": "https://klinegroup.com/webinars/webinar-slug/",
    "title": {
      "rendered": "How to Win the Next Decade of PCMO Lubricants with EV Fluids and Premium Value?"
    },
    "content": {
      "rendered": "<p>Webinar description content...</p>"
    },
    "excerpt": {
      "rendered": "<p>Brief excerpt...</p>"
    },
    "meta": {
      "webinar_date": "October 20, 2025",
      "registration_url": "https://register.example.com"
    }
  }
]
```

## Troubleshooting

### If REST API is Disabled
- The site might have disabled the REST API
- Try the web scraping approach in the C# service

### If No Custom Post Types Found
- The webinars might be stored as regular posts with categories/tags
- Use the search and category filtering approaches

### If Getting 404 Errors
- The endpoint doesn't exist
- Try the discovery endpoints first to see what's available

## Alternative Approaches

### 1. RSS Feed
```bash
curl "https://klinegroup.com/feed/"
curl "https://klinegroup.com/category/webinars/feed/"
```

### 2. Sitemap
```bash
curl "https://klinegroup.com/sitemap.xml"
curl "https://klinegroup.com/wp-sitemap.xml"
```

### 3. Direct Page Scraping
If APIs don't work, the C# service will fall back to scraping:
- `https://klinegroup.com/webinars/`

## Next Steps

1. Run the test commands above
2. Identify which endpoint returns webinar data
3. Update the C# service endpoint array with the working endpoint
4. Test the complete integration