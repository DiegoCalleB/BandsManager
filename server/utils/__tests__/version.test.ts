import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getAppInfo, sentryRelease } from '../version';

const raiz = path.resolve(__dirname, '../../..');
const leerJson = (f: string) => JSON.parse(fs.readFileSync(path.join(raiz, f), 'utf8'));
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/;

describe('versionado (SemVer + release-please)', () => {
  const pkg = leerJson('package.json');

  it('package.json lleva una versión SemVer válida', () => {
    expect(pkg.version).toMatch(SEMVER);
  });

  it('el manifiesto de release-please coincide con package.json', () => {
    // release-please sube los dos a la vez; si divergen, el siguiente release saldría mal.
    expect(leerJson('.release-please-manifest.json')['.']).toBe(pkg.version);
  });

  it('la configuración de release-please apunta a la raíz y a CHANGELOG.md', () => {
    const cfg = leerJson('release-please-config.json');
    expect(cfg.packages['.']['changelog-path']).toBe('CHANGELOG.md');
    expect(cfg['release-type']).toBe('node');
  });

  it('getAppInfo devuelve la versión de package.json', () => {
    expect(getAppInfo().version).toBe(pkg.version);
  });

  it('sentryRelease identifica la app y la versión', () => {
    expect(sentryRelease()).toBe(`bandmanager@${pkg.version}`);
  });
});
