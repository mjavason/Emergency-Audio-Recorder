// const apiUrl = 'http://localhost:5000';
const apiUrl = 'https://emergency-audio-recorder-backend.onrender.com';

const socket = io(apiUrl);

let recorder = null;
let streamId = crypto.randomUUID();
let stream = null;

let startTime = null;
let timerInterval = null;

const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const statusEl = document.getElementById('status');
const micEl = document.getElementById('mic');
const durationEl = document.getElementById('duration');

window.addEventListener('DOMContentLoaded', () => {
  const link = document.getElementById('downloadLink');
  if (!link) return;

  link.href = `${apiUrl}/download`;
});

function setStatus(text) {
  statusEl.textContent = text;
}

function setMicRecording(isRecording) {
  if (isRecording) {
    micEl.classList.add('recording');
  } else {
    micEl.classList.remove('recording');
  }
}

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const sec = String(totalSec % 60).padStart(2, '0');
  return `${min}:${sec}`;
}

function startTimer() {
  startTime = Date.now();

  timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    durationEl.textContent = formatDuration(elapsed);
  }, 500);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  startTime = null;
  durationEl.textContent = '00:00';
}

function setUI(isRecording) {
  startBtn.disabled = isRecording;
  stopBtn.disabled = !isRecording;

  if (isRecording) {
    setStatus('Recording');
    startTimer();
  } else {
    setStatus('');
    stopTimer();
  }

  setMicRecording(isRecording);
}

async function startRecording() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    streamId = crypto.randomUUID();
    socket.emit('start', streamId);

    recorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    recorder.ondataavailable = async (e) => {
      if (e.data.size > 0) {
        const buffer = await e.data.arrayBuffer();
        socket.emit('audio-chunk', buffer);
      }
    };

    recorder.onstop = () => {
      socket.emit('stop');
    };

    recorder.start(1000);

    setUI(true);
  } catch (err) {
    setStatus('Mic access denied');
  }
}

function stopRecording() {
  if (!recorder) return;

  recorder.stop();

  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
  }

  stream = null;
  recorder = null;

  setUI(false);
}

startBtn.onclick = startRecording;
stopBtn.onclick = stopRecording;

setUI(false);
