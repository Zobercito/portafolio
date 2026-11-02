import ReactMarkdown from 'react-markdown';
import { markdownComponents, markdownPlugins } from './ChatMarkdown';

/**
 * Se carga con `import()` desde ChatMessage: `react-markdown` más el
 * resaltador de Prism pesan más que todo el resto del MiniChat junto, y sólo
 * hacen falta cuando ya hay una respuesta que renderizar.
 */
export default function ChatMarkdownBody({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={markdownPlugins} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
}
