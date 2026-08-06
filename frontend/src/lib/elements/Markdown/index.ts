export { CHART_REF_PREFIX, Markdown, type MarkdownProps, slugifyHeading } from './Markdown'
// MarkdownWithMermaid is deliberately not re-exported: this barrel is imported by lib
// components shipped in the toolbar bundle, and the mermaid variant must stay out of that graph.
// Import it from 'lib/elements/Markdown/MarkdownWithMermaid' directly.
