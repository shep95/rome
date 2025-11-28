# NOMAD OSINT Tools Reference
## Total: 380+ Open-Source Intelligence Tools

Last Updated: 2025-11-28

---

## 🔍 CORE OSINT TOOLS (15 Tools)

### Network & DNS Intelligence
1. **ip_lookup** - Detailed IP geolocation with ISP, timezone, VPN/proxy detection
2. **whois_lookup** - Domain registration data, registrar, creation/expiry dates
3. **dns_enumerate** - Comprehensive DNS records (A, AAAA, MX, NS, TXT, CNAME, SOA)
4. **reverse_dns** - Reverse DNS lookup from IP to hostname
5. **enumerate_subdomains** - Discover subdomains via DNS enumeration
6. **find_subdomains_crtsh** - Certificate transparency subdomain discovery

### Web Security Analysis
7. **check_security_headers** - HTTP security headers analysis (CSP, HSTS, X-Frame-Options)
8. **check_technologies** - Identify frameworks, CMS, analytics, hosting provider
9. **check_website_status** - Site availability, response time, status codes
10. **extract_metadata** - Extract metadata, Open Graph tags, security headers
11. **check_robots_txt** - Analyze robots.txt for hidden directories

### Data & Breach Intelligence
12. **check_breach** - HaveIBeenPwned breach database lookup
13. **extract_emails** - Extract email addresses from websites/text
14. **check_username** - Username availability across social platforms
15. **check_redirect_chain** - Follow and analyze HTTP redirect chains

---

## 🌐 WEB APPLICATION SECURITY (85 Tools)

### Vulnerability Scanning
16. **scan_vulnerabilities** - VulnRisk-style vulnerability assessment
17. **test_sql_injection** - SQLMap-style SQL injection testing
18. **run_pentest** - Autonomous AI-powered penetration testing
19. **analyze_ssl** - SSL Labs comprehensive SSL/TLS analysis
20. **lookup_certificate** - Certificate transparency log search
21. **lookup_cve** - NIST NVD CVE vulnerability lookup

### Exploitation Payloads
22. **sqlmap_payloads** - SQL injection payloads by database type
23. **xss_payloads** - XSS payloads (reflected, stored, DOM)
24. **xxe_payloads** - XML External Entity exploitation
25. **ssrf_payloads** - Server-Side Request Forgery attacks
26. **lfi_rfi_payloads** - Local/Remote File Inclusion exploits
27. **command_injection_payloads** - OS command injection by platform

### API & Authentication Testing
28. **csrf_token_analysis** - CSRF protection analysis
29. **idor_testing** - Insecure Direct Object Reference testing
30. **jwt_analysis** - JWT token decode and analysis
31. **oauth_flow_analysis** - OAuth implementation security
32. **api_key_scanner** - Scan for exposed API keys
33. **graphql_introspection** - GraphQL schema enumeration
34. **rest_api_fuzzing** - REST API endpoint fuzzing
35. **grpc_enumeration** - gRPC service/method discovery

### Protocol Analysis
36. **websocket_analysis** - WebSocket security assessment
37. **mqtt_enumeration** - MQTT broker/topic enumeration
38. **amqp_analysis** - RabbitMQ/AMQP security analysis
39. **check_cors_policy** - CORS misconfiguration testing

### Content & Information Disclosure
40. **find_api_endpoints** - API endpoint discovery
41. **find_js_libraries** - JavaScript library identification
42. **check_exposed_files** - Exposed sensitive file scanning (.git, .env, backups)
43. **find_hidden_params** - Hidden parameter discovery
44. **check_waf_presence** - Web Application Firewall detection
45. **analyze_cookies** - Cookie security analysis
46. **find_admin_panels** - Admin panel discovery
47. **find_backup_files** - Backup file enumeration
48. **check_clickjacking** - Clickjacking vulnerability testing
49. **find_leaked_keys** - Leaked secret key detection
50. **check_open_redirects** - Open redirect vulnerability testing
51. **find_staging_environments** - Staging server discovery
52. **check_cms_version** - CMS version fingerprinting
53. **find_archived_pages** - Wayback Machine archive search
54. **check_subdomain_takeover** - Subdomain takeover vulnerability
55-100. **[45 more web security tools]** - Directory fuzzing, SSTI, CRLF injection, prototype pollution, deserialization, template injection, XXS filters, etc.

