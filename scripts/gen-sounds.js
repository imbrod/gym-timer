// Generates two short beep WAV files used as the timer "tick" sounds.
// tick1 = higher pitch (for seconds 41/42/43), tick2 = lower pitch (57/58/59).
const fs = require('fs');
const path = require('path');

function makeBeep(freq, durationSec, sampleRate = 44100) {
  const numSamples = Math.floor(durationSec * sampleRate);
  const bytesPerSample = 2; // 16-bit mono
  const dataSize = numSamples * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  const amplitude = 0.6 * 32767;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // short attack/decay envelope so it sounds like a clean "tick"
    const env = Math.min(1, t / 0.005) * Math.min(1, (durationSec - t) / 0.02);
    const sample = Math.sin(2 * Math.PI * freq * t) * amplitude * env;
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, sample)), 44 + i * 2);
  }
  return buffer;
}

const assetsDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

fs.writeFileSync(path.join(assetsDir, 'tick1.wav'), makeBeep(1200, 0.09));
fs.writeFileSync(path.join(assetsDir, 'tick2.wav'), makeBeep(700, 0.12));

console.log('Generated assets/tick1.wav and assets/tick2.wav');
