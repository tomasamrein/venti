'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Plus, Pencil, Trash2, Tag } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'

interface Props {
  params: Promise<{ orgSlug: string }>
}

interface Category {
  id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  sort_order: number
  _count?: number
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
]

export default function CategoriasPage({ params }: Props) {
  const [orgSlug, setOrgSlug] = useState('')
  const [orgId, setOrgId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Form
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    params.then(p => setOrgSlug(p.orgSlug))
  }, [params])

  const loadData = useCallback(async () => {
    if (!orgSlug) return
    const supabase = createClient()

    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', orgSlug)
      .single()
    if (!org) return

    setOrgId(org.id)

    const { data: cats } = await supabase
      .from('product_categories')
      .select('id, name, description, color, icon, sort_order')
      .eq('organization_id', org.id)
      .order('sort_order')
      .order('name')

    // Get product counts
    const { data: counts } = await supabase
      .from('products')
      .select('category_id')
      .eq('organization_id', org.id)
      .eq('is_active', true)

    const countMap: Record<string, number> = {}
    counts?.forEach(p => {
      if (p.category_id) countMap[p.category_id] = (countMap[p.category_id] || 0) + 1
    })

    setCategories((cats || []).map(c => ({ ...c, _count: countMap[c.id] || 0 })))
    setLoading(false)
  }, [orgSlug])

  useEffect(() => {
    loadData()
  }, [loadData])

  function openNew() {
    setEditCat(null)
    setName('')
    setDescription('')
    setColor(COLORS[0])
    setDialogOpen(true)
  }

  function openEdit(cat: Category) {
    setEditCat(cat)
    setName(cat.name)
    setDescription(cat.description ?? '')
    setColor(cat.color ?? COLORS[0])
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    setSubmitting(true)
    try {
      const supabase = createClient()

      if (editCat) {
        const { error } = await supabase
          .from('product_categories')
          .update({ name: name.trim(), description: description.trim() || null, color })
          .eq('id', editCat.id)
        if (error) throw error
        toast.success('Categoría actualizada')
      } else {
        const { error } = await supabase
          .from('product_categories')
          .insert({
            organization_id: orgId,
            name: name.trim(),
            description: description.trim() || null,
            color,
          })
        if (error) throw error
        toast.success('Categoría creada')
      }

      setDialogOpen(false)
      await loadData()
    } catch (err: any) {
      if (err?.code === '23505') {
        toast.error('Ya existe una categoría con ese nombre')
      } else {
        toast.error('Error al guardar')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('product_categories').delete().eq('id', id)
    if (error) {
      toast.error('Error al eliminar. ¿Tiene productos asignados?')
    } else {
      toast.success('Categoría eliminada')
      setCategories(prev => prev.filter(c => c.id !== id))
    }
    setDeleteId(null)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/${orgSlug}/productos`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Categorías</h1>
          <p className="text-sm text-muted-foreground">{categories.length} categorías</p>
        </div>
        <Button onClick={openNew} size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          Nueva categoría
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Cargando...</div>
      ) : categories.length === 0 ? (
        <Card className="border-dashed border-2 border-border/60">
          <CardContent className="py-16 text-center">
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No hay categorías aún.</p>
            <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700">
              Crear primera categoría
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {categories.map(cat => (
            <Card key={cat.id} className="border-border/60">
              <CardContent className="p-4 flex items-center gap-4">
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ background: cat.color ?? '#94a3b8' }}
                />
                <div className="flex-1">
                  <p className="font-medium">{cat.name}</p>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {cat._count} producto{cat._count !== 1 ? 's' : ''}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => openEdit(cat)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(cat.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editCat ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cat-name" className="mb-2 block">Nombre</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Bebidas, Lácteos..."
                className="rounded-xl"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="cat-desc" className="mb-2 block">Descripción (opcional)</Label>
              <Input
                id="cat-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descripción breve..."
                className="rounded-xl"
              />
            </div>
            <div>
              <Label className="mb-2 block">Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : ''}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                onClick={handleSave}
                disabled={submitting}
              >
                {submitting ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Los productos de esta categoría quedarán sin categoría asignada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
