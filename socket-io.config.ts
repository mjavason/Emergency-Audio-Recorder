import fs from 'fs';
import path from 'path';
import { Server } from 'socket.io';
import { STREAM_DIR } from './constants';

export function setupSocketIo(server: any) {
  const io = new Server(server, {
    cors: { origin: '*' },
  });

  if (!fs.existsSync(STREAM_DIR)) {
    fs.mkdirSync(STREAM_DIR);
  }

  io.on('connection', (socket) => {
    let streamId: string | null = null;
    let fileStream: fs.WriteStream | null = null;

    socket.on('start', (id: string) => {
      streamId = id;

      const filePath = path.join(STREAM_DIR, `${streamId}.webm`);
      fileStream = fs.createWriteStream(filePath, { flags: 'a' });
    });

    socket.on('audio-chunk', (chunk: ArrayBuffer) => {
      if (!fileStream) return;

      const buffer = Buffer.from(chunk);
      fileStream.write(buffer);
    });

    socket.on('stop', () => {
      if (fileStream) {
        fileStream.end();
        fileStream = null;
      }
    });

    socket.on('disconnect', () => {
      if (fileStream) {
        fileStream.end();
      }
    });
  });
}
