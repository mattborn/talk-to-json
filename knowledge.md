# Talk-to-JSON

[previous sections remain unchanged...]

## State Management
- Collect transcription texts immediately before making API calls
- Do not cache or store concatenated transcriptions
- Rebuild context from current DOM state for each request
- When deleting transcriptions:
  - Remove from DOM and localStorage
  - Rebuild context from remaining transcriptions
  - Make new API call with fresh context
- Avoid storing conversation state outside of sessionStream
- Reset session stream before any state changes:
  - Before processing deletions
  - After clearing transcriptions
  - When switching schemas
- Always rebuild API context from current UI state
- Never rely on cached/stored conversation history
- Context must be rebuilt from visible UI elements only
- Deleted transcriptions must not influence future API calls
- Each API call should only use currently visible transcriptions

[rest of file remains unchanged...]
