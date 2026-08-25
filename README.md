# scope-roast

Point it at your venture scope. It reads the thing, scores it out of 100, and tells you what is wrong with it.

From [Builders](https://builders.studio). It runs inside the Claude Code session you already have.

## Install

Grab it once:

```bash
git clone --depth 1 https://github.com/buildersstudio/scope-roast.git ~/.scope-roast
```

Then, from inside the folder where your venture material lives:

```bash
~/.scope-roast/install
```

Restart Claude Code in that folder. That is the whole setup. Node 20 or later, nothing else.

## Run it

Say this to Claude:

> roast my scope

That is enough. It will find your material, tell you which files it is reading, and go.

If you want to point it at something specific:

> roast my scope, use docs/one-pager.md

If you want it to be harsh about one thing in particular:

> roast my scope and be brutal about the evidence

## What you can give it

Anything you already have. Nothing needs writing first, and finding out your document is thin is the most useful thing this does.

Put whatever you have in the folder and let it look:

- A one-pager, a problem brief, a business case, a memo you wrote to yourself
- A pitch deck exported to PDF
- The README of the thing you are building
- Meeting notes, customer call notes, a Slack thread you pasted into a file
- Several of these at once. It reads them all and says which ones it used
- Nothing at all

Formats it reads: `.md`, `.txt`, `.pdf`. For a Word doc or a Google Doc, export it to PDF or Markdown first. Claude reads PDFs directly, so a deck is fine as it comes.

If you have written nothing, say so:

> I have not written anything down yet, interview me

It asks you the questions instead and scores your answers. That takes about ten minutes and it works.

## Or ask Claude to gather the material first

You do not have to do the collecting yourself. Before you roast anything, ask Claude in the same session to pull your venture into one place:

> before we roast anything, read my notes in this folder and write venture.md: the problem, who has it, what they use today, what I would build first, and what I have actually tested

> search the web for who else is solving this and write what you find into competitors.md

> pull the last three customer calls out of my notes and summarise what they actually said into evidence.md

Then run the roast. It reads what you built and scores that. Two steps, better input, better report.

One caution worth stating: a file you assemble this way is a summary, and the roast judges the summary. If the good evidence lives in your head and never makes it onto the page, the score reflects the page. That is the correct behaviour and also the reason the score is worth reading.

## What comes back

A Markdown file, `scope-roast.md`, written next to your work. In it:

- **A score out of 100**, built from fourteen parts of a scope rolled up into six dimensions: Problem, Customer, Insight, Wedge, Evidence, Founder. Open sums, so the same ratings always give the same number.
- **A process view.** How many of the fourteen parts you have written down, how many are specific enough that someone else could check them, and how many you have actually tested against reality. For most people the drop between those three is the real finding.
- **A coverage figure.** Write four of the fourteen parts and it says so and marks the score provisional, instead of pretending a quarter of the picture is the picture. Not writing something is not the same as getting it wrong, and it never confuses the two.
- **A wedge check, separate from evidence.** Evidence asks whether reality has touched your idea. Wedge asks whether there is a bounded thing for reality to touch: where version one starts, what it explicitly does not do, and what result would prove you wrong. Those come apart all the time.
- **A ranked fix list.** Every gap, ordered by how much the score would actually rise if you fixed it. Computed, not opined.
- **Three burns.** Each quotes your own document, names what it breaks, and gives you the fix. Sharp on purpose. Never about you, always about the writing.
- **A Builders fit verdict**, separate from the score. A consumer product with a sharp scope scores high and comes back out of scope, because those are two different questions.

An HTML version is optional. Ask for it and you get a self-contained file that opens from disk.

You can check every number. The opinions are the tool's and you are welcome to argue with them. Neither is a funding decision: it reads a document and tells you how good it is.

## Where your scope goes

No API key, no account, no server of ours. It runs in the Claude Code session you already have, so your scope goes to Anthropic the same way everything else you type into Claude Code does, under whatever terms you already have with them. Nothing is sent to Builders, nothing is stored anywhere, and the report is a file on your own disk.

If a document is too sensitive to paste into Claude Code, it is too sensitive for this. That is the honest version.

## Housekeeping

Install into another folder with `~/.scope-roast/install /path/to/project`. Update everywhere at once with `cd ~/.scope-roast && git pull`, since the install is a symlink and not a copy. Remove with `~/.scope-roast/install --uninstall`.

Under the hood it is a `SKILL.md` Claude Code loads, a rubric it judges against, and a `bin/` of dependency-free Node scripts it shells out to for anything that has to be reproducible.

```bash
npm test          # 105 tests across scoring, rendering, and install
npm run validate  # copy rules, payload shape, and a scan for machine-sounding prose
```

MIT licensed.
