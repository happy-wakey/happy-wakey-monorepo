import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

const expected = [
  'happy-wakey-api-server.rs',
  'happy-wakey-mcp-server.rs',
  'happy-wakey-sidecar.rs',
  'happy-wakey-web-server.rs',
];

const exactPins = new Map([
  ['apps/happy-wakey-api-server.rs', 'ff840aa61509c4e99fd3a83a57fca899afc2d08f'],
  ['apps/happy-wakey-mcp-server.rs', '5cd01bddfca48de8660503410ec0f5519baaaf2e'],
  ['apps/happy-wakey-sidecar.rs', '1a0fe1ec173af600c0ac056f8039b5e340055cbf'],
  ['apps/happy-wakey-web-server.rs', 'ac2c9acc4dc4d0eb2d8273568699dbb722bcb395'],
]);

test('manifest is the authority for public Kubernetes applications', async () => {
  const manifest = JSON.parse(await readFile(
    new URL('../monorepo.config.json', import.meta.url),
    'utf8',
  ));

  assert.equal(manifest.org, 'happy-wakey');
  assert.equal(manifest.monorepo, 'happy-wakey-monorepo');
  assert.deepEqual(manifest.apps, expected);
});

test('pins every manifested application under apps', async () => {
  const modules = await readFile(new URL('../.gitmodules', import.meta.url), 'utf8');
  for (const name of expected) {
    assert.match(modules, new RegExp(`path = apps/${name.replace('.', '\\.')}`));
    assert.match(modules, new RegExp(`github\\.com/happy-wakey/${name.replace('.', '\\.')}`));
  }

  assert.doesNotMatch(modules, /url = (?!https:\/\/github\.com\/happy-wakey\/)/);
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
  assert.equal(exactPins.size, expected.length, 'every application needs an exact reviewed pin');
  for (const [path, revision] of exactPins) {
    assert.match(revision, /^[0-9a-f]{40}$/, `${path} does not use a full Git revision`);
    assert.equal(gitlinks.get(path), revision, `${path} drifted from its reviewed pin`);
  }
});