---

## 🗄️ DATABASE & CLOUD INFRASTRUCTURE (45 Tools)

### Database Enumeration
101. **redis_enumeration** - Redis instance/key enumeration
102. **mongodb_enumeration** - MongoDB database/collection discovery
103. **elasticsearch_enumeration** - Elasticsearch index enumeration
104. **memcached_scan** - Memcached data exposure scanning
105. **cassandra_enumeration** - Cassandra keyspace enumeration
106. **couchdb_enumeration** - CouchDB database discovery

### Cloud Storage
107. **s3_bucket_scanner** - AWS S3 bucket discovery
108. **azure_blob_scanner** - Azure Blob storage exposure
109. **gcp_bucket_scanner** - GCP storage bucket scanning
110. **find_cloud_storage** - Multi-cloud storage enumeration

### Container & Orchestration
111. **docker_registry_scan** - Docker registry image enumeration
112. **kubernetes_enumeration** - Kubernetes resource discovery
113. **etcd_enumeration** - etcd key-value store access
114. **consul_enumeration** - Consul service/KV enumeration
115. **vault_enumeration** - HashiCorp Vault secret discovery

### DevOps & CI/CD
116. **jenkins_enumeration** - Jenkins job/credential discovery
117. **gitlab_enumeration** - GitLab repository/secret scanning
118. **jira_enumeration** - Jira project/issue enumeration
119. **confluence_enumeration** - Confluence space/page discovery
120. **terraform_state_scanner** - Terraform state file exposure
121. **ansible_vault_cracker** - Ansible Vault password cracking
122. **chef_knife_enumeration** - Chef infrastructure enumeration
123. **puppet_enumeration** - Puppet node/module discovery
124. **saltstack_enumeration** - SaltStack minion enumeration
125-145. **[21 more DevOps tools]** - CircleCI, Travis CI, GitHub Actions, etc.

---

## 📡 WIRELESS & IoT SECURITY (30 Tools)

### WiFi & Bluetooth
146. **wifi_network_scanner** - WiFi network discovery
147. **wpa_handshake_capture** - WPA handshake capture for analysis
148. **wps_pin_attack** - WPS PIN vulnerability testing
149. **bluetooth_scanner** - Bluetooth device discovery (Classic & BLE)

### RFID & NFC
150. **rfid_cloner** - RFID card cloning/analysis
151. **nfc_reader** - NFC tag/card reading

### IoT Protocols
152. **zigbee_sniffer** - ZigBee network traffic analysis
153. **zwave_enumeration** - Z-Wave device enumeration
154. **lorawan_sniffer** - LoRaWAN communication sniffing

### SCADA & Industrial
155. **scada_scanner** - SCADA/ICS system scanning
156. **modbus_enumeration** - Modbus device discovery
157. **bacnet_scanner** - BACnet building automation scanning
158. **dnp3_analyzer** - DNP3 protocol analysis
159. **profinet_scanner** - PROFINET industrial network scanning
160. **ethercat_analyzer** - EtherCAT protocol analysis
161. **canbus_sniffer** - CAN bus automotive network sniffing
162. **obd2_scanner** - OBD-II vehicle diagnostics
163-175. **[13 more IoT/SCADA tools]**

---

## 📻 RADIO & SATELLITE COMMUNICATIONS (25 Tools)

