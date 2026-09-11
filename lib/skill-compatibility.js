// These commands only wrap upstream executables; this package does not ship
// their runtime or contracts. Keep the sources for attribution, but do not
// advertise them as executable DSH commands.
export const UNAVAILABLE_COMMANDS = Object.freeze({
  'ars-mark-read': 'Requires upstream ars_mark_read.py and Material Passport contracts.',
  'ars-unmark-read': 'Requires upstream ars_mark_read.py and Material Passport contracts.',
  'ars-cache-invalidate': 'Requires the upstream verification cache and ars_cache_invalidate.py.',
});

export const DSH_COMPATIBILITY = `# DeepSeek Harness execution contract

This is the Research Loom DSH port. Apply this compatibility contract before the upstream workflow below.

- Use only tools actually exposed by the current DSH session. Agent role descriptions do not guarantee parallel subagents, PDF/DOCX readers, search, Python, Pandoc, or LaTeX. Check the required capabilities before selecting a mode. Explain a missing capability and offer a supported local-text or manual workflow where that preserves the task's meaning.
- This distribution does NOT ship upstream Python tooling, shared/ schemas, MODE_REGISTRY.md, .claude/ hooks, or deterministic citation/patch/submission gates. References to those resources below describe upstream protocols, not installed or executed checks. Resolve bundled references/agents/templates/examples from this skill's resource directory; do not guess absent resources in the user's paper folder.
- Never run a missing scripts/*.py command, install or clone tooling automatically, recreate an upstream verifier from memory, or claim its checks passed. Merely cloning another repository nearby does not configure it. Script-only commands ars-mark-read, ars-unmark-read and ars-cache-invalidate are unavailable in this release.
- If a requested operation requires an unavailable deterministic gate (including anchored revision patches, passport ledger changes, cache mutations or submission certification), report the dependency as unavailable and stop that operation. A manual source review may be offered, but cannot be labeled as the missing gate's result. Do not silently waive a required integrity gate or fabricate hashes, receipts, reading attestations or verification status.
- Prompt-based research, drafting and review can use the current host's available tools. Preserve the author's materials, create new output versions, distinguish generated judgments from independently checked facts, and describe exactly what was read and verified.

---

`;
