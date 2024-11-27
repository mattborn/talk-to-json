# Talk-to-JSON

[previous sections remain unchanged...]

## API Integration
- Use `/openai` endpoint instead of `/gpt4` to avoid CORS issues
- Base URL: `https://us-central1-samantha-374622.cloudfunctions.net`
- Required request format:
  - messages: array of message objects
  - model: "gpt-4o"
- API returns markdown-formatted responses with ```json blocks
- Must use toJSON helper to parse responses - do not use JSON.parse directly
- No test fixtures - use live API calls only
- Response handling pattern:
  ```js
  gpt4(messages).then(text => {
    const json = toJSON(text)
    // Now use json...
  })
  ```
- Avoid duplicate API calls:
  - Only one component should handle API calls for a given state change
  - Use simulateJsonUpdate for preview-only updates
  - Use saveTranscription for persistence + preview updates
  - Never call both for the same state change

[rest of file remains unchanged...]

## Development Guidelines
- Start with core functionality only (Web Speech API + GPT4)
- Avoid premature addition of alternative services
- Add complexity only when core features are stable
- Focus on reliability of primary user path before adding options

## UI Patterns
- Show loading states immediately before starting async work
- Use same loading pattern for all async operations (recording stop, deletion)
- Loading animations should indicate work in progress, not completion
- Apply loading state to container before making API calls
