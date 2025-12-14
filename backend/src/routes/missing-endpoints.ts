// Endpoints temporaires pour éviter les erreurs 404
import { Hono } from 'hono';

const missingEndpoints = new Hono();

// Endpoints manquants qui causent des 404
missingEndpoints.get('/conversations/unread-count', async (c) => {
  return c.json({ success: true, count: 0 });
});

missingEndpoints.get('/notifications/unread-count', async (c) => {
  return c.json({ success: true, count: 0 });
});

export default missingEndpoints;