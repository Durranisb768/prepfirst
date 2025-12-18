import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EditModeProvider } from "@/contexts/EditModeContext";
import { useAuth } from "@/hooks/use-auth";
import Dashboard from "@/pages/dashboard";
import SubjectView from "@/pages/subject-view";
import TopicView from "@/pages/topic-view";
import ContentView from "@/pages/content-view";
import MaterialView from "@/pages/material-view";
import AdminPanel from "@/pages/admin-panel";
import LoginPage from "@/pages/login";
import AiToolsPage from "@/pages/ai-tools";
import QuizPlayerPage from "@/pages/quiz-player";
import QuizResultsPage from "@/pages/quiz-results";
import CustomQuizPage from "@/pages/custom-quiz";
import MentorChatPage from "@/pages/mentor-chat";
import NotFound from "@/pages/not-found";
import { Skeleton } from "@/components/ui/skeleton";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return <Component />;
}

function AdminRoute() {
  const { isAdmin, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  if (!isAdmin) {
    return <Redirect to="/" />;
  }
  
  return <AdminPanel />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/login" component={LoginPage} />
      <Route path="/subjects/:id" component={SubjectView} />
      <Route path="/topics/:id" component={TopicView} />
      <Route path="/topics/:id/view" component={ContentView} />
      <Route path="/materials/:id">{() => <ProtectedRoute component={MaterialView} />}</Route>
      <Route path="/ai-tools" component={AiToolsPage} />
      <Route path="/quiz/custom">{() => <ProtectedRoute component={CustomQuizPage} />}</Route>
      <Route path="/quiz/results" component={QuizResultsPage} />
      <Route path="/quiz/:materialId" component={QuizPlayerPage} />
      <Route path="/mentor" component={MentorChatPage} />
      <Route path="/admin" component={AdminRoute} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <EditModeProvider>
          <Router />
          <Toaster />
        </EditModeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
