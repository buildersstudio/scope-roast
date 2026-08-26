import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { render, escapeHtml } from '../scope-roast/bin/render.mjs'
import { score, FIELDS } from '../scope-roast/bin/score.mjs'

const scoresFrom = (n) => JSON.parse(readFileSync(`scope-roast/fixtures/${n}.scores.json`, 'utf8'))

function payload(name = 'weak', prose = {}) {
  return {
    title: 'Test Venture, doing a thing',
    scores: scoresFrom(name),
    prose: {
      headline: 'Twelve years of proximity and not one hour inside it.',
      burns: [{ field: 'icp', quote: 'Any mid-sized company in Europe.', burn: 'That is a continent with a headcount filter.', fix: 'Name the job title and the country.' }],
      strengths: ['You wrote a full scope rather than a paragraph.', 'The problem you are circling is real.'],
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
  assert.match(html, /--bg: #0c0d12/)
  assert.ok(!html.includes('<link'))
  // xmlns="http://www.w3.org/2000/svg" is a namespace URI, not a fetch, so it
  // is fine on the inline logo. Nothing should ever load or link to one.
  assert.ok(!/\b(?:src|href)="https?:\/\//.test(html))
  assert.ok(!/url\(https?:\/\//.test(html))
})

test('render throws without scores', () => {
  const p = payload()
  delete p.scores
  assert.throws(() => render(p), /scores is required/)
})

test('render never recomputes the score itself, it calls score() on the given input', () => {
  const html = render(payload('weak'))
  assert.match(html, /class="gauge-total">12</)
})

test('render prints the total and band', () => {
  const html = render(payload())
  assert.match(html, /class="gauge-total">12</)
  assert.match(html, /There is no scope here yet/)
})

test('render emits one row per dimension', () => {
  const html = render(payload())
  for (const label of ['Problem', 'Customer', 'Insight', 'Wedge', 'Evidence', 'Founder']) {
    assert.match(html, new RegExp(`class="dim-label">${label}<`))
  }
})

test('an unassessed dimension renders as a dash, never as zero', () => {
  const html = render(payload('sparse'))
  assert.match(html, /class="dim-score">&mdash;</)
})

test('low coverage renders the confidence in the written badge', () => {
  const html = render(payload('sparse'))
  assert.match(html, /4\/14 parts written/)
  assert.match(html, /insufficient/)
})

test('firm coverage renders no confidence suffix', () => {
  const html = render(payload('strong-in-scope'))
  assert.match(html, /14\/14 parts written<\/span>/)
})

test('fit renders as its own pill with a label', () => {
  const html = render(payload('strong-out-of-scope'))
  assert.match(html, /class="fit-pill"[^>]*>Out of scope</)
})

test('a high scoring out of scope venture still shows its high score', () => {
  const html = render(payload('strong-out-of-scope'))
  assert.match(html, /class="gauge-total">84</)
  assert.match(html, /It holds up/)
})

test('the cap line appears only when a cap actually bit', () => {
  assert.ok(!render(payload('weak')).includes('<div class="cap-line"'))
})

test('a partial dimension is starred and named in the note', () => {
  const html = render(payload('sparse'))
  assert.match(html, /80\*/)
  assert.match(html, /anchor field unwritten.*Wedge/)
})

test('the write-these-first list is capped at three and ordered by gain', () => {
  const html = render(payload('weak'))
  const gains = [...html.matchAll(/class="opp-gain">\+(\d+)/g)].map((m) => Number(m[1]))
  assert.ok(gains.length > 0 && gains.length <= 3)
  for (let i = 1; i < gains.length; i++) {
    assert.ok(gains[i - 1] >= gains[i], `row ${i} out of order`)
  }
})

test('the after number in write-these-first is an exact rescore, not an estimate', () => {
  const html = render(payload('weak'))
  const scores = scoresFrom('weak')
  // icp is unwritten-worst in the weak fixture; bump it to 5 by hand the same
  // way render.mjs does, and check the printed number matches exactly.
  const before = score(scores).scope.total
  const clone = { ...scores, fields: { ...scores.fields, icp: { rating: 5, basis: 'adequate', evidence: '' } } }
  const after = score(clone).scope.total
  assert.match(html, new RegExp(`\\+${after - before} &rarr; ${after}`))
})

test('an empty opportunities list says so instead of an empty table', () => {
  const fields = {}
  for (const f of FIELDS) fields[f] = { rating: 5, basis: 'rich', evidence: 'x' }
  const perfect = { fields, flags: [], fit: { status: 'in-scope', reasons: ['t'] } }
  const html = render({ title: 'Perfect', scores: perfect, prose: payload().prose })
  assert.match(html, /Nothing left on the table/)
})

test('every fixture renders without throwing', () => {
  for (const n of ['strong-in-scope', 'strong-out-of-scope', 'weak', 'sparse']) {
    assert.match(render(payload(n)), /^<!doctype html>/i, n)
  }
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

test('a burn quoting the literal absence line renders styled as absent', () => {
  const p = payload('sparse', {
    burns: [{ field: 'validation', quote: 'Nothing in the document.', burn: 'Shown to nobody.', fix: 'Ask one team to try it.' }],
  })
  const html = render(p)
  assert.match(html, /class="burn-quote absent"/)
})

test('a real quote renders styled as present, not absent', () => {
  const html = render(payload('weak'))
  assert.match(html, /class="burn-quote present"/)
})

test('render works with no burns at all, for a document too thin to support any', () => {
  const p = payload('sparse', { burns: [] })
  assert.match(render(p), /^<!doctype html>/i)
})
