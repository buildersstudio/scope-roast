#!/usr/bin/env node
// The deterministic core of scope-roast. Claude judges each field and emits
// ratings. This turns ratings into a number nobody can argue with.
// Pure: no I/O, no randomness, no clock. Same input always gives same output.

import { readFileSync } from 'node:fs'

/**
 * The twelve scope fields, canonical order.
 * @type {readonly string[]}
 */
export const FIELDS = Object.freeze([
  'background', 'connection', 'essential', 'spread',
  'icp', 'pain', 'existingAttempts', 'limitations',
  'solution', 'boundary', 'falsifiable',
  'validation', 'distribution', 'nextSteps',
])

/**
 * The six dimensions of a scope. Fields roll up into these, and these are what
 * the report leads with, because six things a founder can act on beats fourteen
 * things they cannot hold in their head.
 *
 * Each dimension has exactly one anchor field weighing 2. The anchor is the
 * question a reader actually cares about; the siblings qualify the answer.
 *
 * WEDGE is its own dimension, not a corner of Insight. Evidence asks whether
 * reality has touched the idea; wedge asks whether the thing being proposed has
 * an edge at all. A founder can have real customers and paid pilots for a
 * proposition that is still three companies in a trenchcoat, and nothing in an
 * evidence-shaped rubric catches that. Its anchor is `boundary`, because a scope
 * that never says what is OUT is not a scope, it is an ambition.
 *
 * Dimension weights sum to 100.
 */
export const DIMENSIONS = Object.freeze([
  {
    key: 'problem',
    label: 'Problem',
    weight: 18,
    question: 'Is this worth solving?',
    fields: Object.freeze({ essential: 1, spread: 1, pain: 2 }),
  },
  {
    key: 'customer',
    label: 'Customer',
    weight: 18,
    question: 'Do you know who, and can you reach them?',
    fields: Object.freeze({ icp: 2, distribution: 1 }),
  },
  {
    key: 'insight',
    label: 'Insight',
    weight: 14,
    question: 'Do you know something the incumbents do not?',
    fields: Object.freeze({ existingAttempts: 2, limitations: 1 }),
  },
  {
    key: 'wedge',
    label: 'Wedge',
    weight: 18,
    question: 'Is the thing you would build bounded?',
    fields: Object.freeze({ solution: 1, boundary: 2, falsifiable: 1 }),
  },
  {
    key: 'evidence',
    label: 'Evidence',
    weight: 20,
    question: 'Has reality touched this yet?',
    fields: Object.freeze({ validation: 2, nextSteps: 1 }),
  },
  {
    key: 'founder',
    label: 'Founder',
    weight: 12,
    question: 'Are you the one to do it?',
    fields: Object.freeze({ background: 1, connection: 2 }),
  },
])

/**
 * How much source material there was to judge a field on. This is the axis
 * that separates "you wrote nothing about this" from "what you wrote is bad".
 *
 * An `absent` field is not a low score, it is an unanswered question. Scoring
 * it zero would punish a founder for a short document rather than a weak
 * scope, and would hide the far more useful finding: we cannot tell yet.
 */
export const BASIS = Object.freeze(['absent', 'thin', 'adequate', 'rich'])

/**
 * Each field's share of the whole scope, out of 100. Derived from its weight
 * inside its dimension times that dimension's weight, so it needs no separate
 * tuning and cannot drift out of sync.
 *
 * Two things read this: coverage (how much of the scope we could assess) and
 * the opportunity ranking (how many points a given fix is actually worth).
 */
export const FIELD_SCOPE_WEIGHT = Object.freeze(
  Object.fromEntries(
    DIMENSIONS.flatMap((d) => {
      const dimTotal = Object.values(d.fields).reduce((a, b) => a + b, 0)
      return Object.entries(d.fields).map(([f, w]) => [f, (w / dimTotal) * d.weight])
    })
  )
)

/**
 * Coverage thresholds. Below `insufficient` the score is not worth quoting and
 * the report leads with what to go and write instead.
 */
export const COVERAGE = Object.freeze({ insufficient: 50, firm: 80 })

