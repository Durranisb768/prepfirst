import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Plus,
  Trash2,
  Edit,
  Users,
  Activity,
  BookOpen,
  FolderOpen,
  FileText,
  GraduationCap,
  Shield,
  Save,
  Pencil
} from "lucide-react";
import { EditModeToggle } from "@/components/EditModeToggle";
import { useEditMode } from "@/contexts/EditModeContext";
import type { Subject, Topic, Material, ActivityLog, UserWithRole } from "@shared/schema";

function SubjectsManager() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: subjects, isLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await apiRequest("POST", "/api/admin/subjects", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Subject created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create subject", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name?: string; description?: string } }) => {
      const res = await apiRequest("PUT", `/api/admin/subjects/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Subject updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update subject", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/subjects/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Subject deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete subject", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setIsOpen(false);
    setEditingSubject(null);
    setName("");
    setDescription("");
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }

    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, data: { name, description } });
    } else {
      createMutation.mutate({ name, description });
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setName(subject.name);
    setDescription(subject.description || "");
    setIsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">Subjects ({subjects?.length || 0})</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-subject">
              <Plus className="w-4 h-4 mr-1" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
              <DialogDescription>
                {editingSubject ? "Update the subject details." : "Create a new subject for your curriculum."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="subject-name">Name</Label>
                <Input
                  id="subject-name"
                  placeholder="e.g., Mathematics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-subject-name"
                />
              </div>
              <div>
                <Label htmlFor="subject-description">Description (Optional)</Label>
                <Textarea
                  id="subject-description"
                  placeholder="Brief description of the subject"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="textarea-subject-description"
                />
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full"
                data-testid="button-save-subject"
              >
                <Save className="w-4 h-4 mr-1" />
                {editingSubject ? "Update Subject" : "Create Subject"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-2">
          {subjects?.map((subject) => (
            <Card key={subject.id} data-testid={`admin-subject-${subject.id}`}>
              <CardContent className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{subject.name}</p>
                    {subject.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{subject.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(subject)} data-testid={`button-edit-subject-${subject.id}`}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(subject.id)} data-testid={`button-delete-subject-${subject.id}`}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!subjects || subjects.length === 0) && (
            <p className="text-center text-muted-foreground py-8">No subjects yet. Create your first subject!</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function UsersManager() {
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery<UserWithRole[]>({
    queryKey: ["/api/admin/users"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest("PUT", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User role updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user role", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Users ({users?.length || 0})</h3>
      
      <ScrollArea className="h-96">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id} data-testid={`admin-user-${user.id}`}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {user.firstName?.[0] || user.email?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.firstName} {user.lastName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(value) => updateRoleMutation.mutate({ userId: user.id, role: value })}
                  >
                    <SelectTrigger className="w-28" data-testid={`select-role-${user.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {(!users || users.length === 0) && (
          <p className="text-center text-muted-foreground py-8">No users found.</p>
        )}
      </ScrollArea>
    </div>
  );
}

function ActivityLogs() {
  const { data: logs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/admin/activity-logs"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Recent Activity ({logs?.length || 0})</h3>
      
      <ScrollArea className="h-96">
        <div className="space-y-2">
          {logs?.map((log) => (
            <Card key={log.id} data-testid={`activity-log-${log.id}`}>
              <CardContent className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{log.action.replace(/_/g, " ")}</p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{log.details}</p>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(log.createdAt!)}
                </div>
              </CardContent>
            </Card>
          ))}
          {(!logs || logs.length === 0) && (
            <p className="text-center text-muted-foreground py-8">No activity logs yet.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { data: roleData, isLoading: roleLoading } = useQuery<{ role: string }>({
    queryKey: ["/api/user/role"],
  });

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  if (roleData?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="text-center p-8">
          <CardContent>
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You need administrator privileges to access this page.</p>
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
      <header className="border-b sticky top-0 z-50 bg-background">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild data-testid="button-back">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-medium">PrepMaster</span>
            <Badge variant="outline">Admin</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-admin-title">
                Admin Control Panel
              </h1>
              <p className="text-muted-foreground">
                Manage subjects, topics, materials, users, and monitor activity.
              </p>
            </div>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Pencil className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Inline Editing Mode</p>
                  <p className="text-xs text-muted-foreground">Edit content directly on pages</p>
                </div>
                <EditModeToggle userEmail={user?.email} />
              </div>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="subjects" className="w-full">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="subjects" className="gap-2" data-testid="tab-subjects">
              <BookOpen className="w-4 h-4" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2" data-testid="tab-users">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2" data-testid="tab-activity">
              <Activity className="w-4 h-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subjects">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Content Management
                </CardTitle>
                <CardDescription>
                  Create and manage subjects. Navigate to subjects to manage topics and materials.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubjectsManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  View and manage user roles. Promote users to admin or demote them to student.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UsersManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Activity Monitor
                </CardTitle>
                <CardDescription>
                  View recent admin actions and system activity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityLogs />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
