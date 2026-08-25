import test from 'node:test'
import assert from 'node:assert/strict'
import { score, FIELDS, FIELD_SCOPE_WEIGHT, BASIS } from '../scope-roast/bin/score.mjs'

function build(spec, { flags = [], fit = { status: 'in-scope', reasons: ['t'] } } = {}) {
  const fields = {}
  for (const f of FIELDS) {
    const s = spec[f] ?? spec.default
    fields[f] = s.basis === 'absent'
      ? { basis: 'absent', evidence: 'not covered' }
      : { rating: s.rating, basis: s.basis ?? 'adequate', evidence: 'test' }
  }
  return { fields, flags, fit }
}

// --- per-field venture weight, the basis for coverage and for ranking fixes ---

test('field venture weights sum to 100', () => {
  const sum = FIELDS.reduce((s, f) => s + FIELD_SCOPE_WEIGHT[f], 0)
  assert.ok(Math.abs(sum - 100) < 0.001, `got ${sum}`)
})

test('validation is the single heaviest field', () => {
  const sorted = [...FIELDS].sort((a, b) => FIELD_SCOPE_WEIGHT[b] - FIELD_SCOPE_WEIGHT[a])
  assert.equal(sorted[0], 'validation')
})

test('basis values are the four the rubric knows', () => {
  assert.deepEqual([...BASIS], ['absent', 'thin', 'adequate', 'rich'])
})

// --- absent is not zero ---

test('an absent field is excluded from its dimension, not scored as zero', () => {
  const r = score(build({ default: { rating: 4 }, distribution: { basis: 'absent' } }))
  const customer = r.dimensions.find((d) => d.key === 'customer')
  assert.equal(customer.score, 80, 'icp alone at 4 of 5 is 80, not dragged down by a silent field')
  assert.deepEqual(customer.unassessed, ['distribution'])
})

test('a field the founder answered badly still scores zero', () => {
  const r = score(build({ default: { rating: 4 }, distribution: { rating: 0 } }))
  const customer = r.dimensions.find((d) => d.key === 'customer')
  assert.equal(customer.score, 53)  // icp 4x2 of 15 possible
  assert.deepEqual(customer.unassessed, [])
})

test('a dimension with every field absent scores null, not zero', () => {
  const r = score(build({ default: { rating: 4 }, icp: { basis: 'absent' }, distribution: { basis: 'absent' } }))
  const customer = r.dimensions.find((d) => d.key === 'customer')
  assert.equal(customer.score, null)
  assert.equal(customer.assessed, false)
})

test('a null dimension is dropped from the total rather than counted as zero', () => {
  const r = score(build({ default: { rating: 5 }, icp: { basis: 'absent' }, distribution: { basis: 'absent' } }))
  assert.equal(r.scope.base, 100, 'the rest are perfect, so the assessable venture is perfect')
})

// --- coverage and confidence ---

test('full coverage is 100 and confidence is firm', () => {
  const r = score(build({ default: { rating: 3 } }))
  assert.equal(r.coverage.percent, 100)
  assert.equal(r.coverage.confidence, 'firm')
  assert.equal(r.scope.provisional, false)
})

test('coverage is weighted, so a silent validation costs more than a silent spread', () => {
  const noValidation = score(build({ default: { rating: 3 }, validation: { basis: 'absent' } }))
  const noSpread = score(build({ default: { rating: 3 }, spread: { basis: 'absent' } }))
  assert.ok(noValidation.coverage.percent < noSpread.coverage.percent)
  assert.equal(noSpread.coverage.percent, 96)
})

test('under half the venture assessable means insufficient and provisional', () => {
  const spec = { default: { rating: 4 } }
  for (const f of ['validation', 'nextSteps', 'icp', 'pain', 'existingAttempts', 'connection']) {
    spec[f] = { basis: 'absent' }
  }
  const r = score(spec.default ? build(spec) : null)
  assert.ok(r.coverage.percent < 50, `got ${r.coverage.percent}`)
  assert.equal(r.coverage.confidence, 'insufficient')
  assert.equal(r.scope.provisional, true)
})

test('exactly four fifths covered is the firm floor, not provisional', () => {
  const r = score(build({ default: { rating: 4 }, validation: { basis: 'absent' }, nextSteps: { basis: 'absent' } }))
  assert.equal(r.coverage.percent, 80)
  assert.equal(r.coverage.confidence, 'firm')
  assert.equal(r.scope.provisional, false)
})

test('between half and four fifths is provisional but still scored', () => {
  const r = score(build({
    default: { rating: 4 },
    validation: { basis: 'absent' },
    nextSteps: { basis: 'absent' },
    icp: { basis: 'absent' },
  }))
  assert.ok(r.coverage.percent >= 50 && r.coverage.percent < 80, `got ${r.coverage.percent}`)
  assert.equal(r.coverage.confidence, 'provisional')
  assert.equal(r.scope.provisional, true)
  assert.ok(r.scope.total > 0)
})

test('coverage lists exactly which fields were never covered', () => {
  const r = score(build({ default: { rating: 3 }, spread: { basis: 'absent' }, solution: { basis: 'absent' } }))
  assert.deepEqual(r.coverage.unassessed.sort(), ['solution', 'spread'])
  assert.equal(r.coverage.assessedCount, 12)
})

// --- ranked opportunities, the depth ---

test('opportunities rank fields by recoverable venture points', () => {
  const r = score(build({ default: { rating: 5 }, validation: { rating: 1 }, spread: { rating: 1 } }))
  assert.equal(r.opportunities[0].field, 'validation', 'the heaviest weak field comes first')
  const val = r.opportunities[0]
  const spr = r.opportunities.find((o) => o.field === 'spread')
  assert.ok(val.recoverable > spr.recoverable)
  assert.ok(Math.abs(val.recoverable - (4 / 5) * FIELD_SCOPE_WEIGHT.validation) < 0.01)
})

