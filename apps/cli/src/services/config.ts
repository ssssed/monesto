import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';

export interface MonestoConfig {
  money?: number;
  tax?: string;
  currency?: string;
  imprestDate?: number;
  gold?: string;
  usd?: string;
  rub?: string;
}

function getConfigDir(): string {
  const platform = process.platform;

  if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, 'monesto');
  }

  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg) {
    return path.join(xdg, 'monesto');
  }

  const configDir = path.join(os.homedir(), '.config', 'monesto');
  return configDir;
}

function getConfigPath(): string {
  return path.join(getConfigDir(), 'monesto.json');
}

export async function loadConfig(): Promise<Partial<MonestoConfig>> {
  const filePath = getConfigPath();
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as MonestoConfig;
    return parsed || {};
  } catch (error: any) {
    if (error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')) {
      return {};
    }
    return {};
  }
}

export async function saveConfig(config: MonestoConfig): Promise<void> {
  const dir = getConfigDir();
  const filePath = getConfigPath();

  await fs.mkdir(dir, { recursive: true });
  const serialized = JSON.stringify(config, null, 2);
  await fs.writeFile(filePath, serialized, 'utf-8');
}

