package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"golang.org/x/oauth2"
)

type Repository struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	FullName    string `json:"full_name"`
	Description string `json:"description"`
	Private     bool   `json:"private"`
	Archived    bool   `json:"archived"`
	HTMLURL     string `json:"html_url"`
	CloneURL    string `json:"clone_url"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
	PushedAt    string `json:"pushed_at"`
	Size        int    `json:"size"`
	StargazersCount int `json:"stargazers_count"`
	WatchersCount   int `json:"watchers_count"`
	Language        string `json:"language"`
	ForksCount      int `json:"forks_count"`
	OpenIssuesCount int `json:"open_issues_count"`
	DefaultBranch   string `json:"default_branch"`
	Owner           Owner `json:"owner"`
}

type Owner struct {
	Login     string `json:"login"`
	AvatarURL string `json:"avatar_url"`
	HTMLURL   string `json:"html_url"`
}

type GitHubClient struct {
	httpClient *http.Client
}

func NewGitHubClient(token *oauth2.Token, config *oauth2.Config) *GitHubClient {
	return &GitHubClient{
		httpClient: config.Client(context.Background(), token),
	}
}

func (g *GitHubClient) GetRepositories() ([]Repository, error) {
	resp, err := g.httpClient.Get("https://api.github.com/user/repos?per_page=100&sort=updated")
	if err != nil {
		return nil, fmt.Errorf("failed to get repositories: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub API returned status %d", resp.StatusCode)
	}

	var repos []Repository
	if err := json.NewDecoder(resp.Body).Decode(&repos); err != nil {
		return nil, fmt.Errorf("failed to decode repositories: %w", err)
	}

	return repos, nil
}

func (g *GitHubClient) UpdateRepository(owner, repo string, updates map[string]interface{}) (*Repository, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s", owner, repo)
	
	// Implementation will be added when we implement the actual update functionality
	// This is a placeholder for now
	return nil, fmt.Errorf("not implemented yet")
}

func (g *GitHubClient) DeleteRepository(owner, repo string) error {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s", owner, repo)
	
	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create delete request: %w", err)
	}

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to delete repository: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("GitHub API returned status %d", resp.StatusCode)
	}

	return nil
}