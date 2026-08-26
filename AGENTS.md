# scope-roast, operating manual

A Claude Code skill. It reads whatever venture material is in the founder's project,
scores the scope out of 100 across six dimensions, and writes a Markdown report with
three burns and a ranked list of what to write first. There is no app and no API.

## Layout

```
scope-roast/            the skill itself, symlinked into a project's .claude/skills
  SKILL.md              frontmatter plus the workflow Claude follows
  bin/                  roast, score.mjs, render.mjs
  rubric/               scope-rubric.json, the twelve scoring fields
  reference/            scoring.md, roast-voice.md, report-spec.md, what-to-give-it.md
  templates/            report.html
  fixtures/             sample scopes with expected scores, used by the tests
install                 symlinks every SKILL.md folder into a target project
scripts/                validate.mjs, ai-tells.mjs
tests/                  node:test, no dependencies
```

## Rules that bite

**No em-dashes or en-dashes in anything a user reads.** `scripts/validate.mjs` walks every
`.md`, `.json`, `.html` and `.css` outside `tests/` and fails on a single one. Use a comma,
a colon, or two sentences.

**No AI writing tells in the skill's own copy.** `scripts/ai-tells.mjs` scans `scope-roast/`
for nine patterns: correlatives, empty setups, fake reveals, era openers, stacked
transitions, staccato drama, consultant nouns, closing summaries and soft hedges. Read
`reference/roast-voice.md` before writing any copy the founder will see. That one file is
exempt from the scan, because it quotes the patterns it bans.

**The rubric and the engine must agree.** `tests/validate.test.mjs` checks that the rubric
covers exactly the twelve scoring fields and exactly the quality flags the engine knows.
Adding a field to one without the other fails the suite.

## Before you push

```bash
npm test           # 112 tests
npm run validate   # copy rule plus structural invariants
```

CI runs both. Neither needs an install: the tool has zero dependencies and the tests run on
`node:test`. If either ever needs `npm ci`, the tool has stopped being clone-and-run.

## Changing the score

`reference/scoring.md` is the contract. The fixtures in `scope-roast/fixtures/` pin expected
scores for a sparse, a weak and two strong documents. Change the weighting and those move,
which is the point: the fixtures are how you see what a tuning actually did.
