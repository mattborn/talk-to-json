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
