/**
 * Full-email / phishing message analysis.
 * Runs entirely in the browser — the pasted message is never uploaded.
 */

export type MessageRiskLevel = 'safe' | 'suspicious' | 'dangerous';
export type FindingSeverity = 'info' | 'warning' | 'critical';
export type FindingCategory = 'identity' | 'link' | 'language' | 'attachment' | 'header';

export interface MessageFinding {
  id: string;
  title: string;
  detail: string;
  severity: FindingSeverity;
  category: FindingCategory;
}

export interface ExtractedLink {
  url: string;
  host: string;
  issues: string[];
}

export interface ParsedEmailMessage {
  fromDisplayName: string;
  fromEmail: string;
  fromDomain: string;
  replyToEmail: string;
  replyToDomain: string;
  returnPath: string;
  subject: string;
  body: string;
  hasHeaderBlock: boolean;
}

export interface EmailMessageReport {
  riskLevel: MessageRiskLevel;
  score: number;
  scoreLabel: string;
  headline: string;
  summary: string;
  findings: MessageFinding[];
  whyReasons: string[];
  whatToDo: string[];
  links: ExtractedLink[];
  attachments: string[];
  parsed: ParsedEmailMessage;
  scannedAt: string;
}

const TRUSTED_BRANDS: { name: string; domains: string[] }[] = [
  { name: 'PayPal', domains: ['paypal.com', 'paypal.me'] },
  { name: 'Apple', domains: ['apple.com', 'icloud.com', 'appleid.com'] },
  { name: 'Microsoft', domains: ['microsoft.com', 'outlook.com', 'live.com', 'office.com', 'microsoftonline.com'] },
  { name: 'Google', domains: ['google.com', 'gmail.com', 'googlemail.com', 'youtube.com'] },
  { name: 'Amazon', domains: ['amazon.com', 'amazon.in', 'amazon.co.uk', 'aws.amazon.com'] },
  { name: 'Netflix', domains: ['netflix.com'] },
  { name: 'Facebook', domains: ['facebook.com', 'fb.com', 'meta.com'] },
  { name: 'Instagram', domains: ['instagram.com'] },
  { name: 'WhatsApp', domains: ['whatsapp.com', 'whatsapp.net'] },
  { name: 'Chase', domains: ['chase.com'] },
  { name: 'Bank of America', domains: ['bankofamerica.com'] },
  { name: 'HDFC Bank', domains: ['hdfcbank.com'] },
  { name: 'ICICI Bank', domains: ['icicibank.com'] },
  { name: 'SBI', domains: ['onlinesbi.sbi', 'sbi.co.in'] },
  { name: 'IRS', domains: ['irs.gov'] },
  { name: 'SecureShield', domains: ['secureshield.gov'] },
];

const URL_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'buff.ly',
  'cutt.ly',
  'rebrand.ly',
]);

const DANGEROUS_ATTACHMENT =
  /\.(exe|scr|js|vbs|bat|cmd|msi|iso|img|html|htm|apk|ps1|jar|dll|com|pif|docm|xlsm|pptm)$/i;

const URGENCY_PATTERNS: { id: string; label: string; re: RegExp }[] = [
  { id: 'verify-now', label: 'Asks you to verify an account immediately', re: /\b(verify (your )?(account|identity|email)|confirm (your )?(details|identity|account))\b/i },
  { id: 'suspend', label: 'Threatens to lock or close the account', re: /\b(account (will be |has been )?(suspended|locked|closed|disabled)|unusual (sign[- ]?in|activity))\b/i },
  { id: 'deadline', label: 'Uses a short deadline to create panic', re: /\b(within \d+ hours?|act now|immediately|limited time|final (notice|warning)|expires? (today|soon))\b/i },
  { id: 'payment', label: 'Pushes an unexpected payment or gift card', re: /\b(gift ?card|wire transfer|bitcoin|crypto(currency)?|urgent payment|pay now)\b/i },
  { id: 'click', label: 'Pushes you to click a link without checking it', re: /\b(click (here|below)|tap (here|below)|open the attachment)\b/i },
  { id: 'password', label: 'Asks for a password or one-time code', re: /\b(enter (your )?password|one[- ]time (code|password)|otp|cvv|pin code)\b/i },
];

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i++) grid[i][0] = i;
  for (let j = 0; j < cols; j++) grid[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      grid[i][j] = Math.min(grid[i - 1][j] + 1, grid[i][j - 1] + 1, grid[i - 1][j - 1] + cost);
    }
  }
  return grid[a.length][b.length];
}

