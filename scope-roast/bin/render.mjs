#!/usr/bin/env node
// Turns a scored result plus the model's prose into one self-contained HTML
// file. No chart library, no fonts fetched, no network at all: the report has
// to open from a founder's disk on a train.
//
// This file never computes a score. Everything numeric arrives in `scored`.

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FIELD_SCOPE_WEIGHT } from './score.mjs'

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

const FIT_LABELS = {
  'in-scope': 'In scope',
  edge: 'On the edge',
  'out-of-scope': 'Out of scope',
}

const FIT_BLURB = {
  'in-scope': 'This sits inside what Builders builds.',
  edge: 'Most of the thesis is met, with one open question.',
  'out-of-scope': 'Builders would not build this. That is a statement about Builders, not about the scope.',
}

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

/** Red under 40, amber under 70, green above. */
const tone = (pct) => (pct < 40 ? 'lo' : pct < 70 ? 'mid' : 'hi')

function barRow({ name, note, pct, value, na = false }) {
  const fill = na ? '' : `<div class="bar-fill ${tone(pct)}" style="width:${pct}%"></div>`
  return [
    `  <div class="bar-row${na ? ' na' : ''}">`,
    `    <div class="bar-name"><b>${escapeHtml(name)}</b>${note ? `<small>${escapeHtml(note)}</small>` : ''}</div>`,
    `    <div class="bar-track">${fill}</div>`,
    `    <div class="bar-value">${escapeHtml(value)}</div>`,
    '  </div>',
  ].join('\n')
}

function renderDimensions(dimensions) {
  return dimensions
    .map((d) => {
      if (d.score === null) {
        return barRow({
          name: d.label,
          note: `${d.question} Nothing written on ${d.unassessed.map(label).join(' or ')}.`,
          pct: 0,
          value: 'not assessed',
          na: true,
        })
      }
      // A reading taken without its anchor field has to say so, or it prints
      // like a firm score while standing on the light fields alone.
      const note = d.partial
        ? `Partial: ${d.unassessed.map(label).join(' and ')} never written${d.anchorAssessed ? '' : ', including the anchor'}.`
        : `${d.question} Worth ${d.weight} of 100.`
      return barRow({
        name: d.label,
        note,
        pct: d.score,
        value: d.partial ? `${d.score}*` : `${d.score}`,
      })
    })
    .join('\n')
}

function renderRatings(scored) {
  return scored.dimensions
    .flatMap((d) => d.fields)
    .map((f) => {
      const weight = FIELD_SCOPE_WEIGHT[f.field].toFixed(1)
      const rating = f.assessed ? `${f.rating}/5` : 'not written'
      return `  <tr><td>${escapeHtml(label(f.field))}${f.anchor ? ' <span class="pill">anchor</span>' : ''}</td><td>${escapeHtml(f.basis)}</td><td class="num">${rating}</td><td class="num">${weight}</td></tr>`
    })
    .join('\n')
}

function renderFixes(opportunities) {
  if (opportunities.length === 0) {
    return '  <tr><td colspan="3">Nothing left on the table. Every field is at five.</td></tr>'
  }
  return opportunities
    .map((o) => {
      const now = o.unwritten
        ? '<span class="pill unwritten">not written</span>'
        : `<span class="pill">${o.rating}/5</span>`
      return `  <tr><td>${escapeHtml(label(o.field))}</td><td>${now}</td><td class="num">+${o.recoverable.toFixed(1)}</td></tr>`
    })
    .join('\n')
}

function renderCoverage(coverage) {
  const { percent, confidence, assessedCount, totalCount, unassessed } = coverage
  const low = confidence !== 'firm'
  const gaps = unassessed.length
    ? `<p class="gaps">Never covered: ${unassessed.map((f) => `<code>${escapeHtml(label(f))}</code>`).join(' ')}</p>`
    : '<p class="gaps">Every field was covered, so the score stands on the whole picture.</p>'
  const line = low
    ? `Only ${assessedCount} of ${totalCount} fields could be assessed, so this score is provisional. Write the gaps below and run it again.`
    : `${assessedCount} of ${totalCount} fields assessed. Enough to stand behind the number.`
  return [
    `<div class="coverage${low ? ' low' : ''}">`,
    '  <p class="label">Coverage</p>',
    `  <p style="margin:6px 0 0"><b>${percent}% of the venture could be judged.</b> ${escapeHtml(line)}</p>`,
    `  <div class="cov-track"><div class="cov-fill" style="width:${percent}%"></div></div>`,
    `  ${gaps}`,
    '</div>',
  ].join('\n')
}