/**
 * Quality flags cap the scope score. These are structural problems that good
 * writing hides, so without a cap a fluent founder reaches 75 on ten decent
 * fields while the evidence is theatre.
 *
 * Note what is NOT here: nothing about which market or vertical the venture is
 * in. Category is a fit question, not a quality question, and it lives on the
 * other axis.
 */
export const FLAGS = Object.freeze({
  'validation-theatre': {
    label: 'Validation theatre',
    cap: 60,
    why: 'Validation rests on positive conversations, a cold waitlist, or a competitor raising money. Nobody has changed their behaviour because of you yet.',
  },
  'platform-speak': {
    label: 'Platform speak without a wedge',
    cap: 65,
    why: 'A sprawling platform or operating system across several customers and modules, with no first workflow and no first customer named.',
  },
  'everyone-is-the-icp': {
    label: 'Everyone is the customer',
    cap: 65,
    why: 'The customer is a category rather than a person. Nobody has been picked, so every number downstream is guesswork.',
  },
  'no-boundary': {
    label: 'No stated boundary',
    cap: 65,
    why: 'The scope never says what is out. Nothing is excluded from version one, so there is no edge to build to and no way to know when it is done.',
  },
  'unfalsifiable': {
    label: 'Nothing could come back false',
    cap: 70,
    why: 'No kill criterion and no test with a losing outcome. A plan that cannot fail cannot teach you anything either.',
  },
})

/**
 * Scope bands, lowest first. Ranges are inclusive and tile 0 to 100.
 *
 * These judge the SCOPE: how well defined, bounded and evidenced the proposal
 * is. They are deliberately not investment language. This tool reads a
 * document, so the verdict is about the document.
 *
 * Every label is a statement about the document, never about where the
 * founder is in their process. "You have not tested it" and "go test it now"
 * describe the person's flow, and `development` already reports that far
 * better, with counts. Two places saying the same thing in different words is
 * what makes a report feel automated, and the label loses either way: it is
 * the one line that has to say how good the writing is.
 */
export const BANDS = Object.freeze([
  { min: 0, max: 39, key: 'not-a-scope', label: 'There is no scope here yet', verdict: 'Right now this is a subject you find interesting. Nobody reading it could tell me what you would build, who for, or what would make you stop.' },
  { min: 40, max: 54, key: 'sketch', label: 'Still an idea', verdict: 'The shape is there. Almost every line is you saying so, and none of it has an edge on it yet.' },
  { min: 55, max: 69, key: 'unevidenced', label: 'Clear, and unproven', verdict: 'I can tell what the thing is. Nothing outside your own head has touched it yet, so neither of us knows if you got it right.' },
  { min: 70, max: 84, key: 'sharp', label: 'It holds up', verdict: 'I read it closely and it did not fall apart. What is thin is proof, not thinking.' },
  { min: 85, max: 100, key: 'airtight', label: 'Nothing left to write', verdict: 'Anyone arguing with this would be arguing with the plan, not with the scope. There is nothing left to write.' },
])

/** The only permitted fit verdicts. */
export const FIT_STATUSES = Object.freeze(['in-scope', 'edge', 'out-of-scope'])

/**
 * The sentence the report leads with. The band alone is not enough, because at
 * low coverage the band describes a document that was barely written and reads
 * as a verdict on the business. A live company with a storefront and no scope
 * doc is not a weak venture, it is an unread one, and the copy has to say so.
 */
function verdictFor(band, coverage, assessedCount, totalCount) {
  if (coverage === 'insufficient') {
    return `Only ${assessedCount} of ${totalCount} fields are written down anywhere, so there is not enough here to read as a scope. The score below is what those few fields support, and nothing more. This is a statement about the document, not about the business behind it.`
  }
  if (coverage === 'provisional') {
    return `${band.verdict} Read it as provisional: ${assessedCount} of ${totalCount} fields were on the page.`
  }
  return band.verdict
}

function bandFor(total) {
  const b = BANDS.find((x) => total >= x.min && total <= x.max)
  if (!b) throw new Error(`score: no band for total: ${total}`)
  return { key: b.key, label: b.label, verdict: b.verdict }
}

