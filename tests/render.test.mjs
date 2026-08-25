import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { render, escapeHtml } from '../scope-roast/bin/render.mjs'
import { score } from '../scope-roast/bin/score.mjs'

const scoredFrom = (n) => score(JSON.parse(readFileSync(`scope-roast/fixtures/${n}.scores.json`, 'utf8')))

function payload(name = 'weak', prose = {}) {
  return {
    title: 'Test Venture, doing a thing',
    scored: scoredFrom(name),
    prose: {
      headline: 'Twelve years of proximity and not one hour inside it.',
      burns: [{ field: 'icp', quote: 'Any mid-sized company in Europe.', burn: 'That is a continent with a headcount filter.', rule: 'The founder has not picked.', fix: 'Name the job title and the country.' }],
      strengths: ['You wrote a full scope rather than a paragraph.', 'The problem you are circling is real.'],
      rewrite: { field: 'icp', before: 'Any mid-sized company.', after: 'Heads of QA at Dutch medtech firms with 50 to 200 staff.' },
      ...prose,
    },
  }
}

test('render returns a complete standalone document with no leftover placeholders', () => {
  const html = render(payload())
  assert.match(html, /^<!doctype html>/i)
  assert.match(html, /<\/html>\s*$/)
  assert.ok(!html.includes('{{'))
})

test('render inlines the stylesheet so the file needs no network', () => {
  const html = render(payload())
  assert.match(html, /--cream: #FAF7F2/)
  assert.ok(!html.includes('<link'))
  assert.ok(!html.includes('http://') && !html.includes('https://'))
})

test('render prints the total and band', () => {
  const html = render(payload())
  assert.match(html, />12<span>\/100<\/span>/)
  assert.match(html, /There is no scope here yet/)
})

test('render emits one row per dimension', () => {
  const html = render(payload())
  for (const label of ['Problem', 'Customer', 'Insight', 'Evidence', 'Founder']) {
    assert.match(html, new RegExp(`<b>${label}</b>`))
  }
})

test('an unassessed dimension renders as not assessed, never as zero', () => {
  const html = render(payload('sparse'))
  assert.match(html, /not assessed/i)
  assert.match(html, /class="bar-row na"/)
})

test('low coverage renders the provisional badge and the gap list', () => {
  const html = render(payload('sparse'))
  assert.match(html, /Provisional/i)
  assert.match(html, /4 of 14/)
  assert.match(html, /class="coverage low"/)
})

test('firm coverage renders no provisional badge', () => {
  const html = render(payload('strong-in-scope'))
  assert.ok(!/class="provisional"/.test(html))
})

test('fit renders in its own card with its status class and reasons', () => {
  const html = render(payload('strong-out-of-scope'))
  assert.match(html, /class="fit out-of-scope"/)
  assert.match(html, /Consumer product/)
})

test('a high scoring out of scope venture still shows its high score', () => {
  const html = render(payload('strong-out-of-scope'))
  assert.match(html, />84<span>/)
  assert.match(html, /It holds up/)
})

test('the cap block appears only when a cap actually bit', () => {
  assert.ok(!render(payload('weak')).includes('class="cap"'))
  const capped = payload('weak')
  capped.scored.scope.cappedBy = { id: 'validation-theatre', label: 'Validation theatre', cap: 60, why: 'Nobody paid.' }
  capped.scored.scope.base = 88
  assert.match(render(capped), /class="cap"/)
})

test('the fixes table is ranked by recoverable points, descending', () => {
  const html = render(payload('weak'))
  const points = [...html.matchAll(/class="num">\+([\d.]+)</g)].map((m) => Number(m[1]))
  assert.ok(points.length >= 5)
  for (let i = 1; i < points.length; i++) {
    assert.ok(points[i - 1] >= points[i], `row ${i} out of order`)
  }
  assert.match(html, /Validation|Ideal customer/, 'the heaviest weak fields lead')
})

test('an unwritten field is marked as unwritten in the fixes table', () => {
  assert.match(render(payload('sparse')), /class="pill unwritten"/)
})

test('the rewrite section is omitted when there is nothing to rewrite', () => {
  const html = render(payload('sparse', { rewrite: null }))
  assert.ok(!html.includes('class="rewrite"'))
})

test('escapeHtml neutralises markup', () => {
  assert.equal(escapeHtml('<b>a & "b"</b>'), '&lt;b&gt;a &amp; &quot;b&quot;&lt;/b&gt;')
})

test('model prose is escaped, never injected as markup', () => {
  const p = payload()
  p.prose.burns[0].quote = '<script>alert(1)</script>'
  const html = render(p)
  assert.ok(!html.includes('<script>alert(1)</script>'))
  assert.match(html, /&lt;script&gt;/)
})

test('render throws on a missing required prose section', () => {
  const p = payload()
  delete p.prose.headline
  assert.throws(() => render(p), /missing prose\.headline/)
})

test('every fixture renders without throwing', () => {
  for (const n of ['strong-in-scope', 'strong-out-of-scope', 'weak', 'sparse']) {
    assert.match(render(payload(n)), /^<!doctype html>/i, n)
  }
})

test('a partial dimension is starred and says which field is missing', () => {
  const html = render(payload('sparse'))
  assert.match(html, /Partial:/)
  assert.match(html, /80\*/, 'a partial reading is starred, not printed like a firm one')
})

test('the wedge dimension appears in the report', () => {
  assert.match(render(payload('strong-in-scope')), /<b>Wedge<\/b>/)
})
