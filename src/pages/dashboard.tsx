import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { EditableText } from "@/components/EditableText";
import { useEditMode } from "@/contexts/EditModeContext";
import { 
  BookOpen, 
  GraduationCap, 
  ChevronRight, 
  LogOut,
  LogIn,
  Settings,
  FolderOpen,
  FileText,
  ClipboardList,
  Lightbulb,
  Plus,
  Minus,
  Trash2,
  Edit,
  Play,
  Sparkles,
  Loader2,
  Newspaper,
  PenTool,
  BookA,
  Languages,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Home,
  Trophy,
  Eye
} from "lucide-react";
import type { Subject, Topic, Material, McqQuestion } from "@shared/schema";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};

function TopicDeleteButton({ topicId, subjectId }: { topicId: number; subjectId: number }) {
  const { toast } = useToast();
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/admin/topics/${topicId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/subjects/${subjectId}/topics`] });
      queryClient.invalidateQueries({ queryKey: [`/api/subjects/${subjectId}/materials`] });
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({ title: "Topic deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete topic", variant: "destructive" });
    },
  });

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (confirm("Delete this topic and all its materials?")) {
          deleteMutation.mutate();
        }
      }}
      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md z-10"
      data-testid={`button-delete-topic-${topicId}`}
    >
      <Trash2 className="w-3 h-3" />
    </button>
  );
}

interface SubjectCardProps {
  subject: Subject;
  color: { bg: string; border: string; iconBg: string; icon: string };
  onClick: () => void;
}

function SubjectCard({ subject, color, onClick }: SubjectCardProps) {
  const { isEditMode } = useEditMode();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/admin/subjects/${subject.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({ title: "Subject deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete subject", variant: "destructive" });
    },
  });

  return (
    <div
      className={`p-4 rounded-xl cursor-pointer transition-all shadow-md border relative ${color.bg} ${color.border} ${
        isEditMode ? "border-dashed border-indigo-400" : ""
      } hover:shadow-lg hover:scale-[1.02]`}
      onClick={isEditMode ? undefined : onClick}
      data-testid={`subject-card-${subject.id}`}
    >
      {isEditMode && isAdmin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Delete this subject and all its topics/materials?")) {
              deleteMutation.mutate();
            }
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md z-10"
          data-testid={`button-delete-subject-${subject.id}`}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
      <div className="flex flex-col items-center text-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.iconBg}`}>
          <BookOpen className={`w-6 h-6 ${color.icon}`} />
        </div>
        <div>
          {isEditMode && isAdmin ? (
            <EditableText
              value={subject.name}
              entityType="subject"
              entityId={subject.id}
              field="name"
              className="font-semibold text-sm"
            />
          ) : (
            <p className="font-semibold text-sm">{subject.name}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Quiz / Theory</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const { isEditMode } = useEditMode();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("one-paper");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<number>>(new Set());

  const { data: subjects, isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: siteSettings } = useQuery<{ [key: string]: string }>({
    queryKey: ["/api/site-settings"],
  });

  const getSetting = (key: string, defaultValue: string = "") => 
    siteSettings?.[key] || defaultValue;

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const toggleSubjectExpand = (subjectId: number) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="min-h-screen gradient-mesh">
        <header className="glass-header sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <GraduationCap className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <span className="text-lg font-bold font-heading bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">PrepMaster</span>
                <p className="text-xs text-muted-foreground">Learn with Durrani</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <Button variant="outline" size="sm" asChild data-testid="button-admin-panel" className="glass">
                      <Link href="/admin">
                        <Settings className="w-4 h-4 mr-1" />
                        Admin
                      </Link>
                    </Button>
                  )}
                  <div className="flex items-center gap-2 pl-3 border-l border-white/20">
                    <Avatar className="w-8 h-8 ring-2 ring-indigo-500/20">
                      <AvatarImage src={user?.profileImageUrl || undefined} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-indigo-500 to-purple-600 text-white">{getInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium leading-none font-heading">{user?.firstName || "User"}</p>
                      <p className="text-xs text-muted-foreground">{isAdmin ? "Administrator" : "Student"}</p>
                    </div>
                  </div>
                <Button variant="ghost" size="icon" asChild data-testid="button-logout">
                  <a href="/api/logout">
                    <LogOut className="w-4 h-4" />
                  </a>
                </Button>
              </>
            ) : (
              <Button asChild data-testid="button-login" className="bg-[#FF6B6B] hover:bg-[#FF5252] text-white border-0">
                <Link href="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login / Signup
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl mb-8 p-3 shadow-lg border border-white/20 dark:border-slate-700/50 overflow-hidden">
            <TabsList className="!flex flex-row overflow-x-auto lg:!grid w-full lg:grid-cols-7 h-auto gap-3 bg-transparent p-0 no-scrollbar">
              <TabsTrigger
                value="guide"
                className="group relative flex flex-col items-center gap-2.5 py-5 px-4 text-xs rounded-xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 shadow-sm border border-rose-200/50 dark:border-rose-800/30 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-md data-[state=active]:from-rose-50 data-[state=active]:to-rose-100/80 dark:data-[state=active]:from-rose-950/50 dark:data-[state=active]:to-rose-900/50 data-[state=active]:border-rose-400 dark:data-[state=active]:border-rose-600 data-[state=active]:shadow-xl transition-all duration-300 overflow-hidden min-w-[140px] lg:min-w-0"
                data-testid="tab-guide"
              >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/0 to-rose-600/0 group-data-[state=active]:from-rose-500/10 group-data-[state=active]:to-rose-600/5 transition-all duration-300" />
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/60 dark:to-rose-800/60 flex items-center justify-center shadow-sm group-data-[state=active]:scale-110 group-data-[state=active]:shadow-lg group-hover:scale-105 transition-all duration-300">
                <Lightbulb className="w-5 h-5 text-rose-600 dark:text-rose-400 group-data-[state=active]:drop-shadow-sm" />
              </div>
              <span className="relative hidden lg:inline font-semibold text-center leading-tight text-slate-700 dark:text-slate-300 group-data-[state=active]:text-rose-700 dark:group-data-[state=active]:text-rose-300 transition-colors duration-300">Tutorial/Guidance</span>
              <span className="relative lg:hidden font-semibold text-slate-700 dark:text-slate-300 group-data-[state=active]:text-rose-700 dark:group-data-[state=active]:text-rose-300 transition-colors duration-300">Guide</span>
            </TabsTrigger>
            <TabsTrigger
              value="one-paper"
              className="group relative flex flex-col items-center gap-2.5 py-5 px-4 text-xs rounded-xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 shadow-sm border border-blue-200/50 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md data-[state=active]:from-blue-50 data-[state=active]:to-blue-100/80 dark:data-[state=active]:from-blue-950/50 dark:data-[state=active]:to-blue-900/50 data-[state=active]:border-blue-400 dark:data-[state=active]:border-blue-600 data-[state=active]:shadow-xl transition-all duration-300 overflow-hidden min-w-[140px] lg:min-w-0"
              data-testid="tab-one-paper"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-600/0 group-data-[state=active]:from-blue-500/10 group-data-[state=active]:to-blue-600/5 transition-all duration-300" />
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/60 dark:to-blue-800/60 flex items-center justify-center shadow-sm group-data-[state=active]:scale-110 group-data-[state=active]:shadow-lg group-hover:scale-105 transition-all duration-300">
                <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400 group-data-[state=active]:drop-shadow-sm" />
              </div>
              <span className="relative hidden lg:inline font-semibold text-center leading-tight text-slate-700 dark:text-slate-300 group-data-[state=active]:text-blue-700 dark:group-data-[state=active]:text-blue-300 transition-colors duration-300">MCQs + Theory</span>
              <span className="relative lg:hidden font-semibold text-slate-700 dark:text-slate-300 group-data-[state=active]:text-blue-700 dark:group-data-[state=active]:text-blue-300 transition-colors duration-300">MCQs</span>
            </TabsTrigger>
            <TabsTrigger
              value="pms-css"
              className="group relative flex flex-col items-center gap-2.5 py-5 px-4 text-xs rounded-xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 shadow-sm border border-violet-200/50 dark:border-violet-800/30 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md data-[state=active]:from-violet-50 data-[state=active]:to-violet-100/80 dark:data-[state=active]:from-violet-950/50 dark:data-[state=active]:to-violet-900/50 data-[state=active]:border-violet-400 dark:data-[state=active]:border-violet-600 data-[state=active]:shadow-xl transition-all duration-300 overflow-hidden min-w-[140px] lg:min-w-0"
              data-testid="tab-pms-css"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-violet-600/0 group-data-[state=active]:from-violet-500/10 group-data-[state=active]:to-violet-600/5 transition-all duration-300" />
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900/60 dark:to-violet-800/60 flex items-center justify-center shadow-sm group-data-[state=active]:scale-110 group-data-[state=active]:shadow-lg group-hover:scale-105 transition-all duration-300">
                <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400 group-data-[state=active]:drop-shadow-sm" />
              </div>
              <span className="relative hidden sm:inline font-semibold text-slate-700 dark:text-slate-300 group-data-[state=active]:text-violet-700 dark:group-data-[state=active]:text-violet-300 transition-colors duration-300">PMS/CSS/Written</span>
              <span className="relative sm:hidden font-semibold text-slate-700 dark:text-slate-300 group-data-[state=active]:text-violet-700 dark:group-data-[state=active]:text-violet-300 transition-colors duration-300">Written</span>
            </TabsTrigger>
            <TabsTrigger
              value="essay"
              className="group relative flex flex-col items-center gap-2.5 py-5 px-4 text-xs rounded-xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 shadow-sm border border-pink-200/50 dark:border-pink-800/30 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md data-[state=active]:from-pink-50 data-[state=active]:to-pink-100/80 dark:data-[state=active]:from-pink-950/50 dark:data-[state=active]:to-pink-900/50 data-[state=active]:border-pink-400 dark:data-[state=active]:border-pink-600 data-[state=active]:shadow-xl transition-all duration-300 overflow-hidden min-w-[140px] lg:min-w-0"
              data-testid="tab-essay"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-pink-600/0 group-data-[state=active]:from-pink-500/10 group-data-[state=active]:to-pink-600/5 transition-all duration-300" />
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/60 dark:to-pink-800/60 flex items-center justify-center shadow-sm group-data-[state=active]:scale-110 group-data-[state=active]:shadow-lg group-hover:scale-105 transition-all duration-300">
                <PenTool className="w-5 h-5 text-pink-600 dark:text-pink-400 group-data-[state=active]:drop-shadow-sm" />
              </div>
              <span className="relative font-semibold text-slate-700 dark:text-slate-300 group-data-[state=active]:text-pink-700 dark:group-data-[state=active]:text-pink-300 transition-colors duration-300">Essay Builder</span>
            </TabsTrigger>
            <TabsTrigger
              value="news"
              className="group relative flex flex-col items-center gap-2.5 py-5 px-4 text-xs rounded-xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 shadow-sm border border-amber-200/50 dark:border-amber-800/30 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md data-[state=active]:from-amber-50 data-[state=active]:to-amber-100/80 dark:data-[state=active]:from-amber-950/50 dark:data-[state=active]:to-amber-900/50 data-[state=active]:border-amber-400 dark:data-[state=active]:border-amber-600 data-[state=active]:shadow-xl transition-all duration-300 overflow-hidden min-w-[140px] lg:min-w-0"
              data-testid="tab-news"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-600/0 group-data-[state=active]:from-amber-500/10 group-data-[state=active]:to-amber-600/5 transition-all duration-300" />
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/60 dark:to-amber-800/60 flex items-center justify-center shadow-sm group-data-[state=active]:scale-110 group-data-[state=active]:shadow-lg group-hover:scale-105 transition-all duration-300">
                <Newspaper className="w-5 h-5 text-amber-600 dark:text-amber-400 group-data-[state=active]:drop-shadow-sm" />
              </div>
              <span className="relative hidden lg:inline font-semibold text-center leading-tight text-slate-700 dark:text-slate-300 group-data-[state=active]:text-amber-700 dark:group-data-[state=active]:text-amber-300 transition-colors duration-300">News Provider</span>
              <span className="relative lg:hidden font-semibold text-slate-700 dark:text-slate-300 group-data-[state=active]:text-amber-700 dark:group-data-[state=active]:text-amber-300 transition-colors duration-300">News</span>
            </TabsTrigger>
            <TabsTrigger
              value="analyzer"
              className="group relative flex flex-col items-center gap-2.5 py-5 px-4 text-xs rounded-xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 shadow-sm border border-emerald-200/50 dark:border-emerald-800/30 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md data-[state=active]:from-emerald-50 data-[state=active]:to-emerald-100/80 dark:data-[state=active]:from-emerald-950/50 dark:data-[state=active]:to-emerald-900/50 data-[state=active]:border-emerald-400 dark:data-[state=active]:border-emerald-600 data-[state=active]:shadow-xl transition-all duration-300 overflow-hidden min-w-[140px] lg:min-w-0"
              data-testid="tab-analyzer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-600/0 group-data-[state=active]:from-emerald-500/10 group-data-[state=active]:to-emerald-600/5 transition-all duration-300" />
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/60 dark:to-emerald-800/60 flex items-center justify-center shadow-sm group-data-[state=active]:scale-110 group-data-[state=active]:shadow-lg group-hover:scale-105 transition-all duration-300">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-data-[state=active]:drop-shadow-sm" />
              </div>
              <span className="relative hidden lg:inline font-semibold text-center leading-tight text-slate-700 dark:text-slate-300 group-data-[state=active]:text-emerald-700 dark:group-data-[state=active]:text-emerald-300 transition-colors duration-300">Article Analyzer</span>
              <span className="relative lg:hidden font-semibold text-slate-700 dark:text-slate-300 group-data-[state=active]:text-emerald-700 dark:group-data-[state=active]:text-emerald-300 transition-colors duration-300">Analyze</span>
            </TabsTrigger>
            <TabsTrigger
              value="vocabulary"
              className="group relative flex flex-col items-center gap-2.5 py-5 px-4 text-xs rounded-xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 shadow-sm border border-cyan-200/50 dark:border-cyan-800/30 hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-md data-[state=active]:from-cyan-50 data-[state=active]:to-cyan-100/80 dark:data-[state=active]:from-cyan-950/50 dark:data-[state=active]:to-cyan-900/50 data-[state=active]:border-cyan-400 dark:data-[state=active]:border-cyan-600 data-[state=active]:shadow-xl transition-all duration-300 overflow-hidden min-w-[140px] lg:min-w-0"
              data-testid="tab-vocabulary"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-600/0 group-data-[state=active]:from-cyan-500/10 group-data-[state=active]:to-cyan-600/5 transition-all duration-300" />
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900/60 dark:to-cyan-800/60 flex items-center justify-center shadow-sm group-data-[state=active]:scale-110 group-data-[state=active]:shadow-lg group-hover:scale-105 transition-all duration-300">
                <BookA className="w-5 h-5 text-cyan-600 dark:text-cyan-400 group-data-[state=active]:drop-shadow-sm" />
              </div>
              <span className="relative font-semibold text-slate-700 dark:text-slate-300 group-data-[state=active]:text-cyan-700 dark:group-data-[state=active]:text-cyan-300 transition-colors duration-300">Vocabulary</span>
            </TabsTrigger>
          </TabsList>
          </div>

          <TabsContent value="guide" className="mt-0">
            <TutorialGuideTab setActiveTab={setActiveTab} />
          </TabsContent>

          <TabsContent value="one-paper" className="mt-0">
            <OnePaperMcqsTab 
              subjects={subjects || []} 
              isLoading={subjectsLoading} 
              isAdmin={isAdmin}
              isAuthenticated={isAuthenticated}
            />
          </TabsContent>

          <TabsContent value="pms-css" className="mt-0">
            <PmsCssWrittenTab 
              isAdmin={isAdmin}
              isAuthenticated={isAuthenticated}
            />
          </TabsContent>

          <TabsContent value="essay" className="mt-0">
            <EssayBuilderTab isAuthenticated={isAuthenticated} />
          </TabsContent>

          <TabsContent value="news" className="mt-0">
            <NewsProviderTab />
          </TabsContent>

          <TabsContent value="analyzer" className="mt-0">
            <ArticleAnalyzerTab isAuthenticated={isAuthenticated} />
          </TabsContent>

          <TabsContent value="vocabulary" className="mt-0">
            <VocabularyTab isAuthenticated={isAuthenticated} />
          </TabsContent>
        </Tabs>
        </motion.div>
      </main>
      </div>
    </div>
  );
}

