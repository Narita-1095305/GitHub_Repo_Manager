package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github-repo-manager/internal/auth"
	"github-repo-manager/internal/middleware"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"golang.org/x/oauth2"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize GitHub OAuth
	auth.InitGitHubOAuth()

	// Initialize Gin router
	r := gin.Default()

	// CORS configuration
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"}
	config.AllowCredentials = true
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
			"message": "GitHub Repository Manager API",
		})
	})

	// API routes
	api := r.Group("/api")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.GET("/github", handleGitHubAuth)
			auth.GET("/callback", handleGitHubCallback)
			auth.POST("/logout", handleLogout)
		}

		// Protected routes
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.GET("/auth/me", getCurrentUser)
			
			// Repository routes
			repos := protected.Group("/repositories")
			{
				repos.GET("", getRepositories)
				repos.PATCH("/:id", updateRepository)
				repos.DELETE("/:id", deleteRepository)
				repos.POST("/bulk-update", bulkUpdateRepositories)
				repos.POST("/bulk-delete", bulkDeleteRepositories)
			}
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	r.Run(":" + port)
}

// Auth handlers
func handleGitHubAuth(c *gin.Context) {
	config := auth.GetGitHubOAuthConfig()
	state := "random-state-string" // In production, use a secure random state
	url := config.AuthCodeURL(state, oauth2.AccessTypeOffline)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func handleGitHubCallback(c *gin.Context) {
	code := c.Query("code")
	state := c.Query("state")
	
	// Validate state parameter (in production, verify against stored state)
	if state != "random-state-string" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid state parameter"})
		return
	}
	
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization code not provided"})
		return
	}
	
	config := auth.GetGitHubOAuthConfig()
	token, err := config.Exchange(c.Request.Context(), code)
	if err != nil {
		log.Printf("Failed to exchange code for token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange authorization code"})
		return
	}
	
	// Get user info from GitHub
	user, err := auth.GetGitHubUser(token)
	if err != nil {
		log.Printf("Failed to get user info: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user information"})
		return
	}
	
	// Store the OAuth token for future API calls
	auth.StoreUserToken(user.ID, user.Login, token)
	
	// Generate JWT token
	jwtToken, err := auth.GenerateJWT(user.ID, user.Login)
	if err != nil {
		log.Printf("Failed to generate JWT: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate authentication token"})
		return
	}
	
	// Redirect to frontend with token
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}
	
	redirectURL := frontendURL + "/auth/callback?token=" + jwtToken
	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

func handleLogout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func getCurrentUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	
	_, exists = c.Get("username")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	
	// Get user's OAuth token
	userIDInt := userID.(int)
	token := auth.GetOAuthToken(userIDInt)
	if token == nil {
		log.Printf("No OAuth token found for user %d", userIDInt)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "GitHub token not found. Please re-authenticate."})
		return
	}
	
	// Fetch current user info from GitHub
	client := &http.Client{}
	req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		log.Printf("Failed to create request: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create GitHub API request"})
		return
	}
	
	req.Header.Set("Authorization", "Bearer "+token.AccessToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "GitHub-Repository-Manager")
	
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Failed to call GitHub API: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user info from GitHub"})
		return
	}
	defer resp.Body.Close()
	
	if resp.StatusCode == 401 {
		log.Printf("GitHub API returned 401 for user %d", userIDInt)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "GitHub token expired. Please re-authenticate."})
		return
	}
	
	if resp.StatusCode != 200 {
		log.Printf("GitHub API returned status %d for user %d", resp.StatusCode, userIDInt)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("GitHub API error: %d", resp.StatusCode)})
		return
	}
	
	var user map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		log.Printf("Failed to decode GitHub API response: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse GitHub API response"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": user,
	})
}

