# Report spec

The primary output is **Markdown**, written to `scope-roast.md` in the working directory. That is the deliverable. An HTML render is optional and secondary.

Everything numeric comes from the object `bin/roast score` printed. Do not restate it in prose and never recompute it.

Never call it arithmetic. Nobody says that word out loud. It is the maths, or the sums, or just the numbers.

## Length

**Aim for 650 to 800 words of prose, not counting the tables and the legend.** Hard ceiling 900. A roast nobody finishes is a roast nobody acts on. If you are over, cut adjectives and cut the third burn before you cut a quote or a fix.

## The shape

```markdown
# Roast: [name]

**[total] / 100. [score scale label].**
[one line: the sharpest true thing about the document. Not a restatement of the number.]

**Read:** [every file you scored, by path]
**Written:** [n] of 14 parts ([confidence], in plain words)

## Before we start
[2 to 3 sentences. See below.]

## How far you have taken this
[the three steps as full sentences with counts, then the biggest-drop line]

## What decides this
[2 short paragraphs. The single thing that moves this score.]

## Where it falls over
### 01 · [Field]
> [verbatim quote, or `Nothing in the document.`]
[the burn: 2 to 3 sentences, why it costs them]
**Fix:** [one concrete sentence they could paste in]
[repeat, up to 3]

## What is actually working
**[Thing].** [one sentence]
**[Thing].** [one sentence]

## Write these first
[the ranked table, top 5, straight from `opportunities`]
[one line naming the cheapest win]

## Would Builders build it
**[Fit status].** [the reasons as bullets, 3 or 4]

## The maths
[dimension table: score, weight, what it is worth, note]
[one line on how the total came out]

## How to read this
[the 0-5 scale, the six weights, what coverage means, the score scale]
```

## Section rules

**The headline number** is `scope.total`. The label beside it is `scope.band.label` in the scored object, and in the report it is called the score scale, never a band. The word band does not appear in anything a founder reads. Under it goes the shortest true caveat: a cap if one fired, otherwise the coverage line if confidence is not firm, otherwise nothing.

**Read / Coverage** is the source line, and it goes directly under the headline. Name every file you actually read, by path, so nobody has to guess what the score was built from. If you interviewed them instead of reading a file, say so: `Read: your answers to 14 questions, this session.` Never claim a source you did not open.

**Before we start** is the disarming paragraph and it earns everything after it. Say three things and nothing else: you read the document and not the company; they can check every number in it; how many fields were missing and that silence was not scored as failure. Keep it under 80 words. It is not an apology, and it is not a preamble about what a scope is.

**How far you have taken this** is the process view, and for most founders it lands harder than the score. It carries the counts, so nothing above it should have. It comes straight from `development` in the scored object.

Never render this as a bare table. Fragment labels in table cells ("A scope has", "Reality has touched") mean nothing on their own, and this section fails completely when a row does not explain itself. Write it as three steps, because after the blank page a scope is built in exactly three moves, and say each one as a full plain sentence with its count:

```markdown
Every part of a scope goes through the same three steps. First you write it down. Then you make it specific enough that someone else could check it. Then you go and find out if it is true.

- **Written down:** [written] of the 14 parts
- **Checkable:** [specific] of those [written], meaning someone else could go and verify what you wrote
- **Tested:** [tested] of those [specific], meaning reality has already answered
```

The three lines nest, and the wording has to make the nesting obvious: each count is drawn from the line above it, not from 14. Checkable means rated 4 or 5. Tested means rated 5.

Then one or two sentences naming the biggest drop, which is almost always written to checkable. `development.assertedFields` is that gap: parts they wrote and never made checkable. Say the number, name two or three of the parts in plain words, and say what the gap means. Do not moralise about it.

**What decides this** names the single thing. Usually the gap between the strongest and weakest dimension. Two short paragraphs, and the second one is where the knife goes in.

**Where it falls over** takes up to three burns from the top of `opportunities`. Fewer is correct when the document is too thin to support three. Each burn is quote, burn, fix. The quote is verbatim, and when the field is unwritten the quote line is `Nothing in the document.` and the burn is about the absence.