// Theory Reader Component with Edit Mode
function TheoryReaderView({ 
  material, 
  onBack, 
  isAdmin,
  selectedSubjectId 
}: { 
  material: Material; 
  onBack: () => void; 
  isAdmin: boolean;
  selectedSubjectId: number | null;
}) {
  const { toast } = useToast();
  const { isEditMode } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(material.content || "");
  const [editedTitle, setEditedTitle] = useState(material.title);

  const updateMaterialMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await apiRequest("PUT", `/api/admin/materials/${material.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/topics/${material.topicId}/materials`] });
      setIsEditing(false);
      toast({ title: "Theory Updated!", description: "Changes saved successfully." });
    },
    onError: () => {
      toast({ title: "Failed to update theory", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack} data-testid="button-theory-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            {isEditing ? (
              <Input 
                value={editedTitle} 
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-xl font-bold"
                data-testid="input-edit-theory-title"
              />
            ) : (
              <h2 className="text-xl font-bold">{material.title}</h2>
            )}
            <p className="text-sm text-muted-foreground">Study Notes</p>
          </div>
        </div>
        {isAdmin && isEditMode && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  data-testid="button-cancel-edit-theory"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => updateMaterialMutation.mutate({ title: editedTitle, content: editedContent })}
                  disabled={updateMaterialMutation.isPending}
                  data-testid="button-save-theory"
                >
                  {updateMaterialMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)} data-testid="button-edit-theory">
                <Edit className="w-4 h-4 mr-2" />
                Edit Theory
              </Button>
            )}
          </div>
        )}
      </div>
      <Card>
        <CardContent className="py-6">
          {isEditing ? (
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[500px] font-mono text-sm"
              data-testid="textarea-edit-theory-content"
            />
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                {material.content}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Tab 1: One Paper MCQs with Notes/Theory
function OnePaperMcqsTab({ 
  subjects, 
  isLoading, 
  isAdmin,
  isAuthenticated 
}: { 
  subjects: Subject[]; 
  isLoading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
}) {
  const { toast } = useToast();
  const { isEditMode } = useEditMode();
  const [viewMode, setViewMode] = useState<"subjects" | "topics" | "test-builder">("subjects");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showGenerateMcq, setShowGenerateMcq] = useState(false);
  const [showAddTheory, setShowAddTheory] = useState(false);
  const [showMcqMaker, setShowMcqMaker] = useState(false);
  const [showTheoryReader, setShowTheoryReader] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectDesc, setNewSubjectDesc] = useState("");
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [mcqText, setMcqText] = useState("");
  const [mcqTitle, setMcqTitle] = useState("");
  const [includeUrdu, setIncludeUrdu] = useState(false);
  const [theoryTitle, setTheoryTitle] = useState("");
  const [theoryContent, setTheoryContent] = useState("");
  const [mcqMakerTopicName, setMcqMakerTopicName] = useState("");
  const [mcqMakerText, setMcqMakerText] = useState("");
  const [mcqMakerUrdu, setMcqMakerUrdu] = useState(false);
  const [mcqMakerModel, setMcqMakerModel] = useState("gemini");
  
  // AI Job Progress State
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [jobProgress, setJobProgress] = useState<{
    status: string;
    processedChunks: number;
    totalChunks: number;
    message: string;
  } | null>(null);
  
  // Poll for job status when activeJobId is set
  useEffect(() => {
    if (!activeJobId) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/ai/jobs/${activeJobId}`, { credentials: "include" });
        if (!res.ok) return;
        const job = await res.json();
        
        setJobProgress({
          status: job.status,
          processedChunks: job.processedChunks || 0,
          totalChunks: job.totalChunks || 1,
          message: job.status === "completed" ? "MCQs generated successfully!" 
                 : job.status === "failed" ? (job.errorMessage || "Generation failed")
                 : `Processing chunk ${job.processedChunks || 0} of ${job.totalChunks || 1}...`
        });
        
        if (job.status === "completed" || job.status === "failed") {
          clearInterval(pollInterval);
          queryClient.invalidateQueries({ queryKey: [`/api/subjects/${selectedSubjectId}/materials`] });
          queryClient.invalidateQueries({ queryKey: [`/api/subjects/${selectedSubjectId}/topics`] });
          
          if (job.status === "completed") {
            toast({ title: "Quiz Generated!", description: "MCQs are ready to attempt." });
          } else {
            toast({ title: "Generation Failed", description: job.errorMessage || "Please try again.", variant: "destructive" });
          }
          
          setTimeout(() => {
            setActiveJobId(null);
            setJobProgress(null);
          }, 3000);
        }
      } catch (err) {
        console.error("Error polling job status:", err);
      }
    }, 2000);
    
    return () => clearInterval(pollInterval);
  }, [activeJobId, selectedSubjectId]);
  
  // Test Your Knowledge state
  const [testConfig, setTestConfig] = useState<{[subjectId: number]: {[topicId: number]: number}}>({});
  const [totalTestQuestions, setTotalTestQuestions] = useState(0);

  const { data: topics } = useQuery<Topic[]>({
    queryKey: [`/api/subjects/${selectedSubjectId}/topics`],
    enabled: !!selectedSubjectId,
  });

  // Fetch all materials for all topics in the selected subject
  const { data: subjectMaterials } = useQuery<Material[]>({
    queryKey: [`/api/subjects/${selectedSubjectId}/materials`],
    enabled: !!selectedSubjectId && isAuthenticated && viewMode === "topics",
  });

  // Helper to get materials for a specific topic
  const getMaterialsForTopic = (topicId: number) => {
    return subjectMaterials?.filter(m => m.topicId === topicId) || [];
  };

  const subjectColors = [
    { bg: "bg-blue-100 dark:bg-blue-900/50", border: "border-blue-200 dark:border-blue-800", icon: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-200 dark:bg-blue-800" },
    { bg: "bg-purple-100 dark:bg-purple-900/50", border: "border-purple-200 dark:border-purple-800", icon: "text-purple-600 dark:text-purple-400", iconBg: "bg-purple-200 dark:bg-purple-800" },
    { bg: "bg-pink-100 dark:bg-pink-900/50", border: "border-pink-200 dark:border-pink-800", icon: "text-pink-600 dark:text-pink-400", iconBg: "bg-pink-200 dark:bg-pink-800" },
    { bg: "bg-amber-100 dark:bg-amber-900/50", border: "border-amber-200 dark:border-amber-800", icon: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-200 dark:bg-amber-800" },
    { bg: "bg-emerald-100 dark:bg-emerald-900/50", border: "border-emerald-200 dark:border-emerald-800", icon: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-200 dark:bg-emerald-800" },
    { bg: "bg-indigo-100 dark:bg-indigo-900/50", border: "border-indigo-200 dark:border-indigo-800", icon: "text-indigo-600 dark:text-indigo-400", iconBg: "bg-indigo-200 dark:bg-indigo-800" },
  ];

  const [, navigate] = useLocation();
  const [showImportQuiz, setShowImportQuiz] = useState(false);
  const [importQuizJson, setImportQuizJson] = useState("");
  const [importQuizTitle, setImportQuizTitle] = useState("");
  
  const handleSubjectClick = (subjectId: number) => {
    setSelectedSubjectId(subjectId);
    setViewMode("topics");
  };

  const handleBack = () => {
    if (showTheoryReader) {
      setShowTheoryReader(false);
      setSelectedMaterial(null);
    } else if (viewMode === "topics") {
      setViewMode("subjects");
      setSelectedSubjectId(null);
      setSelectedTopicId(null);
    }
  };

  const openTheoryReader = (material: Material) => {
    setSelectedMaterial(material);
    setShowTheoryReader(true);
  };

  const createSubjectMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await apiRequest("POST", "/api/admin/subjects", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      setShowAddSubject(false);
      setNewSubjectName("");
      setNewSubjectDesc("");
      toast({ title: "Subject created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create subject", variant: "destructive" });
    },
  });

  const createTopicMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; subjectId: number }) => {
      const res = await apiRequest("POST", "/api/admin/topics", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/subjects/${selectedSubjectId}/topics`] });
      setShowAddTopic(false);
      setNewTopicName("");
      setNewTopicDesc("");
      toast({ title: "Topic created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create topic", variant: "destructive" });
    },
  });

  const generateMcqsMutation = useMutation({
    mutationFn: async (data: { text: string; topicId: number; title: string; includeUrdu: boolean }) => {
      const res = await apiRequest("POST", "/api/ai/generate-mcqs", data);
      return res.json();
    },
    onSuccess: (data) => {
      setShowGenerateMcq(false);
      setMcqText("");
      setMcqTitle("");
      setActiveJobId(data.jobId);
      setJobProgress({
        status: "processing",
        processedChunks: 0,
        totalChunks: data.totalChunks || 1,
        message: `Starting AI generation (${data.totalChunks} chunks)...`
      });
    },
    onError: (error: any) => {
      toast({ title: "Failed to generate MCQs", description: error?.message || "Please try again", variant: "destructive" });
    },
  });

  const addTheoryMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; topicId: number; type: string }) => {
      const res = await apiRequest("POST", "/api/admin/materials", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/topics/${selectedTopicId}/materials`] });
      queryClient.invalidateQueries({ queryKey: [`/api/subjects/${selectedSubjectId}/materials`] });
      setShowAddTheory(false);
      setTheoryTitle("");
      setTheoryContent("");
      toast({ title: "Theory notes added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add theory notes", variant: "destructive" });
    },
  });

  const importQuizMutation = useMutation({
    mutationFn: async (data: { title: string; topicId: number; questions: any[] }) => {
      const materialRes = await apiRequest("POST", "/api/admin/materials", {
        title: data.title,
        topicId: data.topicId,
        type: "mcq",
        description: `Imported quiz with ${data.questions.length} questions`
      });
      const material = await materialRes.json();
      
      for (const q of data.questions) {
        await apiRequest("POST", "/api/admin/mcq-questions", {
          materialId: material.id,
          question: q.question,
          optionA: q.optionA || q.options?.[0] || "",
          optionB: q.optionB || q.options?.[1] || "",
          optionC: q.optionC || q.options?.[2] || "",
          optionD: q.optionD || q.options?.[3] || "",
          correctAnswer: q.correctAnswer || q.answer || "A",
          explanation: q.explanation || ""
        });
      }
      return material;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/subjects/${selectedSubjectId}/materials`] });
      setShowImportQuiz(false);
      setImportQuizJson("");
      setImportQuizTitle("");
      toast({ title: "Quiz imported successfully!" });
    },
    onError: (error) => {
      toast({ title: "Failed to import quiz", description: "Check JSON format", variant: "destructive" });
    },
  });

  const handleImportQuiz = () => {
    try {
      const questions = JSON.parse(importQuizJson);
      if (!Array.isArray(questions)) {
        toast({ title: "Invalid format", description: "JSON must be an array of questions", variant: "destructive" });
        return;
      }
      if (!selectedTopicId) {
        toast({ title: "Select a topic first", variant: "destructive" });
        return;
      }
      importQuizMutation.mutate({
        title: importQuizTitle || "Imported Quiz",
        topicId: selectedTopicId,
        questions
      });
    } catch (e) {
      toast({ title: "Invalid JSON", description: "Please check your JSON format", variant: "destructive" });
    }
  };

  // MCQ Maker - Create Topic + Generate MCQs in one step
  const createTopicWithMcqsMutation = useMutation({
    mutationFn: async (data: { text: string; subjectId: number; topicName: string; includeUrdu: boolean }) => {
      const res = await apiRequest("POST", "/api/ai/create-topic-with-mcqs", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/subjects/${selectedSubjectId}/topics`] });
      setShowMcqMaker(false);
      setMcqMakerTopicName("");
      setMcqMakerText("");
      setMcqMakerUrdu(false);
      setActiveJobId(data.jobId);
      setJobProgress({
        status: "processing",
        processedChunks: 0,
        totalChunks: data.totalChunks || 1,
        message: `Topic created! Generating MCQs (${data.totalChunks} chunks)...`
      });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create topic with MCQs", description: error?.message || "Please try again", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      {/* Theory Reader Full Screen View */}
      {showTheoryReader && selectedMaterial && (
        <TheoryReaderView 
          material={selectedMaterial} 
          onBack={handleBack} 
          isAdmin={isAdmin}
          selectedSubjectId={selectedSubjectId}
        />
      )}

      {/* Subjects View - Pastel Card Design */}
      {!showTheoryReader && viewMode === "subjects" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold font-heading flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                One Paper MCQs with Notes
              </h2>
              <p className="text-sm text-muted-foreground">Select a subject to attempt quizzes and study theory</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {isAuthenticated && (
                <Button 
                  variant="outline"
                  onClick={() => setViewMode("test-builder")}
                  data-testid="button-test-your-knowledge"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Test Your Knowledge
                </Button>
              )}
            {isAdmin && (
              <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-subject">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Subject</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Subject Name</Label>
                      <Input
                        placeholder="e.g., Pakistan Studies"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        data-testid="input-subject-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Brief description..."
                        value={newSubjectDesc}
                        onChange={(e) => setNewSubjectDesc(e.target.value)}
                        data-testid="input-subject-description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button 
                      onClick={() => createSubjectMutation.mutate({ name: newSubjectName, description: newSubjectDesc })}
                      disabled={!newSubjectName.trim() || createSubjectMutation.isPending}
                      data-testid="button-save-subject"
                    >
                      {createSubjectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Subject
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            </div>
          </div>

          {/* Subjects Grid - Same style as tabs */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No subjects available yet</p>
                {isAdmin && <p className="text-sm text-muted-foreground mt-1">Click "Add Subject" to create one</p>}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {subjects.map((subject, index) => {
                const color = subjectColors[index % subjectColors.length];
                return (
                  <SubjectCard
                    key={subject.id}
                    subject={subject}
                    color={color}
                    onClick={() => handleSubjectClick(subject.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Topics View - With Quiz Attempt and Theory buttons */}
      {!showTheoryReader && viewMode === "topics" && selectedSubjectId && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleBack} data-testid="button-topics-back">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div>
                <h2 className="text-xl font-bold font-heading">
                  {subjects.find(s => s.id === selectedSubjectId)?.name}
                </h2>
                <p className="text-sm text-muted-foreground">Select a topic to study or take a quiz</p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Dialog open={showMcqMaker} onOpenChange={setShowMcqMaker}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-new-topic-quiz">
                      <Sparkles className="w-4 h-4 mr-2" />
                      New Topic/Quiz
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-base">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        Create Topic with AI Quiz
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                      <div className="space-y-1">
                        <Label className="text-sm">Topic Name</Label>
                        <Input
                          placeholder="e.g., World Capitals..."
                          value={mcqMakerTopicName}
                          onChange={(e) => setMcqMakerTopicName(e.target.value)}
                          data-testid="input-mcq-maker-topic"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">Study Material</Label>
                        <Textarea
                          placeholder="Paste your content here..."
                          className="min-h-[120px] font-mono text-xs"
                          value={mcqMakerText}
                          onChange={(e) => setMcqMakerText(e.target.value)}
                          data-testid="textarea-mcq-maker-content"
                        />
                        <p className="text-xs text-muted-foreground">
                          {mcqMakerText.length} chars | ~{Math.ceil(mcqMakerText.length / 4000) * 15 || 0} MCQs
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">AI Model</Label>
                        <Select value={mcqMakerModel} onValueChange={setMcqMakerModel}>
                          <SelectTrigger className="h-9" data-testid="select-ai-model">
                            <SelectValue placeholder="Select AI Model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gemini">Gemini (Google AI)</SelectItem>
                            <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Switch
                          id="urdu-mcq-maker"
                          checked={mcqMakerUrdu}
                          onCheckedChange={setMcqMakerUrdu}
                          data-testid="switch-mcq-maker-urdu"
                        />
                        <Label htmlFor="urdu-mcq-maker" className="text-sm flex items-center gap-1">
                          <Languages className="w-3 h-3" /> Urdu Translation
                        </Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button 
                        onClick={() => createTopicWithMcqsMutation.mutate({ 
                          text: mcqMakerText, 
                          subjectId: selectedSubjectId!,
                          topicName: mcqMakerTopicName,
                          includeUrdu: mcqMakerUrdu
                        })}
                        disabled={!mcqMakerText.trim() || !mcqMakerTopicName.trim() || createTopicWithMcqsMutation.isPending}
                        data-testid="button-mcq-maker-generate"
                      >
                        {createTopicWithMcqsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Generate & Create
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={showAddTopic} onOpenChange={setShowAddTopic}>
                  <DialogTrigger asChild>
                    <Button variant="outline" data-testid="button-add-topic">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Topic
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Topic</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Topic Name</Label>
                        <Input
                          placeholder="e.g., Pakistan Movement"
                          value={newTopicName}
                          onChange={(e) => setNewTopicName(e.target.value)}
                          data-testid="input-topic-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Brief description..."
                          value={newTopicDesc}
                          onChange={(e) => setNewTopicDesc(e.target.value)}
                          data-testid="input-topic-description"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button 
                        onClick={() => createTopicMutation.mutate({ 
                          name: newTopicName, 
                          description: newTopicDesc,
                          subjectId: selectedSubjectId!
                        })}
                        disabled={!newTopicName.trim() || createTopicMutation.isPending}
                        data-testid="button-save-topic"
                      >
                        {createTopicMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Topic
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* Topics List with Quiz Attempt & Theory buttons */}
          {!topics?.length ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Lightbulb className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No topics available yet</p>
                {isAdmin && <p className="text-sm text-muted-foreground mt-1">Click "New Topic/Quiz" to create one with AI-generated MCQs</p>}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {topics.map((topic, index) => {
                const color = subjectColors[index % subjectColors.length];
                const topicMaterials = getMaterialsForTopic(topic.id);
                const mcqMaterial = topicMaterials.find(m => m.type === "mcq");
                const theoryMaterial = topicMaterials.find(m => m.type === "theory");
                
                return (
                  <Card 
                    key={topic.id} 
                    className={`${color.bg} ${color.border} border relative ${isEditMode ? "border-dashed border-indigo-400" : ""}`}
                    data-testid={`topic-card-${topic.id}`}
                  >
                    {isEditMode && isAdmin && selectedSubjectId && (
                      <TopicDeleteButton topicId={topic.id} subjectId={selectedSubjectId} />
                    )}
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.iconBg}`}>
                            <Lightbulb className={`w-6 h-6 ${color.icon}`} />
                          </div>
                          <div>
                            {isEditMode && isAdmin ? (
                              <EditableText
                                value={topic.name}
                                entityType="topic"
                                entityId={topic.id}
                                field="name"
                                className="font-semibold"
                                as="h3"
                              />
                            ) : (
                              <h3 className="font-semibold">{topic.name}</h3>
                            )}
                            <p className="text-sm text-muted-foreground">{topic.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                        <div className="flex gap-2 flex-wrap">
                          {!isAuthenticated ? (
                            <Button size="sm" asChild>
                              <Link href="/login">
                                <LogIn className="w-4 h-4 mr-2" />
                                Sign In to Access
                              </Link>
                            </Button>
                          ) : (
                            <>
                              {mcqMaterial ? (
                                <Button size="sm" asChild data-testid={`button-quiz-${topic.id}`}>
                                  <Link href={`/quiz/${mcqMaterial.id}`}>
                                    <Play className="w-4 h-4 mr-2" />
                                    Quiz
                                  </Link>
                                </Button>
                              ) : (
                                <Button size="sm" variant="secondary" disabled>
                                  <ClipboardList className="w-4 h-4 mr-2" />
                                  No Quiz
                                </Button>
                              )}
                              {theoryMaterial ? (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => openTheoryReader(theoryMaterial)}
                                  data-testid={`button-theory-${topic.id}`}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Theory
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" disabled>
                                  <FileText className="w-4 h-4 mr-2" />
                                  No Notes
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                        {isAdmin && isAuthenticated && (
                          <div className="flex gap-1 flex-wrap border-t pt-2 mt-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-xs h-7"
                              onClick={() => {
                                setSelectedTopicId(topic.id);
                                setShowGenerateMcq(true);
                              }}
                              data-testid={`button-generate-quiz-${topic.id}`}
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              Generate Quiz
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-xs h-7"
                              onClick={() => {
                                setSelectedTopicId(topic.id);
                                setShowImportQuiz(true);
                              }}
                              data-testid={`button-import-quiz-${topic.id}`}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Import Quiz
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-xs h-7"
                              onClick={() => {
                                setSelectedTopicId(topic.id);
                                setShowAddTheory(true);
                              }}
                              data-testid={`button-add-theory-${topic.id}`}
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              Add Theory
                            </Button>
                          </div>
                        )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Test Your Knowledge View */}
      {!showTheoryReader && viewMode === "test-builder" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setViewMode("subjects");
                setTestConfig({});
                setTotalTestQuestions(0);
              }} 
              data-testid="button-test-builder-back"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h2 className="text-xl font-bold font-heading flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Test Your Knowledge
              </h2>
              <p className="text-sm text-muted-foreground">Create a custom quiz from multiple subjects and topics</p>
            </div>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Select Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subjects.map((subject) => (
                <div key={subject.id} className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-muted-foreground" />
                    {subject.name}
                  </h4>
                  <TestBuilderTopics 
                    subjectId={subject.id}
                    testConfig={testConfig}
                    setTestConfig={setTestConfig}
                    totalTestQuestions={totalTestQuestions}
                    setTotalTestQuestions={setTotalTestQuestions}
                  />
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Total Questions: <span className="font-bold text-foreground">{totalTestQuestions}</span>
              </p>
              <Button 
                disabled={totalTestQuestions === 0}
                data-testid="button-start-custom-quiz"
                onClick={() => {
                  sessionStorage.setItem("customQuizConfig", JSON.stringify(testConfig));
                  window.location.href = "/quiz/custom";
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Quiz
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Generate MCQ Dialog */}
      <Dialog open={showGenerateMcq} onOpenChange={setShowGenerateMcq}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Generate Quiz from Notes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quiz Title</Label>
              <Input
                placeholder="e.g., Chapter 1 Quiz"
                value={mcqTitle}
                onChange={(e) => setMcqTitle(e.target.value)}
                data-testid="input-mcq-title"
              />
            </div>
            <div className="space-y-2">
              <Label>Paste Your Notes/Content</Label>
              <Textarea
                placeholder="Paste the content you want to generate MCQs from..."
                className="min-h-[200px] font-mono text-sm"
                value={mcqText}
                onChange={(e) => setMcqText(e.target.value)}
                data-testid="textarea-mcq-content"
              />
              <p className="text-xs text-muted-foreground">
                {mcqText.length} characters | Estimated: ~{Math.ceil(mcqText.length / 4000) * 15 || 0} MCQs
              </p>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Switch
                id="urdu-switch"
                checked={includeUrdu}
                onCheckedChange={setIncludeUrdu}
                data-testid="switch-include-urdu"
              />
              <Label htmlFor="urdu-switch" className="text-sm flex items-center gap-1">
                <Languages className="w-3 h-3" /> Include Urdu Translation
              </Label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={() => generateMcqsMutation.mutate({ 
                text: mcqText, 
                topicId: selectedTopicId!,
                title: mcqTitle,
                includeUrdu
              })}
              disabled={!mcqText.trim() || !mcqTitle.trim() || generateMcqsMutation.isPending}
              data-testid="button-generate-mcqs"
            >
              {generateMcqsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generate MCQs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Quiz JSON Dialog */}
      <Dialog open={showImportQuiz} onOpenChange={setShowImportQuiz}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Import Quiz from JSON
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quiz Title</Label>
              <Input
                placeholder="e.g., Pakistan History Quiz"
                value={importQuizTitle}
                onChange={(e) => setImportQuizTitle(e.target.value)}
                data-testid="input-import-quiz-title"
              />
            </div>
            <div className="space-y-2">
              <Label>Paste JSON Array of Questions</Label>
              <Textarea
                placeholder={`[
  {
    "question": "What is the capital of Pakistan?",
    "optionA": "Karachi",
    "optionB": "Lahore", 
    "optionC": "Islamabad",
    "optionD": "Peshawar",
    "correctAnswer": "C",
    "explanation": "Islamabad is the capital since 1967"
  }
]`}
                className="min-h-[200px] font-mono text-xs"
                value={importQuizJson}
                onChange={(e) => setImportQuizJson(e.target.value)}
                data-testid="textarea-import-quiz-json"
              />
              <p className="text-xs text-muted-foreground">
                Format: Array of objects with question, optionA-D, correctAnswer (A/B/C/D), explanation
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleImportQuiz}
              disabled={!importQuizJson.trim() || importQuizMutation.isPending}
              data-testid="button-import-quiz"
            >
              {importQuizMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Import Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Theory Dialog */}
      <Dialog open={showAddTheory} onOpenChange={setShowAddTheory}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Add Theory Notes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g., Introduction to Pakistan Movement"
                value={theoryTitle}
                onChange={(e) => setTheoryTitle(e.target.value)}
                data-testid="input-theory-title"
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                placeholder="Paste or write your theory content here..."
                className="min-h-[250px]"
                value={theoryContent}
                onChange={(e) => setTheoryContent(e.target.value)}
                data-testid="textarea-theory-content"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={() => addTheoryMutation.mutate({ 
                title: theoryTitle, 
                content: theoryContent,
                topicId: selectedTopicId!,
                type: "theory"
              })}
              disabled={!theoryTitle.trim() || !theoryContent.trim() || addTheoryMutation.isPending}
              data-testid="button-save-theory"
            >
              {addTheoryMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Theory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generation Progress Modal */}
      <Dialog open={!!jobProgress} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {jobProgress?.status === "completed" ? (
                <span className="text-green-500">Quiz Generated!</span>
              ) : jobProgress?.status === "failed" ? (
                <span className="text-red-500">Generation Failed</span>
              ) : (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span>Generating MCQs...</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{jobProgress?.message}</span>
                {jobProgress?.status === "processing" && (
                  <span className="text-muted-foreground">
                    {Math.round(((jobProgress?.processedChunks || 0) / (jobProgress?.totalChunks || 1)) * 100)}%
                  </span>
                )}
              </div>
              {jobProgress?.status === "processing" && (
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${((jobProgress?.processedChunks || 0) / (jobProgress?.totalChunks || 1)) * 100}%` }}
                  />
                </div>
              )}
            </div>
            {jobProgress?.status === "processing" && (
              <p className="text-xs text-muted-foreground text-center">
                Please wait while AI generates MCQs from your content. This may take 1-3 minutes depending on text length.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Test Builder Topics Component
function TestBuilderTopics({ 
  subjectId, 
  testConfig, 
  setTestConfig,
  totalTestQuestions,
  setTotalTestQuestions 
}: { 
  subjectId: number;
  testConfig: {[subjectId: number]: {[topicId: number]: number}};
  setTestConfig: React.Dispatch<React.SetStateAction<{[subjectId: number]: {[topicId: number]: number}}>>;
  totalTestQuestions: number;
  setTotalTestQuestions: React.Dispatch<React.SetStateAction<number>>;
}) {
  const { data: topics } = useQuery<Topic[]>({
    queryKey: [`/api/subjects/${subjectId}/topics`],
  });

  const updateTopicCount = (topicId: number, count: number, maxCount: number) => {
    const validCount = Math.max(0, Math.min(count, maxCount));
    setTestConfig(prev => {
      const oldCount = prev[subjectId]?.[topicId] || 0;
      const newConfig = {
        ...prev,
        [subjectId]: {
          ...prev[subjectId],
          [topicId]: validCount
        }
      };
      setTotalTestQuestions(prev => prev - oldCount + validCount);
      return newConfig;
    });
  };

  if (!topics || topics.length === 0) {
    return <p className="text-sm text-muted-foreground pl-6">No topics available</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pl-6">
      {topics.map(topic => (
        <TestBuilderTopicItem 
          key={topic.id}
          topic={topic}
          count={testConfig[subjectId]?.[topic.id] || 0}
          onCountChange={(count, maxCount) => updateTopicCount(topic.id, count, maxCount)}
        />
      ))}
    </div>
  );
}

// Test Builder Topic Item
function TestBuilderTopicItem({ 
  topic, 
  count, 
  onCountChange 
}: { 
  topic: Topic;
  count: number;
  onCountChange: (count: number, maxCount: number) => void;
}) {
  const { data: materials } = useQuery<Material[]>({
    queryKey: [`/api/topics/${topic.id}/materials`],
  });

  const mcqMaterial = materials?.find(m => m.type === "mcq");
  
  const { data: mcqQuestions } = useQuery<McqQuestion[]>({
    queryKey: [`/api/materials/${mcqMaterial?.id}/mcq-questions`],
    enabled: !!mcqMaterial?.id,
  });
  
  const maxQuestions = mcqQuestions?.length || 0;

  return (
    <div className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-md">
      <span className="text-sm truncate flex-1">{topic.name}</span>
      <div className="flex items-center gap-1">
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => onCountChange(count - 1, maxQuestions)}
          disabled={count === 0}
        >
          <Minus className="w-3 h-3" />
        </Button>
        <span className="text-sm w-10 text-center">{count}/{maxQuestions}</span>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => onCountChange(count + 1, maxQuestions)}
          disabled={count >= maxQuestions || maxQuestions === 0}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

// Tab 2: PMS/CSS/Written
function PmsCssWrittenTab({ isAdmin, isAuthenticated }: { isAdmin: boolean; isAuthenticated: boolean }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectDesc, setNewSubjectDesc] = useState("");

  const { data: subjects, isLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const createSubjectMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await apiRequest("POST", "/api/admin/subjects", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      setShowAddSubject(false);
      setNewSubjectName("");
      setNewSubjectDesc("");
      toast({ title: "Subject created successfully" });
    },
  });

  const subjectColors = [
    { bg: "bg-blue-100 dark:bg-blue-900/50", border: "border-blue-200 dark:border-blue-800", icon: "text-blue-600 dark:text-blue-400" },
    { bg: "bg-purple-100 dark:bg-purple-900/50", border: "border-purple-200 dark:border-purple-800", icon: "text-purple-600 dark:text-purple-400" },
    { bg: "bg-pink-100 dark:bg-pink-900/50", border: "border-pink-200 dark:border-pink-800", icon: "text-pink-600 dark:text-pink-400" },
    { bg: "bg-amber-100 dark:bg-amber-900/50", border: "border-amber-200 dark:border-amber-800", icon: "text-amber-600 dark:text-amber-400" },
    { bg: "bg-emerald-100 dark:bg-emerald-900/50", border: "border-emerald-200 dark:border-emerald-800", icon: "text-emerald-600 dark:text-emerald-400" },
    { bg: "bg-indigo-100 dark:bg-indigo-900/50", border: "border-indigo-200 dark:border-indigo-800", icon: "text-indigo-600 dark:text-indigo-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold font-heading flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            PMS/CSS/Written Exams
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Click on a subject to view and manage topics, sub-topics, and content
          </p>
        </div>
        {isAdmin && (
          <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-written-subject">
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Written Exam Subject</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Subject Name</Label>
                  <Input
                    placeholder="e.g., Essay Writing"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    data-testid="input-new-subject-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Brief description..."
                    value={newSubjectDesc}
                    onChange={(e) => setNewSubjectDesc(e.target.value)}
                    data-testid="textarea-new-subject-desc"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  onClick={() => createSubjectMutation.mutate({ name: newSubjectName, description: newSubjectDesc })}
                  disabled={!newSubjectName.trim() || createSubjectMutation.isPending}
                  data-testid="button-save-new-subject"
                >
                  Save Subject
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : !subjects?.length ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No subjects available yet</p>
            {isAdmin && <p className="text-sm text-muted-foreground mt-1">Click "Add Subject" to create one</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {subjects.map((subject, index) => {
            const color = subjectColors[index % subjectColors.length];
            return (
              <div
                key={subject.id}
                className={`p-5 rounded-xl cursor-pointer transition-all shadow-md border ${color.bg} ${color.border} hover:shadow-lg hover:scale-[1.02]`}
                onClick={() => navigate(`/subjects/${subject.id}`)}
                data-testid={`pms-subject-card-${subject.id}`}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/50 dark:bg-black/20`}>
                    <BookOpen className={`w-6 h-6 ${color.icon}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{subject.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{subject.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ChevronRight className="w-3 h-3" />
                    <span>View Topics</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Tab 3: Essay Builder
function EssayBuilderTab({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { toast } = useToast();
  const [essayTopic, setEssayTopic] = useState("");
  const [essayStructure, setEssayStructure] = useState<any>(null);

  const generateEssayMutation = useMutation({
    mutationFn: async (topic: string) => {
      const res = await apiRequest("POST", "/api/ai/generate-essay", { topic });
      return res.json();
    },
    onSuccess: (data) => {
      setEssayStructure(data);
      toast({ title: "Essay structure generated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to generate essay structure", variant: "destructive" });
    },
  });

  const howToSteps = [
    { step: 1, title: "Enter Your Topic", desc: "Provide a specific essay topic related to CSS subjects, current affairs, or academic themes for comprehensive analysis", icon: PenTool, color: "text-blue-500 bg-blue-100 dark:bg-blue-900/50" },
    { step: 2, title: "AI Analysis", desc: "Gemini 2.0 Flash generates comprehensive outlines, multi-dimensional arguments, case studies, and expert writing guidance", icon: Sparkles, color: "text-purple-500 bg-purple-100 dark:bg-purple-900/50" },
    { step: 3, title: "Build Your Essay", desc: "Use the structured content, professional tips, and case studies to write a high-scoring CSS examination essay", icon: FileText, color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/50" },
  ];

  const essayRequirements = [
    "3000-3500 words (optimal length)",
    "Clear introduction with thesis statement",
    "Multi-dimensional analysis approach",
    "Evidence-based arguments with sources",
    "Professional academic tone",
    "Forward-looking conclusions"
  ];

  const scoringCriteria = [
    "Original insights (avoid rote learning)",
    "Critical analysis and evaluation",
    "Clarity and coherence",
    "Grammatical accuracy",
    "Balanced perspective",
    "Policy awareness and recommendations"
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/50 dark:to-rose-900/50 flex items-center justify-center mx-auto mb-4">
          <PenTool className="w-8 h-8 text-pink-600 dark:text-pink-400" />
        </div>
        <h2 className="text-2xl font-bold font-heading">CSS Essay Builder</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Generate comprehensive, CSS-examiner friendly essay structures with professional outlines, multi-dimensional arguments, relevant case studies, and expert writing guidance
        </p>
      </div>

      {/* Topic Input Section */}
      <Card className="max-w-3xl mx-auto bg-gradient-to-br from-pink-50 to-rose-50 dark:from-slate-800 dark:to-slate-800 border-pink-200 dark:border-pink-900/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PenTool className="w-5 h-5 text-pink-600" />
            Enter Your Essay Topic
          </CardTitle>
          <CardDescription>
            Provide a specific topic for comprehensive CSS-standard analysis and outline generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="e.g., Climate Change and Global Security, Pakistan's Economic Challenges, AI and Future of Work..."
            className="text-base"
            value={essayTopic}
            onChange={(e) => setEssayTopic(e.target.value)}
            data-testid="input-essay-topic"
          />
          {!isAuthenticated ? (
            <Button asChild className="w-full">
              <Link href="/login">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In to Generate
              </Link>
            </Button>
          ) : (
            <Button 
              className="w-full"
              onClick={() => generateEssayMutation.mutate(essayTopic)}
              disabled={!essayTopic.trim() || generateEssayMutation.isPending}
              data-testid="button-generate-essay"
            >
              {generateEssayMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Essay Structure
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Generated Essay Structure */}
      {essayStructure && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-lg">Generated Essay Structure</CardTitle>
            <CardDescription>Use this outline to write your CSS examination essay</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
                {essayStructure.content || essayStructure.structure || JSON.stringify(essayStructure, null, 2)}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* How to Use Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          How to Use the CSS Essay Builder
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Follow these steps to generate comprehensive, CSS-examiner friendly essay structures
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {howToSteps.map((item) => (
            <Card key={item.step} className="hover-elevate">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {item.step}
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CSS Examination Standards */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          CSS Examination Standards
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Essay Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {essayRequirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-slate-800 dark:to-slate-800 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-purple-500" />
                Scoring Criteria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {scoringCriteria.map((criteria, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                    {criteria}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Tab 4: News Provider
function NewsProviderTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-heading flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary" />
          News Provider
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Stay updated with current affairs and news
        </p>
      </div>

      <Card className="glass-card max-w-4xl">
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-sm max-w-md mx-auto">
              News aggregation feature will be available soon. Stay tuned for updates on current affairs, 
              national and international news relevant to your exam preparation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Tab 5: Article Analyzer
function ArticleAnalyzerTab({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { toast } = useToast();
  const [articleText, setArticleText] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);

  const analyzeMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/ai/analyze-article", { text });
      return res.json();
    },
    onSuccess: (data) => {
      setAnalysis(data);
    },
    onError: () => {
      toast({ title: "Failed to analyze article", variant: "destructive" });
    },
  });

  if (!isAuthenticated) {
    return (
      <Card className="glass-card max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <Sparkles className="w-12 h-12 mx-auto text-primary mb-2" />
          <CardTitle>Article Analyzer</CardTitle>
          <CardDescription>Sign in to analyze articles with AI</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-heading flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Article Analyzer
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Extract vocabulary, key points, and analytical angles from articles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paste Article</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste your article text here..."
              className="min-h-[300px]"
              value={articleText}
              onChange={(e) => setArticleText(e.target.value)}
              data-testid="textarea-article-input"
            />
            <Button 
              onClick={() => analyzeMutation.mutate(articleText)}
              disabled={!articleText.trim() || analyzeMutation.isPending}
              className="w-full"
              data-testid="button-analyze"
            >
              {analyzeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Article
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            {!analysis ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Paste an article and click Analyze</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Key Vocabulary</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.vocabulary?.map((item: any, i: number) => (
                        <Badge key={i} variant="secondary" title={item.definition}>
                          {item.word}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Key Points</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {analysis.keyPoints?.map((point: string, i: number) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Analytical Angles</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {analysis.analyticalAngles?.map((angle: string, i: number) => (
                        <li key={i}>{angle}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Counter-Narratives</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {analysis.counterNarratives?.map((counter: string, i: number) => (
                        <li key={i}>{counter}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Tab 6: Vocabulary
function VocabularyTab({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-heading flex items-center gap-2">
          <BookA className="w-5 h-5 text-primary" />
          Vocabulary Builder
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Build and practice your vocabulary
        </p>
      </div>

      <Card className="glass-card max-w-4xl">
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            <BookA className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-sm max-w-md mx-auto">
              Vocabulary builder with flashcards, word lists, and practice exercises 
              will be available soon to enhance your language skills.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Tab 7: Tutorial/Guide
function TutorialGuideTab({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { isEditMode } = useEditMode();
  const { isAdmin } = useAuth();
  
  const { data: siteSettings } = useQuery<{ [key: string]: string }>({
    queryKey: ["/api/site-settings"],
  });

  const getSetting = (key: string, defaultValue: string = "") => 
    siteSettings?.[key] || defaultValue;

  const features = [
    {
      title: "Study Planner",
      desc: "Create personalized study plans with AI-powered scheduling, topic prioritization, and progress tracking for CSS/PMS preparation.",
      icon: ClipboardList,
      color: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
    },
    {
      title: "One Paper MCQs",
      desc: "Generate comprehensive MCQ quizzes from any study material using AI. Supports both English and Urdu translations.",
      icon: Sparkles,
      color: "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400"
    },
    {
      title: "Article Analyzer",
      desc: "Paste any article and get AI-powered summaries, key insights, vocabulary extraction, and multi-angle analysis.",
      icon: FileText,
      color: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "Essay Builder",
      desc: "Generate comprehensive essay outlines with multi-dimensional arguments, case studies, and writing tips.",
      icon: PenTool,
      color: "bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400"
    },
    {
      title: "Theory Notes",
      desc: "Study materials are automatically saved alongside quizzes. Access theory notes anytime for complete learning.",
      icon: BookOpen,
      color: "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
    },
    {
      title: "Urdu Support",
      desc: "All MCQs, questions, options, and explanations are available in both English and Urdu languages.",
      icon: Languages,
      color: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
    }
  ];

  const howToSteps = [
    {
      step: 1,
      title: "Select a Subject",
      desc: "Go to One Paper MCQs tab and click on any subject card to explore topics."
    },
    {
      step: 2,
      title: "Choose Quiz or Theory",
      desc: "Each topic shows Quiz Attempt and Theory buttons. Take quizzes or read study notes."
    },
    {
      step: 3,
      title: "Generate New Content (Admin)",
      desc: "Admins can paste study material to auto-generate MCQs using AI with Urdu translation support."
    },
    {
      step: 4,
      title: "Track Progress",
      desc: "View your quiz scores and track learning progress over time."
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/50 dark:to-pink-900/50 flex items-center justify-center mx-auto mb-4">
          <Lightbulb className="w-8 h-8 text-rose-600 dark:text-rose-400" />
        </div>
        <h2 className={`text-2xl font-bold font-heading ${isEditMode && isAdmin ? "border-dashed border-2 border-rose-400 rounded p-1 inline-block" : ""}`}>
          {isEditMode && isAdmin ? (
            <EditableText
              value={getSetting("welcome_title", "Welcome to Learn with Durrani")}
              settingKey="welcome_title"
              className="font-bold text-2xl"
            />
          ) : (
            getSetting("welcome_title", "Welcome to Learn with Durrani")
          )}
        </h2>
        <p className={`text-muted-foreground mt-2 max-w-2xl mx-auto ${isEditMode && isAdmin ? "border-dashed border-2 border-rose-400 rounded p-1" : ""}`}>
          {isEditMode && isAdmin ? (
            <EditableText
              value={getSetting("welcome_description", "Your Personal CSS/PMS Research & AI Assistant. Plan your studies, analyze articles, build essays, and get instant answers with AI-powered tools.")}
              settingKey="welcome_description"
              className="text-muted-foreground"
            />
          ) : (
            getSetting("welcome_description", "Your Personal CSS/PMS Research & AI Assistant. Plan your studies, analyze articles, build essays, and get instant answers with AI-powered tools.")
          )}
        </p>
      </div>

      {/* Daily Practice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <BookA className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Word of the Day</h4>
                <p className="text-xs text-muted-foreground">Vocabulary Builder</p>
              </div>
            </div>
            <p className={`text-xl font-bold ${isEditMode && isAdmin ? "border-dashed border border-blue-400 rounded p-1" : ""}`}>
              {isEditMode && isAdmin ? (
                <EditableText value={getSetting("word_of_day", "Perspicacious")} settingKey="word_of_day" className="font-bold text-xl" />
              ) : getSetting("word_of_day", "Perspicacious")}
            </p>
            <p className={`text-sm text-muted-foreground mt-1 ${isEditMode && isAdmin ? "border-dashed border border-blue-400 rounded p-1" : ""}`}>
              {isEditMode && isAdmin ? (
                <EditableText value={getSetting("word_of_day_meaning", "Having keen mental perception and understanding")} settingKey="word_of_day_meaning" className="text-sm" />
              ) : getSetting("word_of_day_meaning", "Having keen mental perception and understanding")}
            </p>
            <p className={`text-xs text-muted-foreground mt-2 italic ${isEditMode && isAdmin ? "border-dashed border border-blue-400 rounded p-1" : ""}`}>
              {isEditMode && isAdmin ? (
                <EditableText value={getSetting("word_of_day_usage", "Used in: His perspicacious analysis impressed the examiners.")} settingKey="word_of_day_usage" className="text-xs italic" />
              ) : getSetting("word_of_day_usage", "Used in: His perspicacious analysis impressed the examiners.")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">MCQ of the Day</h4>
                <p className="text-xs text-muted-foreground">Quick Knowledge Check</p>
              </div>
            </div>
            <p className={`text-sm font-medium ${isEditMode && isAdmin ? "border-dashed border border-purple-400 rounded p-1" : ""}`}>
              {isEditMode && isAdmin ? (
                <EditableText value={getSetting("mcq_of_day_question", "Who was the first Governor-General of Pakistan?")} settingKey="mcq_of_day_question" className="text-sm font-medium" />
              ) : getSetting("mcq_of_day_question", "Who was the first Governor-General of Pakistan?")}
            </p>
            <div className="mt-3 space-y-1.5">
              <div className={`text-xs p-2 rounded bg-white/60 dark:bg-slate-700/50 ${isEditMode && isAdmin ? "border-dashed border border-purple-400" : ""}`}>
                {isEditMode && isAdmin ? (
                  <EditableText value={getSetting("mcq_of_day_option_a", "A) Liaquat Ali Khan")} settingKey="mcq_of_day_option_a" className="text-xs" />
                ) : getSetting("mcq_of_day_option_a", "A) Liaquat Ali Khan")}
              </div>
              <div className={`text-xs p-2 rounded bg-white/60 dark:bg-slate-700/50 ${isEditMode && isAdmin ? "border-dashed border border-purple-400" : ""}`}>
                {isEditMode && isAdmin ? (
                  <EditableText value={getSetting("mcq_of_day_option_b", "B) Muhammad Ali Jinnah")} settingKey="mcq_of_day_option_b" className="text-xs" />
                ) : getSetting("mcq_of_day_option_b", "B) Muhammad Ali Jinnah")}
              </div>
              <div className={`text-xs p-2 rounded bg-white/60 dark:bg-slate-700/50 ${isEditMode && isAdmin ? "border-dashed border border-purple-400" : ""}`}>
                {isEditMode && isAdmin ? (
                  <EditableText value={getSetting("mcq_of_day_option_c", "C) Khawaja Nazimuddin")} settingKey="mcq_of_day_option_c" className="text-xs" />
                ) : getSetting("mcq_of_day_option_c", "C) Khawaja Nazimuddin")}
              </div>
            </div>
            <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setActiveTab("one-paper")}>
              Take More Quizzes
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30 border-pink-200 dark:border-pink-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center">
                <PenTool className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Essay Prompt</h4>
                <p className="text-xs text-muted-foreground">Daily Practice</p>
              </div>
            </div>
            <p className={`text-sm font-medium ${isEditMode && isAdmin ? "border-dashed border border-pink-400 rounded p-1" : ""}`}>
              {isEditMode && isAdmin ? (
                <EditableText value={getSetting("essay_prompt_title", "\"Climate Change and Pakistan's Economy: Challenges and Opportunities\"")} settingKey="essay_prompt_title" className="text-sm font-medium" />
              ) : getSetting("essay_prompt_title", "\"Climate Change and Pakistan's Economy: Challenges and Opportunities\"")}
            </p>
            <p className={`text-xs text-muted-foreground mt-2 ${isEditMode && isAdmin ? "border-dashed border border-pink-400 rounded p-1" : ""}`}>
              {isEditMode && isAdmin ? (
                <EditableText value={getSetting("essay_prompt_desc", "Analyze the economic implications of climate change on Pakistan's agricultural and industrial sectors.")} settingKey="essay_prompt_desc" className="text-xs" />
              ) : getSetting("essay_prompt_desc", "Analyze the economic implications of climate change on Pakistan's agricultural and industrial sectors.")}
            </p>
            <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setActiveTab("essay")}>
              Start Essay Builder
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Powerful Tools for Academic Excellence
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <Card key={index} className="hover-elevate">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{feature.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How to Use */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          How to Use This Application
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {howToSteps.map((item) => (
            <Card key={item.step} className="hover-elevate">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats */}
      <Card className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 border-0">
        <CardContent className="py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-blue-600">600+</p>
              <p className="text-sm text-muted-foreground">MCQs Generated</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600">200+</p>
              <p className="text-sm text-muted-foreground">Essays Analyzed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-pink-600">1000+</p>
              <p className="text-sm text-muted-foreground">Facts Retrieved</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-600">50+</p>
              <p className="text-sm text-muted-foreground">Active Students</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Founder Section */}
      <Card className="border-2 border-indigo-200 dark:border-indigo-800">
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg ring-4 ring-indigo-100 dark:ring-indigo-900">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
            <div className="text-center md:text-left flex-1">
              <h3 className={`text-xl font-bold mb-1 ${isEditMode ? "border-dashed border-2 border-indigo-400 rounded p-1" : ""}`}>
                {isEditMode && isAdmin ? (
                  <EditableText
                    value={getSetting("founder_name", "Mudassar Ali Durrani")}
                    settingKey="founder_name"
                    className="font-bold text-xl"
                  />
                ) : (
                  getSetting("founder_name", "Mudassar Ali Durrani")
                )}
              </h3>
              <p className={`text-indigo-600 dark:text-indigo-400 font-medium mb-3 ${isEditMode ? "border-dashed border-2 border-indigo-400 rounded p-1" : ""}`}>
                {isEditMode && isAdmin ? (
                  <EditableText
                    value={getSetting("founder_title", "Founder / CEO / Innovator")}
                    settingKey="founder_title"
                    className="font-medium"
                  />
                ) : (
                  getSetting("founder_title", "Founder / CEO / Innovator")
                )}
              </p>
              <p className={`text-muted-foreground text-sm max-w-xl ${isEditMode ? "border-dashed border-2 border-indigo-400 rounded p-1" : ""}`}>
                {isEditMode && isAdmin ? (
                  <EditableText
                    value={getSetting("founder_bio", "Dedicated to empowering CSS/PMS aspirants with cutting-edge AI tools and comprehensive study materials. Building the future of competitive exam preparation in Pakistan.")}
                    settingKey="founder_bio"
                    className="text-sm"
                  />
                ) : (
                  getSetting("founder_bio", "Dedicated to empowering CSS/PMS aspirants with cutting-edge AI tools and comprehensive study materials. Building the future of competitive exam preparation in Pakistan.")
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact/Support */}
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Contact us for any questions or feedback about the application.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>Designed for CSS/PMS Excellence</span>
              <span className="text-xs">|</span>
              <span>Learn with Durrani</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