func getRepositories(c *gin.Context) {
	// Get user info from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	
	username, exists := c.Get("username")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	
	// Get pagination parameters
	page := 1
	perPage := 30
	
	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}
	
	if perPageStr := c.Query("per_page"); perPageStr != "" {
		if pp, err := strconv.Atoi(perPageStr); err == nil && pp > 0 && pp <= 100 {
			perPage = pp
		}
	}
	
	// Get user's OAuth token
	userIDInt := userID.(int)
	token := auth.GetOAuthToken(userIDInt)
	if token == nil {
		log.Printf("No OAuth token found for user %d", userIDInt)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "GitHub token not found. Please re-authenticate."})
		return
	}
	
	// Create GitHub client and fetch repositories
	client := &http.Client{}
	// Try a simpler approach - get all repositories without complex filtering
	url := fmt.Sprintf("https://api.github.com/user/repos?page=%d&per_page=%d&sort=updated", page, perPage)
	
	log.Printf("GitHub API URL: %s", url)
	log.Printf("Using token: %s...", token.AccessToken[:10]) // Log first 10 chars for debugging
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		log.Printf("Failed to create request: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create GitHub API request"})
		return
	}
	
	req.Header.Set("Authorization", "Bearer "+token.AccessToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "GitHub-Repository-Manager")
	
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Failed to call GitHub API: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch repositories from GitHub"})
		return
	}
	defer resp.Body.Close()
	
	if resp.StatusCode == 401 {
		log.Printf("GitHub API returned 401 for user %d", userIDInt)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "GitHub token expired. Please re-authenticate."})
		return
	}
	
	if resp.StatusCode != 200 {
		log.Printf("GitHub API returned status %d for user %d", resp.StatusCode, userIDInt)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("GitHub API error: %d", resp.StatusCode)})
		return
	}
	
	var repositories []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&repositories); err != nil {
		log.Printf("Failed to decode GitHub API response: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse GitHub API response"})
		return
	}
	
	// Debug: Log repository details
	log.Printf("Fetched %d repositories for user %d:", len(repositories), userIDInt)
	for i, repo := range repositories {
		if i < 5 { // Log first 5 repos for debugging
			name := "unknown"
			private := false
			archived := false
			if n, ok := repo["name"].(string); ok {
				name = n
			}
			if p, ok := repo["private"].(bool); ok {
				private = p
			}
			if a, ok := repo["archived"].(bool); ok {
				archived = a
			}
			log.Printf("  Repo %d: %s (private: %v, archived: %v)", i+1, name, private, archived)
		}
	}
	
	// Get total count by making a separate API call to get all repositories count
	var totalCount int
	countReq, err := http.NewRequest("GET", "https://api.github.com/user/repos?per_page=1", nil)
	if err == nil {
		countReq.Header.Set("Authorization", "Bearer "+token.AccessToken)
		countReq.Header.Set("Accept", "application/vnd.github.v3+json")
		countReq.Header.Set("User-Agent", "GitHub-Repository-Manager")
		
		countResp, err := client.Do(countReq)
		if err == nil && countResp.StatusCode == 200 {
			// Parse Link header to get total count
			linkHeader := countResp.Header.Get("Link")
			log.Printf("Link header: %s", linkHeader)
			totalCount = parseTotalFromLinkHeader(linkHeader, len(repositories))
			log.Printf("Parsed total count: %d", totalCount)
			countResp.Body.Close()
		} else {
			log.Printf("Count request failed: status %d", countResp.StatusCode)
			totalCount = len(repositories)
		}
	} else {
		log.Printf("Count request creation failed: %v", err)
		totalCount = len(repositories)
	}
	
	// If total count is still just the current page, try a different approach
	if totalCount <= 30 {
		// Make a request to get more repositories to estimate total
		estimateReq, err := http.NewRequest("GET", "https://api.github.com/user/repos?per_page=100", nil)
		if err == nil {
			estimateReq.Header.Set("Authorization", "Bearer "+token.AccessToken)
			estimateReq.Header.Set("Accept", "application/vnd.github.v3+json")
			estimateReq.Header.Set("User-Agent", "GitHub-Repository-Manager")
			
			estimateResp, err := client.Do(estimateReq)
			if err == nil {
				var estimateRepos []map[string]interface{}
				if err := json.NewDecoder(estimateResp.Body).Decode(&estimateRepos); err == nil {
					if len(estimateRepos) == 100 {
						// There are likely more than 100 repositories
						totalCount = 200 // Conservative estimate
					} else {
						totalCount = len(estimateRepos)
					}
					log.Printf("Estimated total count: %d", totalCount)
				}
				estimateResp.Body.Close()
			}
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"data": repositories,
			"pagination": gin.H{
				"page":     page,
				"per_page": perPage,
				"total":    totalCount,
			},
		},
	})
	
	log.Printf("User %d (%s) fetched %d repositories from GitHub (page: %d, per_page: %d, total: %d)", userIDInt, username, len(repositories), page, perPage, totalCount)
}

func parseTotalFromLinkHeader(linkHeader string, fallback int) int {
	if linkHeader == "" {
		return fallback
	}
	
	// Parse Link header to extract last page number
	// Example: <https://api.github.com/user/repos?page=2>; rel="next", <https://api.github.com/user/repos?page=5>; rel="last"
	parts := strings.Split(linkHeader, ",")
	for _, part := range parts {
		if strings.Contains(part, `rel="last"`) {
			// Extract URL from <URL>
			start := strings.Index(part, "<")
			end := strings.Index(part, ">")
			if start != -1 && end != -1 && end > start {
				url := part[start+1 : end]
				// Extract page number from URL
				if strings.Contains(url, "page=") {
					pageStart := strings.Index(url, "page=") + 5
					pageEnd := pageStart
					for pageEnd < len(url) && url[pageEnd] >= '0' && url[pageEnd] <= '9' {
						pageEnd++
					}
					if pageEnd > pageStart {
						if lastPage, err := strconv.Atoi(url[pageStart:pageEnd]); err == nil {
							// Assume 30 repos per page for total calculation
							return lastPage * 30
						}
					}
				}
			}
		}
	}
	
	// If we can't parse, return a reasonable estimate
	if fallback == 30 {
		return 100 // Assume there are more repositories
	}
	return fallback
}

