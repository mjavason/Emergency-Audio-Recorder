import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { Server } from 'socket.io';
import { STREAM_DIR } from './constants';

export function setupSocketIo(server: any) {
  const io = new Server(server, {
    cors: { origin: '*' },
  });

  if (!fs.existsSync(STREAM_DIR)) {
    fs.mkdirSync(STREAM_DIR, { recursive: true });
  }

  io.on('connection', (socket) => {
    let ffmpeg: ChildProcessWithoutNullStreams | null = null;
    let fileStream: fs.WriteStream | null = null;
    let closed = false;

    console.log('connection', Date.now());

    function closeStream() {
      if (closed) return;

      closed = true;

      ffmpeg?.stdin.end();

      ffmpeg?.once('close', () => {
        fileStream?.end();
        fileStream = null;
        ffmpeg = null;
      });
    }

    socket.on('start', (id: string) => {
      console.log('start', Date.now());

      const outputPath = path.join(STREAM_DIR, `${id}.wav`);

      fileStream = fs.createWriteStream(outputPath);

      ffmpeg = spawn(ffmpegPath!, [
        '-loglevel',
        'error',

        '-f',
        'webm',

        '-i',
        'pipe:0',

        '-f',
        'wav',

        'pipe:1',
      ]);

      ffmpeg.stdout.pipe(fileStream);

      ffmpeg.stdout.on('data', (chunk) => {
        console.log('decoded', chunk.length);
      });

      ffmpeg.stderr.on('data', (data) => {
        console.error(data.toString());
      });

      ffmpeg.on('error', (err) => {
        console.error('ffmpeg error', err);
      });

      ffmpeg.on('close', (code) => {
        console.log('ffmpeg exited', code);
      });

      closed = false;
    });

    socket.on('audio-chunk', (chunk: ArrayBuffer) => {
      if (!ffmpeg || closed) {
        return;
      }

      ffmpeg.stdin.write(Buffer.from(chunk));
    });

    socket.on('stop', () => {
      console.log('stop', Date.now());
      closeStream();
    });

    socket.on('disconnect', () => {
      console.log('disconnect', Date.now());
      closeStream();
    });
  });
}
