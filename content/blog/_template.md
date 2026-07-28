---
title: Post title goes here
author: Your Name
date: 2026-01-01
excerpt: One or two sentences for the card. Optional — if you omit it, the first paragraph of the body is used instead. Cards truncate at ~150 characters.
tags: Research, Engineering
published: false
---

<!--
  COPY THIS FILE to start a post. `published: false` keeps it off the site, so this
  template never appears on /blog.

  The filename becomes the URL: copying this to `my-post.md` publishes it at
  /blog/my-post. Renaming a file later changes its URL and breaks existing links —
  add a `slug:` field to pin the URL independently of the filename.

  Everything below shows what the renderer supports. Raw HTML (including this
  comment) is stripped, never rendered.
-->

Open with a paragraph that stands on its own — it becomes the card excerpt when
`excerpt:` is omitted.

## A section heading

Body text with **bold**, _italic_, `inline code`, ~~strikethrough~~ and
[a link](https://fintela.io). Markdown headings start at `h2` in the rendered page,
because the post title is already the page's `h1`.

### A subsection

> Blockquotes are styled with a brand accent rule.

- Bulleted lists
- With a second item

1. Numbered lists
2. Also work

- [x] Task lists render as checkboxes
- [ ] Unchecked items too

Fenced code blocks get syntax highlighting for `python`, `ts`/`tsx`, `js`/`jsx`,
`json`, `bash`/`sh` and `http`/`curl`. Anything else renders with minimal
highlighting.

```python
returns = prices.pct_change().dropna()
signal = returns.rolling(20).mean().shift(1)  # shift(1) == no look-ahead
```

Tables use GitHub syntax and scroll horizontally on narrow screens:

| Rebalance | Net Sharpe | Turnover |
|---|---|---|
| Daily | 0.34 | 780% |
| Weekly | 1.12 | 160% |
| Monthly | 1.31 | 38% |

For images, put the file in `landing/public/blog-assets/` and reference it with an
absolute path, so it resolves the same on every route:

```markdown
![Alt text](/blog-assets/my-diagram.png)
```

---

Horizontal rules separate sections. Close with whatever you like.
