import React from 'react';
import { Shield, MessageSquare, Users, Lock, Eye, Zap, FileText, Phone, Globe, Smartphone, UserX, ThumbsUp, AlertTriangle, Crown, Timer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Features = () => {
  const navigate = useNavigate();

  const coreFeatures = [
    {
      icon: <Shield className="h-8 w-8 text-blue-500" />,
      title: "Military-Grade Encryption",
      description: "End-to-end encryption using industry-standard AES-256 encryption ensures your messages remain private and secure.",
      category: "Security",
      isPremium: false
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-green-500" />,
      title: "Secure Messaging",
      description: "Send encrypted text messages, files, images, and videos with complete privacy and security.",
      category: "Communication",
      isPremium: false
    },
    {
      icon: <Users className="h-8 w-8 text-purple-500" />,
      title: "Group Conversations",
      description: "Create secure group chats with multiple participants while maintaining end-to-end encryption.",
      category: "Communication",
      isPremium: false
    },
    {
      icon: <UserX className="h-8 w-8 text-orange-500" />,
      title: "Anonymous Group Posting",
      description: "Post anonymously in group conversations with rotating identifiers (Anon-1, Anon-2) while admins maintain oversight for moderation.",
      category: "Privacy",
      isPremium: false,
      isNew: true
    },
    {
      icon: <ThumbsUp className="h-8 w-8 text-indigo-500" />,
      title: "Contextual Reactions",
      description: "React to messages with meaningful responses like ✅ Seen, 🔥 Agree, 🤔 Question, 👀 Looking into it, replacing cluttered text responses.",
      category: "Communication",
      isPremium: false,
      isNew: true
    },
    {
      icon: <FileText className="h-8 w-8 text-red-500" />,
      title: "Secure File Sharing",
      description: "Share files securely with automatic encryption and secure storage in military-grade infrastructure.",
      category: "Security",
      isPremium: false
    },
    {
      icon: <Timer className="h-8 w-8 text-red-600" />,
      title: "Self-Destructing Messages",
      description: "Send messages and files that automatically delete once viewed by recipients using the /selfdestruct command for ultimate privacy.",
      category: "Security",
      isPremium: false,
      isNew: true
    },
    {
      icon: <Eye className="h-8 w-8 text-amber-500" />,
      title: "Screenshot Protection",
      description: "Advanced screenshot and screen recording protection to prevent unauthorized capture of sensitive conversations.",
      category: "Security",
      isPremium: false
    },
    {
      icon: <Lock className="h-8 w-8 text-teal-500" />,
      title: "App Lock & Biometrics",
      description: "Secure your app with biometric authentication, PIN codes, and automatic locking when inactive.",
      category: "Security",
      isPremium: false
    },
    {
      icon: <Globe className="h-8 w-8 text-cyan-500" />,
      title: "Multi-Language Support",
      description: "Automatic message translation and support for multiple languages to communicate globally.",
      category: "Accessibility",
      isPremium: false
    },
    {
      icon: <AlertTriangle className="h-8 w-8 text-yellow-500" />,
      title: "Link Security Scanner",
      description: "Automatic detection of suspicious links in messages with privacy-first scanning that doesn't send data to external servers.",
      category: "Security",
      isPremium: false,
      isNew: true
    }
  ];

  const securityFeatures = [
    "Zero-knowledge architecture - we can't read your messages",
    "Self-destructing messages that vanish once viewed",
    "Automatic message expiration and self-destruction",
    "Advanced threat detection and monitoring",
    "Secure key exchange protocols",
    "Protection against man-in-the-middle attacks",
    "Forward secrecy for all conversations",
    "Secure backup and recovery systems",
    "Real-time security audit logs"
  ];

  const categories = Array.from(new Set(coreFeatures.map(f => f.category)));

  return (
    <div className="min-h-screen w-full bg-background">

      <div className="container mx-auto px-6 py-8 space-y-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Shield className="h-4 w-4" />
            Privacy-First Communication Platform
          </div>
          <h2 className="text-4xl font-bold text-foreground">
            Secure. Private. Powerful.
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Rome combines military-grade security with modern communication features, 
            ensuring your conversations remain private while providing all the tools you need 
            for effective collaboration.
          </p>
        </div>

        {/* Feature Categories */}
        {categories.map(category => (
          <div key={category} className="space-y-6">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-semibold text-foreground">{category}</h3>
              <div className="flex-1 h-px bg-border"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coreFeatures
                .filter(feature => feature.category === category)
                .map((feature, index) => (
                <Card key={index} className="relative overflow-hidden border-border/20 hover:border-primary/20 transition-all duration-300 hover:shadow-lg">
                  {feature.isNew && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                        New
                      </Badge>
                    </div>
                  )}
                  {feature.isPremium && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                        <Crown className="h-3 w-3 mr-1" />
                        Pro
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-muted/50">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{feature.title}</CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                          {feature.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* Security Deep Dive */}
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Advanced Security Features
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Rome implements multiple layers of security to ensure your data remains private and secure
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/20">
                <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center space-y-6 py-12">
          <h3 className="text-3xl font-bold text-foreground">
            Ready to Experience Secure Communication?
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of users who trust Rome for their private communications. 
            Start messaging securely today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <MessageSquare className="h-5 w-5" />
              Start Messaging
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.open('https://docs.rome-chat.com', '_blank')}
              className="gap-2"
            >
              <FileText className="h-5 w-5" />
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;