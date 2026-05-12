import { promises as fs } from 'fs'
import path from 'path'
import type { Metadata } from 'next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BookOpen } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Documentación',
}

export default async function OrgDocsPage() {
  const filePath = path.join(process.cwd(), 'docs', 'USO.md')
  const content = await fs.readFile(filePath, 'utf-8')

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 pb-6 border-b border-border flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Documentación</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Guía completa de uso del sistema. Buscá el tema con Ctrl+F.
          </p>
        </div>
      </div>

      <article className="prose prose-slate dark:prose-invert max-w-none
        prose-headings:scroll-mt-20 prose-headings:font-bold prose-headings:tracking-tight
        prose-h1:hidden
        prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
        prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
        prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-sm
        prose-li:text-muted-foreground prose-li:my-1 prose-li:text-sm
        prose-strong:text-foreground prose-strong:font-semibold
        prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:text-emerald-700 hover:prose-a:underline
        prose-code:text-emerald-700 dark:prose-code:text-emerald-400 prose-code:bg-emerald-50 dark:prose-code:bg-emerald-900/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-lg prose-pre:border prose-pre:border-border prose-pre:text-xs
        prose-table:text-sm prose-th:bg-muted prose-th:text-foreground prose-th:font-semibold prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-td:border-border
        prose-hr:border-border
        prose-blockquote:border-l-emerald-500 prose-blockquote:bg-emerald-50/50 dark:prose-blockquote:bg-emerald-900/20 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </div>
  )
}
