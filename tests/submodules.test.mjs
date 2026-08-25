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
  'happy-wakey-interfaces',
  'happy-wakey-lib-core',
  'happy-wakey-sync',
  'happy-wakey-web-server.rs',
];

test('pins every application repository under apps', async () => {
  const modules = await readFile(new URL('../.gitmodules', import.meta.url), 'utf8');
  for (const name of expected) {
    assert.match(modules, new RegExp(`path = apps/${name.replace('.', '\\.')}`));
    assert.match(modules, new RegExp(`github\\.com/happy-wakey/${name.replace('.', '\\.')}`));
  }
});

test('records immutable gitlinks and keeps infrastructure standalone', () => {
  const staged = execFileSync('git', ['ls-files', '--stage'], { encoding: 'utf8' });
  const gitlinks = staged
    .split('\n')
    .filter((line) => line.startsWith('160000 '))
    .map((line) => line.split('\t')[1])
    .sort();

  assert.deepEqual(gitlinks, expected.map((name) => `apps/${name}`).sort());
  assert.ok(!gitlinks.includes('apps/happy-wakey-infra'));
});