### Radio Protocols
176. **sdr_signal_analyzer** - Software Defined Radio signal analysis
177. **gsm_sniffer** - GSM network traffic sniffing
178. **lte_imsi_catcher** - LTE/4G IMSI catcher detection
179. **ss7_vulnerability_scanner** - SS7 protocol vulnerability scanning
180. **sip_scanner** - SIP/VoIP infrastructure scanning
181. **dect_sniffer** - DECT cordless phone sniffing
182. **tetra_decoder** - TETRA radio decoding
183. **p25_decoder** - P25 public safety radio decoding
184. **dmr_decoder** - DMR digital radio decoding

### Paging & Legacy Systems
185. **pocsag_pager_decoder** - POCSAG pager message decoding
186. **flex_pager_decoder** - FLEX pager protocol decoding

### Satellite Communications
187. **weather_satellite_decoder** - Weather satellite imagery (NOAA, METEOR)
188. **iridium_decoder** - Iridium satellite communications
189. **inmarsat_decoder** - Inmarsat satellite data
190. **starlink_tracker** - Starlink constellation tracking

### Navigation & Tracking
191. **ais_ship_tracker** - AIS ship tracking
192. **adsb_aircraft_tracker** - ADS-B aircraft tracking
193. **acars_decoder** - ACARS aircraft message decoding
194. **aprs_tracker** - APRS ham radio position tracking
195. **gps_spoofer** - GPS spoofing simulation
196-200. **[5 more radio/tracking tools]**

---

## 🔐 NETWORK & PROTOCOL ANALYSIS (30 Tools)

### Network Mapping
201. **find_network_neighbors** - Same-subnet host discovery
202. **asn_lookup** - Autonomous System information
203. **bgp_hijack_detector** - BGP route hijacking detection
204. **ipv6_enumeration** - IPv6 address range enumeration
205. **submarine_cable_mapper** - Undersea fiber optic cable mapping

### Tunneling Detection
206. **icmp_tunnel_detector** - ICMP tunneling detection
207. **dns_tunnel_detector** - DNS tunneling/exfiltration detection
208. **http_tunnel_detector** - HTTP/HTTPS tunneling detection
209. **covert_channel_detector** - Covert communication channel detection

### Protocol Security
210. **diameter_protocol_analyzer** - Diameter protocol security
211. **rtp_stream_analyzer** - RTP media stream analysis
212-230. **[19 more network/protocol tools]**

---

## 🎭 SOCIAL MEDIA & PEOPLE OSINT (50 Tools)

### Username Intelligence
231. **sherlock_username_search** - Cross-platform username hunting
232. **maigret_osint** - Username data collection
233. **whatsmyname_search** - Username enumeration
234. **namechk_availability** - Username availability checker
235. **social_analyzer** - Social media account analysis

### Platform-Specific
236. **linkedin_osint** - LinkedIn profile deep dive
237. **twitter_osint** - Twitter/X account analysis
238. **facebook_osint** - Facebook intelligence gathering
239. **instagram_osint** - Instagram profile analysis
240. **tiktok_osint** - TikTok creator intelligence
241. **reddit_osint** - Reddit user analysis
242. **youtube_osint** - YouTube channel analysis
243. **twitch_osint** - Twitch streamer analysis
244. **discord_osint** - Discord user/server intelligence
245. **snapchat_osint** - Snapchat user lookup
246. **telegram_osint** - Telegram intelligence
247. **whatsapp_osint** - WhatsApp intelligence (limited)

### Financial Platforms
248. **cashapp_osint** - CashApp user lookup
249. **venmo_osint** - Venmo transaction analysis
250. **paypal_osint** - PayPal account intelligence
251. **crypto_wallet_trace** - Cryptocurrency wallet tracing

### Professional Networks
252. **professional_network_osint** - Deep LinkedIn analysis
253. **employment_history** - Employment tracking
254. **education_verification** - Educational credential verification
255. **professional_license_lookup** - Professional license searches
256-280. **[25 more social/people OSINT tools]**

---

## 💰 FINANCIAL & CORPORATE INTELLIGENCE (40 Tools)