func updateRepository(c *gin.Context) {
	// Get user info from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	
	repoID := c.Param("id")
	if repoID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Repository ID required"})
		return
	}
	
	// Parse request body
	var updateReq struct {
		Private  *bool `json:"private"`
		Archived *bool `json:"archived"`
		Owner    string `json:"owner"`
		Name     string `json:"name"`
	}
	
	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	
	// Get user's OAuth token
	userIDInt := userID.(int)
	token := auth.GetOAuthToken(userIDInt)
	if token == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "GitHub token not found. Please re-authenticate."})
		return
	}
	
	// Prepare update data
	updateData := make(map[string]interface{})
	if updateReq.Private != nil {
		updateData["private"] = *updateReq.Private
	}
	if updateReq.Archived != nil {
		updateData["archived"] = *updateReq.Archived
	}
	
	if len(updateData) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No update data provided"})
		return
	}
	
	// Call GitHub API
	client := &http.Client{}
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s", updateReq.Owner, updateReq.Name)
	
	jsonData, err := json.Marshal(updateData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare update data"})
		return
	}
	
	req, err := http.NewRequest("PATCH", url, strings.NewReader(string(jsonData)))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create GitHub API request"})
		return
	}
	
	req.Header.Set("Authorization", "Bearer "+token.AccessToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "GitHub-Repository-Manager")
	
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update repository"})
		return
	}
	defer resp.Body.Close()
	
	if resp.StatusCode == 401 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "GitHub token expired. Please re-authenticate."})
		return
	}
	
	if resp.StatusCode != 200 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("GitHub API error: %d", resp.StatusCode)})
		return
	}
	
	var updatedRepo map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&updatedRepo); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse GitHub API response"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": updatedRepo,
		"message": "Repository updated successfully",
	})
	
	log.Printf("User %d updated repository %s/%s", userIDInt, updateReq.Owner, updateReq.Name)
}

func deleteRepository(c *gin.Context) {
	// Get user info from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	
	repoID := c.Param("id")
	if repoID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Repository ID required"})
		return
	}
	
	// Parse request body for owner and name
	var deleteReq struct {
		Owner string `json:"owner"`
		Name  string `json:"name"`
	}
	
	if err := c.ShouldBindJSON(&deleteReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	
	// Get user's OAuth token
	userIDInt := userID.(int)
	token := auth.GetOAuthToken(userIDInt)
	if token == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "GitHub token not found. Please re-authenticate."})
		return
	}
	
	// Call GitHub API to delete repository
	client := &http.Client{}
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s", deleteReq.Owner, deleteReq.Name)
	
	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create GitHub API request"})
		return
	}
	
	req.Header.Set("Authorization", "Bearer "+token.AccessToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "GitHub-Repository-Manager")
	
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete repository"})
		return
	}
	defer resp.Body.Close()
	
	if resp.StatusCode == 401 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "GitHub token expired. Please re-authenticate."})
		return
	}
	
	if resp.StatusCode != 204 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("GitHub API error: %d", resp.StatusCode)})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Repository deleted successfully",
	})
	
	log.Printf("User %d deleted repository %s/%s", userIDInt, deleteReq.Owner, deleteReq.Name)
}

