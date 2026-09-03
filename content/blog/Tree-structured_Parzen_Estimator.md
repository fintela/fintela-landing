---
title: How the Tree-structured Parzen Estimator actually searches
author: Fintela Team
date: 2026-09-03
excerpt: TPE is the default optimizer behind most of Fintela's studies. Here's the math it actually runs, and why splitting parameters into "good" and "bad" densities turns out to be a shortcut for something much more familiar.
tags: Engineering
published: true
---

![Alt text](https://tse1.mm.bing.net/th/id/OIP.Oq0IXk59gNDahqAYp7lciAHaDr?r=0&rs=1&pid=ImgDetMain&o=7&rm=3)



Most people who run a study never open the optimization engine panel, and when they do, TPE is usually already selected, quietly doing the work. It's worth actually looking at what it's doing, because the math underneath is simpler than the name suggests, and it explains a few things about why it behaves the way it does.

## The problem it's solving

Say you're searching over a set of parameters, a lookback window, a rebalance threshold, a weighting coefficient, and each combination produces some objective value once you run the backtest. Evaluating that objective is expensive, so you can't grid search everything. The standard approach is Bayesian optimization: build a cheap surrogate model of how the objective behaves across the parameter space, then use that surrogate to decide where to try next. Most versions of this build a model of the objective directly, predicting a distribution over outcomes for any given point. TPE does something different, and that difference is the whole trick.

## Two densities instead of one model

Instead of modeling the objective as a function of the parameters, TPE flips the relationship around. It picks a threshold, some quantile of the results seen so far, call it y*, and splits every trial into two groups: the ones that scored better than y* and the ones that didn't. Then it fits a density to each group separately over the parameter space:

```
l(x) = density of parameters, given the result was better than y*
g(x) = density of parameters, given the result was worse than y*
```

l is built from the good trials, g from the bad ones. Both are estimated with the same technique the name refers to, a Parzen estimator, which is just a sum of small kernels (usually simple triangular or Gaussian bumps) placed at each observed point, smoothed into a continuous density. The "tree-structured" part comes from how the parameter space is organized when parameters depend on each other, so a choice made for one parameter can change what values are even valid for the next.

## Why the ratio is the whole idea

Once you have l and g, TPE picks the next point to try by maximizing the ratio between them:

```
next_x = argmax over x of  l(x) / g(x)
```

That's a point that looks like the good trials and doesn't look like the bad ones. What makes this worth doing instead of the more common approach is a result that isn't obvious on first look: maximizing this ratio is mathematically equivalent to maximizing Expected Improvement, the standard acquisition function used in Bayesian optimization, the quantity that asks "how much better than my current best result do I expect this point to be." The derivation runs through the definition of expected improvement over the threshold y*, and after substituting in the mixture of l and g, the expression reduces to:

```
EI(x)  ∝  ( γ + (1 − γ) · g(x)/l(x) )⁻¹
```

where γ is the quantile used to split good from bad. Since γ is fixed, this expression gets larger exactly when g(x)/l(x) gets smaller, which is exactly when l(x)/g(x) gets larger. So the simple, cheap thing TPE actually computes, a ratio of two densities, turns out to be a stand-in for the harder thing everyone actually wants, expected improvement, without ever needing to model the objective's uncertainty directly.

## What this explains in practice

This is also why TPE tends to be forgiving with awkward search spaces, conditional parameters, mixed discrete and continuous values, parameters that only matter when another one is set a certain way. Since it's just fitting two densities over whatever points it has, rather than one continuous surrogate over the whole space, it doesn't struggle the way a smooth regression model can when the space has that kind of structure. It's also why it needs a reasonable number of trials before it gets useful: with very few points, both l and g are built from almost nothing, and the ratio between two nearly empty densities isn't telling you much yet.
