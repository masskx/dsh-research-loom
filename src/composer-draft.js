// Replace only a uniquely identifiable, unedited insertion owned by this panel.
// Unknown/edited drafts need an explicit user decision; never append implicitly.
export function prepareComposerDraft(current, next, owned) {
  if (!current.trim()) return { kind: 'fill', draft: next };
  if (owned) {
    const index = current.indexOf(owned);
    if (index >= 0 && current.indexOf(owned, index + 1) < 0) {
      return { kind: 'replace', draft: current.slice(0, index) + next + current.slice(index + owned.length) };
    }
  }
  return { kind: 'confirm' };
}
