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

const exactPins = new Map([
  ['apps/happy-wakey-api-server.rs', '60a7dac6f4a2bd16481edc776f7323129b962125'],
  ['apps/happy-wakey-cli', 'd8a7c45bef21c6540ef97a2fe08f902f7c285b15'],
  ['apps/happy-wakey-clients', '7b8e24090dcbb6a71cf140a5108ca74fa1a01c2e'],
  ['apps/happy-wakey-desktop-app.rs', 'ac31a2a22d532575cd6ba04c500c6ccf8e7117eb'],
  ['apps/happy-wakey-e2e', '4baa1a74365a53c7f0c5739774bda252f8f88de5'],
  ['apps/happy-wakey-flutter', '2f748459cb942802a112825abbebd5c0ea77811c'],
  ['apps/happy-wakey-infra', 'da5b034c09bb34d5dfe7e91bea9434df8991529d'],
  ['apps/happy-wakey-interfaces', 'd6278ec8f6b2263678728b147a32dff92d52d8c8'],
  ['apps/happy-wakey-lib-core', '9638429097bc68b2aac280d4e3edaa92db96f85a'],
  ['apps/happy-wakey-sync', '5943e1764e3ada83985e6c5051869ba7e772e55c'],
  ['apps/happy-wakey-web-server.rs', '5e79984641b72033fb3a1962996ed43222105a14'],
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
  assert.equal(exactPins.size, expected.length, 'every application needs an exact reviewed pin');
  for (const [path, revision] of exactPins) {
    assert.match(revision, /^[0-9a-f]{40}$/, `${path} does not use a full Git revision`);
    assert.equal(gitlinks.get(path), revision, `${path} drifted from its reviewed pin`);
  }
});
