import { Hono } from 'hono';
import { LicenseService } from '../services/licenseService.js';

const license = new Hono();

// Helper : BU depuis l'en-tête X-Tenant
function resolveBu(c: any): string {
  const raw = c.req.header('X-Tenant');
  return (raw || process.env.NEXT_PUBLIC_TENANT || '2025_bu01').split(',')[0].trim();
}

// GET /api/status - État de la licence
license.get('/', async (c) => {
  const bu = resolveBu(c);

  const result = await LicenseService.getStatus(bu);

  return c.json({
    success: true,
    machineId: result.state.machineId,
    bu,
    status: result.state.status,
    type: result.state.type,
    activatedAt: result.state.activatedAt,
    expiresAt: result.state.expiresAt,
    daysLeft: result.daysLeft,
    valid: result.valid,
    trialDaysBeforeExpiry: result.daysLeft
  });
});

// POST /api/license/activate - activer une clé
license.post('/activate', async (c) => {
  const bu = resolveBu(c);

  const body = await c.req.json().catch(() => ({}));
  const key = (body.key || '').trim();

  if (!key) {
    return c.json({ success: false, error: 'Clé de licence requise' }, 400);
  }

  const result = await LicenseService.activate(key, bu);
  if (!result.ok) {
    return c.json({ success: false, error: result.reason || "Clé invalide" }, 402);
  }

  return c.json({
    success: true,
    message: 'Licence activée avec succès',
    daysLeft: result.daysLeft
  });
});

// POST /api/license/trial - démarrer un essai si aucun état (optionnel)
license.post('/trial', async (c) => {
  const bu = resolveBu(c);

  const r = await LicenseService.trialFor(new Date(), bu);
  if (!r.ok) {
    return c.json({ success: false, error: r.reason }, 409);
  }
  return c.json({ success: true, message: 'Essai démarré', expiresAt: r.expiresAt });
});

export default license;