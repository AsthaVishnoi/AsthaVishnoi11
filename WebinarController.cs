using Microsoft.AspNetCore.Mvc;
using WebinarExtraction.Services;

namespace WebinarExtraction.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WebinarController : ControllerBase
    {
        private readonly WebinarService _webinarService;
        private readonly ILogger<WebinarController> _logger;

        public WebinarController(WebinarService webinarService, ILogger<WebinarController> logger)
        {
            _webinarService = webinarService;
            _logger = logger;
        }

        /// <summary>
        /// Get all upcoming webinars from WordPress site
        /// </summary>
        /// <returns>List of upcoming webinars</returns>
        [HttpGet("upcoming")]
        public async Task<ActionResult<List<WebinarData>>> GetUpcomingWebinars()
        {
            try
            {
                var webinars = await _webinarService.GetWebinarsAsync();
                
                if (webinars == null || webinars.Count == 0)
                {
                    return NotFound("No upcoming webinars found");
                }

                return Ok(webinars);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving webinars");
                return StatusCode(500, "Internal server error while retrieving webinars");
            }
        }

        /// <summary>
        /// Clear the webinar cache to force refresh
        /// </summary>
        [HttpPost("refresh")]
        public async Task<ActionResult> RefreshWebinars()
        {
            try
            {
                await _webinarService.ClearCacheAsync();
                return Ok("Cache cleared successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing cache");
                return StatusCode(500, "Internal server error while clearing cache");
            }
        }

        /// <summary>
        /// Get webinars with fresh data (bypasses cache)
        /// </summary>
        [HttpGet("fresh")]
        public async Task<ActionResult<List<WebinarData>>> GetFreshWebinars()
        {
            try
            {
                // Clear cache first
                await _webinarService.ClearCacheAsync();
                
                // Get fresh data
                var webinars = await _webinarService.GetWebinarsAsync();
                
                if (webinars == null || webinars.Count == 0)
                {
                    return NotFound("No upcoming webinars found");
                }

                return Ok(webinars);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving fresh webinars");
                return StatusCode(500, "Internal server error while retrieving fresh webinars");
            }
        }
    }
}