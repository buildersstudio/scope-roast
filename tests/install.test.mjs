import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, existsSync, lstatSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const REPO = process.cwd()
const INSTALL = join(REPO, 'install')
const project = () => mkdtempSync(join(tmpdir(), 'roast-install-'))

test('install is executable', () => {
  assert.ok(lstatSync(INSTALL).mode & 0o111)
})

test('install symlinks scope-roast into the target project', () => {
  const p = project()
  try {
    execFileSync(INSTALL, [p], { encoding: 'utf8' })
    const link = join(p, '.claude', 'skills', 'scope-roast')
    assert.ok(existsSync(link))
    assert.ok(lstatSync(link).isSymbolicLink(), 'symlink, not a copy')
    assert.match(readFileSync(join(link, 'SKILL.md'), 'utf8'), /^---\nname: scope-roast/)
  } finally {
    rmSync(p, { recursive: true, force: true })
  }
})

// The bug this guards: scripts living outside the tool directory are not
// reachable once the tool is symlinked into someone else's project. Everything
// a run needs must travel with the symlink.
test('everything a run needs is reachable through the symlink alone', () => {
  const p = project()
  try {
    execFileSync(INSTALL, [p])
    const link = join(p, '.claude', 'skills', 'scope-roast')
    for (const rel of [
      'bin/roast',
      'bin/score.mjs',
      'bin/render.mjs',
      'rubric/scope-rubric.json',
      'reference/scoring.md',
      'reference/roast-voice.md',
      'reference/report-spec.md',
      'reference/what-to-give-it.md',
      'templates/report.html',
      'assets/report.css',
    ]) {
      assert.ok(existsSync(join(link, rel)), `${rel} must be reachable through the symlink`)
    }
  } finally {
    rmSync(p, { recursive: true, force: true })
  }
})

test('the roast wrapper runs through the symlink from an unrelated cwd', () => {
  const p = project()
  try {
    execFileSync(INSTALL, [p])
    const roast = join(p, '.claude', 'skills', 'scope-roast', 'bin', 'roast')
    const out = execFileSync(roast, ['score', join(REPO, 'scope-roast/fixtures/weak.scores.json')], {
      encoding: 'utf8',
      cwd: p,
    })
    const parsed = JSON.parse(out)
    assert.equal(parsed.scope.total, 12)
    assert.equal(parsed.fit.status, 'in-scope')
  } finally {
    rmSync(p, { recursive: true, force: true })
  }
})

test('the roast wrapper renders through the symlink', () => {
  const p = project()
  try {
    execFileSync(INSTALL, [p])
    const roast = join(p, '.claude', 'skills', 'scope-roast', 'bin', 'roast')
    const scored = JSON.parse(
      execFileSync(roast, ['score', join(REPO, 'scope-roast/fixtures/weak.scores.json')], { encoding: 'utf8', cwd: p })
    )
    const payloadPath = join(p, 'payload.json')
    writeFileSync(payloadPath, JSON.stringify({
      title: 'T',
      scored,
      prose: {
        headline: 'H',
        burns: [{ field: 'icp', quote: 'q', burn: 'b', rule: 'r', fix: 'f' }],
        strengths: ['a', 'b'],
        rewrite: null,
      },
    }))
    execFileSync(roast, ['render', payloadPath, join(p, 'report.html')], { cwd: p })
    assert.match(readFileSync(join(p, 'report.html'), 'utf8'), /^<!doctype html>/i)
  } finally {
    rmSync(p, { recursive: true, force: true })
  }
})

test('install is idempotent', () => {
  const p = project()
  try {
    execFileSync(INSTALL, [p])
    execFileSync(INSTALL, [p])
    assert.ok(lstatSync(join(p, '.claude', 'skills', 'scope-roast')).isSymbolicLink())
  } finally {
    rmSync(p, { recursive: true, force: true })
  }
})

test('install refuses to clobber a real directory', () => {
  const p = project()
  try {
    const real = join(p, '.claude', 'skills', 'scope-roast')
    mkdirSync(real, { recursive: true })
    writeFileSync(join(real, 'SKILL.md'), 'mine')
    const out = execFileSync(INSTALL, [p], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
    assert.equal(readFileSync(join(real, 'SKILL.md'), 'utf8'), 'mine')
    assert.match(out, /installed 0 tool/)
  } finally {
    rmSync(p, { recursive: true, force: true })
  }
})

test('uninstall removes the symlink', () => {
  const p = project()
  try {
    execFileSync(INSTALL, [p])
    execFileSync(INSTALL, ['--uninstall', p])
    assert.ok(!existsSync(join(p, '.claude', 'skills', 'scope-roast')))
  } finally {
    rmSync(p, { recursive: true, force: true })
  }
})
