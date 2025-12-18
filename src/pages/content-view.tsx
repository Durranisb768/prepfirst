import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  BookOpen, 
  ChevronRight,
  FileText,
  Calendar,
  Clock,
  Printer,
  Share2,
  Bookmark
} from "lucide-react";
import type { Topic } from "@shared/schema";

type TopicWithDetails = Topic & { 
  subTopics?: Topic[];
  subject?: { id: number; name: string };
};

function formatContent(content: string): JSX.Element[] {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let currentParagraph: string[] = [];
  let listItems: string[] = [];
  let isInList = false;
  let listType: 'ul' | 'ol' = 'ul';

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        elements.push(
          <p key={elements.length} className="text-base leading-relaxed text-foreground/90 mb-4">
            {text}
          </p>
        );
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      const ListTag = listType;
      elements.push(
        <ListTag key={elements.length} className={`mb-4 space-y-2 ${listType === 'ol' ? 'list-decimal' : 'list-disc'} list-inside`}>
          {listItems.map((item, i) => (
            <li key={i} className="text-base leading-relaxed text-foreground/90">
              {item}
            </li>
          ))}
        </ListTag>
      );
      listItems = [];
      isInList = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    if (trimmed.startsWith('# ')) {
      flushParagraph();
      flushList();
      elements.push(
        <h1 key={elements.length} className="text-2xl font-bold text-foreground mb-4 mt-8 first:mt-0">
          {trimmed.substring(2)}
        </h1>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      flushParagraph();
      flushList();
      elements.push(
        <h2 key={elements.length} className="text-xl font-semibold text-foreground mb-3 mt-6">
          {trimmed.substring(3)}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith('### ')) {
      flushParagraph();
      flushList();
      elements.push(
        <h3 key={elements.length} className="text-lg font-semibold text-foreground mb-2 mt-4">
          {trimmed.substring(4)}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      flushParagraph();
      flushList();
      elements.push(
        <p key={elements.length} className="text-base font-semibold text-foreground mb-3 mt-4">
          {trimmed.slice(2, -2)}
        </p>
      );
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushParagraph();
      if (!isInList) {
        flushList();
        isInList = true;
        listType = 'ul';
      }
      listItems.push(trimmed.substring(2));
      return;
    }

    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      flushParagraph();
      if (!isInList) {
        flushList();
        isInList = true;
        listType = 'ol';
      }
      listItems.push(numberedMatch[2]);
      return;
    }

    if (trimmed.startsWith('> ')) {
      flushParagraph();
      flushList();
      elements.push(
        <blockquote key={elements.length} className="border-l-4 border-primary/50 pl-4 py-2 my-4 italic text-muted-foreground bg-muted/30 rounded-r-lg">
          {trimmed.substring(2)}
        </blockquote>
      );
      return;
    }

    if (trimmed.startsWith('---') || trimmed.startsWith('***')) {
      flushParagraph();
      flushList();
      elements.push(<Separator key={elements.length} className="my-6" />);
      return;
    }

    currentParagraph.push(trimmed);
  });

  flushParagraph();
  flushList();

  return elements;
}

export default function ContentView() {
  const { id } = useParams<{ id: string }>();

  const { data: topic, isLoading } = useQuery<TopicWithDetails>({
    queryKey: ["/api/topics", id],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b sticky top-0 z-50 bg-background">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
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
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Content Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested content could not be found.</p>
            <Button asChild>
              <Link href="/">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasContent = topic.content && topic.content.trim().length > 0;
  const wordCount = topic.content ? topic.content.split(/\s+/).filter(w => w).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild data-testid="button-back-content">
              <Link href={`/subjects/${topic.subjectId}`}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Link>
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Reading Mode</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" data-testid="button-bookmark">
              <Bookmark className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => window.print()} data-testid="button-print">
              <Printer className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link href="/" className="hover:text-foreground transition-colors">Dashboard</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/subjects/${topic.subjectId}`} className="hover:text-foreground transition-colors">Subject</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground">{topic.name}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="content-title">
              {topic.name}
            </h1>

            {topic.description && (
              <p className="text-lg text-muted-foreground mb-4">{topic.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{readingTime} min read</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{wordCount.toLocaleString()} words</span>
              </div>
              {topic.parentTopicId && (
                <Badge variant="secondary" className="text-xs">
                  Sub-topic
                </Badge>
              )}
            </div>
          </div>

          <Separator className="my-8" />

          {hasContent ? (
            <div className="content-body" data-testid="content-body">
              {formatContent(topic.content!)}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Content Yet</h3>
                <p className="text-muted-foreground">
                  This topic doesn't have any content yet. Check back later or contact an administrator.
                </p>
              </CardContent>
            </Card>
          )}

          {topic.subTopics && topic.subTopics.length > 0 && (
            <>
              <Separator className="my-8" />
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Related Sub-Topics
                </h2>
                <div className="grid gap-3">
                  {topic.subTopics.map((subTopic) => (
                    <Link key={subTopic.id} href={`/topics/${subTopic.id}/view`}>
                      <Card className="p-4 hover-elevate cursor-pointer" data-testid={`subtopic-card-${subTopic.id}`}>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3 className="font-medium">{subTopic.name}</h3>
                            {subTopic.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">{subTopic.description}</p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            </>
          )}
        </article>
      </main>

      <style>{`
        @media print {
          header { display: none; }
          .content-body { font-size: 12pt; }
        }
      `}</style>
    </div>
  );
}
