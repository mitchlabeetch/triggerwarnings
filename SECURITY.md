# Security Policy

## 🔒 Security Commitment

We take the security and privacy of our users seriously. This extension handles potentially sensitive viewing data, and we're committed to:

- **No data collection**: We don't track what you watch or store personal information
- **Local-first processing**: AI/ML models run entirely in your browser
- **Transparent code**: Open-source for community auditing
- **Rapid response**: Security issues are our highest priority

---

## 🐛 Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | ✅ Active support  |
| 1.x.x   | ⚠️ Security fixes only |
| < 1.0   | ❌ No longer supported |

---

## 🚨 Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

### Preferred Method: Private Security Advisory

1. Go to the [Security tab](https://github.com/mitchlabeetch/Trigger_Warnings/security) on GitHub
2. Click **"Report a vulnerability"**
3. Fill out the form with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if you have one)

### Alternative: Email

If you prefer email or GitHub's advisory system is unavailable:

- **Email**: security@triggerwarnings.app *(coming soon)*
- **Subject**: `[SECURITY] Brief description`
- **PGP Key**: *(coming soon for encrypted reports)*

### What to Include

Help us understand and fix the issue quickly:

```
1. **Vulnerability Type**
   - [ ] XSS (Cross-site scripting)
   - [ ] Injection (SQL, command, etc.)
   - [ ] Authentication bypass
   - [ ] Privacy leak
   - [ ] Other: ___________

2. **Affected Component**
   - [ ] Content script
   - [ ] Background service worker
   - [ ] Popup/Options page
   - [ ] Backend API
   - [ ] Other: ___________

3. **Impact**
   - Who is affected?
   - What can an attacker do?
   - How serious is this? (Critical/High/Medium/Low)

4. **Reproduction Steps**
   1. Step one
   2. Step two
   3. Observed behavior

5. **Environment**
   - Browser: Chrome/Firefox/Edge (version)
   - Extension version: 2.0.0
   - OS: Windows/Mac/Linux

6. **Suggested Fix** (optional)
   - Your proposed solution
```

---

## 📬 What Happens Next?

### Our Response Timeline

| Stage | Timeline | Action |
|-------|----------|--------|
| **Acknowledgment** | 24-48 hours | We confirm receipt and assign a severity level |
| **Initial Assessment** | 2-5 days | We reproduce and validate the issue |
| **Fix Development** | Varies | We develop and test a patch (may involve you) |
| **Disclosure** | Coordinated | We agree on a public disclosure date |
| **Release** | ASAP | Patched version released, advisory published |

### Severity Levels

**Critical** (24-48 hour fix target)
- Remote code execution
- Authentication bypass
- Sensitive data exposure to unauthorized parties

**High** (1 week fix target)
- Privilege escalation
- XSS that could lead to account compromise
- Privacy violations

**Medium** (2 weeks fix target)
- CSRF without significant impact
- Information disclosure (limited scope)
- Minor permission issues

**Low** (1 month fix target)
- Security best practice violations
- Hardening opportunities
- UI spoofing

---

## 🏆 Recognition

We believe in recognizing security researchers:

### Hall of Fame
Responsible disclosers will be:
- Listed in our `SECURITY_THANKS.md` file (if desired)
- Mentioned in release notes
- Given credit in the security advisory

### Bounties
Currently, we don't have a formal bug bounty program (we're a free, open-source project). However:
- We deeply appreciate your help!
- We'll give you prominent credit
- Consider sponsoring the project if you find it valuable

---

## 🔐 Security Best Practices

### For Users

**Extension Permissions**
- We only request necessary permissions (storage, tabs, activeTab, alarms)
- Review our `manifest.json` to see exactly what we access

**Data Privacy**
- Your viewing history **never leaves your device**
- AI detection runs 100% locally
- Only anonymized warning votes are sent to our servers

