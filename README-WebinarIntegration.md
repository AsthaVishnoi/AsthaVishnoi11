# WordPress Webinar Data Extraction for Angular

This solution provides multiple approaches to extract dynamic webinar data from your WordPress site (https://klinegroup.com/webinars/) for integration with your Angular frontend via a C# backend.

## 🚀 Quick Start

### 1. Backend Setup (C#)

1. **Create a new ASP.NET Core Web API project:**
   ```bash
   dotnet new webapi -n WebinarExtraction
   cd WebinarExtraction
   ```

2. **Install required NuGet packages:**
   ```bash
   dotnet add package HtmlAgilityPack
   dotnet add package Microsoft.Extensions.Caching.Memory
   ```

3. **Copy the provided files:**
   - `WebinarService.cs` - Main service for data extraction
   - `WebinarController.cs` - API controller
   - `Program.cs` - Application configuration
   - `WebinarExtraction.csproj` - Project file with dependencies

4. **Run the backend:**
   ```bash
   dotnet run
   ```

### 2. Frontend Setup (Angular)

1. **Install Angular HTTP Client (if not already installed):**
   ```bash
   ng add @angular/common/http
   ```

2. **Copy the provided files:**
   - `webinar.service.ts` - Service for API communication
   - `webinar-list.component.ts` - Component logic
   - `webinar-list.component.html` - Component template
   - `webinar-list.component.css` - Component styles
   - `app.module.ts` - Module configuration

3. **Update the API URL:**
   In `webinar.service.ts`, replace `'https://your-api-domain.com/api/webinar'` with your actual backend URL.

4. **Add the component to your app:**
   ```html
   <app-webinar-list></app-webinar-list>
   ```

## 🔍 Data Extraction Approaches

### Approach 1: WordPress REST API (Primary)

The service automatically tries multiple WordPress REST API endpoints:

- `https://klinegroup.com/wp-json/wp/v2/webinars`
- `https://klinegroup.com/wp-json/wp/v2/events`
- `https://klinegroup.com/wp-json/wp/v2/posts?search=webinar`
- And more...

### Approach 2: Web Scraping (Fallback)

If the REST API doesn't return data, the service falls back to scraping the webinar page directly using HtmlAgilityPack.

### Approach 3: Manual Testing

Use the provided testing commands in `testing-endpoints.md` to identify the correct WordPress endpoint for your webinar data.

## 📊 API Endpoints

### Backend Endpoints

- `GET /api/webinar/upcoming` - Get cached webinar data
- `GET /api/webinar/fresh` - Get fresh data (bypasses cache)
- `POST /api/webinar/refresh` - Clear cache

### Response Format

```json
[
  {
    "id": 123,
    "title": "How to Win the Next Decade of PCMO Lubricants...",
    "description": "Webinar description...",
    "date": "2025-10-20T00:00:00",
    "slug": "webinar-slug",
    "url": "https://klinegroup.com/webinars/webinar-slug/",
    "registrationUrl": "https://register.example.com",
    "isUpcoming": true,
    "imageUrl": ""
  }
]
```

## ⚡ Performance Features

### Caching Strategy
- **24-hour cache** for optimal performance
- **Monthly data updates** - perfect for your use case
- **Automatic cache refresh** when needed

### Error Handling
- **Graceful fallbacks** between different data sources
- **Retry logic** for network failures
- **User-friendly error messages**

### Loading States
- **Loading indicators** during data fetching
- **Empty state handling** when no webinars found
- **Error state management** with retry options

## 🎨 UI Features

### Modern Design
- **Responsive grid layout**
- **Card-based design** for each webinar
- **Hover effects** and smooth animations
- **Mobile-friendly** responsive design

### Interactive Elements
- **"Happening Soon" badges** for webinars within 7 days
- **Registration buttons** that open in new tabs
- **Refresh functionality** to get latest data
- **Loading spinners** and progress indicators

## 🧪 Testing Your Integration

### 1. Test WordPress Endpoints

Use the commands in `testing-endpoints.md` to identify which endpoint works for your site:

```bash
# Test basic endpoint
curl "https://klinegroup.com/wp-json/wp/v2/posts?search=webinar"

# Test custom post types
curl "https://klinegroup.com/wp-json/wp/v2/webinars"
```

### 2. Test Backend API

```bash
# Test your C# backend
curl "https://localhost:5001/api/webinar/upcoming"
```

### 3. Integration Testing

1. Start your C# backend
2. Start your Angular development server
3. Navigate to the webinar component
4. Verify data loads correctly

## 🔧 Customization

### Modify Data Extraction

In `WebinarService.cs`, update the `endpoints` array to match your WordPress structure:

```csharp
var endpoints = new[]
{
    "your-custom-post-type",
    "posts?categories=your-webinar-category-id",
    // Add more endpoints as needed
};
```

### Customize UI

Modify the CSS in `webinar-list.component.css` to match your brand colors and styling preferences.

### Add More Fields

Extend the `WebinarData` model to include additional fields like speaker information, duration, etc.

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure CORS is properly configured in your C# backend
2. **No Data Returned**: Test WordPress endpoints manually first
3. **Cache Issues**: Use the `/fresh` endpoint to bypass cache during testing

### WordPress REST API Disabled?

If the WordPress REST API is disabled on your site, the service will automatically fall back to web scraping.

### Need Custom Fields?

If your webinars use custom fields, modify the `ConvertWordPressPostsToWebinars` method to extract additional metadata.

## 📈 Monitoring and Maintenance

### Logging

The service includes comprehensive logging for:
- API endpoint attempts
- Cache operations
- Error tracking
- Performance monitoring

### Monthly Updates

Since your webinar data updates monthly:
- Cache duration is set to 24 hours
- Consider setting up automated cache clearing
- Monitor for any changes in WordPress structure

## 🤝 Support

If you encounter issues:

1. Check the browser console for errors
2. Review backend logs for API failures
3. Test WordPress endpoints manually
4. Verify CORS configuration
5. Check network connectivity

This solution provides a robust, scalable approach to integrating your WordPress webinar data with your Angular application while handling various edge cases and providing excellent user experience.