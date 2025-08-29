import React from 'react';
import { Shield, MessageSquare, Users, Lock, Eye, Zap, FileText, Phone, Globe, Smartphone, UserX, ThumbsUp, AlertTriangle, Crown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Features = () => {
  const navigate = useNavigate();

  const coreFeatures = [
    {
      icon: <Shield className="h-8 w-8 text-blue-500" />,
      title: "AES-256-GCM Encryption",
      description: "Military-grade AES-256-GCM encryption with authenticated encryption ensuring both confidentiality and authenticity of all data.",
      category: "Core Encryption",
      isPremium: false
    },
    {
      icon: <Lock className="h-8 w-8 text-blue-600" />,
      title: "Signal Protocol Implementation",
      description: "Industry-leading Signal Protocol with Double Ratchet Algorithm providing perfect forward secrecy and post-compromise security.",
      category: "Core Encryption",
      isPremium: false
    },
    {
      icon: <Shield className="h-8 w-8 text-blue-700" />,
      title: "PBKDF2-SHA-512 Key Derivation",
      description: "Secure password-based key derivation using PBKDF2 with SHA-512 and 100,000+ iterations for maximum security.",
      category: "Core Encryption",
      isPremium: false
    },
    {
      icon: <Lock className="h-8 w-8 text-purple-500" />,
      title: "ECDH P-256 Key Exchange",
      description: "Elliptic Curve Diffie-Hellman key exchange using NIST P-256 curve for secure session establishment.",
      category: "Core Encryption",
      isPremium: false
    },
    {
      icon: <Shield className="h-8 w-8 text-purple-600" />,
      title: "HMAC-SHA-256 Authentication",
      description: "Message authentication using HMAC-SHA-256 to ensure message integrity and prevent tampering.",
      category: "Core Encryption",
      isPremium: false
    },
    {
      icon: <Lock className="h-8 w-8 text-indigo-500" />,
      title: "HKDF Key Stretching",
      description: "HMAC-based Key Derivation Function (HKDF) for secure key expansion and cryptographic key management.",
      category: "Core Encryption",
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
      category: "Privacy Features",
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
      category: "Data Protection",
      isPremium: false
    },
    {
      icon: <FileText className="h-8 w-8 text-green-500" />,
      title: "Database-Level Encryption",
      description: "All database fields containing sensitive data are encrypted at rest using AES-256 with unique salts per record.",
      category: "Data Protection",
      isPremium: false
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Secure Key Management",
      description: "Cryptographic keys are managed using hardware security modules with automatic rotation and secure storage.",
      category: "Data Protection",
      isPremium: false
    },
    {
      icon: <Lock className="h-8 w-8 text-green-700" />,
      title: "Memory Protection",
      description: "Sensitive data is securely wiped from memory after use with cryptographic memory overwriting patterns.",
      category: "Data Protection",
      isPremium: false
    },
    {
      icon: <Eye className="h-8 w-8 text-red-500" />,
      title: "Device Fingerprinting",
      description: "Advanced device fingerprinting for secure authentication and anomaly detection using WebGL and Canvas API.",
      category: "Data Protection",
      isPremium: false
    },
    {
      icon: <Lock className="h-8 w-8 text-teal-500" />,
      title: "App Lock & Biometrics",
      description: "Secure your app with biometric authentication, PIN codes, and automatic locking when inactive.",
      category: "Privacy Features",
      isPremium: false
    },
    {
      icon: <Eye className="h-8 w-8 text-amber-500" />,
      title: "Screenshot Protection",
      description: "Advanced screenshot and screen recording protection to prevent unauthorized capture of sensitive conversations.",
      category: "Privacy Features",
      isPremium: false
    },
    {
      icon: <Globe className="h-8 w-8 text-cyan-500" />,
      title: "Multi-Language Support",
      description: "Automatic message translation and support for multiple languages to communicate globally.",
      category: "Communication",
      isPremium: false
    },
    {
      icon: <AlertTriangle className="h-8 w-8 text-yellow-500" />,
      title: "Link Security Scanner",
      description: "Automatic detection of suspicious links in messages with privacy-first scanning that doesn't send data to external servers.",
      category: "Privacy Features",
      isPremium: false,
      isNew: true
    }
  ];

  const encryptionFeatures = [
    "AES-256-GCM: Authenticated encryption for all messages and files",
    "Signal Protocol: Double Ratchet Algorithm with perfect forward secrecy",
    "PBKDF2-SHA-512: 100,000+ iterations for password-based key derivation",
    "ECDH P-256: Elliptic curve key exchange for session establishment", 
    "HMAC-SHA-256: Message authentication and integrity verification",
    "HKDF: Secure key expansion and cryptographic key management",
    "ChaCha20-Poly1305: Alternative stream cipher for high-performance encryption",
    "Ed25519: Digital signatures for message authenticity",
    "X25519: High-speed elliptic curve Diffie-Hellman function",
    "Argon2: Memory-hard password hashing for enhanced security",
    "Database Encryption: All sensitive fields encrypted at rest with unique salts",
    "Memory Protection: Secure wiping of cryptographic material from RAM",
    "Key Rotation: Automatic cryptographic key rotation every 30 days",
    "Hardware Security: Integration with device secure enclaves when available",
    "Zero-Knowledge Architecture: Server cannot decrypt user messages",
    "Quantum-Resistant Algorithms: Post-quantum cryptography readiness"
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

        {/* Encryption Technologies */}
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Complete Encryption Arsenal
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every cryptographic algorithm and security protocol implemented in Rome for maximum protection
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