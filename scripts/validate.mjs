#!/usr/bin/env node
// Repo-wide invariants. Two jobs: enforce the copy rule (no em-dashes or
// en-dashes in anything a user reads) and check the structural shape of the
// payload files a tool ships, so a bad edit fails loudly instead of quietly
// degrading every run.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, extname, basename } from 'node:path'
import { FIELDS, FLAGS, FIT_STATUSES, DIMENSIONS } from '../scope-roast/bin/score.mjs'

const BANNED = { '—': 'em-dash', '–': 'en-dash' }

/**
 * Finds every em-dash and en-dash in a string.
 * Line and column are 1-indexed so the message is clickable.
 */
export function findDashViolations(text) {
  const hits = []
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const chars = [...lines[i]]
    for (let j = 0; j < chars.length; j++) {
      if (BANNED[chars[j]]) hits.push({ line: i + 1, col: j + 1, char: chars[j] })
    }
  }
  return hits
}

const SHIPPED_EXT = new Set(['.md', '.json', '.html', '.css'])
// Everything in this repo is shipped, so everything in it is checked. There
// are no exceptions to maintain and no list to keep in step.
const SKIP_DIRS = new Set(['node_modules', '.git', 'out', 'tests'])

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

/**
 * Validates the whole repo.
 * @returns {string[]} problems. Empty means clean.
 */
export function validateRepo(rootDir) {
  const problems = []
  for (const file of walk(rootDir)) {
    if (!SHIPPED_EXT.has(extname(file))) continue
    if (basename(file) === 'package-lock.json') continue
    for (const hit of findDashViolations(readFileSync(file, 'utf8'))) {
      problems.push(
        `${relative(rootDir, file)}:${hit.line}:${hit.col} contains an ${BANNED[hit.char]}. Copy rule: use a comma, a colon, or a full stop.`
      )
    }
  }

  try {
    problems.push(...validateSkillFrontmatter(readFileSync(join(rootDir, 'scope-roast/SKILL.md'), 'utf8')))
  } catch (e) {
    problems.push(`skill: could not read scope-roast/SKILL.md: ${e.message}`)
  }

  try {
    const rubric = JSON.parse(readFileSync(join(rootDir, 'scope-roast/rubric/scope-rubric.json'), 'utf8'))
    problems.push(...validateRubric(rubric))
  } catch (e) {
    problems.push(`rubric: could not read or parse scope-roast/rubric/scope-rubric.json: ${e.message}`)
  }

  return problems
}

/**
 * Checks that a rubric lines up with the scoring engine. A rubric that drifts
 * from FIELDS, FLAGS, DIMENSIONS, or the fit statuses silently degrades every
 * run rather than failing, so this runs in CI.
 * @returns {string[]} problems. Empty means clean.
 */
export function validateRubric(rubric) {
  const problems = []
  const perField = (rubric && rubric.per_field) || {}
  const flags = (rubric && rubric.flags) || {}
  const dims = (rubric && rubric.dimensions) || {}
  const fit = (rubric && rubric.fit) || {}

  for (const field of FIELDS) {
    if (!perField[field]) {
      problems.push(`rubric: per_field is missing: ${field}`)
      continue
    }
    for (const key of ['strong', 'weak', 'probe']) {
      const v = perField[field][key]
      if (typeof v !== 'string' || v.length <= 30) {
        problems.push(`rubric: per_field.${field}.${key} must be a string longer than 30 chars`)
      }
    }
  }
  for (const key of Object.keys(perField)) {
    if (!FIELDS.includes(key)) problems.push(`rubric: per_field has unknown key: ${key}`)
  }

  for (const id of Object.keys(FLAGS)) {
    if (!flags[id]) problems.push(`rubric: flags is missing: ${id}`)
  }
  for (const [id, entry] of Object.entries(flags)) {
    if (!FLAGS[id]) {
      problems.push(`rubric: flags has unknown id: ${id}`)
      continue
    }
    if (typeof entry.detect !== 'string' || entry.detect.length <= 30) {
      problems.push(`rubric: flags.${id}.detect must be a string longer than 30 chars`)
    }
    if (typeof entry.burn_angle !== 'string' || entry.burn_angle.length <= 10) {
      problems.push(`rubric: flags.${id}.burn_angle must be a string longer than 10 chars`)
    }
  }

  for (const d of DIMENSIONS) {
    if (typeof dims[d.key] !== 'string' || dims[d.key].length <= 30) {
      problems.push(`rubric: dimensions.${d.key} must be a string longer than 30 chars`)
    }
  }

  const statuses = (fit && fit.statuses) || {}
  for (const s of FIT_STATUSES) {
    if (typeof statuses[s] !== 'string') problems.push(`rubric: fit.statuses is missing: ${s}`)
  }
  for (const s of Object.keys(statuses)) {
    if (!FIT_STATUSES.includes(s)) problems.push(`rubric: fit.statuses has unknown status: ${s}`)
  }
  if (!Array.isArray(fit.thesis) || fit.thesis.length === 0) {
    problems.push('rubric: fit.thesis must be a non-empty array')
  }
  if (!Array.isArray(fit.out_of_scope) || fit.out_of_scope.length === 0) {
    problems.push('rubric: fit.out_of_scope must be a non-empty array')
  }

  return problems
}

/**
 * Minimal frontmatter check for a SKILL.md. Claude Code needs name and
 * description to route to the skill at all, so a typo here makes the tool
 * silently unroutable rather than loudly broken.
 * @returns {string[]} problems. Empty means clean.
 */
export function validateSkillFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/)
  if (!match) return ['skill: no frontmatter block at the top of the file']

  const problems = []
  const name = match[1].match(/^name:\s*(.+)$/m)
  const description = match[1].match(/^description:\s*(.+)$/m)

  if (!name) problems.push('skill: missing name in frontmatter')
  else if (!/^[a-z0-9-]+$/.test(name[1].trim())) {
    problems.push(`skill: name must be lowercase kebab-case, got: ${name[1].trim()}`)
  }

  if (!description) problems.push('skill: missing description in frontmatter')
  else if (description[1].trim().length < 40) {
    problems.push('skill: description must be at least 40 chars so the router can match it')
  }

  return problems
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const problems = validateRepo(process.argv[2] || '.')
  if (problems.length === 0) {
    console.log('validate: clean')
    process.exit(0)
  }
  for (const p of problems) console.error(p)
  console.error(`\nvalidate: ${problems.length} problem(s)`)
  process.exit(1)
}
