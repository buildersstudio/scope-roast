#!/usr/bin/env node
// Scans shipped copy for the patterns that make writing read as generated.
// Runs on the tool's own prose and on any roast in evals/out, because a roast
// that sounds like a model wrote it is not a roast anybody acts on.
//
// roast-voice.md is skipped: it is the forbidden list, so it quotes every
// pattern on purpose.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const PATTERNS = [
  ['correlative', /\b(?:is|are|was|were|isn't|aren't)\s+not\s+just\b/i],
  ['empty setup', /\b(?:The (?:truth|reality) is|Here'?s the thing|Let'?s be honest|At the end of the day|Let that sink in)\b/i],
  ['fake reveal', /\b(?:The best part\?|The secret\?|What if I told you|Sounds impossible\?)/i],
  ['era opener', /\bIn (?:today'?s|an era where|the ever-evolving)\b/i],
  ['transition stacking', /^\s*(?:Furthermore|Moreover|Additionally),/im],
  ['staccato drama', /\b(?:No fluff\.|Simple\. Clear\.|Stop guessing\.)/i],
  ['consultant noun', /\b(?:leverage|synergies|holistic|best-in-class|ecosystems?|streamline)\b/i],
  ['closing summary', /\bIn (?:conclusion|summary)\b/i],
  ['soft hedge', /\b(?:perhaps|possibly|somewhat|it seems like|one could argue)\b/i],
]

const SKIP_FILES = new Set(['roast-voice.md'])

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (e.endsWith('.md') && !SKIP_FILES.has(e)) out.push(full)
  }
  return out
}

export function scan(root, dirs = ['scope-roast', 'evals/out']) {
  const hits = []
  for (const d of dirs) {
    let files
    try { files = walk(join(root, d)) } catch { continue }
    for (const f of files) {
      const lines = readFileSync(f, 'utf8').split('\n')
      lines.forEach((line, i) => {
        for (const [name, re] of PATTERNS) {
          if (re.test(line)) hits.push(`${relative(root, f)}:${i + 1} [${name}] ${line.trim().slice(0, 90)}`)
        }
      })
    }
  }
  return hits
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const hits = scan(process.argv[2] || '.')
  if (!hits.length) { console.log('ai-tells: clean'); process.exit(0) }
  for (const h of hits) console.error(h)
  console.error(`\nai-tells: ${hits.length} hit(s)`)
  process.exit(1)
}
