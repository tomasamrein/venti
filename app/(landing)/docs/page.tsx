import { promises as fs } from 'fs'
import path from 'path'
import type { Metadata } from 'next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const metadata: Metadata = {
  title: 'Documentación de uso',
  description: 'Guía completa de uso del sistema Ventix: POS, productos, caja, clientes, facturación ARCA, reportes, modo offline y más.',
}

export default async function DocsPage() {
  const filePath = path.join(process.cwd(), 'docs', 'USO.md')
  const content = await fs.readFile(filePath, 'utf-8')

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="mb-10 pb-8 border-b border-slate-200">
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Documentación</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">Guía de uso de Ventix</h1>
        <p className="mt-3 text-base text-slate-600 max-w-2xl">
          Todo lo que necesitás saber para usar el sistema desde el primer ingreso hasta la operación diaria.
        </p>
      </div>

      <article className="prose prose-slate max-w-none
        prose-headings:scroll-mt-20 prose-headings:font-bold prose-headings:tracking-tight
        prose-h1:hidden
        prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-slate-200
        prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
        prose-p:text-slate-600 prose-p:leading-relaxed
        prose-li:text-slate-600 prose-li:my-1
        prose-strong:text-slate-900 prose-strong:font-semibold
        prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:text-emerald-700 hover:prose-a:underline
        prose-code:text-emerald-700 prose-code:bg-emerald-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:border prose-pre:border-slate-200
        prose-table:text-sm prose-th:bg-slate-50 prose-th:text-slate-700 prose-th:font-semibold prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-td:border-slate-200
        prose-hr:border-slate-200
        prose-blockquote:border-l-emerald-500 prose-blockquote:bg-emerald-50/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>

      <div className="mt-16 pt-8 border-t border-slate-200 text-center">
        <p className="text-sm text-slate-500 mb-4">
          ¿Algo no quedó claro? Escribinos.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <a
            href="mailto:soporte@ventix.ar"
            className="inline-flex items-center h-10 px-5 rounded-lg text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            soporte@ventix.ar
          </a>
          <a
            href="https://wa.me/543585123456"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center h-10 px-5 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
