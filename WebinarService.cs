using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using HtmlAgilityPack;
using System.Linq;

namespace WebinarExtraction.Services
{
    public class WebinarService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private readonly ILogger<WebinarService> _logger;
        private const string CACHE_KEY = "webinars_data";
        private readonly TimeSpan CACHE_DURATION = TimeSpan.FromHours(24); // Cache for 24 hours since data updates monthly

        public WebinarService(HttpClient httpClient, IMemoryCache cache, ILogger<WebinarService> logger)
        {
            _httpClient = httpClient;
            _cache = cache;
            _logger = logger;
        }

        public async Task<List<WebinarData>> GetWebinarsAsync()
        {
            // Check cache first
            if (_cache.TryGetValue(CACHE_KEY, out List<WebinarData> cachedWebinars))
            {
                _logger.LogInformation("Returning cached webinar data");
                return cachedWebinars;
            }

            var webinars = new List<WebinarData>();

            try
            {
                // Approach 1: Try WordPress REST API
                webinars = await TryWordPressRestApiAsync();
                
                if (webinars.Count == 0)
                {
                    // Approach 2: Fallback to web scraping
                    _logger.LogWarning("REST API returned no data, falling back to web scraping");
                    webinars = await TryWebScrapingAsync();
                }

                // Cache the results
                if (webinars.Count > 0)
                {
                    _cache.Set(CACHE_KEY, webinars, CACHE_DURATION);
                    _logger.LogInformation($"Cached {webinars.Count} webinars");
                }

                return webinars;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching webinar data");
                return new List<WebinarData>();
            }
        }