test('an absent field offers its full weight back and is marked as unwritten', () => {
  const r = score(build({ default: { rating: 5 }, validation: { basis: 'absent' } }))
  const top = r.opportunities[0]
  assert.equal(top.field, 'validation')
  assert.equal(top.unwritten, true)
  assert.ok(Math.abs(top.recoverable - FIELD_SCOPE_WEIGHT.validation) < 0.01)
})

test('a perfect venture has no opportunities left', () => {
  assert.deepEqual(score(build({ default: { rating: 5 } })).opportunities, [])
})

// --- validation of the new input shape ---

test('an unknown basis throws', () => {
  const bad = build({ default: { rating: 3 } })
  bad.fields.pain.basis = 'vibes'
  assert.throws(() => score(bad), /basis for pain must be one of/)
})

test('an absent field carrying a rating throws, because that is a contradiction', () => {
  const bad = build({ default: { rating: 3 } })
  bad.fields.pain = { basis: 'absent', rating: 4, evidence: 'x' }
  assert.throws(() => score(bad), /pain is marked absent so it must not carry a rating/)
})

test('a field omitted entirely is treated as absent rather than crashing', () => {
  const input = build({ default: { rating: 4 } })
  delete input.fields.spread
  const r = score(input)
  assert.ok(r.coverage.unassessed.includes('spread'))
})

// --- the scope dimension, and partial readings ---

import { DIMENSIONS as DIMS2 } from '../scope-roast/bin/score.mjs'

test('wedge is its own dimension, anchored on boundary', () => {
  const wedge = DIMS2.find((d) => d.key === 'wedge')
  assert.ok(wedge, 'wedge must be a first-class dimension')
  assert.equal(wedge.fields.boundary, 2, 'boundary is the anchor')
  assert.deepEqual(Object.keys(wedge.fields).sort(), ['boundary', 'falsifiable', 'solution'])
})

test('no dimension is called scope, because the whole document is the scope', () => {
  assert.equal(DIMS2.find((d) => d.key === 'scope'), undefined)
})

test('wedge carries real weight, not a token amount', () => {
  const wedge = DIMS2.find((d) => d.key === 'wedge')
  assert.ok(wedge.weight >= 15, `wedge weight ${wedge.weight} should be substantial`)
})

test('a dimension scored without its anchor is marked partial and anchorless', () => {
  const fields = {}
  for (const f of FIELDS) fields[f] = { rating: 4, basis: 'adequate', evidence: 'x' }
  fields.boundary = { basis: 'absent', evidence: 'not written' }
  const r = score({ fields, flags: [], fit: { status: 'in-scope', reasons: ['t'] } })
  const wedge = r.dimensions.find((d) => d.key === 'wedge')
  assert.equal(wedge.anchor, 'boundary')
  assert.equal(wedge.anchorAssessed, false)
  assert.equal(wedge.partial, true)
  assert.ok(wedge.score !== null, 'still scored from what was written')
})

test('a fully written dimension is neither partial nor anchorless', () => {
  const fields = {}
  for (const f of FIELDS) fields[f] = { rating: 4, basis: 'adequate', evidence: 'x' }
  const r = score({ fields, flags: [], fit: { status: 'in-scope', reasons: ['t'] } })
  for (const d of r.dimensions) {
    assert.equal(d.partial, false, `${d.key} should not be partial`)
    assert.equal(d.anchorAssessed, true)
  }
})

test('the two wedge flags cap a fluent but unbounded proposal', () => {
  const fields = {}
  for (const f of FIELDS) fields[f] = { rating: 5, basis: 'rich', evidence: 'x' }
  const base = { fields, fit: { status: 'in-scope', reasons: ['t'] } }
  assert.equal(score({ ...base, flags: ['no-boundary'] }).scope.total, 65)
  assert.equal(score({ ...base, flags: ['unfalsifiable'] }).scope.total, 70)
  assert.equal(score({ ...base, flags: ['no-boundary', 'unfalsifiable'] }).scope.cappedBy.id, 'no-boundary')
})

// --- how the report is allowed to talk about a barely written document ---

test('at insufficient coverage the verdict is about the document, not the business', () => {
  const spec = { default: { rating: 4 } }
  for (const f of ['validation', 'nextSteps', 'icp', 'pain', 'existingAttempts', 'connection', 'boundary', 'essential']) {
    spec[f] = { basis: 'absent' }
  }
  const r = score(build(spec))
  assert.equal(r.coverage.confidence, 'insufficient')
  assert.match(r.scope.verdict, /not enough here to read as a scope/)
  assert.match(r.scope.verdict, /about the document, not about the business/)
  assert.ok(!r.scope.verdict.includes(r.scope.band.verdict), 'the band sentence must not also appear')
})

test('at provisional coverage the band sentence stands with a caveat', () => {
  const r = score(build({ default: { rating: 4 }, validation: { basis: 'absent' }, nextSteps: { basis: 'absent' }, icp: { basis: 'absent' } }))
  assert.equal(r.coverage.confidence, 'provisional')
  assert.ok(r.scope.verdict.startsWith(r.scope.band.verdict))
  assert.match(r.scope.verdict, /provisional/)
})

test('at firm coverage the verdict is exactly the band sentence', () => {
  const r = score(build({ default: { rating: 4 } }))
  assert.equal(r.scope.verdict, r.scope.band.verdict)
})