### Market Intelligence
281. **sec_filings** - SEC filing search
282. **insider_trading** - Insider trading analysis
283. **stock_sentiment** - Market sentiment analysis
284. **options_flow** - Unusual options activity
285. **crypto_wallet_trace** - Blockchain transaction tracing
286. **blockchain_analytics** - On-chain analytics
287. **defi_protocol_analysis** - DeFi protocol security
288. **nft_ownership** - NFT ownership tracking
289. **smart_contract_audit** - Smart contract vulnerability analysis

### Regulatory & Legal
290. **ftc_actions** - FTC enforcement actions
291. **antitrust_cases** - Antitrust case searches
292. **merger_filings** - M&A filing searches
293. **beneficial_ownership** - Beneficial ownership tracking
294. **shell_company_check** - Shell company indicators
295. **offshore_entities** - Offshore entity databases
296. **panama_papers** - Panama Papers leak search
297. **paradise_papers** - Paradise Papers investigation
298. **court_records** - Court case searches
299. **bankruptcy_filings** - Bankruptcy record searches
300-320. **[21 more financial/legal tools]**

---

## 🦠 THREAT INTELLIGENCE & MALWARE (60 Tools)

### Malware Analysis Sandboxes
321. **cuckoo_sandbox_analyzer** - Cuckoo automated malware analysis
322. **joe_sandbox_analyzer** - Joe Sandbox file analysis
323. **any_run_analyzer** - ANY.RUN interactive analysis
324. **hybrid_analysis** - Hybrid Analysis multi-scanner
325. **intezer_analyze** - Genetic malware analysis
326. **reversing_labs_lookup** - ReversingLabs file reputation

### Threat Intelligence Feeds
327. **alienvault_otx_lookup** - AlienVault OTX threat data
328. **threatcrowd_lookup** - ThreatCrowd aggregated threat intelligence
329. **threatminer_lookup** - ThreatMiner IoC search
330. **circl_passive_dns** - CIRCL Passive DNS database
331. **circl_passive_ssl** - CIRCL Passive SSL certificate data

### Threat Hunting
332. **apt_tracking** - Advanced Persistent Threat tracking
333. **ransomware_tracking** - Ransomware operation tracking
334. **exploit_database** - Exploit-DB vulnerability search
335. **zero_day_tracking** - Zero-day vulnerability monitoring
336. **ioc_search** - Indicators of Compromise search
337. **threat_intelligence_feed** - Multi-source threat feeds
338. **darkweb_forum_monitor** - Dark web monitoring

### Detection Rules
339. **yara_rule_search** - YARA malware detection rules
340. **sigma_rule_search** - Sigma log detection rules
341. **snort_rule_search** - Snort IDS signatures
342. **suricata_rule_search** - Suricata IDS/IPS rules
343. **capa_malware_analyzer** - CAPA capability analysis
344-380. **[37 more threat intelligence tools]**

---

## 🔎 ADVANCED RECONNAISSANCE (30 Tools)

### Attack Surface Mapping
381. **amass_enumeration** - OWASP Amass attack surface mapping
382. **subfinder_enum** - ProjectDiscovery Subfinder
383. **assetfinder_domains** - Tomnomnom Assetfinder
384. **findomain_recon** - Cross-platform subdomain finder
385. **chaos_dataset** - ProjectDiscovery Chaos dataset
386. **dnsdumpster_recon** - DNSdumpster reconnaissance
387. **securitytrails_api** - SecurityTrails DNS intelligence

### Internet-Wide Scanning
388. **shodan_search** - Shodan IoT/exposed device search
389. **censys_search** - Censys host/certificate search
390. **binaryedge_search** - BinaryEdge exposed system search
391. **zoomeye_search** - ZoomEye cyberspace search
392. **fofa_search** - FOFA network asset search

### Code & Repository Intelligence
393. **search_github** - GitHub repository/code/user search
394. **check_github_repos** - GitHub repository analysis
395. **grep_app_search** - grep.app code search
396. **searchcode_search** - Open source code search
397. **publicwww_search** - PublicWWW source code search
398-410. **[13 more recon tools]**

---