function renderFit(fit) {
  return [
    `<div class="fit ${escapeHtml(fit.status)}">`,
    `  <p class="fit-status">${escapeHtml(FIT_LABELS[fit.status] || fit.status)}</p>`,
    `  <p class="sub">${escapeHtml(FIT_BLURB[fit.status] || '')}</p>`,
    '  <ul>',
    fit.reasons.map((r) => `    <li>${escapeHtml(r)}</li>`).join('\n'),
    '  </ul>',
    '</div>',
  ].join('\n')
}

function renderCap(cappedBy, base) {
  if (!cappedBy) return ''
  return [
    '<div class="cap">',
    `  <p><strong>${escapeHtml(cappedBy.label)}.</strong> The dimensions came to ${base}, and this caps the score at ${cappedBy.cap}.</p>`,
    `  <p>${escapeHtml(cappedBy.why)}</p>`,
    '</div>',
  ].join('\n')
}

function renderBurns(burns) {
  return burns
    .map((b) =>
      [
        '<div class="burn">',
        `  <h3>${escapeHtml(label(b.field))}</h3>`,
        `  <blockquote>${escapeHtml(b.quote)}</blockquote>`,
        `  <p>${escapeHtml(b.burn)}</p>`,
        `  <p class="rule">Breaks: ${escapeHtml(b.rule)}</p>`,
        '  <div class="fix">',
        '    <p class="label">Fix</p>',
        `    <p>${escapeHtml(b.fix)}</p>`,
        '  </div>',
        '</div>',
      ].join('\n')
    )
    .join('\n')
}

function renderRewrite(rewrite) {
  if (!rewrite) return ''
  return [
    '<h2>Your highest value field, rewritten</h2>',
    '<p class="sub">Using only facts already in your document. Bracketed slots are the ones you have not given me.</p>',
    '<div class="rewrite">',
    '  <div class="col">',
    `    <p class="label">What you wrote, ${escapeHtml(label(rewrite.field))}</p>`,
    `    <p>${escapeHtml(rewrite.before)}</p>`,
    '  </div>',
    '  <div class="col after">',
    '    <p class="label">What it should say</p>',
    `    <p>${escapeHtml(rewrite.after)}</p>`,
    '  </div>',
    '</div>',
  ].join('\n')
}

/**
 * @param {{title: string, scored: object, prose: object}} payload
 * @returns {string} a complete HTML document
 */
export function render(payload) {
  const { title, scored, prose } = payload
  const headline = requireProse(prose, 'headline')
  const burns = requireProse(prose, 'burns')
  const strengths = requireProse(prose, 'strengths')
  // rewrite is deliberately optional: when every high value field is unwritten
  // there is nothing to rewrite, and inventing one would fabricate facts.
  const rewrite = prose.rewrite ?? null

  const template = readFileSync(join(TOOL, 'templates', 'report.html'), 'utf8')
  const css = readFileSync(join(TOOL, 'assets', 'report.css'), 'utf8')

  const slots = {
    TITLE: escapeHtml(title),
    REPORT_CSS: css,
    TOTAL: String(scored.scope.total),
    BAND_LABEL: escapeHtml(scored.scope.band.label),
    HEADLINE: escapeHtml(headline),
    PROVISIONAL_BADGE: scored.scope.provisional
      ? '<p class="provisional">Provisional, coverage is thin</p>'
      : '',
    COVERAGE: renderCoverage(scored.coverage),
    CAP_BLOCK: renderCap(scored.scope.cappedBy, scored.scope.base),
    DIMENSIONS: renderDimensions(scored.dimensions),
    FIT: renderFit(scored.fit),
    BURNS: renderBurns(burns),
    STRENGTHS: strengths.map((s) => `  <li>${escapeHtml(s)}</li>`).join('\n'),
    FIXES: renderFixes(scored.opportunities),
    REWRITE: renderRewrite(rewrite),
    RATINGS: renderRatings(scored),
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
  const [inPath, outPath] = process.argv.slice(2)
  if (!inPath || !outPath) {
    console.error('usage: node scripts/render.mjs <roast-payload.json> <out.html>')
    process.exit(2)
  }
  writeFileSync(outPath, render(JSON.parse(readFileSync(inPath, 'utf8'))), 'utf8')
  console.log(`render: wrote ${outPath}`)
}
