import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = (p) => readFileSync(root + p, 'utf8')

describe('toolkit standard', () => {
  for (const file of ['LICENSE', 'README.md', 'AGENTS.md', 'CLAUDE.md', '.nvmrc']) {
    test(`${file} is present`, () => assert.ok(existsSync(root + file)))
  }

  test('CLAUDE.md imports AGENTS.md rather than duplicating it', () => {
    // Claude Code reads CLAUDE.md, other agents read AGENTS.md, and two real
    // files always drift. One file holds the content, one points at it.
    assert.match(read('CLAUDE.md').trim(), /^@AGENTS\.md$/)
  })

  test('LICENSE is MIT and names the studio', () => {
    const src = read('LICENSE')
    assert.match(src, /MIT License/)
    assert.match(src, /Copyright \(c\) \d{4} Builders Studio/)
  })

  test('CI runs the tests and the copy rule', () => {
    const ci = read('.github/workflows/ci.yml')
    assert.match(ci, /npm test/)
    assert.match(ci, /npm run validate/)
  })

  test('CI installs nothing, so the tool stays clone-and-run', () => {
    assert.ok(!/npm ci|npm install/.test(read('.github/workflows/ci.yml')))
  })

  test('the repo declares no dependencies', () => {
    const pkg = JSON.parse(read('package.json'))
    assert.deepEqual(Object.keys(pkg.dependencies ?? {}), [])
    assert.deepEqual(Object.keys(pkg.devDependencies ?? {}), [])
  })
})
