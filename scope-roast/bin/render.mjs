#!/usr/bin/env node
// Turns the deterministic scores plus the model's prose into one
// self-contained HTML file. No chart library, no fonts fetched, no network
// at all: the report has to open from a founder's disk on a train.
//
// This file never invents a score. The one number it computes beyond what
// `score()` already returned is an "after" preview for the write-these-first
// list (what the total would be if one field went to 5 of 5), and that
// preview is produced by calling the same pure `score()` function on a copy
// of the original input, never approximated by hand.

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { score } from './score.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const TOOL = join(HERE, '..')

/** Human labels for the fourteen field keys. */
const FIELD_LABELS = {
  background: 'Background',
  connection: 'Connection to the problem',
  essential: 'Why it is essential',
  spread: 'How widespread it is',
  icp: 'Ideal customer',
  pain: 'Quantifying the pain',
  existingAttempts: 'Existing attempts',
  limitations: 'Why those fall short',
  solution: 'The solution',
  boundary: 'What version one leaves out',
  falsifiable: 'What would prove it wrong',
  validation: 'Validation',
  distribution: 'Distribution',
  nextSteps: 'Next steps',
}

const DIM_COLOR = {
  problem: 'var(--amber)',
  customer: 'var(--cyan)',
  insight: 'var(--violet)',
  wedge: 'var(--gold)',
  evidence: 'var(--emerald)',
  founder: 'var(--rose)',
}

const FIT_LABELS = { 'in-scope': 'In scope', edge: 'Edge', 'out-of-scope': 'Out of scope' }
const FIT_COLOR = { 'in-scope': 'var(--emerald)', edge: 'var(--amber)', 'out-of-scope': 'var(--rose)' }
const FIT_BG = {
  'in-scope': 'rgba(0,255,160,0.07)',
  edge: 'rgba(255,179,71,0.07)',
  'out-of-scope': 'rgba(255,61,158,0.07)',
}

const TIER_LABELS = { verified: 'Verified', claimed: 'Claimed', aspirational: 'Aspirational' }
const TIER_COLOR = { verified: 'var(--emerald)', claimed: 'var(--amber)', aspirational: 'var(--rose)' }

const IDEA_LENS_COLOR = { yes: 'var(--emerald)', partial: 'var(--amber)', no: 'var(--rose)' }
const IDEA_LENS_GLYPH = { yes: '&#10003;', partial: '&#8231;', no: '&#10005;' }

const label = (f) => FIELD_LABELS[f] || f

export function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function requireProse(prose, key) {
  const v = prose ? prose[key] : undefined
  if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) {
    throw new Error(`render: missing prose.${key}`)
  }
  return v
}

/** Emerald at 70 and up, amber from 40, rose below. Matches the band edges. */
const tone = (total) => (total >= 70 ? 'var(--emerald)' : total >= 40 ? 'var(--amber)' : 'var(--rose)')

function rubricVersion() {
  try {
    const rubric = JSON.parse(readFileSync(join(TOOL, 'rubric', 'scope-rubric.json'), 'utf8'))
    return `v${rubric.version}`
  } catch {
    return 'unknown'
  }
}

/** The gauge is a fixed semicircle; only the fill's colour and length change. */
function gaugeSvg(total, band) {
  const color = tone(total)
  const dash = ((total / 100) * 282.74).toFixed(1)
  return [
    '<svg viewBox="0 0 220 122">',
    // No decorative tick marks: the gauge sits directly above the band
    // label, and every tick position tried so far has ended up close enough
    // to some label ("There is no scope here yet" and others) to visually
    // collide with it. The arcs alone carry the reading.
    '<path d="M 20 112 A 90 90 0 0 1 200 112" fill="none" stroke="var(--tg)" stroke-opacity="0.3" stroke-width="3" stroke-dasharray="1 5" stroke-linecap="round"/>',
    `<path d="M 20 112 A 90 90 0 0 1 200 112" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${dash} 282.74" style="filter:drop-shadow(0 0 7px ${color})"/>`,
    '</svg>',
    '<div class="gauge-readout">',
    `<div class="gauge-total">${total}</div>`,
    `<div class="gauge-band" style="color:${color}">${escapeHtml(band)}</div>`,
    '</div>',
  ].join('')
}

function renderDimensionRows(dimensions) {
  const rows = dimensions
    .map((d) => {
      const assessed = d.score !== null
      const scoreDisp = assessed ? String(d.score) + (d.partial ? '*' : '') : '&mdash;'
      const width = assessed ? d.score : 0
      const opacity = assessed ? 1 : 0.35
      return [
        `  <div class="dim-row" style="opacity:${opacity}">`,
        `    <div class="dim-label">${escapeHtml(d.label)}</div>`,
        `    <div class="segtrack"><div class="fill" style="width:${width}%;background:${DIM_COLOR[d.key]};box-shadow:0 0 8px ${DIM_COLOR[d.key]}"></div></div>`,
        `    <div class="dim-score">${scoreDisp}</div>`,
        `    <div class="dim-weight">&times;${d.weight}%</div>`,
        '  </div>',
      ].join('\n')
    })
    .join('\n')
  const partial = dimensions.filter((d) => d.partial).map((d) => d.label)
  const note = partial.length
    ? `<div class="dims-note">* anchor field unwritten: ${escapeHtml(partial.join(', '))}</div>`
    : ''
  return { rows, note }
}

