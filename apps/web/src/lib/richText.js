/**
 * Simple richText (Lexical) to plain text extractor.
 * Recursively walks Lexical nodes and concatenates text.
 */
export function richTextToPlainText(richText) {
  if (!richText) return '';
  if (typeof richText === 'string') return richText;

  const root = richText.root;
  if (!root) return '';

  function extractText(node) {
    if (!node) return '';
    if (node.type === 'text') {
      return node.text || '';
    }
    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractText).join('');
    }
    return '';
  }

  return extractText(root).trim();
}
