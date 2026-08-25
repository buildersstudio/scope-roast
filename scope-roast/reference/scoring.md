# Scoring contract

You judge. `scripts/score.mjs` does the sums. Never compute a total yourself, never invent a score scale step, and never let one axis bleed into the other.

## Two axes

**The scope score** asks how well defined, bounded and evidenced this proposal is, judged on its own terms. It is the number.

**Fit** asks whether Builders would build it. It is a category, not a number, and it never moves the score.

Keep them apart. A consumer product can have an excellent scope and still be out of scope for Builders. Scoring it down because Builders would not build it would be dishonest, and it would make the tool useless to the founder in front of you. The most valuable output this tool produces is sometimes "this is a sharp scope, and it is not for us."

## You are judging a document

This is a scope roast. The subject is the scope: the written definition of the problem, the buyer, and the bounded thing you would build. You are not deciding whether to fund anyone, and you are not predicting an outcome.

So the verdict is always about the writing and the thinking in it. "A reader could not tell what you would build" is in scope for you. "This company will fail" is not.

## What you produce

A file named `scores.json` in the working directory, in exactly this shape:

```json
{
  "fields": {
    "background": { "rating": 3, "basis": "adequate", "evidence": "Six years running ops at a named firm, with the scope of what he owned." },
    "connection": { "rating": 4, "basis": "rich", "evidence": "Describes the March audit that cost them a customer, with the euro figure." },
    "distribution": { "basis": "absent", "evidence": "The source never mentions how they reach a customer." }
  },
  "flags": ["everyone-is-the-icp"],
  "fit": {
    "status": "in-scope",
    "reasons": ["B2B, sold to a named operations role.", "First market is the Netherlands.", "Founder is full time."]
  }
}
```

All fourteen field keys must be present: `background`, `connection`, `essential`, `spread`, `icp`, `pain`, `existingAttempts`, `limitations`, `solution`, `boundary`, `falsifiable`, `validation`, `distribution`, `nextSteps`.

`evidence` is one sentence, in your own words, naming what in the source drove the rating. It is not shown to the user. It exists so a second reader can check your work.

## Basis, and the difference between silence and weakness

This is the rule people get wrong, so it gets its own section.

`basis` says how much source material you had to judge on. It is not a quality judgement.

- **`absent`** The source says nothing about this. Omit `rating` entirely. Including one is an error and the script will throw.
- **`thin`** A passing mention. Enough to judge, barely.
- **`adequate`** A real answer, whatever its quality.
- **`rich`** A developed answer with detail to work through.

**"You did not write this" and "what you wrote is bad" are different findings, and you must not collapse them into each other.**

An `absent` field is not scored. It drops out of its dimension, it costs coverage, and it appears at the top of the list of things to go and write. It does not drag the scope score down, because punishing a founder for a short document tells them nothing useful.

The test for `absent` is the document, not the venture:

- The document never mentions distribution, so you cannot tell whether they have thought about it. That is `absent`.
- The document says "we will figure out distribution later." That is not absent. They answered, and the answer is bad. Rate it 1 with basis `thin`.

An explicit admission counts as an answer. "I do not know who buys this yet" is honest and it is a rating, not a silence. Judge whether the honesty comes with a plan to find out.

## Coverage and confidence

The script computes these. You do not.

Coverage is the share of the scope, by weight, that you were able to assess. A silent `validation` costs far more coverage than a silent `spread`, because validation is the heaviest single field.

- Below 50 percent, confidence is `insufficient`. The score is not worth quoting on its own, and the report leads with what to go and write.
- 50 to 79 percent is `provisional`.
- 80 percent and above is `firm`.

When confidence is not `firm`, `scope.provisional` is true. **Say so in the first sentence you write.** A confident-looking number built from four fields is the most dishonest thing this tool could produce.

## Opportunities

The script also returns `opportunities`: every field that has points left on the table, ranked by how many venture points are actually recoverable. This is computed from the weights, not guessed, so it is the honest answer to "what should I fix first."

Use it. Do not invent your own priority order, and do not tell someone to polish a field worth two points while a thirteen point field sits unwritten.

`flags` is an array, and an empty one is fine. Valid ids only: `validation-theatre`, `platform-speak`, `everyone-is-the-icp`, `no-boundary`, `unfalsifiable`. An invalid id makes the script throw.

`fit.status` is exactly one of `in-scope`, `edge`, `out-of-scope`. `fit.reasons` needs at least one entry, and each reason should cite the thesis line it meets or misses.

## The 0 to 5 scale

