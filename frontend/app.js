const apiUrl = 'http://localhost:5000';
const socket = io(apiUrl);

let recorder = null;
let streamId = crypto.randomUUID();
let stream = null;

const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const statusEl = document.getElementById('status');
const levelEl = document.getElementById('level');

function setStatus(text) {
  statusEl.textContent = text;
}

function setRecordingUI(isRecording) {
  startBtn.disabled = isRecording;
  stopBtn.disabled = !isRecording;

  if (isRecording) {
    setStatus('Recording');
    levelEl.style.width = '100%';
  } else {
    setStatus('Idle');
    levelEl.style.width = '0%';
  }
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

    recorder.start(1000);

    setRecordingUI(true);
  } catch (err) {
    setStatus('Mic access denied');
  }
}

function stopRecording() {
  if (!recorder) return;

  recorder.stop();
  socket.emit('stop');

  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  recorder = null;

  setRecordingUI(false);
}

startBtn.onclick = startRecording;
stopBtn.onclick = stopRecording;

setRecordingUI(false);
