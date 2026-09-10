import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { KaniApiApp } from '../../../application/api/KaniApiApp';

async function toWebRequest(message: IncomingMessage): Promise<Request> {
  const headers = new Headers();
  for (const [name, value] of Object.entries(message.headers)) {
    if (Array.isArray(value)) value.forEach((entry) => headers.append(name, entry));
    else if (value !== undefined) headers.set(name, String(value));
  }
  const chunks: Uint8Array[] = [];
  for await (const chunk of message) {
    chunks.push(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : new Uint8Array(chunk));
  }
  const byteLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const body = byteLength > 0 ? new Uint8Array(byteLength) : null;
  if (body) {
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
  }
  const method = message.method ?? 'GET';
  const host = message.headers.host ?? '127.0.0.1';
  return new Request(`http://${host}${message.url ?? '/'}`, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : body,
  });
}

/** Thin Node transport adapter; HTTP has no storage/auth provider knowledge. */
export function createKaniNodeServer(app: Pick<KaniApiApp, 'handle'>): Server {
  return createServer(async (request, response) => {
    try {
      const webResponse = await app.handle(await toWebRequest(request));
      response.statusCode = webResponse.status;
      webResponse.headers.forEach((value, name) => response.setHeader(name, value));
      response.end(Buffer.from(await webResponse.arrayBuffer()));
    } catch (error) {
      console.error('Kani Node HTTP transport failed', error);
      response.statusCode = 500;
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ error: { code: 'TRANSPORT_ERROR', message: 'HTTP transport could not complete the request.' } }));
    }
  });
}
