const fs = require('fs');
const path = require('path');

const transcriptPath = 'C:/Users/janar/.gemini/antigravity-ide/brain/6b08dfa1-c80f-4b3f-b5b7-88c930af5d5b/.system_generated/logs/transcript.jsonl';

console.log('Checking transcript path:', transcriptPath);
if (fs.existsSync(transcriptPath)) {
  const content = fs.readFileSync(transcriptPath, 'utf8');
  const lines = content.split('\n');
  console.log('Total transcript lines:', lines.length);
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      const text = JSON.stringify(obj);
      if (text.includes('password') || text.includes('postgres') || text.includes('grwhdtvorhdvyvcxwomn') || text.includes('sbp_')) {
        // Look for connection strings or tokens
        const matches = text.match(/(postgres:\/\/[^\s"]+|postgresql:\/\/[^\s"]+|sbp_[a-zA-Z0-9_]+)/g);
        if (matches) {
          console.log('Found matches:', matches);
        }
      }
    } catch (_) {}
  }
} else {
  console.log('Transcript file not found at that exact path.');
}