        private async Task<List<WebinarData>> TryWordPressRestApiAsync()
        {
            var webinars = new List<WebinarData>();
            var baseUrl = "https://klinegroup.com/wp-json/wp/v2/";
            
            // Try different endpoints
            var endpoints = new[]
            {
                "webinars",
                "events", 
                "seminars",
                "posts?categories=webinar",
                "posts?search=webinar",
                "posts?meta_key=webinar_date",
                "posts"
            };

            foreach (var endpoint in endpoints)
            {
                try
                {
                    _logger.LogInformation($"Trying endpoint: {baseUrl}{endpoint}");
                    var response = await _httpClient.GetAsync($"{baseUrl}{endpoint}");
                    
                    if (response.IsSuccessStatusCode)
                    {
                        var content = await response.Content.ReadAsStringAsync();
                        var posts = JsonSerializer.Deserialize<List<WordPressPost>>(content, new JsonSerializerOptions 
                        { 
                            PropertyNameCaseInsensitive = true 
                        });

                        if (posts != null && posts.Count > 0)
                        {
                            webinars = ConvertWordPressPostsToWebinars(posts);
                            if (webinars.Count > 0)
                            {
                                _logger.LogInformation($"Successfully fetched {webinars.Count} webinars from {endpoint}");
                                break;
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"Failed to fetch from endpoint: {endpoint}");
                    continue;
                }
            }

            return webinars;
        }

        private async Task<List<WebinarData>> TryWebScrapingAsync()
        {
            var webinars = new List<WebinarData>();
            
            try
            {
                var response = await _httpClient.GetAsync("https://klinegroup.com/webinars/");
                response.EnsureSuccessStatusCode();
                
                var html = await response.Content.ReadAsStringAsync();
                var doc = new HtmlDocument();
                doc.LoadHtml(html);

                // Look for webinar containers - adjust selectors based on actual HTML structure
                var webinarNodes = doc.DocumentNode.SelectNodes("//div[contains(@class, 'webinar')] | //article | //div[contains(@class, 'event')]");
                
                if (webinarNodes != null)
                {
                    foreach (var node in webinarNodes)
                    {
                        var webinar = ExtractWebinarFromHtml(node);
                        if (webinar != null && !string.IsNullOrEmpty(webinar.Title))
                        {
                            webinars.Add(webinar);
                        }
                    }
                }

                _logger.LogInformation($"Web scraping extracted {webinars.Count} webinars");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Web scraping failed");
            }

            return webinars;
        }

        private WebinarData ExtractWebinarFromHtml(HtmlNode node)
        {
            try
            {
                var title = node.SelectSingleNode(".//h1 | .//h2 | .//h3 | .//h4")?.InnerText?.Trim();
                var dateText = node.SelectSingleNode(".//*[contains(@class, 'date')] | .//*[contains(text(), '2024')] | .//*[contains(text(), '2025')]")?.InnerText?.Trim();
                var description = node.SelectSingleNode(".//p | .//div[contains(@class, 'description')]")?.InnerText?.Trim();
                var registerLink = node.SelectSingleNode(".//a[contains(@class, 'register') or contains(text(), 'Register')]")?.GetAttributeValue("href", "");

                if (string.IsNullOrEmpty(title)) return null;

                return new WebinarData
                {
                    Title = title,
                    Date = ParseDateFromText(dateText),
                    Description = description ?? "",
                    RegistrationUrl = registerLink ?? "",
                    IsUpcoming = IsDateUpcoming(ParseDateFromText(dateText))
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to extract webinar from HTML node");
                return null;
            }
        }

        private List<WebinarData> ConvertWordPressPostsToWebinars(List<WordPressPost> posts)
        {
            var webinars = new List<WebinarData>();

            foreach (var post in posts)
            {
                // Filter for webinar-related posts
                if (IsWebinarPost(post))
                {
                    var webinar = new WebinarData
                    {
                        Id = post.Id,
                        Title = post.Title?.Rendered ?? "",
                        Description = post.Excerpt?.Rendered ?? post.Content?.Rendered ?? "",
                        Date = post.Date,
                        Slug = post.Slug ?? "",
                        Url = post.Link ?? "",
                        IsUpcoming = IsDateUpcoming(post.Date)
                    };

                    // Try to extract additional metadata
                    if (post.Meta != null)
                    {
                        webinar.RegistrationUrl = ExtractMetaValue(post.Meta, "registration_url") ?? 
                                                ExtractMetaValue(post.Meta, "register_link") ?? "";
                    }

                    webinars.Add(webinar);
                }
            }

            // Filter for upcoming webinars only
            return webinars.Where(w => w.IsUpcoming).OrderBy(w => w.Date).ToList();
        }

        private bool IsWebinarPost(WordPressPost post)
        {
            var title = post.Title?.Rendered?.ToLower() ?? "";
            var content = post.Content?.Rendered?.ToLower() ?? "";
            var excerpt = post.Excerpt?.Rendered?.ToLower() ?? "";
            
            var webinarKeywords = new[] { "webinar", "seminar", "workshop", "event", "training", "session" };
            
            return webinarKeywords.Any(keyword => 
                title.Contains(keyword) || 
                content.Contains(keyword) || 
                excerpt.Contains(keyword));
        }

        private string ExtractMetaValue(Dictionary<string, object> meta, string key)
        {
            return meta.TryGetValue(key, out var value) ? value?.ToString() : null;
        }

        private DateTime? ParseDateFromText(string dateText)
        {
            if (string.IsNullOrEmpty(dateText)) return null;

            // Try various date formats
            var formats = new[]
            {
                "MMMM dd, yyyy",
                "MMM dd, yyyy", 
                "MM/dd/yyyy",
                "yyyy-MM-dd",
                "dd/MM/yyyy"
            };

            foreach (var format in formats)
            {
                if (DateTime.TryParseExact(dateText, format, null, System.Globalization.DateTimeStyles.None, out var date))
                {
                    return date;
                }
            }

            // Fallback to general parsing
            if (DateTime.TryParse(dateText, out var parsedDate))
            {
                return parsedDate;
            }

            return null;
        }

        private bool IsDateUpcoming(DateTime? date)
        {
            return date.HasValue && date.Value.Date >= DateTime.Today;
        }

        public async Task ClearCacheAsync()
        {
            _cache.Remove(CACHE_KEY);
            _logger.LogInformation("Webinar cache cleared");
        }
    }

    // Data Models
    public class WebinarData
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public DateTime? Date { get; set; }
        public string Slug { get; set; } = "";
        public string Url { get; set; } = "";
        public string RegistrationUrl { get; set; } = "";
        public bool IsUpcoming { get; set; }
        public string ImageUrl { get; set; } = "";
    }

    public class WordPressPost
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public string Slug { get; set; } = "";
        public string Link { get; set; } = "";
        public WordPressRendered? Title { get; set; }
        public WordPressRendered? Content { get; set; }
        public WordPressRendered? Excerpt { get; set; }
        public Dictionary<string, object>? Meta { get; set; }
    }

    public class WordPressRendered
    {
        public string Rendered { get; set; } = "";
    }
}