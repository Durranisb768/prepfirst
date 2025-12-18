import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Home, RotateCcw, Lightbulb, Trophy, Target, AlertCircle } from "lucide-react";
import type { McqQuestion } from "@shared/schema";

interface UserAnswer {
  questionId: number;
  selectedAnswer: string;
  isCorrect: boolean;
}

interface QuizResults {
  materialId: number;
  materialTitle: string;
  answers: UserAnswer[];
  questions: McqQuestion[];
}

export default function QuizResultsPage() {
  const [, navigate] = useLocation();
  const [results, setResults] = useState<QuizResults | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("quizResults");
    if (stored) {
      setResults(JSON.parse(stored));
    }
  }, []);

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">No quiz results found.</p>
        <Button onClick={() => navigate("/dashboard")} data-testid="button-back-home">
          <Home className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  const { answers, questions, materialTitle, materialId } = results;
  const correctCount = answers.filter(a => a.isCorrect).length;
  const totalCount = answers.length;
  const wrongCount = totalCount - correctCount;
  const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const wrongAnswers = answers.filter(a => !a.isCorrect);

  const getScoreColor = () => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreBg = () => {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const getEncouragement = () => {
    if (score === 100) return "Perfect Score! Outstanding!";
    if (score >= 80) return "Excellent work! Keep it up.";
    if (score >= 60) return "Good job, but room for improvement.";
    if (score >= 40) return "Keep practicing, you'll get better!";
    return "Don't give up! Review and try again.";
  };

  const handleRetryMistakes = () => {
    const wrongQuestionIds = wrongAnswers.map(a => a.questionId);
    sessionStorage.setItem("retryQuestionIds", JSON.stringify(wrongQuestionIds));
    navigate(`/quiz/${materialId}`);
  };

  const getQuestionById = (id: number) => questions.find(q => q.id === id);
  const getAnswerByQuestionId = (id: number) => answers.find(a => a.questionId === id);

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-center text-white">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-amber-400" />
            <h1 className="text-2xl font-bold mb-2">Quiz Results</h1>
            <p className="text-slate-300">{materialTitle}</p>
            <p className="text-slate-400 text-sm mt-1">{getEncouragement()}</p>
          </div>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-xl">
                <div className="relative w-28 h-28 flex items-center justify-center mb-2">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="50"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="50"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={314}
                      strokeDashoffset={314 - (314 * score) / 100}
                      strokeLinecap="round"
                      className={getScoreBg()}
                      style={{ transition: "stroke-dashoffset 1s ease-out" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className={`text-3xl font-bold ${getScoreColor()}`}>{score}%</span>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground font-medium">Score</span>
              </div>

              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <div className="flex flex-col items-center justify-center p-5 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full mb-2">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-2xl font-bold text-green-700 dark:text-green-400">{correctCount}</span>
                  <span className="text-xs font-medium text-green-600 dark:text-green-500 uppercase">Correct</span>
                </div>
                
                <div className="flex flex-col items-center justify-center p-5 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <div className="bg-red-100 dark:bg-red-800 p-2 rounded-full mb-2">
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="text-2xl font-bold text-red-700 dark:text-red-400">{wrongCount}</span>
                  <span className="text-xs font-medium text-red-600 dark:text-red-500 uppercase">Incorrect</span>
                </div>

                <div className="col-span-2 flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="text-sm text-blue-700 dark:text-blue-400">
                    Answered <strong>{correctCount}</strong> of <strong>{totalCount}</strong> correctly
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                data-testid="button-back-dashboard"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              {wrongAnswers.length > 0 && (
                <Button onClick={handleRetryMistakes} data-testid="button-retry-mistakes">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry Mistakes ({wrongCount})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {wrongAnswers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-bold">Mistake Analysis</h2>
              <Badge variant="secondary">{wrongCount} questions</Badge>
            </div>
            
            <div className="space-y-4">
              {wrongAnswers.map((answer, index) => {
                const question = getQuestionById(answer.questionId);
                if (!question) return null;

                const options = [
                  { key: "A", value: question.optionA },
                  { key: "B", value: question.optionB },
                  { key: "C", value: question.optionC },
                  { key: "D", value: question.optionD },
                ].filter(opt => opt.value);

                const selectedOption = options.find(o => o.key === answer.selectedAnswer);
                const correctOption = options.find(o => o.key === question.correctAnswer);

                return (
                  <Card key={answer.questionId} data-testid={`mistake-card-${index}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium flex gap-2">
                        <span className="text-muted-foreground">#{index + 1}</span>
                        <span>{question.question}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                          <p className="text-xs font-bold text-red-500 uppercase mb-1">Your Answer</p>
                          <p className="font-medium text-red-700 dark:text-red-300 flex items-start gap-2">
                            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            {selectedOption?.value || "Not answered"}
                          </p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                          <p className="text-xs font-bold text-green-500 uppercase mb-1">Correct Answer</p>
                          <p className="font-medium text-green-700 dark:text-green-300 flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            {correctOption?.value}
                          </p>
                        </div>
                      </div>

                      {question.explanation && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg">
                          <p className="text-sm flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span>{question.explanation}</span>
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
