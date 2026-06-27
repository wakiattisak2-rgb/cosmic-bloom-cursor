import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownView({ children }: { children: string }) {
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-foreground/90">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => (
            <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight" {...p} />
          ),
          h2: (p) => (
            <h2 className="mt-8 font-display text-2xl font-semibold tracking-tight" {...p} />
          ),
          h3: (p) => (
            <h3 className="mt-6 font-display text-xl font-semibold tracking-tight" {...p} />
          ),
          p: (p) => <p className="leading-relaxed" {...p} />,
          a: (p) => (
            <a
              className="text-primary underline underline-offset-4 hover:text-primary/80"
              target="_blank"
              rel="noopener noreferrer"
              {...p}
            />
          ),
          ul: (p) => <ul className="ml-5 list-disc space-y-1" {...p} />,
          ol: (p) => <ol className="ml-5 list-decimal space-y-1" {...p} />,
          blockquote: (p) => (
            <blockquote
              className="border-l-2 border-primary/60 pl-4 italic text-muted-foreground"
              {...p}
            />
          ),
          code: ({ children, ...p }) => (
            <code
              className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[0.9em] text-primary"
              {...p}
            >
              {children}
            </code>
          ),
          pre: (p) => (
            <pre
              className="overflow-x-auto rounded-xl border border-border bg-muted/30 p-4 font-mono text-xs"
              {...p}
            />
          ),
          hr: () => <hr className="border-border" />,
          img: (p) => <img className="rounded-xl" loading="lazy" {...(p as object)} />,
          table: (p) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm" {...p} />
            </div>
          ),
          th: (p) => <th className="border border-border bg-muted/30 px-3 py-2 text-left" {...p} />,
          td: (p) => <td className="border border-border px-3 py-2" {...p} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