func bulkUpdateRepositories(c *gin.Context) {
	// Get user info from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	
	// Parse request body
	var bulkReq struct {
		Repositories []struct {
			Owner string `json:"owner"`
			Name  string `json:"name"`
		} `json:"repositories"`
		Updates struct {
			Private  *bool `json:"private"`
			Archived *bool `json:"archived"`
		} `json:"updates"`
	}
	
	if err := c.ShouldBindJSON(&bulkReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	
	if len(bulkReq.Repositories) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No repositories specified"})
		return
	}
	
	// Get user's OAuth token
	userIDInt := userID.(int)
	token := auth.GetOAuthToken(userIDInt)
	if token == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "GitHub token not found. Please re-authenticate."})
		return
	}
	
	// Prepare update data
	updateData := make(map[string]interface{})
	if bulkReq.Updates.Private != nil {
		updateData["private"] = *bulkReq.Updates.Private
	}
	if bulkReq.Updates.Archived != nil {
		updateData["archived"] = *bulkReq.Updates.Archived
	}
	
	if len(updateData) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No update data provided"})
		return
	}
	
	client := &http.Client{}
	results := make([]map[string]interface{}, 0)
	errors := make([]string, 0)
	
	// Update each repository
	for _, repo := range bulkReq.Repositories {
		url := fmt.Sprintf("https://api.github.com/repos/%s/%s", repo.Owner, repo.Name)
		
		jsonData, err := json.Marshal(updateData)
		if err != nil {
			errors = append(errors, fmt.Sprintf("Failed to prepare data for %s/%s", repo.Owner, repo.Name))
			continue
		}
		
		req, err := http.NewRequest("PATCH", url, strings.NewReader(string(jsonData)))
		if err != nil {
			errors = append(errors, fmt.Sprintf("Failed to create request for %s/%s", repo.Owner, repo.Name))
			continue
		}
		
		req.Header.Set("Authorization", "Bearer "+token.AccessToken)
		req.Header.Set("Accept", "application/vnd.github.v3+json")
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("User-Agent", "GitHub-Repository-Manager")
		
		resp, err := client.Do(req)
		if err != nil {
			errors = append(errors, fmt.Sprintf("Failed to update %s/%s", repo.Owner, repo.Name))
			continue
		}
		
		if resp.StatusCode == 200 {
			var updatedRepo map[string]interface{}
			if err := json.NewDecoder(resp.Body).Decode(&updatedRepo); err == nil {
				results = append(results, updatedRepo)
			}
		} else {
			errors = append(errors, fmt.Sprintf("GitHub API error for %s/%s: %d", repo.Owner, repo.Name, resp.StatusCode))
		}
		resp.Body.Close()
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"updated": results,
			"errors":  errors,
			"total":   len(bulkReq.Repositories),
			"success": len(results),
			"failed":  len(errors),
		},
		"message": fmt.Sprintf("Bulk update completed: %d success, %d failed", len(results), len(errors)),
	})
	
	log.Printf("User %d performed bulk update on %d repositories", userIDInt, len(bulkReq.Repositories))
}

func bulkDeleteRepositories(c *gin.Context) {
	// Get user info from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	
	// Parse request body
	var bulkReq struct {
		Repositories []struct {
			Owner string `json:"owner"`
			Name  string `json:"name"`
		} `json:"repositories"`
	}
	
	if err := c.ShouldBindJSON(&bulkReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	
	if len(bulkReq.Repositories) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No repositories specified"})
		return
	}
	
	// Get user's OAuth token
	userIDInt := userID.(int)
	token := auth.GetOAuthToken(userIDInt)
	if token == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "GitHub token not found. Please re-authenticate."})
		return
	}
	
	client := &http.Client{}
	deleted := make([]string, 0)
	errors := make([]string, 0)
	
	// Delete each repository
	for _, repo := range bulkReq.Repositories {
		url := fmt.Sprintf("https://api.github.com/repos/%s/%s", repo.Owner, repo.Name)
		
		req, err := http.NewRequest("DELETE", url, nil)
		if err != nil {
			errors = append(errors, fmt.Sprintf("Failed to create request for %s/%s", repo.Owner, repo.Name))
			continue
		}
		
		req.Header.Set("Authorization", "Bearer "+token.AccessToken)
		req.Header.Set("Accept", "application/vnd.github.v3+json")
		req.Header.Set("User-Agent", "GitHub-Repository-Manager")
		
		resp, err := client.Do(req)
		if err != nil {
			errors = append(errors, fmt.Sprintf("Failed to delete %s/%s", repo.Owner, repo.Name))
			continue
		}
		
		if resp.StatusCode == 204 {
			deleted = append(deleted, fmt.Sprintf("%s/%s", repo.Owner, repo.Name))
		} else {
			// Read response body for more detailed error info
			bodyBytes, _ := io.ReadAll(resp.Body)
			bodyString := string(bodyBytes)
			log.Printf("GitHub API delete error for %s/%s: status %d, body: %s", repo.Owner, repo.Name, resp.StatusCode, bodyString)
			errors = append(errors, fmt.Sprintf("GitHub API error for %s/%s: %d - %s", repo.Owner, repo.Name, resp.StatusCode, bodyString))
		}
		resp.Body.Close()
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"deleted": deleted,
			"errors":  errors,
			"total":   len(bulkReq.Repositories),
			"success": len(deleted),
			"failed":  len(errors),
		},
		"message": fmt.Sprintf("Bulk delete completed: %d success, %d failed", len(deleted), len(errors)),
	})
	
	log.Printf("User %d performed bulk delete on %d repositories", userIDInt, len(bulkReq.Repositories))
}

