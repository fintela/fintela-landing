---
title: Why momentum works, and why it sometimes stops working
author: Fintela Team
date: 2026-09-03
excerpt: Momentum is one of the most replicated anomalies in finance and one of the hardest to explain cleanly. Two competing behavioral stories both predict it, and the same mechanism that produces the effect is also what makes it crash.
tags: Research
published: true
---


![Alt text](https://i.ibb.co/NdmZ3Zp0/R.png)

Momentum is an unusually well-documented anomaly. Buy the stocks that performed best over the past three to twelve months, sell the ones that performed worst, and the long-short portfolio has produced positive average returns across nearly every market and era it's been tested on since Jegadeesh and Titman first formalized the effect in 1993. What's less settled, even three decades later, is why continuation happens at all, since it isn't the direction an efficient market should move in on its own.

## Two stories that predict the same pattern

The behavioral finance literature offers two explanations, and they're almost opposites in mechanism while producing the same observable effect. The first is underreaction. In this account, investors update on new information too slowly, whether from anchoring on prior beliefs or from simply not processing news immediately, so a stock's price only partially reflects good or bad news the day it arrives. The rest of the adjustment leaks out over the following months as more investors catch up, which looks exactly like continuation. Barberis, Shleifer, and Vishny's 1998 model builds this from investors who treat earnings as more mean-reverting than they actually are, a conservatism bias that delays the market's reaction to real changes.

The second story runs the causality the other way: overreaction. Here investors are overconfident about their own private information and biased by self-attribution, so early price moves get amplified by investors piling into a trend rather than correcting toward fair value. Daniel, Hirshleifer, and Subrahmanyam's 1998 model formalizes this version, where momentum emerges from investors overweighting their own signals and only slowly, and painfully, correcting once the overreaction becomes too large to ignore.

Both models predict the same three-to-twelve month continuation. Where they diverge is in what happens next: underreaction predicts the delayed correction eventually plays out and momentum returns just fade; overreaction predicts a sharper eventual reversal once the mispricing corrects, since bubbles built on overreaction tend to pop rather than deflate. Distinguishing the two empirically has proven difficult, in part because at any point in time, some fraction of the observed momentum in the market plausibly comes from each.

## The simplest version of the measurement

Whatever the underlying cause, momentum is measured the same simple way in practice. Define a stock's momentum signal over a formation window as its cumulative return:

```
momentum(i, t) = (P(i, t) − P(i, t−k)) / P(i, t−k)
```

for a lookback of k months, typically skipping the most recent month to avoid short-term reversal effects that run in the opposite direction. Stocks get ranked on this signal, sorted into deciles, and the strategy goes long the top decile and short the bottom one. The average spread between winners and losers, computed across formation windows, is the momentum premium, and it's this cross-sectional autocorrelation in returns that both behavioral models are trying to explain.

## The mechanism is also the failure mode

The uncomfortable part of momentum is that the same herding dynamic that generates the effect also produces its worst drawdowns. Daniel and Moskowitz documented in 2016 that momentum strategies crash hardest not during ordinary bear markets but during sharp market rebounds following a crash, because the short leg of the strategy is typically stacked with beaten-down, high-beta stocks that snap back violently once sentiment turns. A strategy built to be long-short and market-neutral on paper turns out to carry a very specific, time-varying exposure to exactly the scenario where past losers recover fastest. This is not a data artifact; it shows up across markets and periods, and it means a momentum strategy's realized volatility is far from constant, clustering into calm periods punctuated by sudden, sharp losses concentrated in a small number of months.

## Why this matters for how a strategy gets built

None of this makes momentum uninvestable, but it does mean the naive version, rank and hold, ignores a known source of tail risk that isn't visible in an average return or even a standard Sharpe ratio computed over a full sample. Position sizing that scales down when recent volatility spikes, or that treats the short leg differently during and after a broad market decline, addresses a specific, documented failure mode rather than a generic risk. It's the difference between capturing a real anomaly and being unknowingly short a crash-recovery option that only shows itself once, at the worst possible time.

Sources: Jegadeesh, N. and Titman, S. (1993), Returns to Buying Winners and Selling Losers, Journal of Finance. Barberis, N., Shleifer, A., and Vishny, R. (1998), A Model of Investor Sentiment, Journal of Financial Economics. Daniel, K., Hirshleifer, D., and Subrahmanyam, A. (1998), Investor Psychology and Security Market Under- and Overreactions, Journal of Finance. Daniel, K. and Moskowitz, T. (2016), Momentum Crashes, Journal of Financial Economics.
