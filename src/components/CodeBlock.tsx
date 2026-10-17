import React, { useState } from 'react';
import { Copy, Check, FileCode } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language: string;
  filename?: string;
  description?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, filename, description }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl mb-6">
      {/* File Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-mono">
          <FileCode className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold">{filename || 'script'}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 uppercase text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer text-xs font-medium"
          title="Copiar código al portapapeles"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>

      {description && (
        <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/60 text-xs text-slate-400">
          {description}
        </div>
      )}

      {/* Code Area */}
      <div className="p-4 overflow-x-auto text-xs leading-relaxed font-mono text-slate-200 max-h-[550px] overflow-y-auto">
        <pre className="whitespace-pre font-mono">{code}</pre>
      </div>
    </div>
  );
};
