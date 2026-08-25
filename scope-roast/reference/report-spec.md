# Report spec

The primary output is **Markdown**, written to `scope-roast.md` in the working directory. That is the deliverable. An HTML render is optional and secondary.

Everything numeric comes from the object `bin/roast score` printed. Do not restate it in prose and never recompute it.

Never call it arithmetic. Nobody says that word out loud. It is the maths, or the sums, or just the numbers.

## Two documents in one file

This is the thing that decides whether the report reads like a person or like a form.

A roast is a letter with a receipt stapled to it. The letter is your read of their document, and it has to flow: an argument, in your voice, uninterrupted. The receipt is the sums, the scale, the weights, the tables, and it is allowed to look like reference material because that is what it is.

Keep them apart. The letter comes first and carries no tables at all. Then a horizontal rule, then `# The numbers`, and everything countable lives below it.

The old failure mode was alternating prose, table, prose, table down the whole file. Half the document was reference material sitting in the middle of the argument, and nobody writes to another person that way. If a founder has to step over a legend to get to your next sentence, you have built a form.

## Length

The letter runs 500 to 700 words. Hard ceiling 800. The numbers section is as long as it needs to be, because nobody reads it end to end, they look things up in it.

A roast nobody finishes is a roast nobody acts on. If the letter is over, cut adjectives and cut the third burn before you cut a quote or a fix.

## The shape

```markdown
# [Name]: Scope Roast

**[total] out of 100.** [score scale label].

[The source line, as a sentence. What you read, how many of the 14 parts were
written, and therefore how much the score is worth. Two or three lines. This is
also where you say you read a document and not a company.]

## The short version
[3 to 5 sentences. The whole argument, before you earn it. Strongest thing,
weakest thing, and the sentence that connects them.]

## [A header that names the actual problem]
> [verbatim quote, or `Nothing in the document.`]
[the burn, then what it costs them downstream]
**Write this:** [one concrete sentence they could paste in]

[repeat, up to 3 burns, each with its own real header]

## What is genuinely good here
**[Thing].** [one or two sentences]
**[Thing].** [one or two sentences]

## How far this has actually been taken
[the three steps in prose, then the biggest-drop line]

## Would Builders build it
[the verdict and its reasons, in a sentence or two. Not a bulleted form.]

---

# The numbers

[one line: everything above is judgement you can argue with, everything below
is sums you can check]

## What to fix, in order
[the ranked table, top 5, then the line about what is cheapest]

## How the [total] was built
[dimension table: score, weight, worth, note]

## The rating scale
## The weights
## Coverage and the score scale
```

## Titles and headers

**The title says what the document is.** `[Name]: Scope Roast`. Not a clever line, not a verdict, not "read hard" or "the honest version". A founder will have this file open next to nine others and the title is how they find it. Save the writing for the first paragraph.

**Every burn header names the actual finding**, in the founder's own terms. "Everyone is not a customer." "There is no ninety days anywhere in fifty pages." "Your own tool would flag your boldest sentence." Somebody reading only the headers should know what you think.

Never number the burns and never use the field key as a header. `### 01 · icp` is a database talking. The header is a sentence, or a fragment of one, and it is about their document rather than about the rubric.

## Let length follow what matters

Uniform sections are the loudest tell that a template is being filled. When every heading gets the same forty words, the reader feels boxes rather than an argument.

Spend the words where the problem is. If the customer section is the whole story, give it three paragraphs. If Builders fit is a formality, give it one sentence and move on. A one-sentence section next to a four-paragraph one reads as a person deciding what matters, which is exactly what you are doing.

## Section rules

**The headline number** is `scope.total`. The label beside it is `scope.band.label` in the scored object, and in the report it is called the score scale, never a band. The word band does not appear in anything a founder reads. Under it goes the shortest true caveat: a cap if one fired, otherwise the coverage line if confidence is not firm, otherwise nothing.

**The source line** sits under the headline, and it is prose rather than a pair of labelled fields. Name every file you actually read, by path, so nobody has to guess what the score was built from. Say how many of the fourteen parts were written and what that does to the score's weight. Say that you read a document and not a company. Three lines at most, and never claim a source you did not open. If you interviewed them, that is the source: say so.

This replaces the old separate "Before we start" section. Two paragraphs of throat-clearing before the argument starts is two paragraphs a founder skips.

**The short version** is the whole argument in three to five sentences, delivered before you have earned it. Strongest thing, weakest thing, and the sentence that connects them. Somebody who reads only this section should be able to repeat your view accurately. The rest of the letter is you proving it.

**How far this has actually been taken** is the process view, and for most founders it lands harder than the score. It carries the counts, so nothing above it should have. It comes straight from `development` in the scored object.

Never render this as a bare table. Fragment labels in table cells ("A scope has", "Reality has touched") mean nothing on their own, and this section fails completely when a row does not explain itself. Write it as three steps, because after the blank page a scope is built in exactly three moves, and say each one as a full plain sentence with its count:

```markdown
Every part of a scope goes through the same three steps. First you write it down. Then you make it specific enough that someone else could check it. Then you go and find out if it is true.

- **Written down:** [written] of the 14 parts
- **Checkable:** [specific] of those [written], meaning someone else could go and verify what you wrote
- **Tested:** [tested] of those [specific], meaning reality has already answered
```

The three lines nest, and the wording has to make the nesting obvious: each count is drawn from the line above it, not from 14. Checkable means rated 4 or 5. Tested means rated 5.

Then one or two sentences naming the biggest drop, which is almost always written to checkable. `development.assertedFields` is that gap: parts they wrote and never made checkable. Say the number, name two or three of the parts in plain words, and say what the gap means. Do not moralise about it.

**The burns** are up to three, from the top of `opportunities`, and each one is its own section with its own real header. Fewer is correct when the document is too thin to support three. Each is quote, burn, then the fix. The quote is verbatim, and when the part is unwritten the quote line is `Nothing in the document.` and the burn is about the absence.

Say what it costs them downstream, in their document rather than in the abstract. A buyer nobody named is why distribution has nothing to attach to. That connection is the difference between a note and a finding.

The fix line is labelled **Write this:**, never "Fix" and never anything with "should" in it. You are handing them a sentence, not marking their work.

**What is actually working** is exactly two, and as specific as the burns. If the document is genuinely bad the strengths get smaller, never vaguer.

**Would Builders build it** closes the letter, plainly, in a sentence or two of prose. Say the verdict and the reasons that carried it. A bulleted list here turns the last thing they read into a form. Do not append a line about it being a separate axis or not moving the score: the heading already says that, and repeating it reads like a machine covering itself.

Everything below this point is `# The numbers`, and it opens with one line drawing the distinction: what is above is judgement they can argue with, what is below is sums they can check.

**What to fix, in order** is `opportunities` top five as a table. Column headings are `Part`, `Now` and `Score if you fix it`. Never write "points back": nobody knows what that means. Each cell in the last column is where the total lands if that one part went to 5 out of 5 and nothing else moved, and one line under the table says exactly that. Then name what is cheapest. A part that is merely unwritten costs a paragraph and no new information, and saying so is the most actionable sentence in the report.

**How the total was built** is the dimension table with four columns: `Dimension`, `Score` (0-100), `Weight` (its share of the 100), `Worth` (score x weight / 100, so the column visibly adds to the total) and a short note. Mark partials with `*` and explain the star once. Then one sentence on how the total came out, including which dimensions dropped out.

**The legend** is the last thing in the file. It is reference, not prose, so keep it to tables and short lines. Four parts:

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
