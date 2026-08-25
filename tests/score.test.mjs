import test from 'node:test'
import assert from 'node:assert/strict'
import { score, FIELDS, DIMENSIONS, FLAGS, FIT_STATUSES } from '../scope-roast/bin/score.mjs'

/** Build a ScoreInput where every field has the same rating. */
function flat(rating, { flags = [], fit = { status: 'in-scope', reasons: ['test'] } } = {}) {
  const fields = {}
  for (const f of FIELDS) fields[f] = { rating, evidence: 'test' }
  return { fields, flags, fit }
}

test('there are exactly 14 fields in canonical order', () => {
  assert.deepEqual(FIELDS, [
    'background', 'connection', 'essential', 'spread',
    'icp', 'pain', 'existingAttempts', 'limitations',
    'solution', 'boundary', 'falsifiable',
    'validation', 'distribution', 'nextSteps',
  ])
})

test('the five dimensions weigh 100 in total', () => {
  const sum = DIMENSIONS.reduce((s, d) => s + d.weight, 0)
  assert.equal(sum, 100)
})

test('every field belongs to exactly one dimension', () => {
  const seen = DIMENSIONS.flatMap((d) => Object.keys(d.fields))
  assert.equal(seen.length, 14, 'no field is in two dimensions')
  assert.deepEqual(seen.sort(), [...FIELDS].sort())
})

test('each dimension has exactly one double-weighted anchor field', () => {
  for (const d of DIMENSIONS) {
    const anchors = Object.entries(d.fields).filter(([, w]) => w === 2)
    assert.equal(anchors.length, 1, `${d.key} should have one anchor`)
  }
})

// --- the venture axis ---

test('all fives scores 100 and bands airtight', () => {
  const r = score(flat(5))
  assert.equal(r.scope.base, 100)
  assert.equal(r.scope.total, 100)
  assert.equal(r.scope.band.key, 'airtight')
  assert.equal(r.scope.cappedBy, null)
})

test('all zeros scores 0 and bands not-a-scope', () => {
  const r = score(flat(0))
  assert.equal(r.scope.total, 0)
  assert.equal(r.scope.band.key, 'not-a-scope')
})

test('all threes scores 60 across every dimension', () => {
  const r = score(flat(3))
  for (const d of r.dimensions) assert.equal(d.score, 60, `${d.key} should be 60`)
  assert.equal(r.scope.base, 60)
  assert.equal(r.scope.band.key, 'unevidenced')
})

test('the total is the weight-mean of the displayed dimension scores, so it adds up on screen', () => {
  const input = flat(3)
  input.fields.validation.rating = 0
  input.fields.nextSteps.rating = 0
  const r = score(input)
  const evidence = r.dimensions.find((d) => d.key === 'evidence')
  assert.equal(evidence.score, 0)
  const recomputed = Math.round(
    r.dimensions.reduce((s, d) => s + d.score * d.weight, 0) / 100
  )
  assert.equal(r.scope.base, recomputed)
})

test('evidence is the heaviest dimension and wedge is a peer of the rest', () => {
  const w = Object.fromEntries(DIMENSIONS.map((d) => [d.key, d.weight]))
  assert.equal(w.evidence, 20)
  for (const k of ['problem', 'customer', 'insight', 'wedge', 'founder']) {
    assert.ok(w.evidence >= w[k], `evidence should not be outweighed by ${k}`)
  }
  assert.equal(w.wedge, 18, 'wedge carries real weight, not a token')
  assert.ok(w.wedge > w.insight && w.wedge > w.founder)
})

test('an anchor field moves its dimension twice as far as a sibling', () => {
  const withAnchorZero = flat(5)
  withAnchorZero.fields.pain.rating = 0
  const withSiblingZero = flat(5)
  withSiblingZero.fields.spread.rating = 0
  const a = score(withAnchorZero).dimensions.find((d) => d.key === 'problem').score
  const b = score(withSiblingZero).dimensions.find((d) => d.key === 'problem').score
  assert.equal(a, 50)
  assert.equal(b, 75)
  assert.ok(b > a, 'the anchor must move its dimension further than a sibling')
})

