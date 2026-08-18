import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import mysql from 'mysql2/promise';

export type LicenseStatus = 'unlicensed' | 'trial' | 'active';
export type LicenseType = 'T15' | 'T30' | 'PERP';

export interface LicenseState {
  status: LicenseStatus;
  type: LicenseType | null;
  machineId: string;
  bu: string;
  activatedAt: string | null;
  expiresAt: string | null;
  licenseKey: string | null;
  trialStartedAt: string | null;
  trialDays: number | null;
}

// Secret de signature embarqué (obfusqué par XOR) et consigné en répertoire source.
// Le sécurisé du mode offline ne peut être "parfaite" (le client possède la machine),
// mais ce mécanisme dissuade l'utilisation non payée et bloque le flux classique.
const _secret = [0x53, 0x74, 0x6f, 0x63, 0x6b, 0x41, 0x70, 0x70, 0x2d, 0x53, 0x65, 0x63, 0x72, 0x65, 0x74, 0x2d, 0x32, 0x30, 0x32, 0x36, 0x2d, 0x62, 0x75, 0x31];
const LICENSE_SECRET = Buffer.from(_secret.map((b, i) => b ^ (i * 7 + 3) % 256)).toString('utf8');

const PREFIX = 'LIC';
const DEFAULT_TRIAL_DAYS = 15;

export class LicenseService {
  private static licenseFile(): string {
    return process.env.LICENSE_FILE || path.join(process.cwd(), 'data', 'license.json');
  }