function normalizeHost(host: string): string {
  return host
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/\.$/, '')
    .replace(/:\d+$/, '');
}

function registrableDomain(host: string): string {
  const h = normalizeHost(host);
  const parts = h.split('.').filter(Boolean);
  const secondLevel = new Set(['co', 'com', 'org', 'net', 'gov', 'ac', 'edu']);
  if (parts.length >= 3 && secondLevel.has(parts[parts.length - 2])) {
    return parts.slice(-3).join('.');
  }
  if (parts.length >= 2) return parts.slice(-2).join('.');
  return h;
}

function decodePunycodeLabel(label: string): string {
  if (!label.toLowerCase().startsWith('xn--')) return label;
  try {
    return new URL(`http://${label}.invalid`).hostname;
  } catch {
    return label;
  }
}

function looksHomoglyph(domain: string): boolean {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) return false;
  const decoded = domain
    .split('.')
    .map((part) => decodePunycodeLabel(part))
    .join('.');
  if (/[^\x00-\x7F]/.test(decoded) || domain.toLowerCase().includes('xn--')) return true;
  return /[0-9]/.test(decoded) && /[a-z]/i.test(decoded) && flattenLookalikes(decoded) !== decoded;
}

function flattenLookalikes(value: string): string {
  return value.toLowerCase().replace(/0/g, 'o').replace(/1/g, 'l').replace(/5/g, 's').replace(/3/g, 'e');
}

function findBrandLookalike(domain: string): { brand: string; genuine: string } | null {
  const host = normalizeHost(domain);
  const target = registrableDomain(host);
  const labels = host.split('.');

  for (const brand of TRUSTED_BRANDS) {
    for (const genuine of brand.domains) {
      if (target === genuine || host === genuine || host.endsWith(`.${genuine}`)) continue;

      const genuineName = genuine.split('.')[0];
      const dist = levenshtein(target, genuine);
      const flatDist = levenshtein(flattenLookalikes(target), genuine);
      if ((dist > 0 && dist <= 2) || (flatDist > 0 && flatDist <= 2)) {
        return { brand: brand.name, genuine };
      }

      for (const label of labels) {
        if (genuineName.length < 4) continue;
        const flatLabel = flattenLookalikes(label);
        const labelDist = levenshtein(flatLabel, genuineName);
        const homoglyphMatch = label !== genuineName && (flatLabel === genuineName || (labelDist > 0 && labelDist <= 2));
        const padded = label.includes(genuineName) && label !== genuineName;
        if (homoglyphMatch || padded) {
          return { brand: brand.name, genuine };
        }
      }
    }
  }
  return null;
}

function brandFromText(text: string): { name: string; domains: string[] } | null {
  const lower = text.toLowerCase();
  for (const brand of TRUSTED_BRANDS) {
    if (lower.includes(brand.name.toLowerCase())) return brand;
  }
  return null;
}

function domainMatchesBrand(domain: string, brand: { domains: string[] }): boolean {
  const target = registrableDomain(domain);
  return brand.domains.some((d) => target === d || target.endsWith(`.${d}`));
}

function extractHeader(headers: string, name: string): string {
  const re = new RegExp(`^${name}:\\s*(.*(?:\\n[ \\t].*)*)`, 'im');
  const match = headers.match(re);
  if (!match) return '';
  return match[1].replace(/\s+/g, ' ').trim();
}

function parseAddress(raw: string): { displayName: string; email: string } {
  const angle = raw.match(/^(?:"?([^"<]*)"?\s*)?<([^>]+)>/);
  if (angle) {
    return { displayName: (angle[1] || '').trim().replace(/^"|"$/g, ''), email: angle[2].trim().toLowerCase() };
  }
  const emailOnly = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return {
    displayName: emailOnly ? raw.replace(emailOnly[0], '').replace(/[<>]/g, '').trim() : raw.trim(),
    email: (emailOnly?.[0] || '').toLowerCase(),
  };
}

