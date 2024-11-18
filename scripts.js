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
    div.textContent = text;
    transcriptionsDiv.insertBefore(div, transcriptionsDiv.firstChild);
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
