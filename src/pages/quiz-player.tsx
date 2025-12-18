import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, CheckCircle, XCircle, Lightbulb, Languages, Save, Loader2, LogIn } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { McqQuestion, Material } from "@shared/schema";

interface UserAnswer {
  questionId: number;
  selectedAnswer: string;
  isCorrect: boolean;
}

export default function QuizPlayerPage() {
  const [, params] = useRoute("/quiz/:materialId");
  const materialId = params?.materialId ? parseInt(params.materialId) : 0;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});
  const [showUrdu, setShowUrdu] = useState(false);
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [retryQuestionIds, setRetryQuestionIds] = useState<number[]>([]);

  useEffect(() => {
    const storedIds = sessionStorage.getItem("retryQuestionIds");
    if (storedIds) {
      try {
        const ids = JSON.parse(storedIds);
        if (Array.isArray(ids) && ids.length > 0) {
          setRetryQuestionIds(ids);
          setIsRetryMode(true);
        }
      } catch (e) {
        console.error("Failed to parse retry question IDs");
      }
      sessionStorage.removeItem("retryQuestionIds");
    }
  }, []);

  const { data: material, isLoading: materialLoading } = useQuery<Material>({
    queryKey: ["/api/materials", materialId],
    enabled: materialId > 0,
  });

  const { data: allQuestions = [], isLoading: questionsLoading } = useQuery<McqQuestion[]>({
    queryKey: [`/api/materials/${materialId}/mcq-questions`],
    enabled: materialId > 0,
  });

  const questions = isRetryMode && retryQuestionIds.length > 0
    ? allQuestions.filter(q => retryQuestionIds.includes(q.id))
    : allQuestions;

  const submitAttemptMutation = useMutation({
    mutationFn: async (data: { materialId: number; answers: UserAnswer[] }) => {
      const correctCount = data.answers.filter(a => a.isCorrect).length;
      const score = data.answers.length > 0 ? Math.round((correctCount / data.answers.length) * 100) : 0;
      
      return apiRequest("POST", "/api/quiz-attempts", {
        materialId: data.materialId,
        totalQuestions: data.answers.length,
        correctAnswers: correctCount,
        score,
        answers: data.answers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress"] });
      toast({ title: "Quiz saved!", description: "Your results have been recorded." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save quiz results.", variant: "destructive" });
    },
  });

  const handleSelectAnswer = (questionIndex: number, answer: string) => {
    if (selectedAnswers[questionIndex]) return;
    
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const toggleExplanation = (index: number) => {
    setShowExplanations(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleSubmitQuiz = async () => {
    const answers: UserAnswer[] = questions.map((q, index) => ({
      questionId: q.id,
      selectedAnswer: selectedAnswers[index] || "",
      isCorrect: selectedAnswers[index] === q.correctAnswer,
    })).filter(a => a.selectedAnswer !== "");

    await submitAttemptMutation.mutateAsync({ materialId, answers });
    
    sessionStorage.setItem("quizResults", JSON.stringify({
      materialId,
      materialTitle: material?.title,
      answers,
      questions,
    }));
    
    navigate("/quiz/results");
  };

  const getOptionStyle = (questionIndex: number, option: string) => {
    const selected = selectedAnswers[questionIndex];
    const question = questions[questionIndex];
    
    if (!selected) {
      return "bg-background border-border hover-elevate cursor-pointer";
    }
    
    const isCorrectOption = option === question?.correctAnswer;
    const isSelectedOption = option === selected;
    
    if (isCorrectOption) {
      return "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-200";
    }
    if (isSelectedOption && !isCorrectOption) {
      return "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-200";
    }
    return "bg-muted/50 border-muted opacity-60";
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = Object.entries(selectedAnswers).filter(([idx, ans]) => {
    return questions[parseInt(idx)]?.correctAnswer === ans;
  }).length;

  const hasUrdu = questions.some(q => q.questionUrdu);

  if (authLoading || materialLoading || questionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <div className="text-center space-y-3">
          <LogIn className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold">Login Required</h2>
          <p className="text-muted-foreground max-w-md">
            Please sign in to access quizzes and track your progress.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/dashboard")} data-testid="button-back-dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button onClick={() => navigate("/login")} data-testid="button-login">
            <LogIn className="w-4 h-4 mr-2" /> Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">No questions found for this quiz.</p>
        <Button onClick={() => navigate("/dashboard")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/dashboard")}
              data-testid="button-quit-quiz"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            
            <div className="flex-1 text-center">
              <h1 className="font-semibold truncate">
                {isRetryMode ? "Retry Mistakes: " : ""}{material?.title || "Quiz"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {answeredCount} / {questions.length} answered
                {isRetryMode && ` (${questions.length} mistakes)`}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {hasUrdu && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="urdu-toggle"
                    checked={showUrdu}
                    onCheckedChange={setShowUrdu}
                    data-testid="switch-urdu"
                  />
                  <Label htmlFor="urdu-toggle" className="text-xs flex items-center gap-1">
                    <Languages className="w-4 h-4" /> Urdu
                  </Label>
                </div>
              )}
              <Badge variant="secondary" className="gap-1">
                <Save className="w-3 h-3" />
                Auto-saved
              </Badge>
            </div>
          </div>
          <Progress value={(answeredCount / questions.length) * 100} className="mt-2 h-2" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {questions.map((question, qIndex) => {
          const hasAnswered = !!selectedAnswers[qIndex];
          const showExp = showExplanations[qIndex];
          
          const options = [
            { key: "A", value: question.optionA, urdu: question.optionAUrdu },
            { key: "B", value: question.optionB, urdu: question.optionBUrdu },
            { key: "C", value: question.optionC, urdu: question.optionCUrdu },
            { key: "D", value: question.optionD, urdu: question.optionDUrdu },
          ].filter(opt => opt.value);

          return (
            <Card key={question.id} className="overflow-visible" data-testid={`card-question-${qIndex}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex gap-2">
                  <span className="text-muted-foreground flex-shrink-0">{qIndex + 1}.</span>
                  <div className="flex-1">
                    <p>{question.question}</p>
                    {showUrdu && question.questionUrdu && (
                      <p className="text-right mt-2 text-muted-foreground" dir="rtl" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}>
                        {question.questionUrdu}
                      </p>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2">
                  {options.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectAnswer(qIndex, opt.key)}
                      disabled={hasAnswered}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${getOptionStyle(qIndex, opt.key)}`}
                      data-testid={`option-${qIndex}-${opt.key}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="font-semibold text-sm w-6">{opt.key}.</span>
                        <div className="flex-1">
                          <p>{opt.value}</p>
                          {showUrdu && opt.urdu && (
                            <p className="text-right text-sm text-muted-foreground mt-1" dir="rtl" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}>
                              {opt.urdu}
                            </p>
                          )}
                        </div>
                        {hasAnswered && opt.key === question.correctAnswer && (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        )}
                        {hasAnswered && selectedAnswers[qIndex] === opt.key && opt.key !== question.correctAnswer && (
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {hasAnswered && (
                  <div className="pt-2 space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExplanation(qIndex)}
                      className="text-primary"
                      data-testid={`button-explanation-${qIndex}`}
                    >
                      <Lightbulb className="w-4 h-4 mr-1" />
                      {showExp ? "Hide" : "Show"} Explanation
                    </Button>
                    
                    {showExp && question.explanation && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm">{question.explanation}</p>
                        {showUrdu && question.explanationUrdu && (
                          <p className="text-sm text-muted-foreground mt-2 text-right" dir="rtl" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}>
                            {question.explanationUrdu}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="text-sm">
            <span className="text-green-600 font-semibold">{correctCount}</span>
            <span className="text-muted-foreground"> correct of </span>
            <span className="font-semibold">{answeredCount}</span>
            <span className="text-muted-foreground"> answered</span>
          </div>
          <Button 
            onClick={handleSubmitQuiz}
            disabled={answeredCount === 0 || submitAttemptMutation.isPending}
            data-testid="button-submit-quiz"
          >
            {submitAttemptMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Quiz
          </Button>
        </div>
      </div>
    </div>
  );
}
