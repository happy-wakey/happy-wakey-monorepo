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
  ['apps/happy-wakey-api-server.rs', 'f027bb65f795e54b1bcfbc36db3098da3e4fcc2a'],
  ['apps/happy-wakey-mcp-server.rs', 'c2fb14705998f7a586510b3368ccd78f41368f33'],
  ['apps/happy-wakey-sidecar.rs', 'c1f06eb2a8f46280da992991094b070379dfe5c9'],
  ['apps/happy-wakey-web-server.rs', '81d4a56e2d7af87623fdc0af73a90e0b5dc77870'],
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

function parseSubmodules(contents) {
  const result = new Map();
  for (const section of contents.split(/(?=^\[submodule )/m)) {
    const header = section.match(/^\[submodule "([^"]+)"\]/);
    if (!header) continue;
    const values = Object.fromEntries(
      [...section.matchAll(/^\s*(path|url)\s*=\s*(\S+)\s*$/gm)]
        .map((match) => [match[1], match[2]]),
    );
    assert.equal(result.has(header[1]), false, `duplicate submodule ${header[1]}`);
    result.set(header[1], values);
  }
  return result;
}

test('pins each application path to its own exact GitHub origin', async () => {
  const raw = await readFile(new URL('../.gitmodules', import.meta.url), 'utf8');
  const modules = parseSubmodules(raw);
  assert.deepEqual([...modules.keys()].sort(), expected.map((name) => `apps/${name}`).sort());
  for (const name of expected) {
    const entry = modules.get(`apps/${name}`);
    assert.equal(entry.path, `apps/${name}`);
    assert.equal(entry.url, `https://github.com/happy-wakey/${name}.git`);
  }
});

test('rejects a cross-application submodule origin swap', () => {
  const swapped = `[submodule "apps/happy-wakey-api-server.rs"]
    path = apps/happy-wakey-api-server.rs
    url = https://github.com/happy-wakey/happy-wakey-web-server.rs.git`;
  const modules = parseSubmodules(swapped);
  assert.notEqual(
    modules.get('apps/happy-wakey-api-server.rs').url,
    'https://github.com/happy-wakey/happy-wakey-api-server.rs.git',
  );
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
