import { motion } from "framer-motion";
import tailscaleLogo from "@/assets/tailscale-logo.png";
import zorakLogo from "@/assets/aureum-logo.png";

export function TechnologyStack() {
  const technologies = [
    {
      name: "Tailscale",
      logo: tailscaleLogo,
      description: "Zero-config VPN for secure networking"
    },
    {
      name: "Zorak",
      logo: zorakLogo,
      description: "Military-grade encryption technology"
    },
    {
      name: "AES-256-GCM",
      logo: null,
      description: "Military-grade AEAD encryption for all data"
    },
    {
      name: "Argon2",
      logo: null,
      description: "Password-level encryption for all files"
    }
  ];

  return (
    <section className="relative py-16 px-4 bg-transparent">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent mb-4">
            Powered By Industry Leaders
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ROME leverages cutting-edge security technologies to protect your communications
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {technologies.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="relative h-full rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                {/* Logo Container */}
                <div className="flex justify-center items-center mb-6 h-32">
                  {tech.logo ? (
                    <img 
                      src={tech.logo} 
                      alt={`${tech.name} logo`}
                      className="max-h-full max-w-full object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-300 group-hover:scale-110 transition-transform rounded-2xl"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                      <span className="text-3xl font-bold text-primary">🔐</span>
                    </div>
                  )}
                </div>
                
                {/* Tech Name */}
                <h3 className="text-xl font-bold text-center text-foreground mb-2">
                  {tech.name}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-center text-muted-foreground">
                  {tech.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
          {technologies.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="relative h-full rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                {/* Logo Container */}
                <div className="flex justify-center items-center mb-6 h-32">
                  {tech.logo ? (
                    <img 
                      src={tech.logo} 
                      alt={`${tech.name} logo`}
                      className="max-h-full max-w-full object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-300 group-hover:scale-110 transition-transform rounded-2xl"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                      <span className="text-3xl font-bold text-primary">🔐</span>
                    </div>
                  )}
                </div>
                
                {/* Tech Name */}
                <h3 className="text-xl font-bold text-center text-foreground mb-2">
                  {tech.name}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-center text-muted-foreground">
                  {tech.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
