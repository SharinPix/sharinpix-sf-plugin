import fs from 'node:fs';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { listCsvFiles, resolvePathUnderRoot } from './pathSafety.js';

export type CsvEditorServerOptions = {
  rootDir: string;
  publicDir: string;
  recursive?: boolean;
};

export async function createCsvEditorApp(options: CsvEditorServerOptions): Promise<FastifyInstance> {
  const { rootDir, publicDir, recursive: defaultRecursive = true } = options;
  const fastify = Fastify({ logger: false });

  const textParser = (
    req: unknown,
    rawBody: string | Buffer,
    done: (err: Error | null, body?: string) => void
  ): void => {
    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    done(null, body);
  };
  fastify.addContentTypeParser('text/plain', { parseAs: 'string' }, textParser);
  fastify.addContentTypeParser('text/csv', { parseAs: 'string' }, textParser);

  // GET /api/files → list CSV files (relative paths)
  fastify.get<{ Querystring: { recursive?: string } }>('/api/files', async (request, reply) => {
    const recursive = request.query.recursive !== 'false' && defaultRecursive;
    try {
      const files = listCsvFiles(rootDir, recursive);
      return await reply.send({ files });
    } catch (err) {
      return reply.status(500).send({ error: err instanceof Error ? err.message : 'Failed to list files' });
    }
  });

  // GET /api/file/raw?path=... → raw CSV content (for oi.csv.js and for save)
  fastify.get<{ Querystring: { path?: string } }>('/api/file/raw', async (request, reply) => {
    const rawPath = request.query.path;
    if (typeof rawPath !== 'string' || !rawPath) {
      return reply.status(400).send({ error: 'Missing path query parameter' });
    }
    const decodedPath = decodeURIComponent(rawPath);
    const resolved = resolvePathUnderRoot(rootDir, decodedPath);
    if (resolved === null) {
      return reply.status(403).send({ error: 'Path not allowed' });
    }
    try {
      const content = fs.readFileSync(resolved, 'utf8');
      return await reply.type('text/csv').send(content);
    } catch (err) {
      return reply.status(500).send({ error: err instanceof Error ? err.message : 'Failed to read file' });
    }
  });

  // POST /api/file → body: raw CSV string, query: path=...
  fastify.post<{ Querystring: { path?: string }; Body: string }>('/api/file', async (request, reply) => {
    const rawPath = request.query.path;
    if (typeof rawPath !== 'string' || !rawPath) {
      return reply.status(400).send({ error: 'Missing path query parameter' });
    }
    const decodedPath = decodeURIComponent(rawPath);
    const resolved = resolvePathUnderRoot(rootDir, decodedPath);
    if (resolved === null) {
      return reply.status(403).send({ error: 'Path not allowed' });
    }
    const body = request.body;
    const content = typeof body === 'string' ? body : String(body ?? '');
    try {
      // Overwrite the original file at resolved path
      fs.writeFileSync(resolved, content, 'utf8');
      return await reply.send({ ok: true });
    } catch (err) {
      return reply.status(500).send({ error: err instanceof Error ? err.message : 'Failed to write file' });
    }
  });

  await fastify.register(fastifyStatic, { root: publicDir });
  fastify.get('/', async (_request, reply) => reply.sendFile('index.html', publicDir));

  return fastify;
}
