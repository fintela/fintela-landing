---
title: Climate risk against agricultural stocks
author: Fintela Team
date: 2026-07-28
excerpt: We built a strategy that scores agricultural tickers on climate anomalies and price momentum, then checked our results against the academic research it's based on, including the parts of that research that should make us skeptical of our own numbers.
tags: Research
published: true
---

Ten tickers, eight countries, one climate index adapted from an actuarial standard that was originally built to price insurance risk rather than to trade equities. That's the starting point for climate_pok, a strategy we backtested that combines price momentum with a monthly climate anomaly score across a small universe of agriculture-linked stocks.

The headline number depends entirely on which universe you look at. Run it across all ten tickers and the strategy loses 95.9%. Run it across the four tickers whose price data actually holds up and it gains 44.5%. Neither figure means much on its own, and working out why is really the subject of this post.

## Where the idea comes from

We didn't invent the premise that climate anomalies predict agricultural stock returns. That comes from a specific line of academic work: a 2019 paper by Jiang and Weng at the University of Waterloo, *Climate Change Risk and Agriculture-Related Stocks*, and the fuller master's thesis behind it, *Climate Change Risk in Stock Markets*, from 2020. The paper's citable claim is that long-run trends in the Actuaries Climate Index predict agricultural equity returns, and that the market doesn't price this efficiently. The thesis is where the real detail lives, including the lag effects, a comparison of fixed versus dynamic ranking, a breakdown by climate component, and sub-period tests that show exactly when the signal stopped working. That last part turned out to matter more than we expected.

It's worth being upfront that climate_pok is not a replication of the paper, more a strategy built on the same premise with a fairly different design. The paper groups whole geographic regions, twelve of them across the US and Canada, and ranks each one by the long-run trend of its climate index rather than any single month's reading. It runs long-short at zero net cost, rebalancing annually over the full 26 years from 1993 to 2018. Our version trades ten individual tickers across eight countries instead of aggregated regions, uses the standardized anomaly for the prior calendar month rather than a multi-year trend, holds long-only positions with no short leg to fund them, and rebalances monthly over a much shorter window, 2024 through 2026. Each of these changes is defensible on its own, but taken together they mean our results can't really borrow the statistical backing of the original study without some caution.

## How the signal is built

At each monthly rebalance, every ticker gets two scores, each normalized between zero and one against that day's universe, then combined with a fixed weight of sixty percent momentum and forty percent climate:

```
score(i) = 0.6 × momentum_norm(i) + 0.4 × climate_norm(i)
```

Momentum is a straightforward twenty-one trading day rate of change,

```
momentum(i) = (P(i,t) − P(i,t−21)) / P(i,t−21)
```

normalized against the rest of the universe on the same day. The climate score is where the actuarial index comes in. For the calendar month before each rebalance, lagged by a month because climate data reporting takes time to catch up, we compute the standardized anomaly of temperature, precipitation, drought (used as an aridity proxy), and wind, each measured against the historical climatology for that same calendar month:

```
anomaly(i, v) = (x(i,v) − mean(v)) / stdev(v)
```

where `x(i,v)` is ticker `i`'s reading for climate variable `v` that month, and `mean(v)`, `stdev(v)` are the historical mean and standard deviation for that variable in that calendar month. Every ticker carries its own sensitivity profile, a coefficient of −1, 0, or +1 for each variable, so the climate score is a weighted sum of signed anomalies before it gets normalized into the zero-to-one range.

Position selection isn't a fixed top group of names. It's a z-score cut: we standardize each day's combined scores against that day's mean and spread,

```
z(i) = (score(i) − mean(score)) / stdev(score)
```

then keep anything with z(i) ≥ 0.75, with a floor of two positions and a ceiling on how many we'll ever hold at once. That follows the paper's logic of ranking relative outliers rather than using a fixed threshold, though our version does it with a per-day z-score rather than fixed terciles computed over the whole sample period.

## A map of sensitivities, not a list of tickers

Every ticker in the universe is tied to a real place where the underlying business operates, and its climate sensitivity signs come directly from that. The clearest illustration is the hemisphere split: the two Southern Hemisphere names, Argentina's BIOX and Brazil's LVRO, have their temperature signs inverted relative to the Northern Hemisphere names, since a warm January in Rosario is a summer month rather than a winter one. Among the tickers that survived into the final backtest, UAN, a nitrogen fertilizer producer out of Coffeyville, Kansas, responds positively to warmth and rain and negatively to drought. IPI, a solar-evaporation potash producer in Carlsbad, New Mexico, is the one exception with inverted rain and drought signs, since drought actually speeds up evaporation in its ponds. MOS in Florida and SMG in Ohio both follow the more typical pattern of benefiting from warmth and rain and suffering under drought.