**What is actually working** is exactly two, and as specific as the burns. If the document is genuinely bad the strengths get smaller, never vaguer.

**Write these first** is `opportunities` top five as a table, unedited. Column headings are `Field`, `Now` and `Score if you fix it`. Never write "points back": nobody knows what that means. The number is how much the total would rise if that one field went to 5 out of 5 and nothing else changed. Say that in a line under the table. Then one line naming what is cheapest. A field that is merely unwritten costs a paragraph and no new information, and saying so is the most actionable sentence in the whole report.

**Would Builders build it** is the fit block, plainly. Say the verdict, give the reasons, stop. Do not append a line about it being a separate axis or not moving the score. It has its own heading, which already says that, and repeating it in every section reads like a machine covering itself.

**The maths** is the dimension table with four columns: `Dimension`, `Score` (0-100), `Weight` (its share of the 100), `Worth` (score x weight / 100, so the columns visibly add to the total) and a short note. Mark partials with `*` and explain the star once. Then one sentence on how the total came out, including which dimensions dropped out.

**How to read this** is the legend, and it is the last thing in the file. It is reference, not prose, so keep it to tables and short lines. Four parts:

1. **The scale.** Every field is rated 0 to 5, and every step gets words, not only a range. `0-1` not enough written to judge it. `2` the idea is there, nothing behind it. `3` a real answer with a hole in it. `4` specific, and someone else could go and check it. `5` specific, checked, and reality already touched it. Add a column saying what each step means for acting on it. A field nobody wrote is not rated at all.
2. **The weights.** The six dimensions and their share of the 100, with one line on why each is weighted that way. State plainly that the weights are fixed and identical for every scope this tool reads, so two documents can be compared.
3. **Coverage.** A three row table: under 50% written is insufficient, 50 to 79% is provisional, 80% and up is firm. Each row says what to do with the score, and the row they landed on says so.
4. **The score scale.** All five steps as a table with three columns: the range, what it is called, and the sentence from the scored object saying what it means. Never a bare list of ranges and labels. A reader has to be able to see what the next step up would take.

Copy the weights and the score scale ranges from the scored object. Do not retype them from memory.

## When coverage is not firm

Use `scope.verdict` rather than the score scale sentence. At insufficient coverage it already says the right thing: this is a statement about the document, not about the business. Do not add a second version of that thought in your own words.

A live business with a real product and no written scope is not a weak venture. It is an unread one. Say that once, plainly, and spend the rest of the report on what to write.

## What to leave out

No table of contents. No restating the headline in the intro. No closing paragraph that repeats the burns back. No wrap-up line. No advice about fundraising, hiring or strategy: you read a document, stay there.

## Say it plainly

The roast is written for a founder reading it once, on a phone, slightly annoyed. Every sentence they have to read twice is a sentence you got wrong.

- Never use a word from the tool's own machinery without explaining it in the same line. `anchor`, `basis`, `partial`, `cap`, `flag`, `coverage` and `opportunity` all mean something specific in here and nothing to them.
- Any number that appears in the report has to say where it came from. Not "+9.6" on its own, but "+9.6 on the total if that field went to 5 out of 5."
- Short sentences. One idea each. If a sentence has two commas and a "which", cut it in half.
- No metaphors in the sections that carry numbers. Save them for the burns, where they earn their place.

Every scale in the legend carries wording. A range with a one word label tells a founder nothing. The words are the point.

Never write a tagline. No "Evidence, not vibes", no sign-off slogan, no strapline in a header or footer. Marketing lines belong on a website. This is a report one person reads about their own work, and a slogan in it makes the whole thing sound automated.

## One word for the fourteen things

Call them **parts**, in every sentence a founder reads. Not fields, not dimensions, not attributes. `field` is what the code calls them and it belongs in `scores.json`, not in the report. "Thirteen of the fourteen parts are written down" is a sentence a person says out loud. "13/14 fields assessed" is a sentence a database says.