## 🗂️ DATA BREACH & LEAK DATABASES (15 Tools)

411. **check_breach** - HaveIBeenPwned
412. **dehashed_search** - DeHashed breach database
413. **snusbase_search** - Snusbase leak database
414. **weleakinfo_search** - WeLeakInfo archives
415. **intelx_search** - Intelligence X leak search
416. **leak_lookup** - leak-lookup.com database
417. **check_pastebin** - Pastebin leak search
418. **check_dark_web_mentions** - Dark web mention tracking
419. **find_data_breaches** - Multi-source breach aggregation
420. **check_leaked_credentials** - Credential leak detection
421-425. **[5 more breach databases]**

---

## 🖼️ IMAGE & MEDIA INTELLIGENCE (10 Tools)

426. **reverse_image_search** - Multi-platform reverse image search
427. **face_recognition_osint** - Social media face recognition
428. **pimeyes_face_search** - PimEyes facial recognition
429. **clearview_ai_search** - Clearview AI face search
430. **exif_data_extractor** - EXIF metadata extraction
431. **steganography_detector** - Hidden data in images/files
432. **deepfake_detection** - Deepfake image/video detection
433-435. **[3 more media tools]**

---

## 🚗 VEHICLE & TRANSPORTATION (8 Tools)

436. **license_plate_lookup** - Vehicle plate information
437. **vin_decoder** - VIN decoding
438. **aircraft_tail_lookup** - Aircraft registration lookup
439. **vessel_imo_lookup** - Ship IMO number lookup
440. **ham_radio_lookup** - Ham radio callsign details
441. **fcc_license_lookup** - FCC license database
442-443. **[2 more transport tools]**

---

## 📱 COMMUNICATIONS & MESSAGING (12 Tools)

444. **telegram_bot_enumeration** - Telegram bot/channel discovery
445. **slack_token_scanner** - Exposed Slack token detection
446. **discord_token_scanner** - Exposed Discord token detection
447. **whatsapp_osint** - WhatsApp intelligence (limited)
448. **signal_osint** - Signal messenger intelligence
449. **wickr_osint** - Wickr secure messaging analysis
450-455. **[6 more messaging tools]**

---

## 🔨 SECURITY TOOL DATABASES (10 Tools)

456. **get_security_tool** - Comprehensive tool information (100+ tools)
457. **search_security_tools** - Search by category/use case
458. **metasploit_modules** - Metasploit Framework modules
459. **nuclei_templates** - Nuclei vulnerability templates
460. **nmap_scan_profiles** - Nmap scan profiles/commands
461. **gobuster_wordlists** - Gobuster wordlist access
462. **ffuf_fuzzing** - FFUF web fuzzer techniques
463. **kali_linux_tools** - Kali Linux tool arsenal
464. **parrot_os_tools** - ParrotOS security tools
465. **blackarch_repository** - BlackArch penetration testing tools

---

## 🧩 REVERSE ENGINEERING (8 Tools)

466. **ghidra_decompiler** - Ghidra binary decompilation
467. **ida_pro_analysis** - IDA Pro disassembly techniques
468. **radare2_analysis** - Radare2 reverse engineering
469. **binary_ninja_decompile** - Binary Ninja decompilation
470. **flare_vm_setup** - FLARE-VM malware analysis VM
471. **remnux_toolkit** - REMnux malware analysis Linux
472-473. **[2 more RE tools]**

---

## 🎯 VULNERABILITY DATABASES (12 Tools)

474. **lookup_cve** - NIST NVD lookup
475. **exploit_db_search** - Exploit Database search
476. **packet_storm_search** - PacketStorm Security
477. **rapid7_vulnerability_db** - Rapid7 vulnerability data
478. **vulners_search** - Vulners security database
479. **cvedetails_lookup** - CVEDetails comprehensive lookup
480. **nist_nvd_search** - NIST NVD advanced search
481. **cisa_kev_catalog** - CISA Known Exploited Vulnerabilities
482. **epss_score_lookup** - EPSS exploit prediction scoring
483. **opencve_monitoring** - OpenCVE vulnerability monitoring
484-485. **[2 more vuln databases]**

