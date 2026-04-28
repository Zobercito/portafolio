import { useState } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import ts from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('typescript', ts);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('html', markup);
SyntaxHighlighter.registerLanguage('markup', markup);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('bash', bash);
import remarkGfm from 'remark-gfm';
import { ChatIcons } from './ChatIcons';

const CodeBlock = ({ match, children, customProps }: { match: RegExpExecArray; children: React.ReactNode; customProps: any }) => {
  const [copied, setCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, '');

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { }
  };

  return (
    <div className="rounded-md my-3 border border-zinc-700/50 bg-zinc-950 overflow-hidden max-w-full">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800 text-[10px] sm:text-xs text-zinc-400 border-b border-zinc-700/50">
        <span>{match[1].toLowerCase()}</span>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors"
          aria-label="Copiar código"
        >
          {copied ? (
            <span className="text-[10px] sm:text-xs text-zinc-300">Copiado</span>
          ) : (
            <>
              <ChatIcons.Copy className="w-3.5 h-3.5" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto text-[11px] sm:text-[13px] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-700/50 [&::-webkit-scrollbar-thumb]:rounded-full">
        <SyntaxHighlighter
          style={vscDarkPlus as any}
          language={match[1]}
          PreTag="div"
          customStyle={{ margin: 0, padding: '0.75rem', background: 'transparent' }}
          {...customProps}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export const markdownComponents: any = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <CodeBlock match={match} customProps={props}>
        {children}
      </CodeBlock>
    ) : (
      <code className="bg-zinc-700/50 text-zinc-200 px-1.5 py-0.5 rounded text-xs font-mono break-words" {...props}>
        {children}
      </code>
    );
  },
  p: ({ children }: any) => <p className="mb-2 last:mb-0 leading-relaxed text-sm break-words whitespace-pre-wrap">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 mb-2 space-y-1 text-sm">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-sm">{children}</ol>,
  li: ({ children }: any) => <li className="break-words">{children}</li>,
  a: ({ children, href }: any) => <a href={href} className="text-blue-400 hover:text-blue-300 underline underline-offset-2 break-all">{children}</a>,
};

export const markdownPlugins = [remarkGfm];
