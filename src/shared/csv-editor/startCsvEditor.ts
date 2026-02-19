import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import open from 'open';
import { createCsvEditorApp } from './server.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

function resolvePackagePaths(): { publicDir: string } {
  const publicDir = path.join(currentDir, 'public');
  return { publicDir };
}

export type StartCsvEditorOptions = {
  outputDir: string;
  port?: number;
  recursive?: boolean;
  openBrowser?: boolean;
};

export type StartCsvEditorResult = {
  url: string;
  port: number;
  close: () => Promise<void>;
};

export async function startCsvEditor(options: StartCsvEditorOptions): Promise<StartCsvEditorResult> {
  const { outputDir, port: requestedPort = 0, recursive = true, openBrowser = true } = options;

  const rootDir = path.resolve(outputDir);
  if (!fs.existsSync(rootDir) || !fs.statSync(rootDir).isDirectory()) {
    throw new Error(`Output directory does not exist or is not a directory: ${rootDir}`);
  }

  const { publicDir } = resolvePackagePaths();

  const fastify = await createCsvEditorApp({
    rootDir,
    publicDir,
    recursive,
  });

  await fastify.listen({ port: requestedPort, host: '127.0.0.1' });

  const address = fastify.server?.address();
  const port =
    typeof address === 'object' && address !== null && 'port' in address ? (address as { port: number }).port : 0;
  const url = `http://127.0.0.1:${port}`;

  if (openBrowser) {
    open(url).catch(() => {});
  }

  return { url, port, close: (): Promise<void> => fastify.close() };
}
