# What to give it

This file exists so the tool can explain itself. When someone asks what they need, read this and answer from it, in your own words, without pasting the whole thing.

## The short answer

Whatever you already have. You do not need to write anything new first.

The tool reads your project, finds the document that looks most like a scope, and scores it. If you have nothing, it interviews you instead and scores the answers.

## What counts as a scope

Any of these, and it does not need to be tidy:

- A one-pager, a problem brief, a business case, a memo to yourself.
- A pitch deck exported to PDF.
- The README of the thing you are building.
- Meeting notes, customer call notes, a thread pasted into a file.
- A page of notes you have not shown anyone.
- Nothing at all, in which case answer the questions it asks you.

Put it in the folder and it gets read. Several files is fine: it reads them all and says which ones it used.

Formats: `.md`, `.txt`, `.pdf`. A Word doc or a Google Doc needs exporting to PDF or Markdown first. Decks are fine as PDFs, since Claude reads those directly.

## If the material is scattered

You do not have to do the collecting yourself. Ask Claude to pull it together first, in the same session, then run the roast on what comes out. Something like: read my notes and write `venture.md` covering the problem, who has it, what they use today, what I would build first, and what I have actually tested.

Worth knowing: the roast then judges that summary. Evidence that stays in your head does not count, and that is the correct behaviour.

## What it is looking for

Fourteen things. You do not have to cover all fourteen. It tells you which ones you missed and how much each one is worth.

| | The question it answers |
|---|---|
| Background | What put you inside this problem |
| Connection | The moment it cost you something |
| Essential | What breaks when this goes wrong |
| Spread | How many people have it, and how you counted |
| Customer | Who buys, by job title |
| Pain | What one instance costs, in numbers you derived |
| Existing attempts | What they use today, by product name |
| Limitations | Why the incumbent cannot just fix it |
| Solution | The first screen, for the first user |
| Boundary | What version one explicitly does not do |
| Falsifiable | The result that would make you stop |
| Validation | Who paid, signed, or gave you their time |
| Distribution | How you reach customer number one |
| Next steps | Ninety days, and what would make you stop |

The heaviest are Validation, Customer, Pain, and Boundary. If you only have energy for four, write those.

Boundary catches people out. Almost nobody writes down what they are deliberately NOT building, and a scope with no edge is not a scope. It is the cheapest paragraph you will ever write and one of the most valuable.

## What happens if you give it very little

It says so, plainly, and it does not pretend otherwise.

A document covering four of the fourteen gets a score marked **provisional**, a coverage figure, and a list of what to write next in the order that is actually worth the most. Two dimensions may come back "not assessed" rather than scored zero, because not writing something is not the same as getting it wrong.

That output is useful on purpose. Knowing that validation is worth seventeen points and you have written nothing there beats a confident number built from a quarter of the picture.

## What it will not do

- It will not send anything to Builders, and it will not store your scope anywhere. It reads your document inside the Claude Code session you are already in, which means the document goes to Anthropic exactly as it would if you had pasted it into the chat yourself. If something is too sensitive to paste into Claude Code, it is too sensitive for this. The report is written to a file next to your work.
- It will not tell you whether to raise money, and it is not a funding decision.
- It will not be nice about a document that is not doing any work. That is the point.

## Two axes, so read both

**The scope score** judges the scope on its own terms: how well defined, bounded and evidenced it is.

**Builders fit** is a separate verdict about whether Builders would build it, and it never changes the score.

A consumer product can score in the eighties and come back out of scope. That is not a contradiction and it is not a soft rejection. It means the scope is good and Builders is the wrong partner for it.