function renderCapLine(cappedBy, base) {
  if (!cappedBy) return ''
  return `<div class="cap-line">capped at ${cappedBy.cap}, ${escapeHtml(cappedBy.label.toLowerCase())} (raw ${base})</div>`
}

function renderStrengths(strengths) {
  const items = strengths.map((s) => `    <div class="item"><span class="dot">&middot;</span>${escapeHtml(s)}</div>`).join('\n')
  return `<div class="strengths-line">\n${items}\n</div>`
}

function renderBurns(burns) {
  if (burns.length === 0) return ''
  return burns
    .map((b, i) => {
      const absent = b.quote.trim() === 'Nothing in the document.'
      const quoteClass = absent ? 'absent' : 'present'
      return [
        '<div class="burn">',
        `  <div class="burn-num">0${i + 1}</div>`,
        '  <div class="burn-body">',
        `    <div class="burn-field">${escapeHtml(label(b.field))}</div>`,
        `    <div class="burn-quote ${quoteClass}"><span class="chevron">&gt; </span>${escapeHtml(b.quote)}</div>`,
        `    <p class="burn-text">${escapeHtml(b.burn)}</p>`,
        `    <div class="burn-fix"><span class="label">fix &rarr;</span> ${escapeHtml(b.fix)}</div>`,
        '  </div>',
        '</div>',
      ].join('\n')
    })
    .join('\n')
}

/**
 * Re-scores the original input with one field bumped to 5 of 5, so the
 * "after" number in the write-these-first list is exact, not estimated.
 */
function afterFixing(scoresInput, field) {
  const existing = scoresInput.fields?.[field]
  const clone = {
    ...scoresInput,
    fields: {
      ...scoresInput.fields,
      [field]: { rating: 5, basis: existing && existing.basis !== 'absent' ? existing.basis : 'adequate', evidence: existing?.evidence || '' },
    },
  }
  return score(clone).scope.total
}

function renderOpportunities(scoresInput, scored) {
  const total = scored.scope.total
  const top = scored.opportunities
    .slice(0, 3)
    .map((o) => ({ ...o, after: afterFixing(scoresInput, o.field) }))
    .map((o) => ({ ...o, gain: o.after - total }))
    .filter((o) => o.gain > 0)

  if (top.length === 0) {
    return '  <p class="opps-empty">Nothing left on the table. Every part is at five.</p>'
  }

  const maxGain = Math.max(...top.map((o) => o.gain))
  return top
    .map((o) => {
      const pct = Math.round((o.gain / maxGain) * 100)
      return [
        '  <div class="opp-row">',
        `    <div class="opp-label">${escapeHtml(label(o.field))}</div>`,
        `    <div class="segtrack"><div class="fill" style="width:${pct}%;background:var(--cyan);box-shadow:0 0 8px var(--cyan)"></div></div>`,
        `    <div class="opp-gain">+${o.gain} &rarr; ${o.after}</div>`,
        '  </div>',
      ].join('\n')
    })
    .join('\n')
}

function renderScopeChecklist(scope) {
  return scope
    .map((s) => {
      const glyph = s.pass === true ? '&#10003;' : s.pass === false ? '&#10005;' : '&#8212;'
      const color = s.pass === true ? 'var(--emerald)' : s.pass === false ? 'var(--rose)' : 'var(--tg)'
      return `    <div class="scope-check" style="color:${color}"><span class="glyph">${glyph}</span><span class="label">${escapeHtml(s.label)}</span></div>`
    })
    .join('\n')
}

function renderScorecard(scorecard) {
  return scorecard
    .map((s) => {
      const assessed = s.score !== null && s.score !== undefined
      const width = assessed ? (s.score / 3) * 100 : 0
      const scoreDisp = assessed ? `${s.score}/3` : '&mdash;'
      const tier = assessed && s.tier ? `<span class="tier" style="color:${TIER_COLOR[s.tier]}">${TIER_LABELS[s.tier]}</span>` : ''
      return [
        `  <div class="score-row" style="opacity:${assessed ? 1 : 0.45}">`,
        `    <div class="score-label">${escapeHtml(s.label)}</div>`,
        `    <div class="segtrack score-track"><div class="fill" style="width:${width}%;background:var(--violet);box-shadow:0 0 8px var(--violet)"></div></div>`,
        `    <div class="score-val">${scoreDisp}</div>`,
        `    <div class="score-tier">${tier || '<span class="score-na">not assessable</span>'}</div>`,
        `    <div class="score-note">${escapeHtml(s.note)}</div>`,
        '  </div>',
      ].join('\n')
    })
    .join('\n')
}

function renderIdeaLens(ideaLens) {
  return ideaLens
    .map(
      (i) =>
        `    <div class="lens-tag" style="color:${IDEA_LENS_COLOR[i.value]};border-color:${IDEA_LENS_COLOR[i.value]}"><span class="glyph">${IDEA_LENS_GLYPH[i.value]}</span>${escapeHtml(i.label)}</div>`
    )
    .join('\n')
}