function domainOf(email: string): string {
  return (email.split('@')[1] || '').toLowerCase().trim();
}

function parseMessage(raw: string): ParsedEmailMessage {
  const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const looksLikeHeaders = /^(from|to|subject|reply-to|return-path|date|content-type):/im.test(text.slice(0, 800));
  let headers = '';
  let body = text;

  if (looksLikeHeaders) {
    const split = text.search(/\n\s*\n/);
    if (split >= 0) {
      headers = text.slice(0, split);
      body = text.slice(split).trim();
    } else {
      headers = text;
      body = '';
    }
  }

  const fromRaw = extractHeader(headers, 'From');
  const replyRaw = extractHeader(headers, 'Reply-To');
  const returnPath = extractHeader(headers, 'Return-Path').replace(/[<>]/g, '');
  const from = parseAddress(fromRaw);
  const reply = parseAddress(replyRaw || fromRaw);

  return {
    fromDisplayName: from.displayName,
    fromEmail: from.email,
    fromDomain: domainOf(from.email),
    replyToEmail: reply.email,
    replyToDomain: domainOf(reply.email),
    returnPath: returnPath.toLowerCase(),
    subject: extractHeader(headers, 'Subject'),
    body,
    hasHeaderBlock: looksLikeHeaders,
  };
}

function extractLinks(text: string): ExtractedLink[] {
  const found = new Map<string, ExtractedLink>();
  const patterns = [
    /\bhttps?:\/\/[^\s<>"'\)\]]+/gi,
    /\bwww\.[^\s<>"'\)\]]+/gi,
    /href\s*=\s*["']([^"']+)["']/gi,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      let url = (match[1] || match[0]).replace(/[.,;]+$/, '');
      if (url.toLowerCase().startsWith('www.')) url = `http://${url}`;
      let host = '';
      try {
        host = normalizeHost(new URL(url).hostname);
      } catch {
        continue;
      }
      if (!host || found.has(url)) continue;

      const issues: string[] = [];
      if (url.toLowerCase().startsWith('javascript:') || url.toLowerCase().startsWith('data:')) {
        issues.push('Uses a script/data URL instead of a normal website.');
      }
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
        issues.push('Link goes to a raw IP address instead of a company website.');
      }
      if (URL_SHORTENERS.has(registrableDomain(host))) {
        issues.push('Link is hidden behind a URL shortener.');
      }
      if (url.includes('@') && !url.startsWith('mailto:')) {
        issues.push('Link contains @, a common trick to hide the real destination.');
      }
      if (looksHomoglyph(host)) {
        issues.push('Domain uses lookalike / international characters.');
      }
      const lookalike = findBrandLookalike(host);
      if (lookalike) {
        issues.push(`Looks similar to ${lookalike.brand} (${lookalike.genuine}) but is not that site.`);
      }

      found.set(url, { url, host, issues });
    }
  }

  return [...found.values()];
}

function extractAttachments(text: string): string[] {
  const names = new Set<string>();
  for (const match of text.matchAll(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)/gi)) {
    names.add(match[1].trim());
  }
  for (const match of text.matchAll(/\b([\w.-]+\.(?:exe|scr|js|vbs|bat|cmd|msi|iso|img|html?|apk|ps1|zip|rar|7z|docm|xlsm|pdf))\b/gi)) {
    names.add(match[1]);
  }
  return [...names];
}

function addFinding(
  findings: MessageFinding[],
  finding: MessageFinding
) {
  if (findings.some((f) => f.id === finding.id)) return;
  findings.push(finding);
}

export const SAMPLE_SAFE_MESSAGE = `From: People Operations <people@secureshield.gov>
Reply-To: people@secureshield.gov
Subject: Weekly office hours reminder

Hello team,

This is a reminder that drop-in office hours are Thursday 3–4pm in the usual meeting room.
No action is required if you cannot attend.

Thank you,
People Operations
SecureShield`;

