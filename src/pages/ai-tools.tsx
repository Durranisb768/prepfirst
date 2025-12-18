import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { 
  ArrowLeft, 
  Sparkles, 
  ClipboardList, 
  Lightbulb, 
  FileText, 
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import type { Subject, Topic, AiGenerationJob } from "@shared/schema";

export default function AiToolsPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("mcq");
  
  const [mcqText, setMcqText] = useState("");
  const [mcqTitle, setMcqTitle] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [includeUrdu, setIncludeUrdu] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);
  const [generatedMaterialId, setGeneratedMaterialId] = useState<number | null>(null);

  const [theoryText, setTheoryText] = useState("");
  const [theoryTitle, setTheoryTitle] = useState("");
  const [theoryTopicId, setTheoryTopicId] = useState<string>("");

  const [articleText, setArticleText] = useState("");
  const [articleAnalysis, setArticleAnalysis] = useState<any>(null);

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  
  const { data: topics } = useQuery<Topic[]>({
    queryKey: ["/api/subjects", selectedSubjectId, "topics"],
    enabled: !!selectedSubjectId,
  });

  const { data: jobStatus } = useQuery<AiGenerationJob>({
    queryKey: ["/api/ai/jobs", jobId],
    enabled: !!jobId,
    refetchInterval: jobId ? 2000 : false,
  });

  const generateMcqsMutation = useMutation({
    mutationFn: async (data: { text: string; topicId: number; title: string; includeUrdu: boolean }) => {
      const res = await apiRequest("POST", "/api/ai/generate-mcqs", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      setJobId(data.jobId);
      setGeneratedMaterialId(data.materialId);
      toast({
        title: "MCQ Generation Started",
        description: `Processing ${data.totalChunks} text chunks. This may take a few minutes.`,
      });
    },
    onError: () => {
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: "Failed to start MCQ generation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateTheoryMutation = useMutation({
    mutationFn: async (data: { text: string; topicId: number; title: string }) => {
      const res = await apiRequest("POST", "/api/ai/generate-theory", data);
      return res.json();
    },
    onSuccess: () => {
      setTheoryText("");
      setTheoryTitle("");
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      toast({
        title: "Theory Notes Generated",
        description: "Your study notes have been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate theory notes. Please try again.",
        variant: "destructive",
      });
    },
  });

  const analyzeArticleMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/ai/analyze-article", { text });
      return res.json();
    },
    onSuccess: (data: any) => {
      setArticleAnalysis(data);
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the article. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateMcqs = () => {
    if (!mcqText.trim() || !selectedTopicId || !mcqTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide text, select a topic, and enter a title.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    generateMcqsMutation.mutate({
      text: mcqText,
      topicId: parseInt(selectedTopicId),
      title: mcqTitle,
      includeUrdu,
    });
  };

  const handleGenerateTheory = () => {
    if (!theoryText.trim() || !theoryTopicId || !theoryTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide text, select a topic, and enter a title.",
        variant: "destructive",
      });
      return;
    }

    generateTheoryMutation.mutate({
      text: theoryText,
      topicId: parseInt(theoryTopicId),
      title: theoryTitle,
    });
  };

  const handleAnalyzeArticle = () => {
    if (!articleText.trim()) {
      toast({
        title: "Missing Text",
        description: "Please paste an article to analyze.",
        variant: "destructive",
      });
      return;
    }

    analyzeArticleMutation.mutate(articleText);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Sparkles className="w-12 h-12 mx-auto text-primary mb-2" />
            <CardTitle>AI Study Tools</CardTitle>
            <CardDescription>Sign in to access AI-powered study tools</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link href="/login">Sign In to Continue</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="font-bold">AI Study Tools</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="mcq" className="flex items-center gap-2" data-testid="tab-mcq">
              <ClipboardList className="w-4 h-4" />
              MCQ Generator
            </TabsTrigger>
            <TabsTrigger value="theory" className="flex items-center gap-2" data-testid="tab-theory">
              <Lightbulb className="w-4 h-4" />
              Theory Notes
            </TabsTrigger>
            <TabsTrigger value="analyze" className="flex items-center gap-2" data-testid="tab-analyze">
              <FileText className="w-4 h-4" />
              Article Analyzer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mcq">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-500" />
                  AI MCQ Generator
                </CardTitle>
                <CardDescription>
                  Paste your study material and let AI generate comprehensive MCQs with explanations.
                  Uses chunking to process long texts exhaustively.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isGenerating && jobStatus ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {jobStatus.status === "processing" && (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      )}
                      {jobStatus.status === "completed" && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {jobStatus.status === "failed" && (
                        <AlertCircle className="w-5 h-5 text-destructive" />
                      )}
                      <span className="font-medium capitalize">{jobStatus.status}</span>
                    </div>
                    
                    {jobStatus.totalChunks && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Processing chunks...</span>
                          <span>{jobStatus.processedChunks || 0} / {jobStatus.totalChunks}</span>
                        </div>
                        <Progress 
                          value={((jobStatus.processedChunks || 0) / jobStatus.totalChunks) * 100} 
                        />
                      </div>
                    )}

                    {jobStatus.status === "completed" && generatedMaterialId && (
                      <div className="flex gap-2">
                        <Button asChild>
                          <Link href={`/quiz/${generatedMaterialId}`}>Start Quiz</Link>
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setIsGenerating(false);
                          setJobId(null);
                          setMcqText("");
                          setMcqTitle("");
                        }}>
                          Generate More
                        </Button>
                      </div>
                    )}

                    {jobStatus.status === "failed" && (
                      <div className="text-sm text-destructive">
                        {jobStatus.errorMessage || "An error occurred during generation."}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                          <SelectTrigger data-testid="select-subject">
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects?.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id.toString()}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Topic</Label>
                        <Select 
                          value={selectedTopicId} 
                          onValueChange={setSelectedTopicId}
                          disabled={!selectedSubjectId}
                        >
                          <SelectTrigger data-testid="select-topic">
                            <SelectValue placeholder="Select topic" />
                          </SelectTrigger>
                          <SelectContent>
                            {topics?.map((topic) => (
                              <SelectItem key={topic.id} value={topic.id.toString()}>
                                {topic.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Quiz Title</Label>
                      <Input
                        placeholder="e.g., Chapter 5: The Industrial Revolution"
                        value={mcqTitle}
                        onChange={(e) => setMcqTitle(e.target.value)}
                        data-testid="input-mcq-title"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Study Material Text</Label>
                      <Textarea
                        placeholder="Paste your study material here. The AI will analyze the content and generate comprehensive MCQs covering all key concepts..."
                        className="min-h-[200px]"
                        value={mcqText}
                        onChange={(e) => setMcqText(e.target.value)}
                        data-testid="textarea-mcq-content"
                      />
                      <p className="text-xs text-muted-foreground">
                        {mcqText.length} characters | Estimated chunks: {Math.ceil(mcqText.length / 4000) || 0}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="urdu-toggle"
                          checked={includeUrdu}
                          onCheckedChange={setIncludeUrdu}
                          data-testid="switch-urdu"
                        />
                        <Label htmlFor="urdu-toggle">Include Urdu Translations</Label>
                      </div>

                      <Button 
                        onClick={handleGenerateMcqs}
                        disabled={generateMcqsMutation.isPending || !mcqText.trim() || !selectedTopicId || !isAdmin}
                        data-testid="button-generate-mcqs"
                      >
                        {generateMcqsMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Generate MCQs
                      </Button>
                    </div>
                    {!isAdmin && (
                      <p className="text-sm text-muted-foreground text-center">
                        Content generation is available for administrators only.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="theory">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  AI Theory Notes Generator
                </CardTitle>
                <CardDescription>
                  Transform raw study material into well-structured, comprehensive study notes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects?.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id.toString()}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Topic</Label>
                    <Select 
                      value={theoryTopicId} 
                      onValueChange={setTheoryTopicId}
                      disabled={!selectedSubjectId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {topics?.map((topic) => (
                          <SelectItem key={topic.id} value={topic.id.toString()}>
                            {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes Title</Label>
                  <Input
                    placeholder="e.g., Key Concepts: Photosynthesis"
                    value={theoryTitle}
                    onChange={(e) => setTheoryTitle(e.target.value)}
                    data-testid="input-theory-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Source Material</Label>
                  <Textarea
                    placeholder="Paste your source material here..."
                    className="min-h-[200px]"
                    value={theoryText}
                    onChange={(e) => setTheoryText(e.target.value)}
                    data-testid="textarea-theory-content"
                  />
                </div>

                <Button 
                  onClick={handleGenerateTheory}
                  disabled={generateTheoryMutation.isPending || !isAdmin}
                  data-testid="button-generate-theory"
                >
                  {generateTheoryMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate Study Notes
                </Button>
                {!isAdmin && (
                  <p className="text-sm text-muted-foreground">
                    Content generation is available for administrators only.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analyze">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  Article Analyzer
                </CardTitle>
                <CardDescription>
                  Extract vocabulary, key points, analytical angles, and counter-narratives from any article.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Article Text</Label>
                  <Textarea
                    placeholder="Paste your article here..."
                    className="min-h-[200px]"
                    value={articleText}
                    onChange={(e) => setArticleText(e.target.value)}
                    data-testid="textarea-article-content"
                  />
                </div>

                <Button 
                  onClick={handleAnalyzeArticle}
                  disabled={analyzeArticleMutation.isPending}
                  data-testid="button-analyze-article"
                >
                  {analyzeArticleMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Analyze Article
                </Button>

                {articleAnalysis && (
                  <div className="space-y-4 mt-6">
                    <div>
                      <h3 className="font-semibold mb-2">Key Vocabulary</h3>
                      <div className="flex flex-wrap gap-2">
                        {articleAnalysis.vocabulary?.map((item: any, i: number) => (
                          <Badge key={i} variant="secondary" className="cursor-help" title={item.definition}>
                            {item.word}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Key Points</h3>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {articleAnalysis.keyPoints?.map((point: string, i: number) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Analytical Angles</h3>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {articleAnalysis.analyticalAngles?.map((angle: string, i: number) => (
                          <li key={i}>{angle}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Counter-Narratives</h3>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {articleAnalysis.counterNarratives?.map((counter: string, i: number) => (
                          <li key={i}>{counter}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
