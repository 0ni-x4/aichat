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
import { Plus, Edit, Trash2, Search, Star, Calendar } from "lucide-react"
import { useState, useMemo } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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

type MemoriesManagerProps = {
  projectId: string
  projectName: string
  initialMemories: Memory[]
}

export function MemoriesManager({ projectId, projectName, initialMemories }: MemoriesManagerProps) {
  const [memories, setMemories] = useState<Memory[]>(initialMemories)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null)

  const queryClient = useQueryClient()

  // Filter memories based on search
  const filteredMemories = useMemo(() => {
    if (!searchQuery) return memories
    
    const query = searchQuery.toLowerCase()
    return memories.filter(memory => 
      memory.title.toLowerCase().includes(query) ||
      memory.content.toLowerCase().includes(query) ||
      (memory.summary && memory.summary.toLowerCase().includes(query))
    )
  }, [memories, searchQuery])

  // Create memory mutation
  const createMemoryMutation = useMutation({
    mutationFn: async (data: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch(`/api/projects/${projectId}/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create memory')
      return response.json()
    },
    onSuccess: (newMemory) => {
      setMemories(prev => [newMemory, ...prev])
      setIsCreateDialogOpen(false)
      toast({ title: "Memory created successfully" })
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create memory", 
        status: "error" 
      })
    },
  })

  // Update memory mutation
  const updateMemoryMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Memory> & { id: string }) => {
      const response = await fetch(`/api/projects/${projectId}/memories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update memory')
      return response.json()
    },
    onSuccess: (updatedMemory) => {
      setMemories(prev => prev.map(m => m.id === updatedMemory.id ? updatedMemory : m))
      setEditingMemory(null)
      toast({ title: "Memory updated successfully" })
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update memory", 
        status: "error" 
      })
    },
  })

  // Delete memory mutation
  const deleteMemoryMutation = useMutation({
    mutationFn: async (memoryId: string) => {
      const response = await fetch(`/api/projects/${projectId}/memories/${memoryId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete memory')
      return response.json()
    },
    onSuccess: (_, memoryId) => {
      setMemories(prev => prev.filter(m => m.id !== memoryId))
      toast({ title: "Memory deleted successfully" })
    },
    onError: (error) => {
      toast({ 
        title: "Failed to delete memory", 
        status: "error" 
      })
    },
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getImportanceColor = (importance: number) => {
    if (importance >= 8) return "text-red-500"
    if (importance >= 6) return "text-orange-500"
    if (importance >= 4) return "text-yellow-500"
    return "text-gray-500"
  }

  return (
    <div className="space-y-6">
      {/* Header with search and add button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Memory
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Memory</DialogTitle>
            </DialogHeader>
            <MemoryForm
              onSubmit={(data) => createMemoryMutation.mutate(data)}
              isLoading={createMemoryMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Results summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredMemories.length} of {memories.length} memories
      </div>

      {/* Memories grid */}
      {filteredMemories.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMemories.map((memory) => (
            <MemoryCard 
              key={memory.id}
              memory={memory}
              onEdit={setEditingMemory}
              onDelete={(id) => deleteMemoryMutation.mutate(id)}
              formatDate={formatDate}
              getImportanceColor={getImportanceColor}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {memories.length === 0 ? (
              <>
                <div className="text-lg font-medium">No memories yet</div>
                <p>Start building your project's knowledge base by creating your first memory.</p>
              </>
            ) : (
              <>
                <div className="text-lg font-medium">No memories match your search</div>
                <p>Try adjusting your search query to find memories.</p>
              </>
            )}
          </div>
          {memories.length === 0 && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Memory
            </Button>
          )}
        </div>
      )}

      {/* Edit dialog */}
      {editingMemory && (
        <Dialog open={!!editingMemory} onOpenChange={() => setEditingMemory(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Memory</DialogTitle>
            </DialogHeader>
            <MemoryForm
              initialData={editingMemory}
              onSubmit={(data) => updateMemoryMutation.mutate({ id: editingMemory.id, ...data })}
              isLoading={updateMemoryMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Memory card component
type MemoryCardProps = {
  memory: Memory
  onEdit: (memory: Memory) => void
  onDelete: (id: string) => void
  formatDate: (date: string) => string
  getImportanceColor: (importance: number) => string
}

function MemoryCard({ memory, onEdit, onDelete, formatDate, getImportanceColor }: MemoryCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">{memory.title}</CardTitle>
          <div className="flex items-center gap-1 ml-2">
            <Star className={`h-4 w-4 ${getImportanceColor(memory.importance)}`} />
            <span className="text-sm font-medium">{memory.importance}</span>
          </div>
        </div>
        {memory.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2">{memory.summary}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm line-clamp-3">{memory.content}</p>
        
        {memory.tags && memory.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {memory.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(memory.updatedAt)}
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onEdit(memory)}
            >
              <Edit className="h-4 w-4" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4 text-red-500" />
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
                  <AlertDialogAction
                    onClick={() => onDelete(memory.id)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Memory form component
type MemoryFormProps = {
  initialData?: Memory
  onSubmit: (data: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => void
  isLoading: boolean
}

function MemoryForm({ initialData, onSubmit, isLoading }: MemoryFormProps) {
  const [title, setTitle] = useState(initialData?.title || "")
  const [content, setContent] = useState(initialData?.content || "")
  const [summary, setSummary] = useState(initialData?.summary || "")
  const [tags, setTags] = useState(initialData?.tags?.join(", ") || "")
  const [importance, setImportance] = useState(initialData?.importance?.toString() || "5")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    const tagsArray = tags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    onSubmit({
      title: title.trim(),
      content: content.trim(),
      summary: summary.trim() || null,
      tags: tagsArray.length > 0 ? tagsArray : null,
      importance: parseInt(importance),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter memory title..."
          required
        />
      </div>

      <div>
        <Label htmlFor="summary">Summary (optional)</Label>
        <Input
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Brief summary of the memory..."
        />
      </div>

      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Detailed memory content..."
          rows={4}
          required
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags (optional)</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="tag1, tag2, tag3..."
        />
        <p className="text-xs text-muted-foreground mt-1">
          Separate tags with commas
        </p>
      </div>

      <div>
        <Label htmlFor="importance">Importance (1-10)</Label>
        <Select value={importance} onValueChange={setImportance}>
          <SelectTrigger>
            <SelectValue placeholder="Select importance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 - Critical</SelectItem>
            <SelectItem value="9">9 - Very High</SelectItem>
            <SelectItem value="8">8 - High</SelectItem>
            <SelectItem value="7">7 - Above Average</SelectItem>
            <SelectItem value="6">6 - Moderate</SelectItem>
            <SelectItem value="5">5 - Average</SelectItem>
            <SelectItem value="4">4 - Below Average</SelectItem>
            <SelectItem value="3">3 - Low</SelectItem>
            <SelectItem value="2">2 - Very Low</SelectItem>
            <SelectItem value="1">1 - Minimal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading || !title.trim() || !content.trim()}>
          {isLoading ? "Saving..." : initialData ? "Update Memory" : "Create Memory"}
        </Button>
      </div>
    </form>
  )
} 