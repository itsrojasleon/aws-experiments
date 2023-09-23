import { Readable, Transform } from 'stream';

export const generateRandomId = () => {
  return Math.random().toString(36).slice(-8);
};

export const createReadableStream = (dataSizeInMB, chunkSizeInBytes) => {
  // Calculate the total number of bytes
  const totalBytes = dataSizeInMB * 1024 * 1024;

  // Create a custom Readable stream
  const customReadableStream = new Readable({
    read(size) {
      let totalPushedBytes = 0;

      while (totalPushedBytes < totalBytes) {
        const remainingBytes = totalBytes - totalPushedBytes;
        const bytesToPush = Math.min(chunkSizeInBytes, remainingBytes);

        // Generate some example data (you can replace this with your data generation logic)
        const dataChunk = Buffer.alloc(bytesToPush, 'x');

        // Push the data chunk into the stream
        this.push(dataChunk);

        totalPushedBytes += bytesToPush;
      }

      // Signal the end of the stream
      if (totalPushedBytes >= totalBytes) {
        this.push(null);
      }
    }
  });
  return customReadableStream;
};

export const toUppercaseTransform = () => {
  return new Transform({
    transform(chunk, encoding, callback) {
      this.push(chunk.toString().toUpperCase());
      callback();
    }
  });
};
