package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

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

		// Repository routes
		repos := api.Group("/repositories")
		repos.Use(authMiddleware())
		{
			repos.GET("", getRepositories)
			repos.PATCH("/:id", updateRepository)
			repos.DELETE("/:id", deleteRepository)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	r.Run(":" + port)
}

// Placeholder handlers - will be implemented later
func handleGitHubAuth(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func handleGitHubCallback(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func handleLogout(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func getRepositories(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func updateRepository(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func deleteRepository(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Placeholder middleware - will be implemented later
		c.Next()
	}
}