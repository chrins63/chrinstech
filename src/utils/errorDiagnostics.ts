/**
 * ChrisTech Root Cause & Diagnostic Remediation Engine
 * Identifies the exact origin layer of website failures and provides step-by-step fix guides.
 */

import { Website, CheckLog, ErrorDiagnosis, ErrorOriginLayer } from '../types';

/**
 * Analyzes a website status or log entry and returns deep diagnostic details:
 * 1. Is there an error?
 * 2. Where is it coming from? (Origin Layer & Specific Component)
 * 3. How can it be fixed? (Actionable steps, shell commands, and prevention advice)
 */
export function diagnoseWebsiteError(
  website: Website,
  logOverride?: CheckLog | null
): ErrorDiagnosis | null {
  const latestLog = logOverride !== undefined ? logOverride : (website.logs && website.logs[0]);
  
  // If no logs or the latest log is successful (is_up === true), there is no active error
  if (!latestLog || latestLog.is_up) {
    return null;
  }

  const statusCode = latestLog.status_code;
  const errorMsg = (latestLog.error_message || '').toLowerCase();
  const latency = latestLog.response_time_ms;
  const url = website.url;

  // 1. SSL / TLS Certificate Errors
  if (
    errorMsg.includes('ssl') || 
    errorMsg.includes('cert') || 
    errorMsg.includes('handshake') || 
    errorMsg.includes('tlsv1') ||
    errorMsg.includes('certificate')
  ) {
    return {
      layer: 'ssl_tls',
      layerTitle: 'SSL / TLS Security Layer',
      sourceComponent: 'Cryptographic Handshake & Certificate Authority (Let\'s Encrypt / OpenSSL)',
      rootCause: `The TLS handshake failed between the monitoring node and ${url}. The server's SSL certificate is either expired, self-signed, invalid for this domain name, or has a broken intermediate certificate chain.`,
      severity: 'critical',
      possibleReasons: [
        'Let\'s Encrypt certbot renewal cron job failed or expired.',
        'Domain DNS points to an IP that does not match the SSL Subject Alternative Name (SAN).',
        'Web server is serving an expired fallback certificate or missing fullchain.pem.',
        'Clock skew on the host server causing premature certificate invalidation.'
      ],
      remediationSteps: [
        'Check current certificate validity and expiration date from terminal.',
        'Trigger an immediate Certbot renewal for the domain.',
        'Verify your Nginx or Apache config points to fullchain.pem (not just cert.pem).',
        'Reload or restart the web server to load the new certificate files.'
      ],
      remediationCommands: [
        '# 1. Test certificate expiry and CN directly via OpenSSL\necho | openssl s_client -connect ' + (new URL(url).hostname || 'example.com') + ':443 -servername ' + (new URL(url).hostname || 'example.com') + ' 2>/dev/null | openssl x509 -noout -dates -subject',
        '# 2. Force renew certificate with Let\'s Encrypt\nsudo certbot renew --force-renewal',
        '# 3. If using Nginx, test config and reload\nsudo nginx -t && sudo systemctl reload nginx',
        '# 4. If using Apache, reload\nsudo apache2ctl configtest && sudo systemctl reload apache2'
      ],
      configFileSuggestions: [
        `# /etc/nginx/sites-available/${new URL(url).hostname || 'default'}\nssl_certificate /etc/letsencrypt/live/${new URL(url).hostname || 'example.com'}/fullchain.pem;\nssl_certificate_key /etc/letsencrypt/live/${new URL(url).hostname || 'example.com'}/privkey.pem;\nssl_protocols TLSv1.2 TLSv1.3;`
      ],
      preventionTips: [
        'Ensure the certbot systemd timer is active: `sudo systemctl status certbot.timer`.',
        'Configure automated email renewal alerts in your Let\'s Encrypt registration.'
      ]
    };
  }

  // 2. DNS Failure
  if (
    errorMsg.includes('dns') || 
    errorMsg.includes('getaddrinfo') || 
    errorMsg.includes('name resolution') ||
    errorMsg.includes('nxdomain')
  ) {
    const host = new URL(url).hostname || url;
    return {
      layer: 'dns',
      layerTitle: 'DNS (Domain Name System) Layer',
      sourceComponent: `Domain Registrar Nameserver / DNS Authoritative Zone (${host})`,
      rootCause: `The domain name '${host}' could not be resolved to an IP address. The DNS request failed at the authoritative nameserver or returned NXDOMAIN (Non-Existent Domain).`,
      severity: 'critical',
      possibleReasons: [
        'The domain registration expired or was placed on clientHold by the registrar.',
        'The A or AAAA DNS records were accidentally deleted, modified, or are still propagating.',
        'Custom nameservers (Cloudflare, Route53, GoDaddy) are misconfigured or unresponsive.',
        'DNSSEC validation failure at recursive resolvers.'
      ],
      remediationSteps: [
        `Query authoritative DNS servers to check if an A record exists for ${host}.`,
        'Log into your domain registrar (e.g. Cloudflare, Namecheap, Route53) and check domain expiration status.',
        'Verify the A record points to your server\'s public IPv4 address.',
        'Flush local DNS cache and wait for TTL expiry.'
      ],
      remediationCommands: [
        `# Query A record using Google DNS (8.8.8.8)\ndig @8.8.8.8 ${host} A +short`,
        `# Query Authoritative Nameservers\ndig ${host} NS +short`,
        `# Check WHOIS status for registrar locks or expiration\nwhois ${host} | grep -E "Status|Expiry|Expiration"`
      ],
      preventionTips: [
        'Enable domain auto-renewal with your registrar.',
        'Set reasonable TTLs (300 to 3600 seconds) so future DNS updates propagate swiftly.'
      ]
    };
  }

  // 3. Connection Refused or Network Timeout
  if (
    errorMsg.includes('timed out') || 
    errorMsg.includes('timeout') || 
    errorMsg.includes('connection refused') ||
    errorMsg.includes('unreachable')
  ) {
    const port = url.startsWith('https') ? 443 : 80;
    return {
      layer: 'network_transport',
      layerTitle: 'Network / Transport & Firewall Layer',
      sourceComponent: `Host Ingress Port ${port} / OS Firewall (UFW / iptables / AWS Security Group)`,
      rootCause: `The monitoring client was unable to establish a TCP 3-way handshake with ${url}. Either the packet was dropped silently (timeout) or the target kernel actively sent a TCP RST packet (connection refused).`,
      severity: 'critical',
      possibleReasons: [
        `The web server daemon (Nginx/Apache/Caddy) is completely stopped and not listening on port ${port}.`,
        'The server\'s cloud firewall (AWS Security Group, GCP VPC, DigitalOcean Firewall) is blocking inbound traffic.',
        'Host-level firewall (UFW, firewalld, iptables) blocked the incoming connection.',
        'The host virtual machine crashed, rebooted, or ran out of network sockets.'
      ],
      remediationSteps: [
        `Log into your host server via SSH and verify if the web server is listening on port ${port}.`,
        'Check systemd status for Nginx or Apache.',
        `Inspect firewall rules and ensure port ${port} is explicitly allowed for TCP ingress.`,
        'Check server CPU and memory usage to ensure host did not freeze.'
      ],
      remediationCommands: [
        `# Check if port ${port} is actively listening on all interfaces\nsudo ss -tulpn | grep :${port}`,
        '# Check if web server service is active\nsudo systemctl status nginx || sudo systemctl status apache2',
        '# Ensure firewall allows HTTP & HTTPS\nsudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw reload',
        '# Test local loopback connectivity\ncurl -Iv http://127.0.0.1:' + port
      ],
      preventionTips: [
        'Configure systemd services with `Restart=always` and `RestartSec=5s` so web servers recover automatically.',
        'Setup cloud provider health checks and auto-healing groups.'
      ]
    };
  }

  // 4. HTTP 502 Bad Gateway
  if (statusCode === 502) {
    return {
      layer: 'gateway_proxy',
      layerTitle: 'Reverse Proxy & Gateway Layer (502 Bad Gateway)',
      sourceComponent: 'Nginx / Caddy / Cloudflare Gateway -> Upstream App (Gunicorn / Uvicorn / Node.js / PHP-FPM)',
      rootCause: 'The frontend reverse proxy (Nginx) received an invalid or empty response from the upstream application daemon. The application process behind the proxy is dead, crashed, or not listening on its internal socket/port.',
      severity: 'critical',
      possibleReasons: [
        'The backend application process (Node.js, Python Gunicorn, PHP-FPM) crashed with an uncaught runtime error.',
        'The application server ran out of memory and was terminated by the Linux OOM (Out-of-Memory) killer.',
        'The upstream socket or port configured in Nginx (e.g. 127.0.0.1:8000 or /var/run/app.sock) does not match the app config.',
        'A recent deployment introduced a syntax or boot crash during startup.'
      ],
      remediationSteps: [
        'Check the status of your backend application service (e.g., systemctl status gunicorn or pm2 status).',
        'Read the last 100 lines of the application system log to see the exact crash stack trace.',
        'Test the internal upstream socket directly with curl on the server.',
        'Restart the backend application process and reload the reverse proxy.'
      ],
      remediationCommands: [
        '# 1. View upstream crash logs (Node / Python / Systemd)\njournalctl -u myapp.service -n 100 --no-pager',
        '# 2. If using PM2 (Node.js)\npm2 status && pm2 logs --lines 50',
        '# 3. Check Nginx reverse proxy error log\nsudo tail -n 50 /var/log/nginx/error.log',
        '# 4. Restart backend application and Nginx\nsudo systemctl restart myapp.service && sudo systemctl reload nginx'
      ],
      configFileSuggestions: [
        '# Sample Nginx upstream definition:\nlocation / {\n    proxy_pass http://127.0.0.1:8000;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n}'
      ],
      preventionTips: [
        'Implement an auto-restart supervisor like systemd or PM2 with max-memory restart limits.',
        'Add a lightweight `/health` endpoint and pre-deployment smoke checks.'
      ]
    };
  }

  // 5. HTTP 503 Service Unavailable
  if (statusCode === 503) {
    return {
      layer: 'database_storage',
      layerTitle: 'Upstream Capacity & Database Layer (503 Service Unavailable)',
      sourceComponent: 'Backend Database Connection Pool (PostgreSQL / MySQL) or Cloud Load Balancer',
      rootCause: 'The server is currently unable to handle the request due to temporary overloading, database connection exhaustion, or an explicit maintenance mode flag.',
      severity: 'high',
      possibleReasons: [
        'PostgreSQL or MySQL database connection pool exhausted (`max_connections` reached).',
        'Database service crashed or was restarted during an automated update.',
        'A maintenance file exists in the web root (e.g. maintenance.flag).',
        'Server CPU or I/O load is pegged at 100% capacity under high traffic.'
      ],
      remediationSteps: [
        'Check the status and logs of your database service (PostgreSQL / MySQL / Redis).',
        'Inspect active database connections and terminate orphaned or deadlocked queries.',
        'Check if an app maintenance flag or deploy lock was left active.',
        'Restart the database service or increase pool limits if warranted.'
      ],
      remediationCommands: [
        '# 1. Check PostgreSQL service status\nsudo systemctl status postgresql',
        '# 2. Query active PostgreSQL connections\nsudo -u postgres psql -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"',
        '# 3. Inspect system CPU and memory load\nhtop || top -b -n 1 | head -n 20',
        '# 4. Check for maintenance mode files in application root\nls -la /var/www/myapp/ | grep -i maintenance'
      ],
      configFileSuggestions: [
        '# In postgresql.conf:\nmax_connections = 200\nshared_buffers = 1GB\n\n# Or configure PgBouncer connection pooler in transaction mode.'
      ],
      preventionTips: [
        'Use connection pooling (such as PgBouncer for Postgres) rather than direct app connections.',
        'Configure database timeout parameters to terminate long-running idle transactions.'
      ]
    };
  }

  // 6. HTTP 504 Gateway Timeout
  if (statusCode === 504) {
    return {
      layer: 'timeout',
      layerTitle: 'Proxy Gateway Timeout Layer (504 Gateway Timeout)',
      sourceComponent: 'Nginx `proxy_read_timeout` / Cloudflare Edge Worker Timeout',
      rootCause: `The reverse proxy timed out waiting for the backend application to finish processing the request. The backend took longer than ${latency ? latency + 'ms' : 'the proxy limit (typically 60s)'} to return bytes.`,
      severity: 'high',
      possibleReasons: [
        'An unindexed, slow database query executed a full table scan across millions of rows.',
        'The backend is waiting on a dead or hanging third-party external API call without a timeout.',
        'An infinite loop or resource deadlock occurred in server-side request processing.',
        'Nginx `proxy_read_timeout` is set too aggressively low for heavy report generation.'
      ],
      remediationSteps: [
        'Identify slow queries by checking slow query logs in PostgreSQL/MySQL.',
        'Verify all external HTTP client calls in your code have strict timeouts (e.g. `timeout=5`).',
        'If the request legitimately takes over 60s, delegate it to an asynchronous worker queue (Celery, BullMQ).',
        'Temporarily increase Nginx `proxy_read_timeout` and `proxy_connect_timeout`.'
      ],
      remediationCommands: [
        '# 1. Find slow transactions in Postgres\nsudo -u postgres psql -c "SELECT pid, now() - query_start AS duration, query FROM pg_stat_activity WHERE state = \'active\' ORDER BY duration DESC LIMIT 5;"',
        '# 2. Check Nginx timeout logs\nsudo grep -i "upstream timed out" /var/log/nginx/error.log | tail -n 20',
        '# 3. Test endpoint response timing locally\ntime curl -o /dev/null -s -w "Total Time: %{time_total}s\\n" http://127.0.0.1:8000/'
      ],
      preventionTips: [
        'Never execute long exports, PDF generations, or heavy imports inside standard synchronous HTTP request handlers.',
        'Ensure all outbound HTTP calls from backend code have client timeouts configured.'
      ]
    };
  }

  // 7. HTTP 500 Internal Server Error
  if (statusCode === 500) {
    return {
      layer: 'application_server',
      layerTitle: 'Application Code & Runtime Layer (500 Internal Server Error)',
      sourceComponent: 'Application Logic (Python Flask / Django / Express / Laravel / Ruby)',
      rootCause: 'An uncaught exception or fatal programming error occurred inside the web application code while preparing the HTTP response.',
      severity: 'critical',
      possibleReasons: [
        'Missing required environment variable in `.env` (e.g., missing API key, invalid secret).',
        'Database migration mismatch (app code expects a database column that has not been migrated).',
        'Null pointer or undefined property access in backend business logic.',
        'Uncaught exception in template rendering or JSON serialization.'
      ],
      remediationSteps: [
        'Check server logs for the full stack trace and exact source code file and line number.',
        'Check `.env` file to ensure all required database credentials and configuration keys are defined.',
        'Run pending database migrations (e.g. `flask db upgrade` or `npx prisma migrate deploy`).',
        'Reproduce the request locally using identical request parameters.'
      ],
      remediationCommands: [
        '# 1. Search for Python/Node traceback in logs\njournalctl -u myapp.service -n 100 --no-pager | grep -A 10 -B 2 "Traceback"',
        '# 2. Tail application-level error log\ntail -n 100 /var/log/myapp/app_error.log',
        '# 3. Verify .env file is readable and has required keys\nls -l .env && cat .env | grep -E "DATABASE|SECRET"'
      ],
      preventionTips: [
        'Integrate error tracking software like Sentry or GlitchTip for immediate stack trace alerts.',
        'Add comprehensive unit and integration tests to your CI/CD pipeline.'
      ]
    };
  }

  // 8. Keyword / Content Verification Failure
  if (
    errorMsg.includes('keyword') || 
    (website.keyword && latestLog.status_code === 200 && !latestLog.is_up)
  ) {
    const keyword = website.keyword || 'target content';
    return {
      layer: 'dom_content',
      layerTitle: 'DOM & Content Integrity Layer (Silent Outage)',
      sourceComponent: 'Client-Side HTML / React Bundle / Single Page Application Hydration',
      rootCause: `The web server returned HTTP 200 OK, but the expected verification keyword "${keyword}" was missing from the response HTML. This indicates a "silent outage" where the web server is running, but the actual page rendered a blank body, maintenance page, or crashed frontend bundle.`,
      severity: 'high',
      possibleReasons: [
        'Single Page Application (React/Vue) failed to compile or threw an uncaught error in main.js, leaving the root div blank.',
        'The page returned an error or maintenance layout that still returns HTTP 200 OK.',
        'The target keyword was modified or removed during a recent website copy update.',
        'Content is loaded via client-side JavaScript AJAX after the initial HTML payload was delivered.'
      ],
      remediationSteps: [
        `Download the raw HTML from ${url} and inspect what the server actually returned.`,
        'Open browser DevTools Console on the live site to check for JavaScript runtime crashes.',
        'If the website text changed intentionally, update the monitoring keyword in ChrisTech.',
        'Ensure the keyword exists in the initial server-rendered HTML payload.'
      ],
      remediationCommands: [
        `# 1. Fetch raw HTML body and search for keyword\ncurl -sL "${url}" | grep -i "${keyword}"`,
        `# 2. View the first 40 lines of HTML to check for error banners\ncurl -sL "${url}" | head -n 40`,
        `# 3. Check HTTP response headers\ncurl -Iv "${url}"`
      ],
      preventionTips: [
        'Choose stable, permanent keywords in the HTML like `<title>`, brand name, or primary navigation links.',
        'Implement Server-Side Rendering (SSR) or static metadata tags for reliable monitoring.'
      ]
    };
  }

  // 9. HTTP 403 Forbidden
  if (statusCode === 403) {
    return {
      layer: 'auth_waf',
      layerTitle: 'Authorization & Web Application Firewall Layer (403 Forbidden)',
      sourceComponent: 'Web Application Firewall (Cloudflare WAF / AWS Shield) or Server Filesystem Permissions',
      rootCause: 'The server understood the request but refuses to authorize it. This typically happens when a WAF blocks the automated monitoring bot, or server file permissions prevent reading the web root.',
      severity: 'medium',
      possibleReasons: [
        'Cloudflare Bot Fight Mode or WAF rule blocked the `ChrisTech-Monitor` User-Agent string.',
        'Filesystem permission error on the server (web root is not readable by `www-data` or `nginx`).',
        'Directory browsing is forbidden and no `index.html` or `index.php` exists in the directory.',
        'IP access restriction rules in `.htaccess` or Nginx `allow`/`deny` directives.'
      ],
      remediationSteps: [
        'Log into Cloudflare or your WAF provider and review Firewall Events / Security Log for blocked requests.',
        'Add a WAF exception or whitelist rule for the ChrisTech monitoring IP or User-Agent.',
        'Check server web directory ownership and file permissions (`chmod 755` for directories, `chmod 644` for files).',
        'Ensure an index file exists in the directory root.'
      ],
      remediationCommands: [
        '# 1. Fix Linux web root permissions\nsudo chown -R www-data:www-data /var/www/html\nsudo chmod -R 755 /var/www/html',
        '# 2. Test request with standard browser User-Agent\ncurl -Iv -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" "' + url + '"',
        '# 3. Check Nginx directory index config\nsudo grep -rn "index " /etc/nginx/sites-available/'
      ],
      preventionTips: [
        'Configure custom User-Agent in ChrisTech and whitelist it in Cloudflare Security Rules.',
        'Avoid restrictive IP blocks on public-facing assets.'
      ]
    };
  }

  // 10. HTTP 404 Not Found
  if (statusCode === 404) {
    return {
      layer: 'client_routing',
      layerTitle: 'Routing & Client URL Layer (404 Not Found)',
      sourceComponent: 'Web Server URL Routing / Single Page App Fallback (`try_files`)',
      rootCause: `The requested resource at '${url}' was not found on the server. Either the URL path is incorrect or the web server is missing SPA rewrite routing.`,
      severity: 'medium',
      possibleReasons: [
        'The URL was entered with a typo or the target path was deleted in a recent release.',
        'Single Page Application (React Router/Vue Router) is missing Nginx `try_files $uri $uri/ /index.html;` fallback.',
        'The root directory in Nginx/Apache configuration points to an incorrect build path (e.g. `/dist` vs `/build`).'
      ],
      remediationSteps: [
        'Check that the URL path in ChrisTech is spelled correctly.',
        'Ensure the build output exists on the web server.',
        'In Nginx, ensure SPA route rewriting is enabled so deep links don\'t trigger 404s.'
      ],
      remediationCommands: [
        '# 1. Check if files exist in the configured document root\nls -la /var/www/html/dist/',
        '# 2. Verify Nginx try_files directive\nsudo grep -rn "try_files" /etc/nginx/sites-available/'
      ],
      configFileSuggestions: [
        '# Nginx SPA fallback configuration:\nlocation / {\n    try_files $uri $uri/ /index.html;\n}'
      ],
      preventionTips: [
        'Always test root and deep-link URLs after deploying frontend updates.',
        'Verify document root paths in your continuous deployment scripts.'
      ]
    };
  }

  // Fallback / Generic Error
  return {
    layer: 'application_server',
    layerTitle: 'Unspecified Application / Network Failure',
    sourceComponent: 'Host Server & HTTP Transport',
    rootCause: `The check failed with ${statusCode ? `HTTP Status ${statusCode}` : 'no response'} and message: "${latestLog.error_message || 'Unresponsive'}".`,
    severity: 'high',
    possibleReasons: [
      'Unhandled error code or network packet drop.',
      'Server process interrupted during communication.',
      'Firewall rate limiting or connection drop.'
    ],
    remediationSteps: [
      'Inspect the web server and host system logs.',
      'Test endpoint reachability manually using curl.',
      'Verify host server system resources (RAM, CPU, disk space).'
    ],
    remediationCommands: [
      `curl -Iv "${url}"`,
      'df -h && free -m',
      'sudo journalctl -xe -n 50'
    ],
    preventionTips: [
      'Enable structured logging and monitor host disk space regularly.'
    ]
  };
}