**What We Store**
- **Locally (in browser)**: Your trigger preferences, profiles, cached warnings
- **On Supabase**: Warning timestamps (linked to content IDs, not user IDs), vote counts
- **Never stored**: Your viewing history, personal information

### For Contributors

**Code Review Checklist**
Before submitting code, verify:
- [ ] No hardcoded secrets (API keys, passwords)
- [ ] User input is sanitized (prevent XSS)
- [ ] External content is properly escaped
- [ ] Sensitive operations require explicit permission
- [ ] No eval() or new Function() with user input
- [ ] CSP (Content Security Policy) is respected
- [ ] HTTPS-only for all external requests

**Common Vulnerabilities to Avoid**

1. **XSS (Cross-Site Scripting)**
   ```typescript
   // ❌ BAD: Direct HTML injection
   element.innerHTML = userInput;
   
   // ✅ GOOD: Use textContent or sanitize
   element.textContent = userInput;
   ```

2. **Injection Attacks**
   ```typescript
   // ❌ BAD: String concatenation in queries
   const query = `SELECT * FROM warnings WHERE id = ${userId}`;
   
   // ✅ GOOD: Use parameterized queries (Supabase handles this)
   const { data } = await supabase
     .from('warnings')
     .select('*')
     .eq('id', userId);
   ```

3. **Sensitive Data Exposure**
   ```typescript
   // ❌ BAD: Logging user data
   console.log('User watched:', videoTitle, videoURL);
   
   // ✅ GOOD: Log only necessary info
   console.log('Warning triggered at timestamp:', timestamp);
   ```

4. **Permission Abuse**
   ```typescript
   // ❌ BAD: Requesting unnecessary permissions
   // "tabs" permission to read all URLs
   
   // ✅ GOOD: Use minimal permissions
   // "activeTab" only when user clicks extension
   ```

---

## 🛡️ Security Features

### Content Security Policy (CSP)
We enforce strict CSP in our manifest:
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; connect-src 'self' https://*.supabase.co"
  }
}
```

### Row-Level Security (Supabase)
Our database uses RLS policies:
- Users can only vote once per warning
- Moderators can delete spam/malicious warnings
- Read access is public, write access is authenticated

### Local AI Processing
- TensorFlow.js models never send data externally
- All frame analysis happens in your browser
- Model weights are loaded from CDN, but inference is local

---

## 📚 Additional Resources

- **OWASP Browser Extension Security**: https://owasp.org/www-community/vulnerabilities/Browser_Extension_Security
- **Chrome Extension Security**: https://developer.chrome.com/docs/extensions/mv3/security/
- **Supabase Security**: https://supabase.com/docs/guides/auth/row-level-security

---

## 🔄 Security Updates

We will:
- Publish security advisories for all patched vulnerabilities (after fix is released)
- Include CVE identifiers for serious issues
- Maintain a changelog with security-related entries
- Notify users via extension update mechanisms

**Stay Updated:**
- Watch this repository for security announcements
- Subscribe to our [Discussions](https://github.com/mitchlabeetch/Trigger_Warnings/discussions) for updates

---

## 📝 Responsible Disclosure Agreement

By reporting a security issue, you agree to:
- Give us reasonable time to fix the issue before public disclosure (typically 90 days)
- Not exploit the vulnerability beyond proof-of-concept
- Not access or modify other users' data
- Not publicly disclose details until we've released a fix

We agree to:
- Respond promptly to your report
- Keep you updated on our progress
- Give you credit for the discovery (if you want it)
- Not take legal action against good-faith security researchers

---

## ❓ Questions About Security?

- **General security questions**: Open a [discussion](https://github.com/mitchlabeetch/Trigger_Warnings/discussions)
- **Report a vulnerability**: Use the methods above
- **Check disclosure status**: See our [Security Advisories](https://github.com/mitchlabeetch/Trigger_Warnings/security/advisories)

---

<div align="center">

**Thank you for helping keep Trigger Warnings secure!** 🔒

</div>
