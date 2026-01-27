"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import ReactMarkdown with SSR completely disabled
const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
});

type MarkdownRendererProps = {
  children: string;
  className?: string;
  variant?: "question" | "answer" | "explanation";
};

const MarkdownRenderer = ({
  children,
  className = "",
  variant = "question",
}: MarkdownRendererProps) => {
  const [plugins, setPlugins] = useState<any[]>([]);

  useEffect(() => {
    // Load remarkGfm after mount
    import("remark-gfm").then((mod) => {
      setPlugins([mod.default]);
    });
  }, []);

  const codeComponent = ({
    className: codeClassName,
    children: codeChildren,
    ...props
  }: any) => {
    const match = /language-(\w+)/.exec(codeClassName || "");
    const isInline = !codeClassName || !match;

    if (variant === "answer") {
      return !isInline ? (
        <pre className="block p-2 rounded-md bg-slate-900 border border-slate-700 text-xs overflow-x-auto my-2">
          <code className="text-slate-200 font-mono" {...props}>
            {codeChildren}
          </code>
        </pre>
      ) : (
        <code
          className="px-1 py-0.5 rounded bg-slate-700 text-blue-300 text-xs font-mono"
          {...props}
        >
          {codeChildren}
        </code>
      );
    }

    // Default for question/explanation
    return !isInline ? (
      <pre className="block p-4 rounded-md bg-slate-900 border border-slate-700 text-sm overflow-x-auto my-4">
        <code className="text-slate-200 font-mono" {...props}>
          {codeChildren}
        </code>
      </pre>
    ) : (
      <code
        className="px-1.5 py-0.5 rounded bg-slate-700 text-blue-300 text-sm font-mono"
        {...props}
      >
        {codeChildren}
      </code>
    );
  };

  const commonComponents = {
    code: codeComponent,
    strong: ({ children }: any) => (
      <strong className="font-semibold">{children}</strong>
    ),
  };

  // Show plain text until plugins are loaded
  if (plugins.length === 0) {
    return <div className={className}>{children}</div>;
  }

  if (variant === "answer") {
    return (
      <div className={className}>
        <ReactMarkdown
          remarkPlugins={plugins}
          skipHtml={true}
          components={{
            ...commonComponents,
            p: ({ children }: any) => (
              <span className="inline">{children}</span>
            ),
          }}
        >
          {children}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={plugins}
        skipHtml={true}
        components={{
          ...commonComponents,
          p: ({ children }: any) => (
            <p className="mb-4 last:mb-0">{children}</p>
          ),
          ul: ({ children }: any) => (
            <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>
          ),
          ol: ({ children }: any) => (
            <ol className="list-decimal list-inside mb-4 space-y-2">
              {children}
            </ol>
          ),
          li: ({ children }: any) => <li className="ml-4">{children}</li>,
          h1: ({ children }: any) => (
            <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }: any) => (
            <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }: any) => (
            <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0">
              {children}
            </h3>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