/**
 * Diagnostic Scenarios for simulation and testing
 */
export interface DiagnosticScenario {
  id: string;
  name: string;
  description: string;
  simulatedLog: {
    status_code: number | null;
    is_up: boolean;
    response_time_ms: number;
    error_message: string;
  };
}

export const DIAGNOSTIC_SCENARIOS: DiagnosticScenario[] = [
  {
    id: '502-bad-gateway',
    name: '502 Bad Gateway (Dead App Worker)',
    description: 'Reverse proxy Nginx is alive, but backend Python/Node.js application crashed or timed out.',
    simulatedLog: {
      status_code: 502,
      is_up: false,
      response_time_ms: 240,
      error_message: 'HTTP Error 502: Bad Gateway. Upstream worker connection refused.'
    }
  },
  {
    id: '503-db-exhausted',
    name: '503 Service Unavailable (Database Exhaustion)',
    description: 'PostgreSQL connection pool maxed out; app cannot allocate database connections.',
    simulatedLog: {
      status_code: 503,
      is_up: false,
      response_time_ms: 840,
      error_message: 'HTTP Error 503: Service Unavailable. Downstream database connection pool exhausted.'
    }
  },
  {
    id: 'ssl-expired',
    name: 'SSL / TLS Certificate Expired',
    description: 'Let\'s Encrypt certificate passed expiration date; browser displays security barrier.',
    simulatedLog: {
      status_code: null,
      is_up: false,
      response_time_ms: 120,
      error_message: 'SSL / HTTPS Certificate error: CERT_HAS_EXPIRED: certificate has expired on 2026-09-10'
    }
  },
  {
    id: 'dns-lookup-fail',
    name: 'DNS Lookup Failure (NXDOMAIN)',
    description: 'Domain registrar or nameserver failed to resolve hostname to an IP address.',
    simulatedLog: {
      status_code: null,
      is_up: false,
      response_time_ms: 95,
      error_message: 'Connection failed: getaddrinfo ENOTFOUND. Server unreachable or DNS lookup failed.'
    }
  },
  {
    id: '504-gateway-timeout',
    name: '504 Gateway Timeout (Slow Query / Hang)',
    description: 'Nginx proxy_read_timeout exceeded waiting for unindexed database query to return.',
    simulatedLog: {
      status_code: 504,
      is_up: false,
      response_time_ms: 60100,
      error_message: 'HTTP Error 504: Gateway Timeout. Upstream server timed out after 60 seconds.'
    }
  },
  {
    id: '500-internal-crash',
    name: '500 Internal Error (Uncaught Traceback)',
    description: 'Missing environment variable or unhandled exception in backend code.',
    simulatedLog: {
      status_code: 500,
      is_up: false,
      response_time_ms: 310,
      error_message: 'HTTP Error 500: Internal Server Error. KeyError: DATABASE_URL not found.'
    }
  },
  {
    id: 'keyword-missing',
    name: 'Keyword Missing (Silent Frontend Crash)',
    description: 'Server returns HTTP 200 OK, but React DOM crashed, rendering a blank white screen.',
    simulatedLog: {
      status_code: 200,
      is_up: false,
      response_time_ms: 110,
      error_message: "Keyword 'ExpectedAppContent' was not found in response HTML."
    }
  },
  {
    id: '403-waf-blocked',
    name: '403 Forbidden (Cloudflare WAF / Permissions)',
    description: 'Web application firewall blocked monitoring agent or web root permissions are 000.',
    simulatedLog: {
      status_code: 403,
      is_up: false,
      response_time_ms: 85,
      error_message: 'HTTP Error 403: Forbidden. Access denied by Cloudflare Bot Management.'
    }
  }
];
