import { useState } from 'react';
import { ArrowLeft, AlertTriangle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import telegramLeakImage from '@/assets/telegram-leak.png';
import zcashLogoImage from '@/assets/zcash-logo.png';
import palantirLogoImage from '@/assets/palantir-logo.png';

interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  image?: string;
}

const posts: Post[] = [
  {
    id: '3',
    title: "Palantir's Dirty Secrets: What the Surveillance Giant Doesn't Want You to Know",
    excerpt: "Palantir, the data analytics behemoth co-founded by Peter Thiel, has been quietly building what many experts call 'the most comprehensive federal data-sharing platform in U.S. history'...",
    date: "2025-10-16",
    image: palantirLogoImage,
    content: `Palantir, the data analytics behemoth co-founded by Peter Thiel, has been quietly building what many experts call "the most comprehensive federal data-sharing platform in U.S. history" while trying to keep several damaging truths under wraps. The company's work with the Trump administration has revealed several bombshells that could destroy its carefully cultivated image.

First, Palantir is allegedly building what officials describe as a "whole-of-government master database on Americans" under Trump's executive order mandating federal agencies share unclassified data. Despite Palantir's public denials calling such reports "blatantly untrue", the company has received more than $113 million in federal contracts since Trump took office, plus a massive $795 million Department of Defense contract.

Even more alarming, Palantir has been contracted to power ICE's deportation machinery. The company was first awarded an ICE contract under Obama in 2014, which has been renewed multiple times, and recently received an additional $30 million. This work has become so controversial that protestors gathered outside Palantir's New York offices were arrested for demonstrating against the company's role in deportations.

Palantir's CEO Alex Karp recently disclosed receiving a staggering $6.8 billion in "compensation actually paid" in 2024, making him the highest-paid CEO of a publicly traded company in America. This obscene compensation comes while Palantir is working on projects that could enable unprecedented government surveillance of American citizens.

The company's ethics problems extend globally. Palantir's £330 million NHS contract in the UK has been rejected by most English hospitals, with fewer than a quarter of England's 215 hospital trusts actively using its platform by the end of 2024. Medical professionals have picketed outside NHS England headquarters demanding cancellation of the deal, citing Palantir's contracts with the Israeli military.

Perhaps most damning is the fact that Palantir's own former employees are turning against the company. More than a dozen former workers—including software engineers, managers, and privacy specialists—have issued a rare rebuke, stating the company's work with the Trump administration violates its founding principles. In their letter to NPR, they explained that when they joined Palantir, they believed in its code of conduct stating its software should "protect the vulnerable and ensure the responsible development of artificial intelligence".

Despite Palantir's claims that it's merely a "data processor" with no ownership over collected information, Democratic lawmakers including Sen. Wyden and Rep. Ocasio-Cortez have raised concerns that the company's work building an IRS "mega-database" would "blatantly violate the notice, transparency, and procedural requirements of the Privacy Act".

With over 50 current and former Palantir employees calling for "clear boundaries" and public accountability mechanisms around the platform's use, it's clear the company's surveillance capabilities have become a source of growing controversy that Palantir is desperately trying to contain.

Source: Insider Asset`
  },
  {
    id: '2',
    title: "Zcash's Hidden Agenda: What the Company Doesn't Want You to Know",
    excerpt: "Zcash, a privacy-focused cryptocurrency, has been working to maintain its image while dealing with several issues...",
    date: "2025-10-16",
    image: zcashLogoImage,
    content: `Zcash, a privacy-focused cryptocurrency, has been working to maintain its image while dealing with several issues that it may prefer to keep under wraps. One of the most significant concerns is the ongoing debate about its governance and the influence of its investors, particularly those involved in its early development.

The Zcash company has faced criticism for its handling of the Founders Reward, a controversial mechanism that allocated a portion of newly minted Zcash coins to the founders and early developers. This reward was seen as a way to fund the initial development of the project, but it also raised questions about fairness and transparency. The Canopy upgrade, implemented in 2020, aimed to address this by removing the Founders Reward and establishing a development fund. However, the transition was not without controversy, and some investors felt that they were not adequately compensated for their early support.

Additionally, the company has been navigating the complexities of regulatory compliance and investor expectations. As Zcash continues to evolve, it must balance the need for privacy with the demands of investors and regulators. The company has been cautious about disclosing certain aspects of its operations, particularly those that could affect its relationship with key stakeholders.

Investors in Zcash have expressed concerns about the project's long-term sustainability and the potential for further halving events, which could impact the supply and value of the cryptocurrency. The next halving is anticipated to occur around November 2024, and the company is likely to face increased scrutiny as this date approaches.

Furthermore, the origins of Zcash are shrouded in controversy, with allegations that the project received funding from the CIA, DARPA, and Israeli defense entities. These connections raise questions about the true motivations behind the development of Zcash and the extent to which these organizations influence its governance and technology. The involvement of such powerful entities suggests that Zcash may be more than just a privacy-focused cryptocurrency, potentially serving broader strategic interests.

Source: Dark Web Forums And Insider Assets`
  },
  {
    id: '1',
    title: "Telegram's Hidden Vulnerabilities: From Data Sharing to Crypto Scams",
    excerpt: "Telegram, often praised for its privacy features, has been quietly facing a series of challenges that could erode user trust...",
    date: "2025-10-16",
    image: telegramLeakImage,
    content: `Telegram, often praised for its privacy features, has been quietly facing a series of challenges that could erode user trust and tarnish its reputation. Recent developments reveal a platform grappling with data sharing, security vulnerabilities, and its role in facilitating large-scale scams.

In a surprising turn, Telegram has seen a surge in sharing user data with authorities, particularly in the United States and the United Kingdom. This increase follows the arrest of CEO Pavel Durov, partly due to the company's resistance to providing user data in a child exploitation investigation. Reports indicate that the messaging app has handed over phone numbers and IP addresses to U.S. authorities on multiple occasions, affecting thousands of users.

The platform's involvement in crypto scams and money laundering is equally concerning. A massive black market known as Haowang Guarantee, operating on Telegram, facilitated over $27 billion in transactions before being shut down. Despite Telegram's efforts to ban thousands of associated accounts, the scammers have quickly rebuilt their operations, suggesting a lack of effective long-term solutions.

Security vulnerabilities have also put Telegram under the microscope. A Russian zero-day seller is offering substantial bounties for Telegram exploits, indicating potential security risks. This comes as the Ukrainian government has banned Telegram for government and military personnel due to fears of Russian hacking.

Telegram has also faced criticism for its role in facilitating doxing and harassment. Investigations have revealed that Telegram groups have been used to target women, sharing nonconsensual intimate images and engaging in harassment. This highlights the platform's role in misogynistic activities and the potential for abuse.

Finally, Telegram's financial and legal history has raised questions about its stability. The company has faced challenges in covering its operating expenses and has had legal disputes, including a case with the Securities and Exchange Commission over a token presale.

These issues collectively suggest that Telegram has significant challenges in terms of user privacy, security, and moderation, which could potentially undermine user trust and the platform's overall reputation. As users and regulators take a closer look, Telegram may need to address these vulnerabilities to maintain its position as a trusted messaging platform.

Source: Dark Web Forums And Insider Assets`
  }
];

export const LeaksSection = () => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

            {selectedPost.image && (
              <div className="flex justify-center my-8">
                <img 
                  src={selectedPost.image} 
                  alt={selectedPost.title} 
                  className="rounded-lg max-w-md w-full shadow-2xl"
                />
              </div>
            )}

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

  // Filter posts based on search query
  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search leaks by title keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-card border-border focus:border-primary transition-colors"
          />
        </div>

        <ScrollArea className="h-[calc(100vh-20rem)]">
          <div className="grid gap-6">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No posts found matching "{searchQuery}"</p>
              </div>
            ) : (
              filteredPosts.map((post) => (
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
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
