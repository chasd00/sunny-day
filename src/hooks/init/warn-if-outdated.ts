import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Hook } from '@oclif/core';

const PLUGIN_NAME = '@chasd00/sunny-day';
// only check npm once per day so we don't add latency/noise to every command
const CHECK_INTERVAL_MS = 1000 * 60 * 60 * 24;
// keep the registry request short so an offline/slow npm never blocks a command for long
const FETCH_TIMEOUT_MS = 1500;
// set this env var to any value to disable the update check
const OPT_OUT_ENV = 'SUNNY_DAY_SKIP_UPDATE_CHECK';

type UpdateCache = {
  lastCheck: number;
  latest: string;
};

/** Parses the release core of a semver string (ignoring any prerelease suffix) into [major, minor, patch]. */
function releaseCore(version: string): [number, number, number] {
  const [major, minor, patch] = version.split('-')[0].split('.').map((part) => Number.parseInt(part, 10) || 0);
  return [major ?? 0, minor ?? 0, patch ?? 0];
}

/** True if `latest` is a newer release than `current`. */
function isNewer(latest: string, current: string): boolean {
  const a = releaseCore(latest);
  const b = releaseCore(current);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

async function readCache(cacheFile: string): Promise<UpdateCache | undefined> {
  try {
    return JSON.parse(await readFile(cacheFile, 'utf-8')) as UpdateCache;
  } catch {
    return undefined;
  }
}

async function fetchLatestVersion(): Promise<string | undefined> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`https://registry.npmjs.org/${PLUGIN_NAME}/latest`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!response.ok) return undefined;
    const body = (await response.json()) as { version?: string };
    return body.version;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Warns when a newer version of this plugin is available on npm. The check is throttled to once
 * per day via a cache file and never interferes with command execution if anything goes wrong.
 */
const hook: Hook<'init'> = async function (options) {
  try {
    // only run for this plugin's own commands, and allow opt-out
    if (process.env[OPT_OUT_ENV]) return;
    if (!options.id?.startsWith('sday')) return;

    // read this plugin's installed version (not the host CLI's)
    const current = options.config.plugins.get(PLUGIN_NAME)?.version;
    if (!current || current.includes('-')) return; // skip if unknown or a prerelease/linked build

    const cacheFile = join(options.config.cacheDir, 'sunny-day-update-check.json');
    const now = Date.now();

    let latest: string | undefined;
    const cached = await readCache(cacheFile);
    if (cached && now - cached.lastCheck < CHECK_INTERVAL_MS) {
      latest = cached.latest;
    } else {
      latest = await fetchLatestVersion();
      if (latest) {
        await mkdir(options.config.cacheDir, { recursive: true });
        await writeFile(cacheFile, JSON.stringify({ lastCheck: now, latest } satisfies UpdateCache));
      }
    }

    if (latest && isNewer(latest, current)) {
      this.warn(
        `${PLUGIN_NAME} update available from ${current} to ${latest}. Run "sf plugins update" to upgrade.`
      );
    }
  } catch {
    // never let an update check disrupt the user's command
  }
};

export default hook;