/**
 * @typedef {{rating: number, evidence: string}} FieldScore
 * @typedef {{status: string, reasons: string[]}} Fit
 * @typedef {{fields: Record<string, FieldScore>, flags: string[], fit: Fit}} ScoreInput
 */

/**
 * Scores a scope on two independent axes.
 *
 * Axis 1 is the scope score: how well defined, bounded and evidenced this
 * proposal is, judged on its own terms.
 * Axis 2 is fit: is this a venture Builders would build. Fit never moves the
 * score. Keeping them apart is the whole point, because an excellent scope for
 * a consumer product is still an excellent scope.
 *
 * @param {ScoreInput} input
 */
export function score(input) {
  if (!input || typeof input !== 'object') throw new Error('score: input must be an object')
  const fields = input.fields || {}
  const flags = Array.isArray(input.flags) ? input.flags : []

  for (const id of flags) {
    if (!FLAGS[id]) throw new Error(`score: unknown flag: ${id}`)
  }

  // --- fit, validated but never mixed into the arithmetic ---
  const fit = input.fit
  if (!fit || typeof fit !== 'object') throw new Error('score: fit is required')
  if (!FIT_STATUSES.includes(fit.status)) {
    throw new Error(`score: fit.status must be one of ${FIT_STATUSES.join(', ')}, got ${JSON.stringify(fit.status)}`)
  }
  if (!Array.isArray(fit.reasons) || fit.reasons.length === 0) {
    throw new Error('score: fit.reasons must have at least one entry')
  }

  // --- per-field ratings, with basis deciding whether a field counts at all ---
  const unassessed = []
  const ratings = {}
  const bases = {}

  for (const field of FIELDS) {
    const entry = fields[field]

    // A field the model omitted entirely is the same finding as one it marked
    // absent: the source said nothing. Treat it that way rather than throwing,
    // so a slightly sloppy scores.json still produces an honest report.
    if (!entry || entry.basis === 'absent') {
      if (entry && entry.rating !== undefined && entry.rating !== null) {
        throw new Error(`score: ${field} is marked absent so it must not carry a rating`)
      }
      bases[field] = 'absent'
      ratings[field] = null
      unassessed.push(field)
      continue
    }

    const basis = entry.basis ?? 'adequate'
    if (!BASIS.includes(basis)) {
      throw new Error(`score: basis for ${field} must be one of ${BASIS.join(', ')}, got ${JSON.stringify(basis)}`)
    }
    const rating = entry.rating
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      throw new Error(`score: rating for ${field} must be an integer 0 to 5, got ${JSON.stringify(rating)}`)
    }
    bases[field] = basis
    ratings[field] = rating
  }

  // --- coverage: how much of the scope could actually be judged ---
  const assessedWeight = FIELDS
    .filter((f) => ratings[f] !== null)
    .reduce((sum, f) => sum + FIELD_SCOPE_WEIGHT[f], 0)
  const percent = Math.round(assessedWeight)
  const confidence =
    percent < COVERAGE.insufficient ? 'insufficient' : percent < COVERAGE.firm ? 'provisional' : 'firm'

  // --- dimension rollup, over assessed fields only ---
  const dimensions = DIMENSIONS.map((d) => {
    let raw = 0
    let max = 0
    const parts = []
    const dimUnassessed = []
    for (const [field, w] of Object.entries(d.fields)) {
      const assessed = ratings[field] !== null
      if (assessed) {
        raw += ratings[field] * w
        max += 5 * w
      } else {
        dimUnassessed.push(field)
      }
      parts.push({ field, rating: ratings[field], basis: bases[field], anchor: w === 2, assessed })
    }
    // A dimension scored without its anchor is standing on its light fields.
    // Scope 80 off `solution` alone, with `boundary` unwritten, is technically
    // true and practically misleading, so the report has to be able to caveat
    // it rather than print it like a firm reading.
    const anchorField = Object.keys(d.fields).find((f) => d.fields[f] === 2)
    const anchorAssessed = ratings[anchorField] !== null

    return {
      key: d.key,
      label: d.label,
      question: d.question,
      weight: d.weight,
      // null, not zero. A dimension nobody wrote about has no score, and the
      // report must show it as a gap rather than as a failure.
      score: max === 0 ? null : Math.round((raw / max) * 100),
      assessed: max > 0,
      anchor: anchorField,
      anchorAssessed,
      partial: max > 0 && dimUnassessed.length > 0,
      unassessed: dimUnassessed,
      fields: parts,
    }
  })

  // The total is the weighted mean of the dimensions that have a score, using
  // the displayed values so a reader can check it against the bars. Dimensions
  // that could not be assessed drop out of both sides of the fraction.
  const scored = dimensions.filter((d) => d.score !== null)
  const weightSum = scored.reduce((sum, d) => sum + d.weight, 0)
  const base = weightSum === 0
    ? 0
    : Math.round(scored.reduce((sum, d) => sum + d.score * d.weight, 0) / weightSum)

  let total = base
  let cappedBy = null
  for (const id of flags) {
    if (FLAGS[id].cap < total) {
      total = FLAGS[id].cap
      cappedBy = { id, label: FLAGS[id].label, cap: FLAGS[id].cap, why: FLAGS[id].why }
    }
  }

  // --- ranked opportunities: where the recoverable points actually are ---
  // Computed, not guessed. An unwritten field offers its whole weight back,
  // because an unanswered question could go either way.
  const opportunities = FIELDS
    .map((field) => {
      const rating = ratings[field]
      const weight = FIELD_SCOPE_WEIGHT[field]
      const unwritten = rating === null
      const recoverable = unwritten ? weight : ((5 - rating) / 5) * weight
      return {
        field,
        rating,
        basis: bases[field],
        unwritten,
        recoverable: Math.round(recoverable * 100) / 100,
        dimension: DIMENSIONS.find((d) => field in d.fields).key,
      }
    })
    .filter((o) => o.recoverable > 0)
    .sort((a, b) => b.recoverable - a.recoverable)

  // --- development: how far each part of the scope has actually been taken ---
  // A scope is built in three moves after the blank page: you write it down,
  // you make it specific enough that someone else could check it, then you go
  // and find out whether it is true. Counting the fields at each move says
  // more about how developed an idea is than the total does.
  const writtenFields = FIELDS.filter((f) => ratings[f] !== null)
  const specificFields = writtenFields.filter((f) => ratings[f] >= 4)
  const testedFields = writtenFields.filter((f) => ratings[f] === 5)
  const development = {
    total: FIELDS.length,
    written: writtenFields.length,
    specific: specificFields.length,
    tested: testedFields.length,
    unwrittenFields: FIELDS.filter((f) => ratings[f] === null),
    // Written down, and still nothing but assertion. Almost always the
    // bottleneck, and the most useful single number in the report.
    assertedFields: writtenFields.filter((f) => ratings[f] < 4),
    specificFields,
    testedFields,
  }

  return {
    scope: {
      base,
      total,
      band: bandFor(total),
      verdict: verdictFor(bandFor(total), confidence, FIELDS.length - unassessed.length, FIELDS.length),
      cappedBy,
      // True when there was not enough in the source to stand behind the
      // number. The report must lead with this, not bury it.
      provisional: confidence !== 'firm',
    },
    fit: { status: fit.status, reasons: fit.reasons },
    coverage: {
      percent,
      confidence,
      assessedCount: FIELDS.length - unassessed.length,
      totalCount: FIELDS.length,
      unassessed,
    },
    development,
    dimensions,
    ratings,
    bases,
    opportunities,
    flags,
  }
}

const isMain = process.argv[1] && import.meta.url === (await import('node:url')).pathToFileURL((await import('node:fs')).realpathSync(process.argv[1])).href
if (isMain) {
  const path = process.argv[2]
  if (!path) {
    console.error('usage: node scripts/score.mjs <scores.json>')
    process.exit(2)
  }
  console.log(JSON.stringify(score(JSON.parse(readFileSync(path, 'utf8'))), null, 2))
}