function renderRedFlags(redFlags) {
  return redFlags.map((f) => `    <div class="flag-row"><span class="glyph">&#9650;</span>${escapeHtml(f)}</div>`).join('\n')
}

/**
 * The Builders assessment is a second, separate rubric (batch admission, not
 * scope quality) grafted onto the same report. It only appears when the
 * model actually ran that assessment and supplied one; most scopes will
 * never carry this key, and the whole section disappears when absent.
 */
function renderAssessment(assessment) {
  if (!assessment) return ''
  const { scope, scorecard, ideaLens, redFlags } = assessment
  const flags = redFlags && redFlags.length ? renderRedFlags(redFlags) : '<div class="flag-row none">Nothing flagged.</div>'
  return [
    '<div class="section">',
    '  <div class="section-head"><span class="num" style="color:var(--violet)">03</span> the builders read<span class="rule"></span></div>',
    '  <div class="assess-block">',
    '    <div class="assess-label">Scope test</div>',
    '    <div class="scope-grid">',
    renderScopeChecklist(scope),
    '    </div>',
    '  </div>',
    '  <div class="assess-block">',
    '    <div class="assess-label">Scorecard</div>',
    '    <div class="scorecard">',
    renderScorecard(scorecard),
    '    </div>',
    '  </div>',
    '  <div class="assess-block">',
    '    <div class="assess-label">Idea lens</div>',
    '    <div class="lens-row">',
    renderIdeaLens(ideaLens),
    '    </div>',
    '  </div>',
    '  <div class="assess-block">',
    '    <div class="assess-label">Red flags</div>',
    '    <div class="flags">',
    flags,
    '    </div>',
    '  </div>',
    '</div>',
  ].join('\n')
}

/**
 * @param {{title: string, scores: object, prose: object}} payload
 * @returns {string} a complete HTML document
 */
export function render(payload) {
  const { title, scores, prose } = payload
  if (!scores || typeof scores !== 'object') throw new Error('render: scores is required')
  const scored = score(scores)

  const headline = requireProse(prose, 'headline')
  const strengths = requireProse(prose, 'strengths')
  const burns = prose.burns ?? []

  const template = readFileSync(join(TOOL, 'templates', 'report.html'), 'utf8')
  const css = readFileSync(join(TOOL, 'assets', 'report.css'), 'utf8')

  const { rows, note } = renderDimensionRows(scored.dimensions)
  const writtenLine = `${scored.coverage.assessedCount}/${scored.coverage.totalCount} parts written`
  const writtenSuffix = scored.coverage.confidence === 'firm' ? '' : ` &middot; ${scored.coverage.confidence}`
  const writtenColor = scored.coverage.confidence === 'firm' ? 'var(--tm)' : scored.coverage.confidence === 'provisional' ? 'var(--amber)' : 'var(--rose)'

  const slots = {
    TITLE: escapeHtml(title),
    REPORT_CSS: css,
    FIT_LABEL: escapeHtml(FIT_LABELS[scored.fit.status] || scored.fit.status),
    FIT_COLOR: FIT_COLOR[scored.fit.status] || 'var(--tm)',
    FIT_BG: FIT_BG[scored.fit.status] || 'transparent',
    WRITTEN_LINE: writtenLine + writtenSuffix,
    WRITTEN_COLOR: writtenColor,
    RUBRIC_VERSION: rubricVersion(),
    GAUGE_SVG: gaugeSvg(scored.scope.total, scored.scope.band.label),
    CAP_LINE: renderCapLine(scored.scope.cappedBy, scored.scope.base),
    DIMENSION_ROWS: rows,
    DIMS_NOTE: note,
    HEADLINE: escapeHtml(headline),
    STRENGTHS: renderStrengths(strengths),
    BURNS: renderBurns(burns),
    OPPORTUNITIES: renderOpportunities(scores, scored),
    ASSESSMENT: renderAssessment(prose.assessment ?? null),
  }

  let html = template
  for (const [key, value] of Object.entries(slots)) {
    html = html.replaceAll(`{{${key}}}`, value)
  }

  const leftover = html.match(/\{\{[A-Z_]+\}\}/g)
  if (leftover) throw new Error(`render: unreplaced placeholders: ${leftover.join(', ')}`)
  return html
}

const isMain = process.argv[1] && import.meta.url === (await import('node:url')).pathToFileURL((await import('node:fs')).realpathSync(process.argv[1])).href
if (isMain) {
  const [scoresPath, prosePath, outPath] = process.argv.slice(2)
  if (!scoresPath || !prosePath || !outPath) {
    console.error('usage: node bin/render.mjs <scores.json> <prose.json> <out.html>')
    process.exit(2)
  }
  const scoresInput = JSON.parse(readFileSync(scoresPath, 'utf8'))
  const { title, ...prose } = JSON.parse(readFileSync(prosePath, 'utf8'))
  writeFileSync(outPath, render({ title, scores: scoresInput, prose }), 'utf8')
  console.log(`render: wrote ${outPath}`)
}