// Superseded by tests/coverage.test.mjs: an omitted field is an unanswered
// question, not a zero. Kept here as the boundary assertion that the venture
// score never silently absorbs a gap.
test('a field the source never covered drops out of scoring rather than scoring zero', () => {
  const input = flat(5)
  delete input.fields.distribution
  const r = score(input)
  assert.deepEqual(r.coverage.unassessed, ['distribution'])
  assert.equal(r.dimensions.find((d) => d.key === 'customer').score, 100)
  assert.ok(r.coverage.percent < 100, 'the gap must cost coverage even when it does not cost score')
  assert.ok(r.opportunities.some((o) => o.field === 'distribution' && o.unwritten))
})

// --- quality caps ---

test('validation theatre caps a perfect venture score at 60', () => {
  const r = score(flat(5, { flags: ['validation-theatre'] }))
  assert.equal(r.scope.base, 100)
  assert.equal(r.scope.total, 60)
  assert.equal(r.scope.cappedBy.id, 'validation-theatre')
})

test('the lowest cap wins when several flags fire', () => {
  const r = score(flat(5, { flags: ['platform-speak', 'validation-theatre'] }))
  assert.equal(r.scope.total, 60)
  assert.equal(r.scope.cappedBy.id, 'validation-theatre')
})

test('a cap never raises a score that is already lower', () => {
  const r = score(flat(1, { flags: ['validation-theatre'] }))
  assert.equal(r.scope.base, 20)
  assert.equal(r.scope.total, 20)
  assert.equal(r.scope.cappedBy, null)
})

test('an unknown flag throws rather than silently scoring high', () => {
  assert.throws(() => score(flat(5, { flags: ['nonsense'] })), /unknown flag: nonsense/)
})

test('a rating outside 0 to 5 throws', () => {
  const bad = flat(5)
  bad.fields.pain.rating = 9
  assert.throws(() => score(bad), /rating for pain must be an integer 0 to 5/)
})

// --- the fit axis, which must stay independent ---

test('fit is passed through and does not touch the venture score', () => {
  const inScope = score(flat(5, { fit: { status: 'in-scope', reasons: ['B2B, European, full time'] } }))
  const outOfScope = score(flat(5, { fit: { status: 'out-of-scope', reasons: ['Consumer app'] } }))
  assert.equal(inScope.scope.total, outOfScope.scope.total)
  assert.equal(outOfScope.fit.status, 'out-of-scope')
  assert.deepEqual(outOfScope.fit.reasons, ['Consumer app'])
})

test('a sharp scope that is out of scope for Builders still bands airtight', () => {
  const r = score(flat(5, { fit: { status: 'out-of-scope', reasons: ['Consumer'] } }))
  assert.equal(r.scope.band.key, 'airtight')
  assert.equal(r.fit.status, 'out-of-scope')
})

test('the three fit statuses are the only ones allowed', () => {
  assert.deepEqual([...FIT_STATUSES], ['in-scope', 'edge', 'out-of-scope'])
  assert.throws(() => score(flat(3, { fit: { status: 'maybe', reasons: ['x'] } })), /fit\.status must be one of/)
})

test('fit requires at least one reason', () => {
  assert.throws(() => score(flat(3, { fit: { status: 'in-scope', reasons: [] } })), /fit\.reasons must have at least one/)
})

test('every declared flag id has a cap and an explanation', () => {
  for (const [id, f] of Object.entries(FLAGS)) {
    assert.ok(Number.isInteger(f.cap) && f.cap > 0 && f.cap < 100, `${id} cap`)
    assert.ok(f.label && f.why, `${id} copy`)
  }
})

test('development counts how far each part has actually been taken', () => {
  const input = flat(3)
  input.fields.essential.rating = 5
  input.fields.spread.rating = 4
  input.fields.icp.rating = 1
  const scored = score(input)
  const d = scored.development
  assert.equal(d.total, 14)
  assert.equal(d.written + d.unwrittenFields.length, 14)
  assert.equal(d.written, d.specific + d.assertedFields.length)
  assert.ok(d.tested <= d.specific, 'tested is a subset of specific')
})

test('a field nobody wrote is unwritten, never asserted', () => {
  const input = flat(3)
  delete input.fields.nextSteps.rating
  input.fields.nextSteps.basis = 'absent'
  const d = score(input).development
  assert.deepEqual(d.unwrittenFields, ['nextSteps'])
  assert.ok(!d.assertedFields.includes('nextSteps'))
})
