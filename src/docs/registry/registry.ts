import type { DocBlock, DocCategory, AppContext, RenderMode } from './types';

export class DocRegistry {
  private readonly _blocks = new Map<string, DocBlock>();

  register(block: DocBlock): this {
    if (import.meta.env.DEV && this._blocks.has(block.meta.id)) {
      console.warn(`[DocRegistry] Block "${block.meta.id}" already registered — overwriting.`);
    }
    this._blocks.set(block.meta.id, block);
    return this;
  }

  getBlock(id: string): DocBlock | undefined {
    return this._blocks.get(id);
  }

  getAll(): DocBlock[] {
    return Array.from(this._blocks.values());
  }

  getByCategory(category: DocCategory): DocBlock[] {
    return this.getAll().filter((b) => b.meta.category === category);
  }

  getByAppContext(context: AppContext): DocBlock[] {
    return this.getAll().filter((b) => b.meta.appContexts.includes(context));
  }

  getByTags(tags: string[]): DocBlock[] {
    return this.getAll().filter((b) =>
      tags.some((t) => b.meta.tags.includes(t)),
    );
  }

  getRelated(id: string): DocBlock[] {
    const block = this.getBlock(id);
    if (!block) return [];
    return block.meta.relatedBlocks
      .map((rid) => this.getBlock(rid))
      .filter((b): b is DocBlock => b !== undefined);
  }

  /** Full-text search across title, summary, tags, and keywords. */
  search(query: string): DocBlock[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getAll();

    return this.getAll()
      .map((b) => {
        const titleScore = b.meta.title.toLowerCase().includes(q) ? 3 : 0;
        const summaryScore = b.meta.summary.toLowerCase().includes(q) ? 2 : 0;
        const keywordScore = [...b.meta.tags, ...b.meta.keywords].some((k) =>
          k.toLowerCase().includes(q),
        )
          ? 1
          : 0;
        return { block: b, score: titleScore + summaryScore + keywordScore };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ block }) => block);
  }

  /** Convenience: render a block by id without needing to call getBlock first. */
  render(id: string, mode: RenderMode = 'full') {
    return this.getBlock(id)?.render(mode) ?? null;
  }
}

/** Singleton registry — import this everywhere. */
export const docRegistry = new DocRegistry();