---

## 🏢 CORPORATE & BUSINESS INTELLIGENCE (15 Tools)

486. **find_company_info** - Company information aggregation
487. **find_linkedin_employees** - LinkedIn employee enumeration
488. **employment_history** - Employment history tracking
489. **medical_professional_lookup** - Medical professional databases
490. **lawyer_bar_lookup** - Bar association attorney search
491. **business_license_lookup** - Business license verification
492. **property_records** - Property ownership records
493. **corporate_filings** - Corporate filing searches
494. **trademark_search** - Trademark database search
495. **copyright_search** - Copyright registration search
496-500. **[5 more corporate tools]**

---

## 🌍 GEOINT & PHYSICAL LOCATION (8 Tools)

501. **location_osint** - Comprehensive property intelligence
502. **find_ip_geolocation** - Detailed IP geolocation
503. **satellite_tracker** - Satellite communication tracking
504. **submarine_cable_mapper** - Undersea cable mapping
505. **gps_spoofer** - GPS spoofing simulation
506-508. **[3 more GEOINT tools]**

---

## 🛡️ PENETRATION TESTING FRAMEWORKS (12 Tools)

509. **spiderfoot_osint** - SpiderFoot automated OSINT
510. **recon_ng_modules** - Recon-ng reconnaissance
511. **maltego_transforms** - Maltego OSINT transforms
512. **osint_framework_nav** - OSINT Framework navigation
513. **osint_framework_search** - Comprehensive OSINT search
514. **pentestbox_tools** - Windows pentesting tools
515. **social_engineering_assessment** - Social engineering testing
516. **physical_security_audit** - Physical security assessment
517-520. **[4 more pentest tools]**

---

## 🔬 SPECIALIZED TOOLS (30+ Tools)

### Steganography & Forensics
- **steganography_detector** - Hidden data detection
- **exif_data_extractor** - Image metadata extraction
- Digital forensics tools

### Disinformation & OSINT
- **disinformation_tracking** - Disinformation campaign tracking
- **fact_checking** - Fact verification tools
- **bot_detection** - Social media bot detection

### Legal & Compliance
- **court_records** - Court case searches
- **arrest_records** - Criminal record searches
- **sex_offender_registry** - Sex offender database
- **firearms_trace** - Firearm serial number tracing
- **stolen_property_check** - Stolen property databases
- **art_theft_database** - Stolen art search
- **wildlife_trafficking** - Wildlife trafficking networks
- **counterfeit_detection** - Counterfeit goods detection

### Regulatory & Public Records
- **fda_recalls** - FDA product recalls
- **nhtsa_recalls** - Vehicle recall database
- **consumer_complaints** - Consumer complaint searches
- **environmental_violations** - EPA violation records
- **osha_violations** - Workplace safety violations
- **visa_status** - Visa/immigration status
- **customs_records** - Border crossing records
- **shipping_manifest** - Cargo/shipping records

### Network Databases
- **networksdb_search** - WiFi network databases
- **wigle_wifi_search** - WiGLE WiFi database
- **viewdns_tools** - ViewDNS investigation tools
- **urlscan_io** - URL scanning and analysis

### Email Intelligence
- **hunter_io_email_finder** - Hunter.io email discovery
- **hunter_io_email_verifier** - Email deliverability verification
- **check_email_format** - Email format validation
- **check_email_delivery** - Email delivery testing
- **find_email_patterns** - Company email pattern discovery

### Additional Categories
- Dating app OSINT
- Payment platform intelligence
- Content creator platforms (OnlyFans, Patreon)
- Professional licensing
- Medical professional databases
- And 200+ more specialized tools

---

## 🎯 TOOL USAGE GUIDELINES

### Automatic Cross-Domain Research
When you use certain core tools, NOMAD automatically executes related tools for comprehensive intelligence:

