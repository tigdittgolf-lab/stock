import type { Context, Next } from 'hono';
import { LicenseService } from '../services/licenseService.js';

/**
 * Middleware de licence : bloque les opérations métier (ventes, stock,
 * achats, PDF, rapports) tant que la licence n'est pas active/valide.
 * Retourne HTTP 402 + message de clé requise si ce n'est pas le cas.
 *
 * Le tenant est lu directement depuis l'en-tête X-Tenant (ou le défaut)
 * pour rester indépendant du middleware interne de chaque route.
 */
export const licenseGuard = async (c: Context, next: Next) => {
  // Autoriser la désactivation totale (mode cloud / dev / tests)
  if (process.env.LICENSE_BYPASS === '1' || process.env.LICENSE_BYPASS === 'true') {
    await next();
    return;
  }

  const rawTenant = c.req.header('X-Tenant');
  const bu = (rawTenant || process.env.NEXT_PUBLIC_TENANT || '2025_bu01')
    .split(',')[0]
    .trim();

  const result = await LicenseService.getStatus(bu);

  if (result.valid) {
    await next();
    return;
  }

  // Licences non valides : essai expiré ou clé absente
  const reason =
    result.state.status === 'expired'
      ? "Votre période d'essai est expirée. Une licence est requise pour continuer."
      : 'Ce poste nécessite une licence pour effectuer cette opération.';

  return c.json(
    {
      success: false,
      error: reason,
      code: 'LICENSE_REQUIRED',
      license: {
        status: result.state.status,
        daysLeft: result.daysLeft,
        machineId: result.state.machineId,
        bu,
      },
    },
    402
  );
};