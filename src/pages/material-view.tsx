import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2,
  XCircle,
  Send,
  FileText,
  GraduationCap
} from "lucide-react";
import type { MaterialWithContent, McqQuestion, BookChapter } from "@shared/schema";

function McqQuiz({ questions }: { questions: McqQuestion[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correctAnswer;

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    setShowResult(true);
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
  };

  if (currentIndex >= questions.length) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Quiz Complete!</h3>
          <p className="text-muted-foreground mb-4">
            You scored {score} out of {questions.length}
          </p>
          <Button onClick={handleRestart}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  const options = [
    { key: "A", value: currentQuestion.optionA },
    { key: "B", value: currentQuestion.optionB },
    currentQuestion.optionC && { key: "C", value: currentQuestion.optionC },
    currentQuestion.optionD && { key: "D", value: currentQuestion.optionD },
  ].filter(Boolean) as { key: string; value: string }[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Badge variant="outline">
          Question {currentIndex + 1} of {questions.length}
        </Badge>
        <Badge variant="secondary">Score: {score}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={selectedAnswer || ""}
            onValueChange={setSelectedAnswer}
            disabled={showResult}
          >
            {options.map((option) => {
              let variant = "";
              if (showResult) {
                if (option.key === currentQuestion.correctAnswer) {
                  variant = "bg-green-100 dark:bg-green-900/20 border-green-500";
                } else if (option.key === selectedAnswer && !isCorrect) {
                  variant = "bg-red-100 dark:bg-red-900/20 border-red-500";
                }
              }
              return (
                <Label
                  key={option.key}
                  className={`flex items-center space-x-3 p-3 rounded-md border cursor-pointer transition-colors ${variant}`}
                  data-testid={`option-${option.key}`}
                >
                  <RadioGroupItem value={option.key} />
                  <span className="font-medium mr-2">{option.key}.</span>
                  <span>{option.value}</span>
                </Label>
              );
            })}
          </RadioGroup>

          {showResult && currentQuestion.explanation && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-1">Explanation:</p>
              <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            {!showResult ? (
              <Button onClick={handleSubmit} disabled={!selectedAnswer} data-testid="button-check-answer">
                Check Answer
              </Button>
            ) : (
              <Button onClick={handleNext} data-testid="button-next-question">
                {currentIndex < questions.length - 1 ? "Next Question" : "See Results"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BookReader({ chapters }: { chapters: BookChapter[] }) {
  const [activeChapter, setActiveChapter] = useState(chapters[0]?.id.toString() || "");

  const selectedChapter = chapters.find((c) => c.id.toString() === activeChapter);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Chapters</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-64 lg:h-96">
            <div className="p-2 space-y-1">
              {chapters.map((chapter, index) => (
                <Button
                  key={chapter.id}
                  variant={activeChapter === chapter.id.toString() ? "secondary" : "ghost"}
                  className="w-full justify-start text-left"
                  onClick={() => setActiveChapter(chapter.id.toString())}
                  data-testid={`button-chapter-${chapter.id}`}
                >
                  <span className="truncate">
                    {index + 1}. {chapter.title}
                  </span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>{selectedChapter?.title || "Select a Chapter"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 lg:h-[500px]">
            <div className="prose dark:prose-invert max-w-none">
              {selectedChapter?.content ? (
                <div className="whitespace-pre-wrap">{selectedChapter.content}</div>
              ) : (
                <p className="text-muted-foreground">No content available for this chapter.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function EssayView({ material }: { material: MaterialWithContent }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const submitMutation = useMutation({
    mutationFn: async (data: { materialId: number; title: string; content: string }) => {
      const res = await apiRequest("POST", "/api/essays/submit", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Essay submitted successfully!" });
      setTitle("");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/essays/my-submissions"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit essay", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: "Error", description: "Please fill in both title and content", variant: "destructive" });
      return;
    }
    submitMutation.mutate({ materialId: material.id, title, content });
  };

  return (
    <Tabs defaultValue="prompt">
      <TabsList>
        <TabsTrigger value="prompt">Essay Prompt</TabsTrigger>
        <TabsTrigger value="submit">Submit Essay</TabsTrigger>
      </TabsList>

      <TabsContent value="prompt" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Essay Topic</CardTitle>
            <CardDescription>{material.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {material.content ? (
              <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                {material.content}
              </div>
            ) : (
              <p className="text-muted-foreground">Essay prompt details coming soon.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="submit" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Essay</CardTitle>
            <CardDescription>Write and submit your essay for review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="essay-title">Essay Title</Label>
              <Input
                id="essay-title"
                placeholder="Enter your essay title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-essay-title"
              />
            </div>
            <div>
              <Label htmlFor="essay-content">Essay Content</Label>
              <Textarea
                id="essay-content"
                placeholder="Write your essay here..."
                className="min-h-[300px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                data-testid="textarea-essay-content"
              />
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={submitMutation.isPending}
              className="w-full"
              data-testid="button-submit-essay"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitMutation.isPending ? "Submitting..." : "Submit Essay"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function TheoryContent({ material }: { material: MaterialWithContent }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{material.title}</CardTitle>
        {material.description && (
          <CardDescription>{material.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="prose dark:prose-invert max-w-none">
            {material.content ? (
              <div className="whitespace-pre-wrap">{material.content}</div>
            ) : (
              <p className="text-muted-foreground">Content coming soon.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function PastPaperView({ material }: { material: MaterialWithContent }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{material.title}</CardTitle>
        {material.description && (
          <CardDescription>{material.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="prose dark:prose-invert max-w-none">
            {material.content ? (
              <div className="whitespace-pre-wrap">{material.content}</div>
            ) : (
              <p className="text-muted-foreground">Past paper content coming soon.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default function MaterialView() {
  const { id } = useParams<{ id: string }>();

  const { data: material, isLoading } = useQuery<MaterialWithContent>({
    queryKey: ["/api/materials", id],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b sticky top-0 z-50 bg-background">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <Skeleton className="h-9 w-24" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Card>
            <CardContent className="py-8">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="text-center p-8">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Material Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested material could not be found.</p>
            <Button asChild>
              <Link href="/">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    switch (material.type) {
      case "mcq":
        return material.mcqQuestions && material.mcqQuestions.length > 0 ? (
          <McqQuiz questions={material.mcqQuestions} />
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Questions Available</h3>
              <p className="text-muted-foreground">MCQ questions haven't been added yet.</p>
            </CardContent>
          </Card>
        );
      case "book":
        return material.bookChapters && material.bookChapters.length > 0 ? (
          <BookReader chapters={material.bookChapters} />
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Chapters Available</h3>
              <p className="text-muted-foreground">Book chapters haven't been added yet.</p>
            </CardContent>
          </Card>
        );
      case "essay":
        return <EssayView material={material} />;
      case "theory":
        return <TheoryContent material={material} />;
      case "past_paper":
        return <PastPaperView material={material} />;
      default:
        return <TheoryContent material={material} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild data-testid="button-back">
            <Link href={`/topics/${material.topicId}`}>
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
        <div className="mb-6">
          <Badge variant="outline" className="mb-2 capitalize">
            {material.type.replace("_", " ")}
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-material-title">
            {material.title}
          </h1>
        </div>

        {renderContent()}
      </main>
    </div>
  );
}
