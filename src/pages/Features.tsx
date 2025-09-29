import React from 'react';
import { Shield, MessageSquare, Users, Lock, Eye, Zap, FileText, Phone, Globe, Smartphone, UserX, ThumbsUp, AlertTriangle, Crown, User, Settings, Inbox, Reply, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Features = () => {
  const navigate = useNavigate();

  const coreFeatures = [
    // Authentication & Security
    {
      icon: <Shield className="h-8 w-8 text-blue-500" />,
      title: "Username-Based Authentication",
      description: "Secure login with auto-generated usernames and Argon2 password hashing for maximum security.",
      category: "Authentication & Security",
      isPremium: false
    },
    {
      icon: <Lock className="h-8 w-8 text-blue-600" />,
      title: "App Lock Protection", 
      description: "Biometric authentication and PIN codes with automatic locking when inactive to secure your conversations.",
      category: "Authentication & Security",
      isPremium: false
    },
    {
      icon: <Eye className="h-8 w-8 text-amber-500" />,
      title: "Screenshot Protection",
      description: "Advanced screenshot and screen recording protection prevents unauthorized capture of sensitive conversations.",
      category: "Authentication & Security",
      isPremium: false
    },
    {
      icon: <AlertTriangle className="h-8 w-8 text-yellow-500" />,
      title: "Link Security Scanner",
      description: "Automatic detection of suspicious links in messages with privacy-first scanning that protects your data.",
      category: "Authentication & Security",
      isPremium: false
    },
    
    // Core Messaging
    {
      icon: <MessageSquare className="h-8 w-8 text-green-500" />,
      title: "Secure Messaging",
      description: "Send encrypted text messages with end-to-end encryption ensuring complete privacy and security.",
      category: "Core Messaging",
      isPremium: false
    },
    {
      icon: <Users className="h-8 w-8 text-purple-500" />,
      title: "Group Conversations",
      description: "Create secure group chats with multiple participants while maintaining end-to-end encryption.",
      category: "Core Messaging", 
      isPremium: false
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-blue-500" />,
      title: "Direct Messages",
      description: "Private one-on-one conversations with complete encryption and security between participants.",
      category: "Core Messaging",
      isPremium: false
    },
    {
      icon: <Inbox className="h-8 w-8 text-indigo-500" />,
      title: "Message Requests",
      description: "Send and receive connection requests to start new conversations securely with privacy controls.",
      category: "Core Messaging",
      isPremium: false
    },
    
    // Advanced Features  
    {
      icon: <UserX className="h-8 w-8 text-orange-500" />,
      title: "Anonymous Group Posting",
      description: "Post anonymously in group conversations with rotating identifiers (Anon-1, Anon-2) while admins maintain oversight.",
      category: "Advanced Features",
      isPremium: false,
      isNew: true
    },
    {
      icon: <ThumbsUp className="h-8 w-8 text-indigo-500" />,
      title: "Message Reactions",
      description: "React to messages with preset responses like ✅ Seen, 🔥 Agree, 🤔 Question, 👀 Looking into it.",
      category: "Advanced Features", 
      isPremium: false
    },
    {
      icon: <Reply className="h-8 w-8 text-cyan-500" />,
      title: "Reply & Edit Messages",
      description: "Reply to specific messages and edit sent messages with full conversation context and history.",
      category: "Advanced Features",
      isPremium: false
    },
    {
      icon: <Eye className="h-8 w-8 text-green-600" />,
      title: "Read Receipts & Typing Indicators",
      description: "See who has read your messages and when someone is typing for better conversation awareness.",
      category: "Advanced Features",
      isPremium: false
    },
    {
      icon: <Globe className="h-8 w-8 text-cyan-500" />,
      title: "Real-Time Translation",
      description: "Automatic message translation supporting multiple languages for seamless global communication.",
      category: "Advanced Features",
      isPremium: false
    },
    
    // File & Media
    {
      icon: <FileText className="h-8 w-8 text-red-500" />,
      title: "Secure File Sharing",
      description: "Share files securely with automatic encryption and secure storage in military-grade infrastructure.",
      category: "File & Media Sharing",
      isPremium: false
    },
    {
      icon: <ImageIcon className="h-8 w-8 text-pink-500" />,
      title: "Media Sharing",
      description: "Share images and videos with automatic encryption and secure delivery to conversation participants.",
      category: "File & Media Sharing", 
      isPremium: false
    },
    {
      icon: <FileText className="h-8 w-8 text-purple-600" />,
      title: "Secure File Vault",
      description: "Personal encrypted file storage with secure access controls and automatic encryption at rest.",
      category: "File & Media Sharing",
      isPremium: false
    },
    
    // Privacy & Data Protection
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Database Encryption", 
      description: "All sensitive data encrypted at rest with AES-256 encryption and unique salts per record.",
      category: "Privacy & Data Protection",
      isPremium: false
    },
    {
      icon: <Lock className="h-8 w-8 text-green-700" />,
      title: "Row Level Security",
      description: "Database-level access controls ensuring users can only access their own data with strict policies.",
      category: "Privacy & Data Protection", 
      isPremium: false
    },
    {
      icon: <UserX className="h-8 w-8 text-green-500" />,
      title: "Minimal Data Collection",
      description: "Only email and password required - no phone numbers, location data, or unnecessary personal information.",
      category: "Privacy & Data Protection",
      isPremium: false
    },
    {
      icon: <Shield className="h-8 w-8 text-blue-700" />,
      title: "Password Security",
      description: "Argon2 password hashing with breach detection and secure password requirements for account protection.",
      category: "Privacy & Data Protection",
      isPremium: false
    },
    
    // Customization
    {
      icon: <User className="h-8 w-8 text-purple-500" />,
      title: "Profile Customization", 
      description: "Custom avatars, display names, and wallpapers with secure storage and privacy controls.",
      category: "Customization & Settings",
      isPremium: false
    },
    {
      icon: <Settings className="h-8 w-8 text-gray-500" />,
      title: "Comprehensive Settings",
      description: "Full control over privacy, security, appearance, and functionality with granular permission controls.",
      category: "Customization & Settings",
      isPremium: false
    }
  ];

  const encryptionFeatures = [
    "AES-256 Encryption: Database-level encryption for all sensitive data",
    "Argon2 Password Hashing: Memory-hard password hashing with salt",
    "SHA-256 Hashing: Secure email hashing for account recovery", 
    "HTTPS/TLS: All communications encrypted in transit",
    "Row Level Security: Database policies restricting data access",
    "Encrypted File Storage: All files encrypted before storage",
    "Secure Session Management: JWT tokens with proper expiration",
    "Password Breach Detection: Check against known compromised passwords",
    "Device Fingerprinting: Unique device identification for security",
    "Rate Limiting: Prevent brute force and spam attacks",
    "Input Validation: Server-side validation of all user inputs",
    "CORS Protection: Controlled cross-origin resource sharing",
    "SQL Injection Prevention: Parameterized queries and ORM protection",
    "Memory Protection: Secure handling of sensitive data in memory",
    "Automatic Security Updates: Regular security patches and updates",
    "Zero-Knowledge Architecture: Server cannot access message content"
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
            Our Live Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Rome is actively deployed with these working features. Every feature listed below 
            is fully functional and available for you to use right now in our secure messaging platform.
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

        {/* Encryption Technologies */}
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Active Security Technologies
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Security protocols and encryption methods currently protecting your data in Rome
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {encryptionFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/20 hover:bg-muted/40 transition-colors">
                <Lock className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center space-y-6 py-12">
          <h3 className="text-3xl font-bold text-foreground">
            Ready to Try These Features?
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            All features are live and ready to use. Start experiencing secure, 
            private communication with Rome's comprehensive feature set today.
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