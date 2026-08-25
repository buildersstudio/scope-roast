import test from 'node:test'
import assert from 'node:assert/strict'
import { findDashViolations } from '../scripts/validate.mjs'

test('findDashViolations flags an em-dash with line and column', () => {
  const hits = findDashViolations('clean line\nbad — dash here')
  assert.equal(hits.length, 1)
  assert.equal(hits[0].line, 2)
  assert.equal(hits[0].col, 5)
})

test('findDashViolations flags an en-dash', () => {
  const hits = findDashViolations('range 1–5')
  assert.equal(hits.length, 1)
  assert.equal(hits[0].char, '–')
})

test('findDashViolations allows plain hyphens', () => {
  assert.deepEqual(findDashViolations('well-known non-trivial ready-made'), [])
})

test('findDashViolations reports every hit, not just the first', () => {
  assert.equal(findDashViolations('a — b – c — d').length, 3)
})

// --- rubric shape ---

import { readFileSync } from 'node:fs'
import { validateRubric } from '../scripts/validate.mjs'
import { FIELDS, FLAGS, FIT_STATUSES, DIMENSIONS } from '../scope-roast/bin/score.mjs'

const rubric = JSON.parse(readFileSync('scope-roast/rubric/scope-rubric.json', 'utf8'))

test('the rubric covers exactly the twelve scoring fields', () => {
  assert.deepEqual(Object.keys(rubric.per_field).sort(), [...FIELDS].sort())
})

test('the rubric covers exactly the quality flags the engine knows', () => {
  assert.deepEqual(Object.keys(rubric.flags).sort(), Object.keys(FLAGS).sort())
})

test('the rubric describes every dimension', () => {
  assert.deepEqual(Object.keys(rubric.dimensions).sort(), DIMENSIONS.map((d) => d.key).sort())
})

test('the rubric documents exactly the three fit statuses', () => {
  assert.deepEqual(Object.keys(rubric.fit.statuses).sort(), [...FIT_STATUSES].sort())
})

test('every field has a strong, a weak, and a probe', () => {
  for (const [field, entry] of Object.entries(rubric.per_field)) {
    for (const key of ['strong', 'weak', 'probe']) {
      assert.ok(typeof entry[key] === 'string' && entry[key].length > 30, `${field}.${key}`)
    }
  }
})

test('the rubric stands on its own and cites no review history', () => {
  const text = JSON.stringify(rubric).toLowerCase()
  for (const phrase of ['distilled from', 'internal review', 'review history', 'our applicants', 'we rejected', 'disqualif']) {
    assert.ok(!text.includes(phrase), `rubric should not say ${phrase}`)
  }
})

test('validateRubric returns no problems for the shipped rubric', () => {
  assert.deepEqual(validateRubric(rubric), [])
})

test('validateRubric catches a missing field', () => {
  const broken = structuredClone(rubric)
  delete broken.per_field.pain
  assert.match(validateRubric(broken).join(' '), /per_field is missing: pain/)
})

test('validateRubric catches an unknown flag id', () => {
  const broken = structuredClone(rubric)
  broken.flags['made-up'] = { detect: 'x'.repeat(40), burn_angle: 'y'.repeat(20) }
  assert.match(validateRubric(broken).join(' '), /flags has unknown id: made-up/)
})

// --- skill frontmatter ---

import { validateSkillFrontmatter } from '../scripts/validate.mjs'

test('the shipped SKILL.md has valid frontmatter', () => {
  assert.deepEqual(validateSkillFrontmatter(readFileSync('scope-roast/SKILL.md', 'utf8')), [])
})

test('validateSkillFrontmatter requires a name', () => {
  const out = validateSkillFrontmatter('---\ndescription: a description that is comfortably long enough to pass\n---\nbody')
  assert.match(out.join(' '), /missing name/)
})

test('validateSkillFrontmatter requires a description long enough to route on', () => {
  assert.match(validateSkillFrontmatter('---\nname: x\ndescription: short\n---\nbody').join(' '), /at least 40/)
})

test('validateSkillFrontmatter rejects a file with no frontmatter', () => {
  assert.match(validateSkillFrontmatter('# just a heading').join(' '), /no frontmatter block/)
})
