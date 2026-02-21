import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../index';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Convertir la requête Vercel en requête Hono
    const url = new URL(req.url || '/', `https://${req.headers.host}`);
    
    const request = new Request(url.toString(), {
      method: req.method,
      headers: new Headers(req.headers as Record<string, string>),
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    // Exécuter l'application Hono
    const response = await app.fetch(request);

    // Convertir la réponse Hono en réponse Vercel
    const body = await response.text();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    res.status(response.status);
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.send(body);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