**Domain/URL Analysis** triggers:
- WHOIS lookup
- DNS enumeration
- Security header analysis
- SSL/TLS assessment
- Technology stack identification
- Subdomain discovery

**Username Research** triggers:
- Sherlock username search
- Social media platform checks
- Email pattern discovery

**IP Analysis** triggers:
- Geolocation lookup
- ASN information
- Network neighbor discovery
- Tor exit node check

### Response Formatting

**Cybersecurity Investigations** use STRUCTURED FORMAT:
- Clear sections with emojis (🔍 🔒 📊 ⚠️)
- Unicode separators (═ ─ │)
- Bullet points for findings
- Cross-domain intelligence section
- Actionable recommendations

**General Conversations** use PLAIN FORMAT:
- No emojis or structure
- Conversational paragraphs
- Casual, friendly tone

---

## 📊 TOOL STATISTICS

- **Total Tools**: 380+
- **Network & Infrastructure**: 90+
- **Web Application Security**: 85+
- **Threat Intelligence**: 60+
- **OSINT & Reconnaissance**: 70+
- **Database & Cloud**: 45+
- **Wireless & IoT**: 30+
- **Communications**: 20+
- **Breach Databases**: 15+
- **Reverse Engineering**: 15+
- **Financial Intelligence**: 40+
- **Legal & Public Records**: 30+

---

## 🚀 USAGE EXAMPLES

### Domain Security Audit
```
User: "check for weaknesses in https://example.com"

NOMAD automatically executes:
- check_security_headers
- whois_lookup
- dns_enumerate
- check_technologies
- analyze_ssl
- lookup_certificate
- find_subdomains_crtsh

Returns structured report with all findings
```

### Username Investigation
```
User: "find information about username: john_doe"

NOMAD automatically executes:
- check_username
- sherlock_username_search
- social_analyzer
- maigret_osint

Returns cross-platform username intelligence
```

### IP Intelligence
```
User: "lookup IP 8.8.8.8"

NOMAD automatically executes:
- ip_lookup (with map visualization)
- asn_lookup
- check_tor_exit_nodes
- find_network_neighbors

Returns comprehensive IP intelligence with map
```

---

## 🛡️ SECURITY & ETHICS

All tools are designed for:
✅ Authorized security testing
✅ OSINT research
✅ Threat intelligence
✅ Security auditing

⚠️ NEVER use for:
❌ Unauthorized access
❌ Illegal surveillance
❌ Privacy violations
❌ Malicious purposes

---

## 📚 TOOL CATEGORIES BREAKDOWN

1. **Network Scanning & Enumeration** (90 tools)
   - Port scanning, DNS reconnaissance, subdomain enumeration, network mapping

2. **Web Application Security** (85 tools)
   - SQLi, XSS, CSRF, IDOR, API testing, authentication bypass

3. **Threat Intelligence** (60 tools)
   - Malware sandboxes, APT tracking, IoC databases, threat feeds

4. **OSINT & Social Engineering** (70 tools)
   - Username hunting, social media analysis, people search, GEOINT

5. **Cloud & Database** (45 tools)
   - S3/Azure/GCP, MongoDB, Redis, Elasticsearch, Kubernetes, Docker

6. **Wireless & RF** (30 tools)
   - WiFi, Bluetooth, ZigBee, LoRa, SDR, satellite, radio protocols

7. **Financial & Corporate** (40 tools)
   - SEC filings, blockchain, crypto tracing, corporate intelligence

8. **Legal & Public Records** (30 tools)
   - Court records, property records, licensing, regulatory databases

9. **Breach & Leak Databases** (15 tools)
   - HaveIBeenPwned, DeHashed, Snusbase, Intelligence X

10. **Reverse Engineering** (15 tools)
    - Ghidra, IDA Pro, Radare2, Binary Ninja, malware analysis VMs

---

**Last Updated**: 2025-11-28
**Maintained By**: NOMAD AI Security Framework
**Total Tools**: 380+ and growing
