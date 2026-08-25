# scope-roast

Point it at your scope. It reads the thing, scores it out of 100, and tells you what is wrong with it.

From [Builders](https://builders.studio). It runs inside your own Claude Code session.

No API key. No account. Nothing leaves your machine. The judgement happens in the Claude session you already have, the sums happen in small local scripts, and the report is a file on your own disk.

## Install

From anywhere:

```bash
git clone --depth 1 https://github.com/buildersstudio/scope-roast.git ~/.scope-roast
```

Then, from inside the project where you want to use it:

```bash
~/.scope-roast/install
```

Restart Claude Code in that project. Done.

Install into a different project with `~/.scope-roast/install /path/to/project`. Update every project at once with `cd ~/.scope-roast && git pull`, since the install is a symlink, not a copy. Remove with `~/.scope-roast/install --uninstall`.

Requires Node 20 or later, and nothing else.

## Using it

Say this to Claude in your project:

> roast my scope

You do not need to prepare anything. It reads whatever you already have: a one-pager, a pitch deck PDF, a README, a page of notes you have not shown anyone. If you have nothing written, it interviews you and scores the answers.

What comes back:

- **A scope score out of 100**, built from fourteen parts of a scope rolled up into six dimensions: Problem, Customer, Insight, Wedge, Evidence, Founder. The sums are open and deterministic, so the same ratings always give the same score.
- **A real wedge analysis**, not just an evidence check. Evidence asks whether reality has touched your idea. Wedge asks whether there is a bounded thing for reality to touch: where version one starts, what it explicitly does not do, and what result would prove you wrong. Those come apart all the time, so they are scored apart.
- **A process view.** How many of the fourteen parts you have written down, how many are specific enough that someone else could check them, and how many have actually been tested against reality. For most people the drop between those is the real finding, more than the score is.
- **A coverage figure.** If you only wrote four of the fourteen parts, it says so and marks the score provisional, instead of pretending a quarter of the picture is the picture. Not writing something is not the same as getting it wrong, and the tool never confuses the two.
- **A ranked fix list.** Every gap and every weak part, ordered by how much the score would actually rise if you fixed it. Computed, not opined.
- **Three burns.** Each one quotes your own document, names the rule it breaks, and gives you the fix. Sharp on purpose. Never about you, always about the writing.
- **A Builders fit verdict**, separate from the score. A consumer product with a sharp scope scores high and comes back out of scope, because those are two different questions and merging them would be a lie.
- **A Markdown report** written to `scope-roast.md`, which is the deliverable. An HTML version is optional, self-contained, and opens from disk with no network.

You can check every number in it, and the same ratings always give the same score. The opinions are the tool's, and you are welcome to argue with those. Neither is a funding decision. It reads a document and tells you how good it is.

## How it works

The tool is a folder with a `SKILL.md` that Claude Code loads, a rubric it judges against, and a `bin/` of dependency-free Node scripts it shells out to for anything that has to be reproducible. `install` symlinks that folder into your project's `.claude/skills/`. Built so more tools can sit alongside it later.

```bash
npm test          # 105 tests across scoring, rendering, and install
npm run validate  # copy rules, payload shape, and a scan for machine-sounding prose
```

MIT licensed.
