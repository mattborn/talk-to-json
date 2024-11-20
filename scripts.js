const startButton = document.getElementById('startButton');
const transcriptionService = document.getElementById('transcriptionService');
const transcriptionsDiv = document.getElementById('transcriptions');
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

recognition.continuous = true;
recognition.interimResults = true;

let isRecording = false;
let currentTranscript = '';

// Load saved transcriptions
const savedTranscriptions = JSON.parse(localStorage.getItem('transcriptions') || '[]');
savedTranscriptions.forEach(t => addTranscriptionToPage(t));

function addTranscriptionToPage(text) {
    const div = document.createElement('div');
    div.className = 'transcription';
    
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    
    const deleteBtn = document.createElement('span');
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = async () => {
        div.remove();
        // Update localStorage
        const transcriptions = JSON.parse(localStorage.getItem('transcriptions') || '[]');
        const index = transcriptions.indexOf(text);
        if (index > -1) {
            transcriptions.splice(index, 1);
            localStorage.setItem('transcriptions', JSON.stringify(transcriptions));
        }
        await simulateJsonUpdate();
    };
    
    div.appendChild(textSpan);
    div.appendChild(deleteBtn);
    transcriptionsDiv.insertBefore(div, transcriptionsDiv.firstChild);
}

const jsonFixtures = [
    {
        type: "conversation",
        content: [
            {
                role: "user",
                text: "Add a new task to review the project documentation"
            }
        ],
        metadata: {
            confidence: 0.92,
            timestamp: "2024-03-21T14:30:00Z"
        }
    },
    {
        type: "conversation",
        content: [
            {
                role: "user",
                text: "Schedule a meeting with the design team for next week"
            }
        ],
        metadata: {
            confidence: 0.89,
            timestamp: "2024-03-21T14:31:00Z"
        }
    },
    {
        type: "conversation",
        content: [
            {
                role: "user",
                text: "Remind me to update the deployment scripts tomorrow"
            }
        ],
        metadata: {
            confidence: 0.95,
            timestamp: "2024-03-21T14:32:00Z"
        }
    },
    {
        type: "task_creation",
        content: [
            {
                priority: "high",
                deadline: "2024-03-25",
                text: "Prepare quarterly report for stakeholders"
            }
        ],
        metadata: {
            confidence: 0.91,
            timestamp: "2024-03-21T14:33:00Z"
        }
    },
    {
        type: "reminder",
        content: [
            {
                time: "tomorrow 9am",
                text: "Call the client about project requirements",
                recurring: false
            }
        ],
        metadata: {
            confidence: 0.88,
            timestamp: "2024-03-21T14:34:00Z"
        }
    },
    {
        type: "event",
        content: [
            {
                date: "2024-03-28",
                location: "Conference Room A",
                text: "Team retrospective meeting",
                attendees: ["team", "product_owner"]
            }
        ],
        metadata: {
            confidence: 0.93,
            timestamp: "2024-03-21T14:35:00Z"
        }
    },
    {
        type: "note",
        content: [
            {
                category: "bug",
                text: "Authentication service needs optimization",
                tags: ["backend", "performance"]
            }
        ],
        metadata: {
            confidence: 0.87,
            timestamp: "2024-03-21T14:36:00Z"
        }
    },
    {
        type: "command",
        content: [
            {
                action: "git",
                command: "create new branch for feature implementation",
                parsed: "git checkout -b feature/user-authentication"
            }
        ],
        metadata: {
            confidence: 0.94,
            timestamp: "2024-03-21T14:37:00Z"
        }
    }
];

async function simulateJsonUpdate() {
    const jsonPreview = document.getElementById('jsonPreview');
    jsonPreview.classList.add('loading');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const randomJson = jsonFixtures[Math.floor(Math.random() * jsonFixtures.length)];
    jsonPreview.querySelector('pre').textContent = JSON.stringify(randomJson, null, 4);
    jsonPreview.classList.remove('loading');
}

function saveTranscription(text) {
    const transcriptions = JSON.parse(localStorage.getItem('transcriptions') || '[]');
    transcriptions.unshift(text);
    localStorage.setItem('transcriptions', JSON.stringify(transcriptions));
    addTranscriptionToPage(text);
}

async function handleTranscription(audio) {
    switch(transcriptionService.value) {
        case 'webSpeech':
            return currentTranscript;
        case 'whisper':
            // TODO: Implement OpenAI Whisper API call
            return '[Whisper transcription placeholder]';
        case 'assembly':
            // TODO: Implement Assembly AI API call
            return '[Assembly AI transcription placeholder]';
    }
}

recognition.onresult = (event) => {
    currentTranscript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join(' ');
    
    // Show interim results
    const tempDiv = document.querySelector('.transcription.interim') || document.createElement('div');
    tempDiv.className = 'transcription interim';
    tempDiv.textContent = currentTranscript;
    
    if (!document.querySelector('.transcription.interim')) {
        transcriptionsDiv.insertBefore(tempDiv, transcriptionsDiv.firstChild);
    }
};

startButton.addEventListener('click', async () => {
    if (!isRecording) {
        isRecording = true;
        startButton.textContent = 'Stop Recording';
        if (transcriptionService.value === 'webSpeech') {
            recognition.start();
        }
    } else {
        isRecording = false;
        startButton.textContent = 'Start Recording';
        if (transcriptionService.value === 'webSpeech') {
            recognition.stop();
        }
        const transcription = await handleTranscription();
        if (transcription) {
            saveTranscription(transcription);
            await simulateJsonUpdate();
        }
        currentTranscript = '';
        const interimDiv = document.querySelector('.transcription.interim');
        if (interimDiv) {
            interimDiv.remove();
        }
    }
});

recognition.onend = () => {
    if (isRecording && transcriptionService.value === 'webSpeech') {
        recognition.start();
    }
};
