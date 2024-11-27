const startButton = document.getElementById('startButton')
let schemas = {}

// Load schemas
fetch('schemas.json')
  .then(response => response.json())
  .then(data => {
    schemas = data
    const schemaCards = document.getElementById('schemaCards')
    Object.entries(schemas).forEach(([key, schema]) => {
      const label = document.createElement('label')
      label.className = `radio-card ${key === 'default' ? 'active' : ''}`
      label.innerHTML = `
                <input type="radio" name="schema" value="${key}" ${key === 'default' ? 'checked' : ''}>
                <span>${schema.name}</span>
            `
      schemaCards.appendChild(label)
    })

    // Set initial JSON preview to default schema
    const defaultSchema = schemas.default.schema
    document.querySelector('#jsonPreview code').textContent = JSON.stringify(defaultSchema, null, 4)
    Prism.highlightElement(document.querySelector('#jsonPreview code'))
  })

// GPT conversation state
let sessionStream = []

// Initialize with selected schema
function initializeSessionStream() {
  const schemaKey = document.querySelector('input[name="schema"]:checked').value
  const schema = schemas[schemaKey]
  sessionStream = [
    {
      role: 'system',
      content: 'Convert transcribed text into structured JSON data.',
    },
  ]
}

// Helper method for GPT-4 calls
const gpt4 = async messages => {
  try {
    const response = await fetch(`https://us-central1-samantha-374622.cloudfunctions.net/openai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: 'gpt-4o',
      }),
    })
    return response.text()
  } catch (error) {
    console.error('GPT-4 API error:', error)
    return null
  }
}

const toJSON = str => {
  const curly = str.indexOf('{')
  const square = str.indexOf('[')
  let first
  if (curly < 0) first = '['
  else if (square < 0) first = '{'
  else first = curly < square ? '{' : '['
  const last = first === '{' ? '}' : ']'
  let count = 0
  for (const c of str) {
    if (c === '{' || c === '[') count++
    else if (c === '}' || c === ']') count--
  }
  if (!count) return JSON.parse(str.slice(str.indexOf(first), str.lastIndexOf(last) + 1))
}

const transcriptionsDiv = document.getElementById('transcriptions')
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()

recognition.continuous = true
recognition.interimResults = true

let isRecording = false
let currentTranscript = ''

// Load saved transcriptions
const savedTranscriptions = JSON.parse(localStorage.getItem('transcriptions') || '[]')
savedTranscriptions.forEach(t => addTranscriptionToPage(t))

function addTranscriptionToPage(text) {
  const div = document.createElement('div')
  div.className = 'transcription'

  const textSpan = document.createElement('span')
  textSpan.textContent = text

  const deleteBtn = document.createElement('span')
  deleteBtn.innerHTML = '🗑️'
  deleteBtn.className = 'delete-btn'
  deleteBtn.onclick = async () => {
    div.remove()
    // Update localStorage
    const transcriptions = JSON.parse(localStorage.getItem('transcriptions') || '[]')
    const index = transcriptions.indexOf(text)
    if (index > -1) {
      transcriptions.splice(index, 1)
      localStorage.setItem('transcriptions', JSON.stringify(transcriptions))
    }
    await simulateJsonUpdate()
  }

  div.appendChild(textSpan)
  div.appendChild(deleteBtn)
  transcriptionsDiv.insertBefore(div, transcriptionsDiv.firstChild)
}

async function simulateJsonUpdate() {
  const jsonPreview = document.getElementById('jsonPreview')
  jsonPreview.classList.add('loading')
  const text = await gpt4(sessionStream)
  if (text) {
    const json = toJSON(text)
    jsonPreview.querySelector('code').textContent = JSON.stringify(json, null, 4)
    Prism.highlightElement(jsonPreview.querySelector('code'))
  }
  jsonPreview.classList.remove('loading')
}

async function saveTranscription(transcriptionText) {
  const transcriptions = JSON.parse(localStorage.getItem('transcriptions') || '[]')
  transcriptions.unshift(transcriptionText)
  localStorage.setItem('transcriptions', JSON.stringify(transcriptions))
  addTranscriptionToPage(transcriptionText)

  // Get all transcriptions for context
  const allTranscriptions = document.querySelectorAll('.transcription:not(.interim)')
  const transcriptionTexts = Array.from(allTranscriptions).map(div => div.querySelector('span').textContent)

  // Initialize stream with current schema
  initializeSessionStream()

  // Add all transcriptions as context
  const schemaKey = document.querySelector('input[name="schema"]:checked').value
  const schema = schemas[schemaKey]
  sessionStream.push({
    role: 'user',
    content: `Return a single JSON object copying this schema: ${JSON.stringify(
      schema.schema,
    )} and use the values as hints for what to generate from this text: "${transcriptionTexts.join(' ')}"`,
  })
  const text = await gpt4(sessionStream)
  if (text) {
    try {
      const jsonData = toJSON(text)
      const jsonPreview = document.getElementById('jsonPreview')
      jsonPreview.classList.add('loading')
      jsonPreview.querySelector('code').textContent = JSON.stringify(jsonData, null, 4)
      Prism.highlightElement(jsonPreview.querySelector('code'))
      setTimeout(() => jsonPreview.classList.remove('loading'), 2000)
    } catch (error) {
      console.error('JSON parsing error:', error)
    }
  }
}

async function handleTranscription() {
  return currentTranscript
}

recognition.onresult = event => {
  currentTranscript = Array.from(event.results)
    .map(result => result[0].transcript)
    .join(' ')

  // Show interim results
  const tempDiv = document.querySelector('.transcription.interim') || document.createElement('div')
  tempDiv.className = 'transcription interim'
  tempDiv.textContent = currentTranscript

  if (!document.querySelector('.transcription.interim')) {
    transcriptionsDiv.insertBefore(tempDiv, transcriptionsDiv.firstChild)
  }
}

startButton.addEventListener('click', async () => {
  if (!isRecording) {
    isRecording = true
    startButton.textContent = 'Stop Recording'
    recognition.start()
  } else {
    isRecording = false
    startButton.textContent = 'Start Recording'
    recognition.stop()
    const transcription = await handleTranscription()
    if (transcription) {
      saveTranscription(transcription)
      await simulateJsonUpdate()
    }
    currentTranscript = ''
    const interimDiv = document.querySelector('.transcription.interim')
    if (interimDiv) {
      interimDiv.remove()
    }
  }
})

recognition.onend = () => {
  if (isRecording) {
    recognition.start()
  }
}