## The universe wasn't actually tradeable

Before we even got to evaluating the strategy, we ran into a more basic problem: six of the original ten tickers don't have reliable price data over the backtest period. We detected seventy-three single-day price jumps greater than thirty percent, concentrated in five names that collapsed to penny or sub-penny levels at some point during 2025 and 2026. At that price range, a small trade can move the quoted price anywhere from fifty to nine hundred percent purely from microstructure illiquidity, nothing to do with the strategy's actual signal. A sixth ticker simply had no data available at all, likely wrong or delisted. Run the backtest on the full ten-ticker universe and you get minus 95.9 percent, a number dominated entirely by noise rather than by anything the strategy is meant to capture.

## What the filtered backtest actually shows

Restricting to the four tickers with reliable data, none of which had a daily move over fifteen percent, produces a result that's at least evaluable on its own terms: a total return of plus 44.5 percent, a maximum drawdown of minus 29.1 percent, over a two year window with zero large single-day jumps. The equity curve runs from July 2024 to July 2026, climbing from 1.0 to roughly 1.445, with most of the gain built through 2025 and into early 2026, punctuated by a sharp drawdown around April 2026.

## What the source research actually found, and why it changes how to read our number

Reading the full thesis rather than just the paper's abstract changes the frame around our own result in a few concrete ways. The first is that the original signal didn't just weaken over time, it went negative. The thesis's sub-period tests show the strategy returning a significant plus 0.50 percent per month between 1993 and 2014, then flipping to minus 1.13 percent per month between 2015 and 2018, a collapse concentrated in a short window in 2017 that coincides with the Paris Agreement and the announced US withdrawal from it. The author is careful not to claim causation from the data available, but the implication for us is unavoidable: our backtest runs from 2024 to 2026, nearly a decade after the thesis documented the signal going quiet. A positive result in our window can't lean on the original signal's validity without some independent evidence that it's actually come back.

The second finding is about which climate variable actually does the predicting, and it cuts against how we built the strategy. The thesis's component-level breakdown finds wind to be the single strongest predictor, drought reasonably useful, and temperature essentially non-predictive, since the market appears to price temperature correctly without delay. Our formula weights temperature equally alongside rain, drought, and wind, which raises the possibility that we're diluting the strongest available signal by averaging it in equally with the weakest one.

The third finding is more reassuring. The thesis compares a risk ranking fixed from 1992 and held constant for twenty-six years against updating it annually, and finds the two approaches produce similar results, because the relative order between regions turns out to be fairly stable over time. That offers some indirect support for our dynamic, per-rebalance selection, though it's not a direct comparison, since the thesis compares fixed versus dynamic at the region and year level while we select dynamically at the ticker level every month.

## Limitations worth sitting with before trusting this number

A two year window is short next to the paper's twenty-six years, not really enough to separate signal from noise with any statistical confidence, so this is one data point rather than a proof of anything. The surviving universe is small and geographically concentrated, four tickers, all based in the US, which means we lost all the geographic diversification across hemispheres and continents that was part of the strategy's original design. We also tested during what the source material itself calls the post-signal era, the period after the thesis documents the climate predictability effect fading and reversing. Our component weighting isn't empirically validated against the thesis's own findings about wind mattering more than temperature. This version is long-only rather than long-short at zero cost, so it carries the sector's general directional risk on top of whatever relative climate risk it's meant to capture. And the reference climatology we used spans ten years rather than the thirty year window the World Meteorological Organization recommends, a shortcut for computation time that reduces the statistical robustness of every anomaly we calculate.

Plus 44.5 percent is a real number from a real backtest, but it only holds up once you strip out six of ten tickers for data quality reasons, run it over a window the source research itself suggests is a weak period for the underlying signal, and weight the climate components in a way the evidence says isn't optimal. None of that means the strategy is wrong. It means this is a first pass rather than a conclusion. The more useful next step isn't a longer backtest on the same universe, it's fixing the weighting scheme against what the thesis actually found, and being honest that a two year sample on four correlated agricultural names won't settle the question either way.

Sources: Jiang, R. and Weng, C. (2019), Climate Change Risk and Agriculture-Related Stocks, SSRN. Jiang, R. (2020), Climate Change Risk in Stock Markets, master's thesis, University of Waterloo.
