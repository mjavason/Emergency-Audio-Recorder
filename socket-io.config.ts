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
    let fileStream: fs.WriteStream | null = null;
    let closed = false;
    console.log('connection', Date.now());

    function closeStream() {
      console.log('closeStream', Date.now());
      if (closed) return;
      closed = true;

      if (fileStream) {
        fileStream.end();
        fileStream = null;
      }
    }

    socket.on('start', (id: string) => {
      console.log('start', Date.now());
      const filePath = path.join(STREAM_DIR, `${id}.webm`);

      fileStream = fs.createWriteStream(filePath, {
        flags: 'w',
      });

      closed = false;
    });

    socket.on('audio-chunk', (chunk: ArrayBuffer) => {
      console.log('audio-chunk', Date.now());
      if (!fileStream || closed) return;

      fileStream.write(Buffer.from(chunk));
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
