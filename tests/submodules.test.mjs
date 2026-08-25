import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

const expected = [
  'happy-wakey-api-server.rs',
  'happy-wakey-cli',
  'happy-wakey-clients',
  'happy-wakey-desktop-app.rs',
  'happy-wakey-e2e',
  'happy-wakey-flutter',
  'happy-wakey-infra',
  'happy-wakey-interfaces',
  'happy-wakey-lib-core',
  'happy-wakey-sync',
  'happy-wakey-web-server.rs',
];

const hardenedPins = new Map([
  ['apps/happy-wakey-api-server.rs', '62d0efd597e4686e6aa34d58dd97af627af09f11'],
  ['apps/happy-wakey-e2e', '5b61f0bec30bbe3a91c1b79e2bf52f0bb8cdc758'],
  ['apps/happy-wakey-infra', 'da5b034c09bb34d5dfe7e91bea9434df8991529d'],
  ['apps/happy-wakey-interfaces', '0f4c4bffa81c1e7d914281fc2056697a2f1a3020'],
  ['apps/happy-wakey-lib-core', '45977ea1c25de5e90f3638de55c89a1b47c5090f'],
  ['apps/happy-wakey-web-server.rs', '216bac3e9f14bedb55c14cc023aca933787a45e6'],
]);

test('pins every application repository under apps', async () => {
  const modules = await readFile(new URL('../.gitmodules', import.meta.url), 'utf8');
  for (const name of expected) {
    assert.match(modules, new RegExp(`path = apps/${name.replace('.', '\\.')}`));
    assert.match(modules, new RegExp(`github\\.com/happy-wakey/${name.replace('.', '\\.')}`));
  }
});

test('records every repository as an immutable gitlink', () => {
  const staged = execFileSync('git', ['ls-files', '--stage'], { encoding: 'utf8' });
  const gitlinks = new Map(staged
    .split('\n')
    .filter((line) => line.startsWith('160000 '))
    .map((line) => {
      const [metadata, path] = line.split('\t');
      return [path, metadata.split(' ')[1]];
    }));

  assert.deepEqual([...gitlinks.keys()].sort(), expected.map((name) => `apps/${name}`).sort());
  for (const [path, revision] of hardenedPins) {
    assert.equal(gitlinks.get(path), revision, `${path} drifted from its reviewed pin`);
  }
});
