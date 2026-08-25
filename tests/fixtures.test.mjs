import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { score, FIELDS } from '../scope-roast/bin/score.mjs'

const load = (n) => score(JSON.parse(readFileSync(`scope-roast/fixtures/${n}.scores.json`, 'utf8')))

test('every fixture rates all twelve fields', () => {
  for (const n of ['strong-in-scope', 'strong-out-of-scope', 'weak', 'sparse']) {
    const raw = JSON.parse(readFileSync(`scope-roast/fixtures/${n}.scores.json`, 'utf8'))
    assert.deepEqual(Object.keys(raw.fields).sort(), [...FIELDS].sort(), n)
  }
})

test('a sharp in-scope proposal scores 95 and bands airtight', () => {
  const r = load('strong-in-scope')
  assert.equal(r.scope.total, 95)
  assert.equal(r.scope.band.key, 'airtight')
  assert.equal(r.fit.status, 'in-scope')
})

// The case the two-axis model exists for. A genuinely good venture that
// Builders would not build. If this ever comes back looking like a failure,
// the axes have contaminated each other.
test('a strong scope that is out of scope for Builders keeps its high score', () => {
  const r = load('strong-out-of-scope')
  assert.equal(r.scope.total, 84)
  assert.equal(r.scope.band.key, 'sharp')
  assert.equal(r.fit.status, 'out-of-scope')
  assert.equal(r.scope.cappedBy, null, 'being out of scope must never cap the score')
})

test('being in scope does not rescue a weak scope', () => {
  const r = load('weak')
  assert.equal(r.scope.total, 12)
  assert.equal(r.scope.band.key, 'not-a-scope')
  assert.equal(r.fit.status, 'in-scope')
})

test('the out-of-scope fixture outscores the in-scope weak one by a wide margin', () => {
  assert.ok(load('strong-out-of-scope').scope.total - load('weak').scope.total > 50)
})

// The number on the page must be checkable against the bars on the page.
// Dimensions that could not be assessed drop out of both sides of the
// fraction, so the divisor is the assessed weight, not always 100. The report
// has to say which dimensions were excluded or this arithmetic looks wrong.
test('every total is recomputable from the dimension scores as displayed', () => {
  for (const n of ['strong-in-scope', 'strong-out-of-scope', 'weak', 'sparse']) {
    const r = load(n)
    const scored = r.dimensions.filter((d) => d.score !== null)
    const weight = scored.reduce((s, d) => s + d.weight, 0)
    const recomputed = Math.round(scored.reduce((s, d) => s + d.score * d.weight, 0) / weight)
    assert.equal(r.scope.base, recomputed, `${n} should add up from its bars`)
  }
})

// The case Julia raised: not enough written down to really assess. The tool
// must say so rather than quietly scoring the silence as failure.
test('a sparse scope reports insufficient coverage instead of a confident number', () => {
  const r = load('sparse')
  assert.equal(r.coverage.confidence, 'insufficient')
  assert.equal(r.coverage.assessedCount, 4)
  assert.equal(r.scope.provisional, true)
})

test('a sparse scope leaves whole dimensions unassessed rather than scoring them zero', () => {
  const r = load('sparse')
  const unscored = r.dimensions.filter((d) => d.score === null).map((d) => d.key)
  assert.deepEqual(unscored.sort(), ['customer', 'insight', 'problem'])
  for (const d of r.dimensions) {
    if (d.score === null) assert.equal(d.assessed, false)
  }
})

test('a sparse scope ranks the unwritten heavyweights first', () => {
  const top = load('sparse').opportunities.slice(0, 3).map((o) => o.field)
  assert.deepEqual(top, ['validation', 'icp', 'existingAttempts'])
  assert.ok(load('sparse').opportunities.slice(0, 3).every((o) => o.unwritten))
})

test('the four fixtures span the range, from insufficient to airtight', () => {
  assert.equal(load('weak').scope.band.key, 'not-a-scope')
  assert.equal(load('sparse').coverage.confidence, 'insufficient')
  assert.equal(load('strong-out-of-scope').fit.status, 'out-of-scope')
  assert.equal(load('strong-in-scope').scope.band.key, 'airtight')
})
