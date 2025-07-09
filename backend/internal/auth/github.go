package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
)

type GitHubUser struct {
	ID        int    `json:"id"`
	Login     string `json:"login"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	AvatarURL string `json:"avatar_url"`
	HTMLURL   string `json:"html_url"`
}

type UserToken struct {
	UserID      int    `json:"user_id"`
	Username    string `json:"username"`
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
}

// In-memory token storage (in production, use a database)
var userTokens = make(map[int]*UserToken)

var githubOAuthConfig *oauth2.Config

func InitGitHubOAuth() {
	githubOAuthConfig = &oauth2.Config{
		ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
		ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		RedirectURL:  fmt.Sprintf("%s/api/auth/callback", getBackendURL()),
		Scopes:       []string{"repo", "user:email", "read:org", "delete_repo"},
		Endpoint:     github.Endpoint,
	}
}

func GetGitHubOAuthConfig() *oauth2.Config {
	if githubOAuthConfig == nil {
		InitGitHubOAuth()
	}
	return githubOAuthConfig
}

func GetGitHubUser(token *oauth2.Token) (*GitHubUser, error) {
	client := githubOAuthConfig.Client(context.Background(), token)
	
	resp, err := client.Get("https://api.github.com/user")
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub API returned status %d", resp.StatusCode)
	}

	var user GitHubUser
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, fmt.Errorf("failed to decode user info: %w", err)
	}

	return &user, nil
}

func getBackendURL() string {
	backendURL := os.Getenv("BACKEND_URL")
	if backendURL == "" {
		port := os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}
		backendURL = "http://localhost:" + port
	}
	return backendURL
}

func StoreUserToken(userID int, username string, token *oauth2.Token) {
	userTokens[userID] = &UserToken{
		UserID:      userID,
		Username:    username,
		AccessToken: token.AccessToken,
		TokenType:   token.TokenType,
	}
}

func GetUserToken(userID int) *UserToken {
	return userTokens[userID]
}

func GetOAuthToken(userID int) *oauth2.Token {
	userToken := userTokens[userID]
	if userToken == nil {
		return nil
	}
	
	return &oauth2.Token{
		AccessToken: userToken.AccessToken,
		TokenType:   userToken.TokenType,
	}
}