  // ---- Machine ID -------------------------------------------------
  static getMachineId(): string {
    let raw = '';
    try {
      const out = execSync(
        'reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid',
        { encoding: 'utf8', windowsHide: true, timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] }
      );
      const m = out.match(/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/);
      if (m) raw = m[0];
    } catch {
      try {
        raw = execSync('hostname', { encoding: 'utf8', windowsHide: true, timeout: 3000 }).trim();
      } catch { /* ignore */ }
    }
    if (!raw) {
      const existing = LicenseService.loadState();
      if (existing && existing.machineId) return existing.machineId;
      raw = 'FALLBACK-' + Math.random().toString(16).slice(2);
    }
    const id = crypto.createHash('sha256').update(raw + '|stockapp|2026').digest('hex').slice(0, 12).toUpperCase();
    return id;
  }

  // ---- Accès MySQL (stockage anti-réinitialisation) --------------
  private static async mysqlPool(): Promise<mysql.Pool | null> {
    // En mode cloud (Supabase) il n'y a pas de MySQL accessible : on retombe sur le fichier.
    if (!process.env.MYSQL_HOST && !process.env.MYSQL_PORT) return null;
    return mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
      database: 'stock_management_auth',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      waitForConnections: true,
      connectionLimit: 2,
      queueLimit: 0,
    });
  }

  private static async loadDbState(): Promise<LicenseState | null> {
    try {
      const pool = await LicenseService.mysqlPool();
      if (!pool) return null;
      const machineId = LicenseService.getMachineId();
      const [rows] = await pool.execute<any[]>(
        'SELECT status, type, bu, activated_at, expires_at, license_key, trial_started_at, trial_days FROM license_state WHERE machine_id = ?',
        [machineId]
      );
      await pool.end();
      const row = rows && rows[0];
      if (!row || !row.status) return null;
      return {
        status: row.status,
        type: row.type || null,
        machineId,
        bu: row.bu || '',
        activatedAt: row.activated_at || null,
        expiresAt: row.expires_at || null,
        licenseKey: row.license_key || null,
        trialStartedAt: row.trial_started_at || null,
        trialDays: row.trial_days != null ? Number(row.trial_days) : null,
      };
    } catch (e) {
      console.warn('⚠️ Licence : base non accessible, repli fichier:', (e as Error).message);
      return null;
    }
  }

  private static async saveDbState(state: LicenseState): Promise<boolean> {
    try {
      const pool = await LicenseService.mysqlPool();
      if (!pool) return false;
      await pool.query(
        `INSERT INTO license_state (machine_id, status, type, bu, activated_at, expires_at, license_key, trial_started_at, trial_days)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           status = VALUES(status), type = VALUES(type), bu = VALUES(bu),
           activated_at = VALUES(activated_at), expires_at = VALUES(expires_at),
           license_key = VALUES(license_key), trial_started_at = VALUES(trial_started_at),
           trial_days = VALUES(trial_days)`,
        [state.machineId, state.status, state.type, state.bu, state.activatedAt, state.expiresAt, state.licenseKey, state.trialStartedAt, state.trialDays]
      );
      await pool.end();
      return true;
    } catch (e) {
      console.warn('⚠️ Licence non persistée en base:', (e as Error).message);
      return false;
    }
  }

  // ---- État (fichier + base) --------------------------------------
  private static loadState(): LicenseState | null {
    try {
      const p = LicenseService.licenseFile();
      if (fs.existsSync(p)) {
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        return data as LicenseState;
      }
    } catch (e) {
      console.error('⚠️ Erreur lecture licence:', e);
    }
    return null;
  }

  private static saveState(state: LicenseState): boolean {
    try {
      const p = LicenseService.licenseFile();
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, JSON.stringify(state, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error('⚠️ Erreur écriture licence:', e);
      return false;
    }
  }

  private static async persist(state: LicenseState): Promise<void> {
    LicenseService.saveState(state);
    await LicenseService.saveDbState(state);
  }

  /**
   * État effectif : base d'abord (anti-réinitialisation), sinon fichier,
   * sinon démarre automatiquement l'essai de 15 jours au premier lancement.
   */
  static async getEffectiveState(bu: string): Promise<LicenseState> {
    const machineId = LicenseService.getMachineId();
    const dbState = await LicenseService.loadDbState();
    const fileState = LicenseService.loadState();

    // Base = source de vérité (elle ne peut pas être réinitialisée par simple suppression du fichier)
    if (dbState) {
      if (dbState.bu && dbState.bu !== bu) {
        // Le tenant affiché change : met le machine/persiste quand même
      }
      return { ...dbState, machineId: dbState.machineId || machineId, bu: dbState.bu || bu };
    }

    // Fichier seul (mode cloud sans MySQL) : on vérifie
    if (fileState) {
      return { ...fileState, bu: fileState.bu || bu };
    }

    // Premier lancement : essai automatique de 15 jours
    return LicenseService.startTrialNow(bu, DEFAULT_TRIAL_DAYS);
  }

  private static startTrialNow(bu: string, days: number): LicenseState {
    const machineId = LicenseService.getMachineId();
    const now = new Date();
    const state: LicenseState = {
      status: 'trial',
      type: 'T15',
      machineId,
      bu,
      activatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + days * 86400000).toISOString(),
      licenseKey: null,
      trialStartedAt: now.toISOString(),
      trialDays: days,
    };
    this.persist(state); // best-effort (fire and forget)
    return state;
  }

  // ---- Construction des clés --------------------------------------
  static sign(machineId: string, type: LicenseType, bu: string, days: number | null): string {
    const payload = [PREFIX, type, bu, machineId, days ?? 0].join('|');
    const sig = crypto.createHmac('sha256', LICENSE_SECRET).update(payload).digest('hex').slice(0, 10).toUpperCase();
    return `LIC-${type}-${bu}-${machineId}-${sig}`;
  }

  static verifyKey(key: string, machineId: string, bu: string): { ok: boolean; type: LicenseType | null; days: number | null; reason?: string } {
    const parts = String(key || '').trim().split('-');
    if (parts.length !== 5 || parts[0] !== 'LIC') {
      return { ok: false, type: null, days: null, reason: 'Format de clé invalide' };
    }
    const [ , t, buKey, machine, sig ] = parts;
    if (buKey !== bu) {
      return { ok: false, type: null, days: null, reason: `Clé prévue pour la structure ${buKey}` };
    }
    const type = t as LicenseType;
    if (!['T15', 'T30', 'PERP'].includes(t)) {
      return { ok: false, type: null, days: null, reason: 'Type de clé inconnu' };
    }
    const days = type === 'PERP' ? null : (type === 'T15' ? 15 : 30);
    const expected = LicenseService.sign(machineId, type, bu, days).slice(-10);
    if (sig !== expected) {
      return { ok: false, type: null, days: null, reason: 'Clé invalide pour cette machine' };
    }
    return { ok: true, type, days };
  }

  // ---- Statut -----------------------------------------------------
  static async getStatus(bu: string): Promise<{ state: LicenseState; valid: boolean; daysLeft: number | null }> {
    const machineId = LicenseService.getMachineId();
    const baseState = await LicenseService.getEffectiveState(bu);
    const state: LicenseState = { ...baseState, machineId: baseState.machineId || machineId, bu: baseState.bu || bu };

    let valid = false;
    let daysLeft: number | null = null;

    if (state.status === 'active' && state.type === 'PERP') {
      valid = true;
    } else if ((state.status === 'active' || state.status === 'trial') && state.expiresAt) {
      const diff = new Date(state.expiresAt).getTime() - Date.now();
      daysLeft = Math.ceil(diff / 86400000);
      valid = diff > 0;
      if (!valid && state.status === 'trial') state.status = 'expired';
    }

    return { state, valid, daysLeft };
  }

  // ---- Activation -------------------------------------------------
  static async activate(key: string, bu: string): Promise<{ ok: boolean; reason?: string; daysLeft?: number | null }> {
    const machineId = LicenseService.getMachineId();
    const check = LicenseService.verifyKey(key, machineId, bu);
    if (!check.ok || !check.type) {
      return { ok: false, reason: check.reason || 'Clé invalide' };
    }

    const isPerpetual = check.type === 'PERP';
    const expiresAt = isPerpetual ? null : new Date(Date.now() + (check.days || 0) * 86400000).toISOString();

    const state: LicenseState = {
      status: 'active',
      type: check.type,
      machineId,
      bu,
      activatedAt: new Date().toISOString(),
      expiresAt,
      licenseKey: key.trim(),
      trialStartedAt: null,
      trialDays: null,
    };

    await LicenseService.persist(state);

    const daysLeft = isPerpetual ? null : check.days;
    return { ok: true, daysLeft };
  }

  // ---- Réactivation essai (démarrage d'une période limitée) ------
  static async trialFor(now: Date, bu: string): Promise<{ ok: boolean; reason?: string; expiresAt?: string }> {
    const machineId = LicenseService.getMachineId();
    const existing = await LicenseService.loadState();
    const db = await LicenseService.loadDbState();
    if (existing && (existing.status === 'active' || existing.status === 'trial')) {
      return { ok: false, reason: 'Une licence ou un essai est déjà actif sur ce poste' };
    }
    if (db && (db.status === 'active' || db.status === 'trial')) {
      return { ok: false, reason: 'Un essai a déjà été activé sur ce poste' };
    }
    const state = LicenseService.startTrialNow(bu, DEFAULT_TRIAL_DAYS);
    await LicenseService.persist(state);
    return { ok: true, expiresAt: state.expiresAt || undefined };
  }

  // ---- Requête d'une réactivation essay (clé essai format) --------
  static echoHelp(): string {
    return `Clé : LIC-<TYPE>-<BU>-<MACHINE>-<SIG>
  TYPE : T15 | T30 | PERP
  Utilisez l'outil generate-license.ps1 côté vendeur pour créer une clé.`
  }
}