export const SAMPLE_SUSPICIOUS_MESSAGE = `From: IT Helpdesk <helpdesk@company-mail.net>
Reply-To: helpdesk@company-mail.net
Subject: Please review this shared document

Hi,

Can you click below and review the shared file when you have a moment?
http://bit.ly/shared-review-99

Thanks`;

export const SAMPLE_DANGEROUS_MESSAGE = `From: "PayPal Security" <accounts-update@paypa1-secure.com>
Reply-To: recover-now@mail-recovery.xyz
Return-Path: bounce@randomhost.online
Subject: URGENT: Your account will be suspended in 12 hours

Dear customer,

We detected unusual activity. Verify your identity immediately or your account will be locked.

Click here to confirm your password and one-time code:
http://paypa1-secure.com/login
http://192.168.8.40/paypal-verify

Please also open the attached file: Invoice-Refund.pdf.exe

PayPal Security Team`;

export const emailMessageSafetyService = {
  analyze(rawMessage: string): EmailMessageReport {
    const parsed = parseMessage(rawMessage);
    const combined = `${parsed.subject}\n${parsed.body}\n${rawMessage}`;
    const findings: MessageFinding[] = [];
    const links = extractLinks(combined);
    const attachments = extractAttachments(rawMessage);
    const whyReasons: string[] = [];

    if (!parsed.fromEmail && !parsed.hasHeaderBlock) {
      addFinding(findings, {
        id: 'no-headers',
        title: 'No email headers were found',
        detail: 'Paste the full message including From, Subject, and Reply-To when you can. We still checked the text and links.',
        severity: 'info',
        category: 'header',
      });
    }

    const displayBrand = brandFromText(parsed.fromDisplayName || parsed.subject);
    if (displayBrand && parsed.fromDomain && !domainMatchesBrand(parsed.fromDomain, displayBrand)) {
      addFinding(findings, {
        id: 'display-spoof',
        title: `Sender name looks like ${displayBrand.name}, but the address does not`,
        detail: `The name says “${parsed.fromDisplayName || displayBrand.name}” while the real address is ${parsed.fromEmail}. Attackers often copy a trusted brand name this way.`,
        severity: 'critical',
        category: 'identity',
      });
      whyReasons.push(`The display name pretends to be ${displayBrand.name}, but the email comes from @${parsed.fromDomain}.`);
    }

    if (parsed.fromDomain && parsed.replyToDomain && parsed.fromDomain !== parsed.replyToDomain) {
      addFinding(findings, {
        id: 'reply-mismatch',
        title: 'Reply-To address does not match the sender',
        detail: `Replies would go to ${parsed.replyToEmail} instead of ${parsed.fromEmail}. That is a common way to steal follow-up messages.`,
        severity: 'critical',
        category: 'identity',
      });
      whyReasons.push('The Reply-To address is different from the From address.');
    }

    if (parsed.returnPath && parsed.fromEmail && !parsed.returnPath.includes(parsed.fromDomain)) {
      addFinding(findings, {
        id: 'return-path',
        title: 'Return-Path does not match the visible sender',
        detail: `Bounced mail would go to ${parsed.returnPath}, which is not the same domain as ${parsed.fromEmail}.`,
        severity: 'warning',
        category: 'header',
      });
    }

    if (parsed.fromDomain) {
      const fromLookalike = findBrandLookalike(parsed.fromDomain);
      if (fromLookalike) {
        addFinding(findings, {
          id: 'from-lookalike',
          title: `Sender domain looks like ${fromLookalike.brand}`,
          detail: `@${parsed.fromDomain} is similar to ${fromLookalike.genuine} but is not that company.`,
          severity: 'critical',
          category: 'identity',
        });
        whyReasons.push(`The sender domain @${parsed.fromDomain} is a lookalike of ${fromLookalike.genuine}.`);
      }
    }

    for (const link of links) {
      if (link.issues.length === 0) continue;
      const isCritical = link.issues.some(
        (issue) =>
          issue.includes('similar to') ||
          issue.includes('IP address') ||
          issue.includes('@') ||
          issue.includes('script/data')
      );
      addFinding(findings, {
        id: `link-${link.host}`,
        title: isCritical ? `Dangerous link: ${link.host}` : `Hidden or shortened link: ${link.host}`,
        detail: `${link.url} — ${link.issues.join(' ')}`,
        severity: isCritical ? 'critical' : 'warning',
        category: 'link',
      });
      whyReasons.push(link.issues[0]);
    }

    for (const pattern of URGENCY_PATTERNS) {
      if (pattern.re.test(combined)) {
        addFinding(findings, {
          id: pattern.id,
          title: pattern.label,
          detail: 'Scam messages often rush people so they skip checking the sender and links.',
          severity: pattern.id === 'password' || pattern.id === 'payment' ? 'critical' : 'warning',
          category: 'language',
        });
        whyReasons.push(pattern.label + '.');
      }
    }

    for (const file of attachments) {
      const doubleExt = /\.[a-z0-9]{2,5}\.(exe|scr|js|bat|cmd|js|html?)$/i.test(file);
      const dangerous = DANGEROUS_ATTACHMENT.test(file) || doubleExt;
      if (!dangerous && !/\.(zip|rar|7z|pdf)$/i.test(file)) continue;
      addFinding(findings, {
        id: `file-${file}`,
        title: dangerous ? `Risky attachment: ${file}` : `Attachment mentioned: ${file}`,
        detail: dangerous
          ? 'This file type can run a program or fake a web page. Do not open it.'
          : 'Attachments from unexpected senders should be treated carefully.',
        severity: dangerous ? 'critical' : 'info',
        category: 'attachment',
      });
      if (dangerous) whyReasons.push(`The message includes a risky file named ${file}.`);
    }

    const criticalCount = findings.filter((f) => f.severity === 'critical').length;
    const warningCount = findings.filter((f) => f.severity === 'warning').length;
    const infoCount = findings.filter((f) => f.severity === 'info').length;
    const score = Math.max(8, 100 - criticalCount * 22 - warningCount * 12 - infoCount * 4);

    let riskLevel: MessageRiskLevel = 'safe';
    if (criticalCount > 0 || score < 45) riskLevel = 'dangerous';
    else if (warningCount > 0 || score < 75) riskLevel = 'suspicious';

    const uniqueWhy = whyReasons.filter((reason, index) => whyReasons.indexOf(reason) === index);

    if (riskLevel === 'safe') {
      uniqueWhy.push('The sender name, address, and links do not show the usual phishing tricks.');
      uniqueWhy.push('No urgent threats, lookalike websites, or dangerous attachments were found.');
    }

    const whatToDo =
      riskLevel === 'dangerous'
        ? [
            'Do not click the links or open any attachments.',
            'Do not reply, especially if it asks for a password, code, or payment.',
            'Check the real website yourself by typing it in the browser, not from this email.',
            'Report the message to your IT / security team if this came to a work inbox.',
          ]
        : riskLevel === 'suspicious'
        ? [
            'Pause before clicking. Hover over links and compare the real website name.',
            'Confirm the request using a known phone number or official app, not this email.',
            'Be careful with shortened links — they hide the true destination.',
          ]
        : [
            'This message looks ordinary, but still avoid sharing passwords by email.',
            'If something later feels off, check the sender address again before taking action.',
          ];

    return {
      riskLevel,
      score,
      scoreLabel: riskLevel === 'safe' ? 'Looks Safe' : riskLevel === 'suspicious' ? 'Caution Needed' : 'Likely Phishing',
      headline:
        riskLevel === 'safe'
          ? 'This Message Looks Safe'
          : riskLevel === 'suspicious'
          ? 'Caution — This Message Has Warning Signs'
          : 'Warning — This Looks Like a Phishing Email',
      summary:
        riskLevel === 'safe'
          ? 'We checked the sender details, links, wording, and attachments in your browser. No strong phishing patterns were found.'
          : riskLevel === 'suspicious'
          ? 'Some parts of this message are commonly used in scams. Review the flagged items before you click or reply.'
          : 'Several phishing patterns were found, such as a spoofed sender, lookalike links, pressure language, or a risky file.',
      findings,
      whyReasons: uniqueWhy,
      whatToDo,
      links,
      attachments,
      parsed,
      scannedAt: new Date().toISOString(),
    };
  },
};
