import fs from 'node:fs';
import path from 'node:path';

export function seedFormFiles(files: Record<string, string>): void {
  fs.mkdirSync('sharinpix/forms', { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join('sharinpix/forms', name), content);
  }
}
