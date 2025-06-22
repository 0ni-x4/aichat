"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Search, Star, Calendar, BrainIcon } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/components/ui/toast"

type Memory = {
  id: string
  title: string
  content: string
  summary?: string | null
  tags?: string[] | null
  importance: number
  createdAt: string
  updatedAt: string
}

export function MemoriesManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainIcon className="h-5 w-5" />
          General Memories
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage your personal memories that aren't tied to any specific project.
        </p>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          General memories management coming soon...
        </div>
      </CardContent>
    </Card>
  )
}

// Memory card component
type MemoryCardProps = {
  memory: Memory
  onEdit: (memory: Memory) => void
  onDelete: (id: string) => void
  formatDate: (dateString: string) => string
  getImportanceColor: (importance: number) => string
}

function MemoryCard({ memory, onEdit, onDelete, formatDate, getImportanceColor }: MemoryCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium truncate">{memory.title}</h3>
            <div className="flex items-center gap-1">
              <Star className={`h-3 w-3 ${getImportanceColor(memory.importance)}`} />
              <span className="text-xs text-muted-foreground">{memory.importance}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {memory.summary || memory.content}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(memory.updatedAt)}</span>
            {memory.tags && memory.tags.length > 0 && (
              <div className="flex gap-1 ml-2">
                {memory.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {memory.tags.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{memory.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(memory)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Memory</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{memory.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(memory.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}

// Memory form component
type MemoryFormProps = {
  initialData?: Memory
  onSubmit: (data: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => void
  isLoading: boolean
}

function MemoryForm({ initialData, onSubmit, isLoading }: MemoryFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    summary: initialData?.summary || '',
    importance: initialData?.importance || 5,
    tags: initialData?.tags || [],
  })

  const [tagInput, setTagInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) return
    
    onSubmit({
      title: formData.title.trim(),
      content: formData.content.trim(),
      summary: formData.summary.trim() || null,
      importance: formData.importance,
      tags: formData.tags.length > 0 ? formData.tags : null,
    })
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter memory title..."
          required
        />
      </div>

      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Enter memory content..."
          className="min-h-32"
          required
        />
      </div>

      <div>
        <Label htmlFor="summary">Summary (optional)</Label>
        <Input
          id="summary"
          value={formData.summary}
          onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
          placeholder="Brief summary..."
        />
      </div>

      <div>
        <Label htmlFor="importance">Importance (1-10)</Label>
        <Select
          value={formData.importance.toString()}
          onValueChange={(value) => setFormData(prev => ({ ...prev, importance: parseInt(value) }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[...Array(10)].map((_, i) => (
              <SelectItem key={i + 1} value={(i + 1).toString()}>
                {i + 1} {i + 1 >= 8 ? '(High)' : i + 1 >= 6 ? '(Medium)' : '(Low)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Tags</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add a tag..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
            }}
          />
          <Button type="button" onClick={addTag} variant="outline">
            Add
          </Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:bg-destructive/20 rounded-full"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Memory' : 'Create Memory'}
        </Button>
      </div>
    </form>
  )
} 