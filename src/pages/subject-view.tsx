import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  BookOpen, 
  ChevronRight,
  FolderOpen,
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Save,
  ChevronDown,
  Eye,
  FileText,
  Layers
} from "lucide-react";
import { useLocation } from "wouter";
import type { Subject, Topic } from "@shared/schema";

type TopicWithSubTopics = Topic & { subTopics?: Topic[] };

export default function SubjectView() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [parentTopicId, setParentTopicId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", content: "" });
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());

  const { data: subject, isLoading: subjectLoading } = useQuery<Subject>({
    queryKey: ["/api/subjects", id],
  });

  const { data: topics, isLoading: topicsLoading } = useQuery<Topic[]>({
    queryKey: [`/api/subjects/${id}/topics`],
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; content?: string; subjectId: number; parentTopicId?: number | null }) => {
      const res = await apiRequest("POST", "/api/admin/topics", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Topic created successfully!" });
      queryClient.invalidateQueries({ queryKey: [`/api/subjects/${id}/topics`] });
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create topic", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ topicId, data }: { topicId: number; data: Partial<Topic> }) => {
      const res = await apiRequest("PUT", `/api/admin/topics/${topicId}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Topic updated successfully!" });
      queryClient.invalidateQueries({ queryKey: [`/api/subjects/${id}/topics`] });
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update topic", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (topicId: number) => {
      await apiRequest("DELETE", `/api/admin/topics/${topicId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Topic deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: [`/api/subjects/${id}/topics`] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete topic", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingTopic(null);
    setParentTopicId(null);
    setFormData({ name: "", description: "", content: "" });
  };

  const handleAddTopic = (parentId: number | null = null) => {
    setParentTopicId(parentId);
    setEditingTopic(null);
    setFormData({ name: "", description: "", content: "" });
    setIsDialogOpen(true);
  };

  const handleEditTopic = (topic: Topic, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTopic(topic);
    setParentTopicId(topic.parentTopicId || null);
    setFormData({ 
      name: topic.name, 
      description: topic.description || "", 
      content: topic.content || "" 
    });
    setIsDialogOpen(true);
  };

  const handleDeleteTopic = (topicId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate(topicId);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }

    if (editingTopic) {
      updateMutation.mutate({ 
        topicId: editingTopic.id, 
        data: formData 
      });
    } else {
      createMutation.mutate({ 
        ...formData, 
        subjectId: parseInt(id!),
        parentTopicId: parentTopicId
      });
    }
  };

  const toggleExpand = (topicId: number) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  const rootTopics = topics?.filter(t => !t.parentTopicId) || [];
  const getSubTopics = (parentId: number) => topics?.filter(t => t.parentTopicId === parentId) || [];

  if (subjectLoading || topicsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b sticky top-0 z-50 bg-background">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="text-center p-8">
          <CardContent>
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Subject Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested subject could not be found.</p>
            <Button asChild>
              <Link href="/">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild data-testid="button-back">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg hidden sm:inline">PrepMaster</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Dashboard</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">{subject.name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-subject-title">
                {subject.name}
              </h1>
              {subject.description && (
                <p className="text-lg text-muted-foreground max-w-2xl">{subject.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                <Layers className="w-4 h-4 mr-1" />
                {rootTopics.length} Topics
              </Badge>
              {isAdmin && (
                <Button onClick={() => handleAddTopic(null)} data-testid="button-add-topic">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Topic
                </Button>
              )}
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {rootTopics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {rootTopics.map((topic) => {
              const subTopics = getSubTopics(topic.id);
              const hasContent = topic.content && topic.content.trim().length > 0;
              const hasSubTopics = subTopics.length > 0;
              const isExpanded = expandedTopics.has(topic.id);

              return (
                <Card 
                  key={topic.id} 
                  className="group relative overflow-visible hover-elevate transition-all duration-200"
                  data-testid={`card-topic-${topic.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FolderOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg leading-tight" data-testid={`topic-name-${topic.id}`}>
                            {topic.name}
                          </CardTitle>
                          {topic.description && (
                            <CardDescription className="line-clamp-2 mt-1">
                              {topic.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {hasContent && (
                        <Badge variant="secondary" className="text-xs">
                          <FileText className="w-3 h-3 mr-1" />
                          Has Content
                        </Badge>
                      )}
                      {hasSubTopics && (
                        <Badge variant="outline" className="text-xs">
                          <Layers className="w-3 h-3 mr-1" />
                          {subTopics.length} Sub-topics
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button 
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/topics/${topic.id}/view`)}
                        data-testid={`button-view-topic-${topic.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Read Content
                      </Button>
                      
                      {hasSubTopics && (
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => toggleExpand(topic.id)}
                          data-testid={`button-expand-${topic.id}`}
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </Button>
                      )}

                      {isAdmin && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => handleEditTopic(topic, e)} 
                            data-testid={`button-edit-topic-${topic.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => handleDeleteTopic(topic.id, e)} 
                            data-testid={`button-delete-topic-${topic.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>

                    {isAdmin && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => handleAddTopic(topic.id)}
                        data-testid={`button-add-subtopic-${topic.id}`}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Sub-Topic
                      </Button>
                    )}
                  </CardContent>

                  {isExpanded && hasSubTopics && (
                    <div className="border-t bg-muted/30 px-4 py-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Sub-Topics</p>
                      {subTopics.map((subTopic) => {
                        const subHasContent = subTopic.content && subTopic.content.trim().length > 0;
                        return (
                          <div 
                            key={subTopic.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-md bg-background hover-elevate cursor-pointer"
                            onClick={() => navigate(`/topics/${subTopic.id}/view`)}
                            data-testid={`subtopic-item-${subTopic.id}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="text-sm font-medium truncate">{subTopic.name}</span>
                              {subHasContent && (
                                <Badge variant="secondary" className="text-xs shrink-0">Content</Badge>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-16">
            <CardContent>
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Topics Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {isAdmin 
                  ? "Start building your course content by adding your first topic." 
                  : "No topics have been added to this subject yet. Check back later!"
                }
              </p>
              {isAdmin && (
                <Button size="lg" onClick={() => handleAddTopic(null)} data-testid="button-add-first-topic">
                  <Plus className="w-5 h-5 mr-2" />
                  Add First Topic
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingTopic ? (
                <>
                  <Edit className="w-5 h-5" />
                  Edit Topic
                </>
              ) : parentTopicId ? (
                <>
                  <Layers className="w-5 h-5" />
                  Add Sub-Topic
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add New Topic
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingTopic 
                ? "Update the topic details and content." 
                : "Create a new topic for students to learn from."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="topic-name">Topic Name</Label>
              <Input
                id="topic-name"
                placeholder="e.g., Constitution of Pakistan"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-topic-name"
              />
            </div>
            <div>
              <Label htmlFor="topic-description">Description (Optional)</Label>
              <Textarea
                id="topic-description"
                placeholder="Brief description of the topic"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                data-testid="textarea-topic-description"
              />
            </div>
            <div>
              <Label htmlFor="topic-content">Content</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Use markdown formatting: # for headings, - for lists, ** for bold
              </p>
              <Textarea
                id="topic-content"
                placeholder="Write your topic content here...

# Introduction
Start with an introduction...

## Key Points
- Point one
- Point two

> Important quote or note"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={10}
                className="font-mono text-sm"
                data-testid="textarea-topic-content"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={resetForm} data-testid="button-cancel-topic">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-topic"
              >
                <Save className="w-4 h-4 mr-1" />
                {editingTopic ? "Update Topic" : "Create Topic"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
