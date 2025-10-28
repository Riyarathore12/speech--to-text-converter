// Feature: Speech-to-Text using Web Speech API
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const transcriptEl = document.getElementById('transcript');
const statusEl = document.getElementById('status');
const langSelect = document.getElementById('lang');
const interimCheckbox = document.getElementById('interim');

let recognition;
let isRecognizing = false;
let finalTranscript = "";

// Cross-browser SpeechRecognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  statusEl.textContent = "Status: Web Speech API not supported in this browser.";
  startBtn.disabled = true;
  // Optionally, provide fallback instructions.
} else {
  recognition = new SpeechRecognition();
  recognition.continuous = true;           // keep recognizing until stopped
  recognition.interimResults = true;       // get interim results
  recognition.maxAlternatives = 1;

  // Event: result
  recognition.addEventListener('result', (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript;
      } else {
        interim += result[0].transcript;
      }
    }

    // Show interim only if enabled
    transcriptEl.value = finalTranscript + (interimCheckbox.checked ? interim : "");
    // Auto-scroll
    transcriptEl.scrollTop = transcriptEl.scrollHeight;
  });

  recognition.addEventListener('start', () => {
    isRecognizing = true;
    statusEl.textContent = "Status: Listening…";
    startBtn.disabled = true;
    stopBtn.disabled = false;
  });

  recognition.addEventListener('end', () => {
    isRecognizing = false;
    statusEl.textContent = "Status: Idle";
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });

  recognition.addEventListener('error', (e) => {
    console.error('Speech recognition error', e);
    statusEl.textContent = `Status: Error — ${e.error}`;
    isRecognizing = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });
}

// Start listening
startBtn.addEventListener('click', async () => {
  if (!SpeechRecognition) return;

  // Update settings from UI
  recognition.lang = langSelect.value;
  recognition.interimResults = interimCheckbox.checked;

  // Request mic permission by calling getUserMedia (optional but helpful on some browsers)
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    statusEl.textContent = "Status: Microphone access denied.";
    return;
  }

  finalTranscript = ""; // reset final transcript for a fresh test
  transcriptEl.value = "";
  recognition.start();
});

// Stop listening
stopBtn.addEventListener('click', () => {
  if (!SpeechRecognition) return;
  recognition.stop();
});

// Clear transcript
clearBtn.addEventListener('click', () => {
  finalTranscript = "";
  transcriptEl.value = "";
});

// Copy to clipboard
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(transcriptEl.value);
    statusEl.textContent = "Status: Copied to clipboard.";
    setTimeout(()=> statusEl.textContent = "Status: Idle", 1500);
  } catch (err) {
    statusEl.textContent = "Status: Copy failed.";
  }
});

// Download transcript as .txt
downloadBtn.addEventListener('click', () => {
  const blob = new Blob([transcriptEl.value], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transcript_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// Optional: update interim toggle live
interimCheckbox.addEventListener('change', () => {
  if (recognition) recognition.interimResults = interimCheckbox.checked;
});
