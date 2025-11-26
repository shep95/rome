import React from 'react';
import { Shield, MessageSquare, Users, Lock, Eye, Zap, FileText, Phone, Globe, Smartphone, UserX, ThumbsUp, AlertTriangle, Crown, User, Settings, Inbox, Reply, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Features = () => {
  const navigate = useNavigate();

  const coreFeatures = [
    // Authentication & Security
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Username-Based Authentication",
      description: "Secure login with auto-generated usernames and Argon2 password hashing for maximum security.",
      category: "Authentication & Security",
      isPremium: false
    },
    {
      icon: <Lock className="h-8 w-8 text-primary" />,
      title: "App Lock Protection", 
      description: "Biometric authentication and PIN codes with automatic locking when inactive to secure your conversations.",
      category: "Authentication & Security",
      isPremium: false
    },
    {
      icon: <Eye className="h-8 w-8 text-accent" />,
      title: "Screenshot Protection",
      description: "Advanced screenshot and screen recording protection prevents unauthorized capture of sensitive conversations.",
      category: "Authentication & Security",
      isPremium: false
    },
    {
      icon: <AlertTriangle className="h-8 w-8 text-destructive" />,
      title: "Link Security Scanner",
      description: "Automatic detection of suspicious links in messages with privacy-first scanning that protects your data.",
      category: "Authentication & Security",
      isPremium: false
    },
    
    // Core Messaging
    {
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      title: "Secure Messaging",
      description: "Send encrypted text messages with end-to-end encryption ensuring complete privacy and security.",
      category: "Core Messaging",
      isPremium: false
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Group Conversations",
      description: "Create secure group chats with multiple participants while maintaining end-to-end encryption.",
      category: "Core Messaging", 
      isPremium: false
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-accent" />,
      title: "Direct Messages",
      description: "Private one-on-one conversations with complete encryption and security between participants.",
      category: "Core Messaging",
      isPremium: false
    },
    {
      icon: <Inbox className="h-8 w-8 text-primary" />,
      title: "Message Requests",
      description: "Send and receive connection requests to start new conversations securely with privacy controls.",
      category: "Core Messaging",
      isPremium: false
    },
    
    // Advanced Features  
    {
      icon: <UserX className="h-8 w-8 text-accent" />,
      title: "Anonymous Group Posting",
      description: "Post anonymously in group conversations with rotating identifiers (Anon-1, Anon-2) while admins maintain oversight.",
      category: "Advanced Features",
      isPremium: false,
      isNew: true
    },
    {
      icon: <ThumbsUp className="h-8 w-8 text-primary" />,
      title: "Message Reactions",
      description: "React to messages with preset responses like ✅ Seen, 🔥 Agree, 🤔 Question, 👀 Looking into it.",
      category: "Advanced Features", 
      isPremium: false
    },
    {
      icon: <Reply className="h-8 w-8 text-primary" />,
      title: "Reply & Edit Messages",
      description: "Reply to specific messages and edit sent messages with full conversation context and history.",
      category: "Advanced Features",
      isPremium: false
    },
    {
      icon: <Eye className="h-8 w-8 text-accent" />,
      title: "Read Receipts & Typing Indicators",
      description: "See who has read your messages and when someone is typing for better conversation awareness.",
      category: "Advanced Features",
      isPremium: false
    },
    {
      icon: <Globe className="h-8 w-8 text-primary" />,
      title: "Real-Time Translation",
      description: "Automatic message translation supporting multiple languages for seamless global communication.",
      category: "Advanced Features",
      isPremium: false
    },
    
    // File & Media
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: "Secure File Sharing",
      description: "Share files securely with automatic encryption and secure storage in military-grade infrastructure.",
      category: "File & Media Sharing",
      isPremium: false
    },
    {
      icon: <ImageIcon className="h-8 w-8 text-accent" />,
      title: "Media Sharing",
      description: "Share images and videos with automatic encryption and secure delivery to conversation participants.",
      category: "File & Media Sharing", 
      isPremium: false
    },
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: "Secure File Vault",
      description: "Personal encrypted file storage with secure access controls and automatic encryption at rest.",
      category: "File & Media Sharing",
      isPremium: false
    },
    
    // Privacy & Data Protection
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Database Encryption", 
      description: "All sensitive data encrypted at rest with AES-256 encryption and unique salts per record.",
      category: "Privacy & Data Protection",
      isPremium: false
    },
    {
      icon: <Lock className="h-8 w-8 text-primary" />,
      title: "Row Level Security",
      description: "Database-level access controls ensuring users can only access their own data with strict policies.",
      category: "Privacy & Data Protection", 
      isPremium: false
    },
    {
      icon: <UserX className="h-8 w-8 text-accent" />,
      title: "Minimal Data Collection",
      description: "Only email and password required - no phone numbers, location data, or unnecessary personal information.",
      category: "Privacy & Data Protection",
      isPremium: false
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Password Security",
      description: "Argon2 password hashing with breach detection and secure password requirements for account protection.",
      category: "Privacy & Data Protection",
      isPremium: false
    },
    
    // Customization
    {
      icon: <User className="h-8 w-8 text-primary" />,
      title: "Profile Customization", 
      description: "Custom avatars, display names, and wallpapers with secure storage and privacy controls.",
      category: "Customization & Settings",
      isPremium: false
    },
    {
      icon: <Settings className="h-8 w-8 text-muted-foreground" />,
      title: "Comprehensive Settings",
      description: "Full control over privacy, security, appearance, and functionality with granular permission controls.",
      category: "Customization & Settings",
      isPremium: false
    }
  ];

  const encryptionFeatures = [
    "AES-256-GCM Message Encryption: Authenticated Encryption with Associated Data (AEAD) for end-to-end message security",
    "PBKDF2 Key Derivation: 250,000 iterations with SHA-512 and 32-byte salt for message encryption keys",
    "Double-Layered Key Storage: Private keys encrypted with AES-256-GCM using 500,000 PBKDF2 iterations",
    "Ed25519 Identity Keys: Elliptic curve digital signature algorithm for user identity verification",
    "X25519 Ephemeral Keys: Curve25519 ECDH for secure key exchange and perfect forward secrecy",
    "ECDH P-384 Curve: Enhanced key pair generation for additional cryptographic strength",
    "HKDF-SHA-512: HMAC-based key derivation function for shared secret generation",
    "HMAC-SHA-512 Authentication: 512-bit message authentication codes for integrity verification",
    "ECDSA P-384 Digital Signatures: Elliptic curve signatures with SHA-512 for non-repudiation",
    "Signal Protocol Architecture: Industry-standard E2EE protocol with double ratchet algorithm",
    "Forward Secrecy & Double Ratchet: HMAC-SHA-512 based chain key ratcheting for message security",
    "Password Security: PBKDF2 with SHA-512, 250,000 iterations, and 32-byte salt for account passwords",
    "K-Anonymity Breach Detection: Client-side SHA-1 hashing for privacy-preserving password breach checks",
    "Cryptographically Secure Sessions: 64-byte random session tokens with timestamp validation",
    "GCM Authentication Tags: Built-in authentication for all encrypted data",
    "Zero-Knowledge Architecture: Server cannot access message content or encryption keys",
    "Perfect Forward Secrecy: Ephemeral keys ensure past communications remain secure if keys are compromised",
    "Replay Attack Protection: Timestamp and nonce validation prevents message replay attacks",
    "Buffer Overflow Protection: Secure memory handling prevents exploitation vulnerabilities",
    "Military-Grade Standards: Meets NSA Suite B cryptographic standards for classified information",
    "HTTPS/TLS 1.3: All communications encrypted in transit with latest TLS protocol",
    "Row Level Security: Database policies restricting data access at the database level",
    "Encrypted File Storage: All files encrypted with AES-256-GCM before storage",
    "Rate Limiting: Prevent brute force and spam attacks with intelligent throttling",
    "SQL Injection Prevention: Parameterized queries and ORM protection",
    "CORS Protection: Controlled cross-origin resource sharing for API security"
  ];

  const categories = Array.from(new Set(coreFeatures.map(f => f.category)));

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-16">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 backdrop-blur-sm"
          >
            <Shield className="h-4 w-4" />
            Privacy-First Communication Platform
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent"
          >
            Our Live Features
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Rome is actively deployed with these working features. Every feature listed below 
            is fully functional and available for you to use right now in our secure messaging platform.
          </motion.p>
        </motion.div>

        {/* Feature Categories */}
        {categories.map((category, catIndex) => (
          <motion.div 
            key={category} 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: catIndex * 0.1, duration: 0.6 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4">
              <motion.h3 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: catIndex * 0.1 + 0.2, duration: 0.5 }}
                className="text-2xl sm:text-3xl font-bold text-foreground whitespace-nowrap"
              >
                {category}
              </motion.h3>
              <motion.div 
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: catIndex * 0.1 + 0.3, duration: 0.7 }}
                className="flex-1 h-px bg-gradient-to-r from-border via-border/50 to-transparent origin-left"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coreFeatures
                .filter(feature => feature.category === category)
                .map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="relative h-full overflow-hidden border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group">
                    {feature.isNew && (
                      <div className="absolute top-3 right-3 z-10">
                        <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border-accent/30 backdrop-blur-sm">
                          New
                        </Badge>
                      </div>
                    )}
                    {feature.isPremium && (
                      <div className="absolute top-3 left-3 z-10">
                        <Badge variant="secondary" className="bg-primary/20 text-primary-foreground border-primary/30 backdrop-blur-sm">
                          <Crown className="h-3 w-3 mr-1" />
                          Pro
                        </Badge>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <CardHeader className="pb-4 relative">
                      <div className="flex items-start gap-4">
                        <motion.div 
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          className="p-3 rounded-xl bg-muted/70 group-hover:bg-primary/10 transition-colors duration-300 border border-border/50"
                        >
                          {feature.icon}
                        </motion.div>
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors duration-300">
                            {feature.title}
                          </CardTitle>
                          <CardDescription className="text-sm leading-relaxed">
                            {feature.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Encryption Technologies */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="text-center space-y-4">
            <motion.h3 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-3xl sm:text-4xl font-bold text-foreground"
            >
              Active Security Technologies
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-muted-foreground max-w-2xl mx-auto text-lg"
            >
              Security protocols and encryption methods currently protecting your data in Rome
            </motion.p>
          </div>
          
          <Tabs defaultValue="encryption" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
              <TabsTrigger value="encryption">Encryption</TabsTrigger>
              <TabsTrigger value="authentication">Auth</TabsTrigger>
              <TabsTrigger value="protection">Protection</TabsTrigger>
            </TabsList>
            
            <TabsContent value="encryption" className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {encryptionFeatures.slice(0, 12).map((feature, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.03, duration: 0.4 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border/40 hover:border-primary/30 hover:bg-muted/30 transition-all duration-300 group"
                  >
                    <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-sm text-foreground leading-relaxed">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="authentication" className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {encryptionFeatures.slice(12, 20).map((feature, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.03, duration: 0.4 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border/40 hover:border-primary/30 hover:bg-muted/30 transition-all duration-300 group"
                  >
                    <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-sm text-foreground leading-relaxed">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="protection" className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {encryptionFeatures.slice(20).map((feature, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.03, duration: 0.4 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border/40 hover:border-primary/30 hover:bg-muted/30 transition-all duration-300 group"
                  >
                    <Eye className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-sm text-foreground leading-relaxed">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8 py-16 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent rounded-3xl -z-10" />
          
          <motion.h3 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent"
          >
            Ready to Try These Features?
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg"
          >
            All features are live and ready to use. Start experiencing secure, 
            private communication with Rome's comprehensive feature set today.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg" 
                onClick={() => navigate('/dashboard')}
                className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
              >
                <MessageSquare className="h-5 w-5" />
                Start Messaging
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.open('https://docs.rome-chat.com', '_blank')}
                className="gap-2 border-border/40 hover:border-primary/30"
              >
                <FileText className="h-5 w-5" />
                Learn More
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Features;