Read `rubric/scope-rubric.json` `per_field.<field>.strong` and `.weak` before rating anything. Those two sentences are the anchors.

- **0** Nothing on this field in the source at all.
- **1** Mentioned, but pure assertion. Matches the `weak` description.
- **2** Some specificity, still mostly claim. A reader could not check any of it.
- **3** Concrete and plausible, but unverified. Clearly thought about, not yet provable.
- **4** Concrete and partly evidenced. Names, numbers, or artifacts a stranger could go and check.
- **5** Matches `strong` in full. Named, quantified, first hand, and verifiable.

Two rules that stop rating inflation, and they are the two most important lines in this file:

1. **Fluency is not evidence.** Confident, well written prose with no checkable fact caps at 2. The most common failure mode is scoring a good writer as a good founder.
2. **A number without a derivation is a 2, not a 4.** If the source says the market loses four billion a year and does not say who counted, that is a claim wearing a number's clothes.

## What the script does with your ratings

You do not apply any of this. It lives in `scripts/score.mjs`. It is documented here so you understand the consequences of a rating.

The fourteen fields roll up into six dimensions, and the dimensions are what the report leads with:

| Dimension | Weight | Fields, anchor first |
|---|---|---|
| Problem | 18 | **pain**, essential, spread |
| Customer | 18 | **icp**, distribution |
| Insight | 14 | **existingAttempts**, limitations |
| Wedge | 18 | **boundary**, solution, falsifiable |
| Evidence | 20 | **validation**, nextSteps |
| Founder | 12 | **connection**, background |

The anchor field in each dimension weighs double. Evidence is the heaviest dimension, because it is what most weak ventures are missing and the easiest thing to fake in prose.

Five quality flags cap the scope total: validation theatre at 60, platform speak at 65, everyone is the customer at 65, no stated boundary at 65, nothing could come back false at 70. Lowest cap wins.

A dimension scored while its anchor field is unwritten comes back with `partial: true` and `anchorAssessed: false`. Say so when you report it. Wedge 80 built on `solution` alone, with `boundary` never written, is not a reading you should present like a firm one.

The score scale, and note that all five steps are judgements about the document: 0 to 39 not a scope yet, 40 to 54 a sketch, 55 to 69 defined but unevidenced, 70 to 84 sharp, 85 to 100 airtight.

## Wedge is not evidence

This is the distinction the sixth dimension exists for, and it is the one thing an interview-shaped rubric gets wrong.

**Evidence** asks whether reality has touched the idea: who paid, who signed, what the founder has already run by hand.

**Wedge** asks whether there is a bounded thing for reality to touch. Where does version one start, where does it stop, and what result would prove it wrong.

These come apart constantly, in both directions:

- A founder with three paid pilots for a proposition that is still three companies in a trenchcoat. Evidence high, wedge low. The pilots are real and they are buying three different products.
- A founder with a beautifully drawn wedge, an explicit exclusion list, and a kill criterion, who has spoken to nobody. Wedge high, evidence zero.

Score them independently. Do not let a signed pilot raise `boundary`, and do not let a crisp exclusion list raise `validation`.

Two things carry most of this dimension:

**`boundary`** is what version one explicitly does NOT do. Its absence is the most common failure in a one-pager and the easiest to miss, because nothing is written where the problem is. Look for the absence deliberately. A document that only ever adds capability, with no deferral and no exclusion anywhere, is a 0 or a 1 no matter how good the prose is.

**`falsifiable`** is whether anything could come back false. Activities the founder controls, build the MVP, launch, hire, grow, are not falsifiable. A threshold the market returns is. If there is no result that would make them stop, rate it 1 or below, and check whether `unfalsifiable` should fire.

## Raising a flag

A flag caps the score hard, so a wrong flag is the most damaging mistake you can make. Check the `detect` line in the rubric before raising one.

If you are torn between raising a flag and rating the relevant field low, rate the field low. Flags are for when the structure is wrong, not when the writing is thin.

Note what is not a flag: nothing about which market or category the venture is in. Category is a fit question and belongs on the other axis.

## Deciding fit

Read `rubric/scope-rubric.json` `fit`. Check each thesis line and each out of scope category against the source.

- Any out of scope category matched, or a thesis line missed in a way iteration would not fix, gives `out-of-scope`.
- Most of the thesis met with one genuine open question gives `edge`.
- Everything met, nothing matched, gives `in-scope`.

State reasons plainly and without apology. If you are calling something out of scope, say which line it misses. Do not hedge the fit verdict to soften the scope score, and do not soften the scope score because the fit is bad.
