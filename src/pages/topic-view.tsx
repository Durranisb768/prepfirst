import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  BookOpen, 
  ChevronRight,
  FileText,
  ClipboardList,
  FileQuestion,
  BookMarked,
  GraduationCap,
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  Save
} from "lucide-react";
import type { TopicWithMaterials, Material, Topic } from "@shared/schema";

type TopicWithSubTopics = TopicWithMaterials & { subTopics?: Topic[] };

const materialTypeConfig = {
  book: { icon: BookMarked, label: "Books", color: "text-blue-500" },
  past_paper: { icon: FileText, label: "Past Papers", color: "text-amber-500" },
  essay: { icon: FileQuestion, label: "Essays", color: "text-purple-500" },
  mcq: { icon: ClipboardList, label: "MCQs", color: "text-emerald-500" },
  theory: { icon: BookOpen, label: "Theory", color: "text-rose-500" },
};

function MaterialCard({ material }: { material: Material }) {
  const config = materialTypeConfig[material.type as keyof typeof materialTypeConfig];
  const Icon = config?.icon || FileText;

  return (
    <Link href={`/materials/${material.id}`}>
      <Card 
        className="hover-elevate cursor-pointer h-full transition-all"
        data-testid={`card-material-${material.id}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config?.color || "text-muted-foreground"} bg-muted`}>
              <Icon className="w-4 h-4" />
            </div>
            <Badge variant="outline" className="text-xs capitalize">
              {material.type.replace("_", " ")}
            </Badge>
          </div>
          <CardTitle className="text-base mt-2">{material.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {material.description && (
            <CardDescription className="line-clamp-2 mb-2">
              {material.description}
            </CardDescription>
          )}
          <div className="flex items-center gap-1 text-sm text-primary">
            <span>Open</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function TopicView() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isSubTopicDialogOpen, setIsSubTopicDialogOpen] = useState(false);
  const [subTopicForm, setSubTopicForm] = useState({ name: "", description: "", content: "" });

  const { data: topic, isLoading } = useQuery<TopicWithSubTopics>({
    queryKey: ["/api/topics", id],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      const res = await apiRequest("PUT", `/api/admin/topics/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Content updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/topics", id] });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update content", variant: "destructive" });
    },
  });

  const createSubTopicMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; content?: string; subjectId: number; parentTopicId: number }) => {
      const res = await apiRequest("POST", "/api/admin/topics", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Sub-topic created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/topics", id] });
      setIsSubTopicDialogOpen(false);
      setSubTopicForm({ name: "", description: "", content: "" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create sub-topic", variant: "destructive" });
    },
  });

  const deleteSubTopicMutation = useMutation({
    mutationFn: async (subTopicId: number) => {
      await apiRequest("DELETE", `/api/admin/topics/${subTopicId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Sub-topic deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/topics", id] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete sub-topic", variant: "destructive" });
    },
  });

  const handleStartEdit = () => {
    setEditContent(topic?.content || "");
    setIsEditing(true);
  };

  const handleSaveContent = () => {
    updateMutation.mutate({ content: editContent });
  };

  const handleAddSubTopic = () => {
    if (!subTopicForm.name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    createSubTopicMutation.mutate({
      ...subTopicForm,
      subjectId: topic!.subjectId,
      parentTopicId: parseInt(id!)
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b sticky top-0 z-50 bg-background">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-10 w-full max-w-md mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-8 w-8 rounded-lg mb-2" />
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="text-center p-8">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Topic Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested topic could not be found.</p>
            <Button asChild>
              <Link href="/">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const materialsByType: Record<string, Material[]> = {};
  topic.materials?.forEach((material) => {
    if (!materialsByType[material.type]) {
      materialsByType[material.type] = [];
    }
    materialsByType[material.type].push(material);
  });

  const availableTypes = Object.keys(materialsByType);
  const hasContent = topic.content && topic.content.trim().length > 0;
  const hasSubTopics = topic.subTopics && topic.subTopics.length > 0;
  const hasMaterials = availableTypes.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild data-testid="button-back">
            <Link href={`/subjects/${topic.subjectId}`}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-medium">PrepMaster</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 flex-wrap">
            <Link href="/" className="hover:text-foreground">Dashboard</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href={`/subjects/${topic.subjectId}`} className="hover:text-foreground">Subject</Link>
            <ChevronRight className="w-4 h-4" />
            <span>{topic.name}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-topic-title">
            {topic.name}
          </h1>
          {topic.description && (
            <p className="text-muted-foreground">{topic.description}</p>
          )}
        </div>

        {(hasContent || isAdmin) && (
          <section className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Content
              </h2>
              {isAdmin && !isEditing && (
                <Button variant="outline" size="sm" onClick={handleStartEdit} data-testid="button-edit-content">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit Content
                </Button>
              )}
            </div>
            
            {isEditing ? (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Write your topic content here..."
                    rows={12}
                    data-testid="textarea-edit-content"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsEditing(false)} data-testid="button-cancel-edit">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveContent} disabled={updateMutation.isPending} data-testid="button-save-content">
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : hasContent ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap" data-testid="text-topic-content">
                    {topic.content}
                  </div>
                </CardContent>
              </Card>
            ) : isAdmin ? (
              <Card className="text-center py-8">
                <CardContent>
                  <p className="text-muted-foreground mb-4">No content added yet.</p>
                  <Button onClick={handleStartEdit} data-testid="button-add-content">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Content
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </section>
        )}

        {(hasSubTopics || isAdmin) && (
          <section className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Sub-Topics
              </h2>
              {isAdmin && (
                <Button size="sm" onClick={() => setIsSubTopicDialogOpen(true)} data-testid="button-add-subtopic">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Sub-Topic
                </Button>
              )}
            </div>

            {hasSubTopics ? (
              <div className="space-y-2">
                {topic.subTopics!.map(subTopic => (
                  <div key={subTopic.id} className="group flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Link 
                      href={`/topics/${subTopic.id}`}
                      className="flex-1 font-medium text-foreground hover:text-primary transition-colors"
                      data-testid={`link-subtopic-${subTopic.id}`}
                    >
                      {subTopic.name}
                    </Link>
                    {subTopic.content && <Badge variant="secondary" className="text-xs">Has Content</Badge>}
                    {isAdmin && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteSubTopicMutation.mutate(subTopic.id)}
                        data-testid={`button-delete-subtopic-${subTopic.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : isAdmin ? (
              <Card className="text-center py-8">
                <CardContent>
                  <p className="text-muted-foreground mb-4">No sub-topics added yet.</p>
                  <Button onClick={() => setIsSubTopicDialogOpen(true)} data-testid="button-add-first-subtopic">
                    <Plus className="w-4 h-4 mr-1" />
                    Add First Sub-Topic
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </section>
        )}

        {hasMaterials && (
          <section>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Materials
            </h2>

            <Tabs defaultValue={availableTypes[0]} className="w-full">
              <TabsList className="mb-6 flex-wrap h-auto gap-1">
                {Object.entries(materialTypeConfig).map(([type, config]) => {
                  const count = materialsByType[type]?.length || 0;
                  if (count === 0) return null;
                  return (
                    <TabsTrigger 
                      key={type} 
                      value={type}
                      className="gap-2"
                      data-testid={`tab-${type}`}
                    >
                      <config.icon className="w-4 h-4" />
                      {config.label}
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {count}
                      </Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {Object.entries(materialTypeConfig).map(([type]) => {
                const materials = materialsByType[type] || [];
                if (materials.length === 0) return null;
                return (
                  <TabsContent key={type} value={type}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {materials.map((material) => (
                        <MaterialCard key={material.id} material={material} />
                      ))}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </section>
        )}

        {!hasContent && !hasSubTopics && !hasMaterials && !isAdmin && (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Content Available</h3>
              <p className="text-muted-foreground">
                This topic doesn't have any content yet.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={isSubTopicDialogOpen} onOpenChange={setIsSubTopicDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Sub-Topic</DialogTitle>
            <DialogDescription>Create a new sub-topic under "{topic.name}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="subtopic-name">Name</Label>
              <Input
                id="subtopic-name"
                placeholder="e.g., Section 1: Introduction"
                value={subTopicForm.name}
                onChange={(e) => setSubTopicForm(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-subtopic-name"
              />
            </div>
            <div>
              <Label htmlFor="subtopic-description">Description (Optional)</Label>
              <Textarea
                id="subtopic-description"
                placeholder="Brief description"
                value={subTopicForm.description}
                onChange={(e) => setSubTopicForm(prev => ({ ...prev, description: e.target.value }))}
                data-testid="textarea-subtopic-description"
              />
            </div>
            <div>
              <Label htmlFor="subtopic-content">Content (Optional)</Label>
              <Textarea
                id="subtopic-content"
                placeholder="Detailed content..."
                value={subTopicForm.content}
                onChange={(e) => setSubTopicForm(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
                data-testid="textarea-subtopic-content"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsSubTopicDialogOpen(false)} data-testid="button-cancel-subtopic">
                Cancel
              </Button>
              <Button onClick={handleAddSubTopic} disabled={createSubTopicMutation.isPending} data-testid="button-save-subtopic">
                <Save className="w-4 h-4 mr-1" />
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
