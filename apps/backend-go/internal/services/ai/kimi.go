package ai

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"backend-go/internal/config"

	"github.com/sirupsen/logrus"
)

type KimiClient struct {
	apiKey  string
	baseURL string
	client  *http.Client
}

func NewKimiClient(cfg *config.KimiConfig) *KimiClient {
	return &KimiClient{
		apiKey:  cfg.APIKey,
		baseURL: cfg.BaseURL,
		client: &http.Client{
			Timeout: 120 * time.Second,
		},
	}
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Model       string    `json:"model"`
	Messages    []Message `json:"messages"`
	Temperature float64   `json:"temperature,omitempty"`
	MaxTokens   int       `json:"max_tokens,omitempty"`
	Stream      bool      `json:"stream,omitempty"`
}

type ChatResponse struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	Model   string `json:"model"`
	Choices []struct {
		Index   int     `json:"index"`
		Message Message `json:"message"`
		Finish  string  `json:"finish_reason"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

func (k *KimiClient) ChatCompletion(ctx context.Context, messages []Message, maxTokens int) (*ChatResponse, error) {
	if k.apiKey == "" || k.apiKey == "demo_key" {
		// Return mock response for demo/testing
		return &ChatResponse{
			ID:      "demo-response",
			Object:  "chat.completion",
			Created: time.Now().Unix(),
			Model:   "moonshot-v1-8k",
			Choices: []struct {
				Index   int     `json:"index"`
				Message Message `json:"message"`
				Finish  string  `json:"finish_reason"`
			}{
				{
					Index: 0,
					Message: Message{
						Role:    "assistant",
						Content: "I'm a demo AI assistant. To get real AI responses, please configure a valid KIMI_API_KEY in your environment variables. You can get an API key from https://platform.moonshot.cn/",
					},
					Finish: "stop",
				},
			},
			Usage: struct {
				PromptTokens     int `json:"prompt_tokens"`
				CompletionTokens int `json:"completion_tokens"`
				TotalTokens      int `json:"total_tokens"`
			}{
				PromptTokens:     len(messages) * 10,
				CompletionTokens: 30,
				TotalTokens:      len(messages)*10 + 30,
			},
		}, nil
	}

	if maxTokens == 0 {
		maxTokens = 4096
	}

	reqBody := ChatRequest{
		Model:       "moonshot-v1-8k",
		Messages:    messages,
		Temperature: 0.7,
		MaxTokens:   maxTokens,
		Stream:      false,
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", k.baseURL+"/chat/completions", bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+k.apiKey)

	resp, err := k.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		logrus.WithField("status", resp.StatusCode).WithField("body", string(body)).Error("Kimi API error")
		return nil, fmt.Errorf("kimi API returned status %d", resp.StatusCode)
	}

	var chatResp ChatResponse
	if err := json.Unmarshal(body, &chatResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &chatResp, nil
}

func (k *KimiClient) GenerateWebsite(ctx context.Context, prompt, templateID string) (string, error) {
	systemPrompt := `You are a website generation assistant. Generate complete website content based on the user's requirements.
Return ONLY valid JSON with this structure:
{
  "title": "Site Title",
  "description": "Site description",
  "sections": [
    {"type": "hero", "content": {...}},
    {"type": "about", "content": {...}},
    {"type": "contact", "content": {...}}
  ],
  "seo": {
    "title": "Page title",
    "description": "Meta description",
    "keywords": ["keyword1", "keyword2"]
  }
}
Be creative and professional. Ensure all content is in the same language as the user's prompt.`

	messages := []Message{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: fmt.Sprintf("Create a website with template '%s'. Requirements: %s", templateID, prompt)},
	}

	resp, err := k.ChatCompletion(ctx, messages, 4096)
	if err != nil {
		return "", err
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no response from AI")
	}

	return resp.Choices[0].Message.Content, nil
}

func (k *KimiClient) Chat(ctx context.Context, messages []Message) (string, error) {
	resp, err := k.ChatCompletion(ctx, messages, 2048)
	if err != nil {
		return "", err
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no response from AI")
	}

	return resp.Choices[0].Message.Content, nil
}

// StreamResponse represents a streaming response chunk from Kimi API
type StreamResponse struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	Model   string `json:"model"`
	Choices []struct {
		Index        int     `json:"index"`
		Delta        Delta   `json:"delta"`
		FinishReason *string `json:"finish_reason"`
	} `json:"choices"`
}

// Delta represents the content delta in a streaming response
type Delta struct {
	Role    string `json:"role,omitempty"`
	Content string `json:"content,omitempty"`
}

// ChatCompletionStream performs a streaming chat completion
func (k *KimiClient) ChatCompletionStream(ctx context.Context, messages []Message, onChunk func(chunk string)) error {
	if k.apiKey == "" || k.apiKey == "demo_key" {
		// Return mock response for demo/testing
		mockResponse := "I'm a demo AI assistant. To get real AI responses, please configure a valid KIMI_API_KEY in your environment variables. You can get an API key from https://platform.moonshot.cn/"

		// Simulate streaming by sending chunks
		words := strings.Split(mockResponse, " ")
		for _, word := range words {
			select {
			case <-ctx.Done():
				return ctx.Err()
			default:
				onChunk(word + " ")
				time.Sleep(50 * time.Millisecond) // Simulate typing delay
			}
		}
		return nil
	}

	reqBody := ChatRequest{
		Model:       "moonshot-v1-8k",
		Messages:    messages,
		Temperature: 0.7,
		MaxTokens:   2048,
		Stream:      true,
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", k.baseURL+"/chat/completions", bytes.NewBuffer(jsonBody))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+k.apiKey)

	resp, err := k.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		logrus.WithField("status", resp.StatusCode).WithField("body", string(body)).Error("Kimi API streaming error")
		return fmt.Errorf("kimi API returned status %d", resp.StatusCode)
	}

	// Read the SSE stream
	reader := bufio.NewReader(resp.Body)
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				break
			}
			return fmt.Errorf("error reading stream: %w", err)
		}

		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// SSE format: data: {...}
		if !strings.HasPrefix(line, "data: ") {
			continue
		}

		data := strings.TrimPrefix(line, "data: ")

		// Check for stream end
		if data == "[DONE]" {
			break
		}

		var streamResp StreamResponse
		if err := json.Unmarshal([]byte(data), &streamResp); err != nil {
			logrus.WithError(err).WithField("data", data).Warn("Failed to unmarshal stream response")
			continue
		}

		if len(streamResp.Choices) > 0 {
			delta := streamResp.Choices[0].Delta
			if delta.Content != "" {
				onChunk(delta.Content)
			}
		}
	}

	return nil
}