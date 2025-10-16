import { useState } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import telegramLeakImage from '@/assets/telegram-leak.png';

interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
}

const posts: Post[] = [
  {
    id: '1',
    title: "Telegram's Hidden Vulnerabilities: From Data Sharing to Crypto Scams",
    excerpt: "Telegram, often praised for its privacy features, has been quietly facing a series of challenges that could erode user trust...",
    date: "2025-10-16",
    content: `Telegram, often praised for its privacy features, has been quietly facing a series of challenges that could erode user trust and tarnish its reputation. Recent developments reveal a platform grappling with data sharing, security vulnerabilities, and its role in facilitating large-scale scams.

In a surprising turn, Telegram has seen a surge in sharing user data with authorities, particularly in the United States and the United Kingdom. This increase follows the arrest of CEO Pavel Durov, partly due to the company's resistance to providing user data in a child exploitation investigation. Reports indicate that the messaging app has handed over phone numbers and IP addresses to U.S. authorities on multiple occasions, affecting thousands of users.

The platform's involvement in crypto scams and money laundering is equally concerning. A massive black market known as Haowang Guarantee, operating on Telegram, facilitated over $27 billion in transactions before being shut down. Despite Telegram's efforts to ban thousands of associated accounts, the scammers have quickly rebuilt their operations, suggesting a lack of effective long-term solutions.

Security vulnerabilities have also put Telegram under the microscope. A Russian zero-day seller is offering substantial bounties for Telegram exploits, indicating potential security risks. This comes as the Ukrainian government has banned Telegram for government and military personnel due to fears of Russian hacking.

Telegram has also faced criticism for its role in facilitating doxing and harassment. Investigations have revealed that Telegram groups have been used to target women, sharing nonconsensual intimate images and engaging in harassment. This highlights the platform's role in misogynistic activities and the potential for abuse.

Finally, Telegram's financial and legal history has raised questions about its stability. The company has faced challenges in covering its operating expenses and has had legal disputes, including a case with the Securities and Exchange Commission over a token presale.

These issues collectively suggest that Telegram has significant challenges in terms of user privacy, security, and moderation, which could potentially undermine user trust and the platform's overall reputation. As users and regulators take a closer look, Telegram may need to address these vulnerabilities to maintain its position as a trusted messaging platform.`
  }
];

export const LeaksSection = () => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setSelectedPost(null)}
            className="mb-6 hover:bg-primary/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leaks
          </Button>

          <article className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-lg">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {selectedPost.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Published on {new Date(selectedPost.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            <div className="flex justify-center my-8">
              <img 
                src={telegramLeakImage} 
                alt="Telegram Security Concerns" 
                className="rounded-lg max-w-md w-full shadow-2xl"
              />
            </div>

            <div className="prose prose-invert max-w-none mt-6">
              {selectedPost.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-foreground mb-4 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <h1 className="text-4xl font-bold text-foreground">The Truth That Other Companies Try To Hide From You</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Latest security vulnerabilities and privacy concerns in popular platforms
          </p>
        </div>

        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="grid gap-6">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-primary/50 hover:scale-[1.02] bg-card/80 backdrop-blur-sm"
                onClick={() => setSelectedPost(post)}
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <CardTitle className="text-xl md:text-2xl mb-2 text-foreground hover:text-primary transition-colors">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {new Date(post.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3">
                    {post.excerpt}
                  </p>
                  <Button variant="link" className="mt-4 p-0 h-auto text-primary">
                    Read more →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
