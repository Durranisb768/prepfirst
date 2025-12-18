import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Trophy, Home, RotateCcw } from "lucide-react";
import type { Material, McqQuestion } from "@shared/schema";

type TestConfig = {[subjectId: number]: {[topicId: number]: number}};

export default function CustomQuizPage() {
  const [, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{[key: number]: string}>({});
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedConfig = sessionStorage.getItem("customQuizConfig");
    if (storedConfig) {
      try {
        const config = JSON.parse(storedConfig) as TestConfig;
        setTestConfig(config);
      } catch {
        setLocation("/");
      }
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  useEffect(() => {
    if (!testConfig) return;

    const fetchQuestions = async () => {
      setIsLoading(true);
      const allQuestions: McqQuestion[] = [];
      
      const fetchPromises: Promise<void>[] = [];
      
      for (const subjectId of Object.keys(testConfig)) {
        const topicConfig = testConfig[parseInt(subjectId)];
        for (const topicId of Object.keys(topicConfig)) {
          const count = topicConfig[parseInt(topicId)];
          if (count > 0) {
            const promise = (async () => {
              try {
                const materialsRes = await fetch(`/api/topics/${topicId}/materials`, {
                  credentials: "include"
                });
                if (!materialsRes.ok) {
                  console.error(`Failed to fetch topic ${topicId}: ${materialsRes.status}`);
                  return;
                }
                const materials: Material[] = await materialsRes.json();
                const mcqMaterial = materials.find(m => m.type === "mcq");
                if (mcqMaterial) {
                  const fullMaterialRes = await fetch(`/api/materials/${mcqMaterial.id}`, {
                    credentials: "include"
                  });
                  if (!fullMaterialRes.ok) {
                    console.error(`Failed to fetch material ${mcqMaterial.id}: ${fullMaterialRes.status}`);
                    return;
                  }
                  const fullMaterial = await fullMaterialRes.json();
                  if (fullMaterial.mcqQuestions && fullMaterial.mcqQuestions.length > 0) {
                    const mcqs = fullMaterial.mcqQuestions as McqQuestion[];
                    const shuffled = [...mcqs].sort(() => Math.random() - 0.5);
                    allQuestions.push(...shuffled.slice(0, count));
                  }
                }
              } catch (error) {
                console.error("Error fetching questions:", error);
              }
            })();
            fetchPromises.push(promise);
          }
        }
      }
      
      await Promise.all(fetchPromises);
      
      const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
      setQuestions(shuffledQuestions);
      setIsLoading(false);
    };

    fetchQuestions();
  }, [testConfig]);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setHasAnswered(true);
    setAnswers(prev => ({ ...prev, [currentIndex]: answer }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(answers[currentIndex + 1] || null);
      setHasAnswered(!!answers[currentIndex + 1]);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setSelectedAnswer(answers[currentIndex - 1] || null);
      setHasAnswered(!!answers[currentIndex - 1]);
    }
  };

  const score = useMemo(() => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) correct++;
    });
    return correct;
  }, [questions, answers]);

  const handleRetry = () => {
    setCurrentIndex(0);
    setAnswers({});
    setShowResults(false);
    setSelectedAnswer(null);
    setHasAnswered(false);
    const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffledQuestions);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="animate-pulse">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-amber-500" />
              <p className="text-lg font-medium">Loading your custom quiz...</p>
              <p className="text-sm text-muted-foreground mt-2">Gathering questions from selected topics</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <p className="text-lg font-medium">No questions found</p>
            <p className="text-sm text-muted-foreground mt-2">The selected topics don't have any MCQs available yet.</p>
            <Button asChild className="mt-4">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen p-4 bg-background">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <Trophy className={`w-20 h-20 mx-auto mb-4 ${percentage >= 70 ? "text-amber-500" : "text-muted-foreground"}`} />
              <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div>
                <p className="text-5xl font-bold">{score}/{questions.length}</p>
                <p className="text-muted-foreground mt-1">{percentage}% Score</p>
              </div>
              <Progress value={percentage} className="h-3" />
              <p className="text-lg">
                {percentage >= 80 ? "Excellent work!" : 
                 percentage >= 60 ? "Good effort!" : 
                 "Keep practicing!"}
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={handleRetry} data-testid="button-retry-quiz">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button asChild data-testid="button-back-dashboard">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" asChild data-testid="button-quiz-back">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Exit Quiz
            </Link>
          </Button>
          <Badge variant="outline" className="text-sm">
            {currentIndex + 1} / {questions.length}
          </Badge>
        </div>

        <Progress value={progress} className="h-2" />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium leading-relaxed">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={selectedAnswer || ""} onValueChange={handleAnswer}>
              {["A", "B", "C", "D"].map((option) => {
                const optionKey = `option${option}` as keyof McqQuestion;
                const optionText = currentQuestion[optionKey] as string;
                if (!optionText) return null;
                
                const isCorrect = option === currentQuestion.correctAnswer;
                const isSelected = selectedAnswer === option;
                
                return (
                  <div 
                    key={option}
                    className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                      hasAnswered
                        ? isCorrect
                          ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                          : isSelected
                            ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                            : "border-border"
                        : isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => !hasAnswered && handleAnswer(option)}
                  >
                    <RadioGroupItem value={option} id={option} disabled={hasAnswered} />
                    <Label htmlFor={option} className="flex-1 cursor-pointer">
                      <span className="font-medium mr-2">{option}.</span>
                      {optionText}
                    </Label>
                    {hasAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {hasAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                  </div>
                );
              })}
            </RadioGroup>

            {hasAnswered && currentQuestion.explanation && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Explanation:</p>
                <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevious} 
            disabled={currentIndex === 0}
            data-testid="button-prev-question"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={!hasAnswered}
            data-testid="button-next-question"
          >
            {currentIndex === questions.length - 1 ? "Finish" : "Next"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
