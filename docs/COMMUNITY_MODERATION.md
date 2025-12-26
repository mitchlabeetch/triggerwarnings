# Community Moderation & Voting System

How the Trigger Warnings community ensures accuracy and quality through democratic voting.

---

## 🗳️ Overview

Trigger Warnings relies on **community consensus** to maintain accurate warnings. Anyone can submit a warning, but the community validates it through voting. This system:

- **Promotes accuracy**: Bad warnings get downvoted and hidden
- **Prevents spam**: Malicious submissions are filtered out
- **Self-correcting**: Mistakes are caught and fixed by the community
- **Democratic**: No single authority decides what's valid

---

## 🎯 How Voting Works

### The Basics

1. **User submits a warning**: "Violence at 05:23, duration 10 seconds"
2. **Warning appears for others**: When they watch the same content
3. **Users vote**: ⬆️ Upvote (accurate) or ⬇️ Downvote (inaccurate)
4. **Consensus emerges**: Warnings with positive score stay visible
5. **Bad warnings hidden**: Warnings below threshold (-5) are auto-hidden

### Voting Rules

**One vote per user per warning**: You can't upvote the same warning twice.

**Vote changes allowed**: You can change your vote (upvote → downvote or vice versa).

**Anonymous voting**: No one can see who voted how (privacy).

**No reputation system (yet)**: All votes have equal weight (planned for v3.0).

---

## 📊 Consensus Algorithm

### Simple Score

Each warning has a **consensus score**:

```
score = votes_up - votes_down
```

**Examples:**
- 10 upvotes, 2 downvotes → score = 8 (high confidence)
- 3 upvotes, 3 downvotes → score = 0 (uncertain)
- 1 upvote, 6 downvotes → score = -5 (hidden)

### Visibility Threshold

Warnings are hidden if:
```
score < -5
```

**Why -5?**
- New warnings start at 0 (neutral)
- A few downvotes won't immediately hide a warning
- Prevents trolls from mass-downvoting good warnings
- Allows for disagreement without censorship

### Confidence Level

Warnings are color-coded by confidence:

| Score | Confidence | Color | Meaning |
|-------|------------|-------|---------|
| ≥ 10 | High | 🟢 Green | Widely validated |
| 5-9 | Moderate | 🟡 Yellow | Some validation |
| 0-4 | Low | 🟠 Orange | New or disputed |
| -1 to -4 | Very Low | 🔴 Red | Questionable |
| ≤ -5 | Hidden | ⚫ Hidden | Community rejected |

---

## 🚨 Warning Quality Guidelines

### What Makes a Good Warning?

✅ **Accurate timestamp**: ±3 seconds of actual trigger  
✅ **Correct type**: Violence is violence, not gore  
✅ **Appropriate severity**: Mild = brief, Severe = graphic/prolonged  
✅ **Helpful description**: "Spider crawling on wall" (not "Spider!")  
✅ **No spoilers**: "Character death" ❌ → "Violence (fatal)" ✅  

### What Makes a Bad Warning?

❌ **Wrong timestamp**: Off by >5 seconds  
❌ **Wrong type**: Calling spiders "violence"  
❌ **Exaggerated severity**: Calling a punch "severe gore"  
❌ **Spoilers**: "John kills the villain"  
❌ **Spam**: Random warnings at 00:00:00  
❌ **Joke warnings**: Fake triggers for memes  

---

## 👮 Moderation Tiers

### Tier 1: Community Self-Moderation (Current)

**Who**: All users  
**Power**: Vote up/down  
**Effect**: Warnings auto-hidden at -5 score  

**Pros:**
- Democratic
- Scales with user base
- No central authority needed

**Cons:**
- Slow for obvious spam
- Vulnerable to coordinated attacks
- No accountability for bad actors

### Tier 2: Trusted Users (Planned v2.1)

**Who**: Users with good track record (high-quality submissions, accurate votes)  
**Power**: Faster voting weight (2x), can flag spam for immediate review  
**Effect**: Warnings flagged by trusted users reviewed within 24 hours  

**How to become trusted:**
- Submit 50+ warnings with avg. score ≥ 5
- Vote on 200+ warnings with >80% agreement with consensus
- No rejected submissions for spam/spoilers

### Tier 3: Moderators (Planned v3.0)

**Who**: Elected community members (applications open annually)  
**Power**: Can delete warnings, ban users, resolve disputes  
**Effect**: Immediate action on spam, harassment, etc.  

**How to become a moderator:**
- Trusted user for 6+ months
- Apply during election period
- Community votes (top 10 elected)
- 1-year term (renewable)

---

## 🛡️ Anti-Abuse Measures

### Spam Detection

**Automated filters:**
- Reject warnings with timestamp = 0 (unless genuinely at start)
- Reject warnings with duration > 50% of video length
- Flag users submitting >10 warnings/hour
- Detect patterns (e.g., same text for multiple videos)

**Penalty:**
- First offense: Warning message
- Repeat offenses: Temporary ban (24 hours)
- Persistent abuse: Permanent ban

### Vote Manipulation

**Detection:**
- IP address clustering (multiple accounts from same IP)
- Rapid voting patterns (100 votes in 5 minutes)
- Coordinated voting (same users always voting together)

**Response:**
- Invalidate suspicious votes
- Flag accounts for review
- Require CAPTCHA for voting (if needed)

### Spoiler Reporting

**User can report warnings** with:
- Reason: "Contains spoilers"
- Optional: Suggested edit

**Moderator reviews:**
- If spoiler confirmed: Warning edited or deleted
- If false report: Reporter warned

---

## 📈 Voting Statistics

### Public Stats (Coming Soon)

On each warning:
- **Total votes**: 42 votes (35 ⬆️, 7 ⬇️)
- **Consensus**: 82% agreement
- **Age**: Submitted 3 days ago
- **Reporter**: Anonymous (or username if accounts enabled)

On content page:
- **Warning coverage**: 85% (most scenes covered)
- **Community confidence**: High (avg. score 8.2)
- **Top contributors**: Anonymous (or usernames)

### Your Stats (Private)

In your profile (future):
- Warnings submitted: 42
- Avg. warning score: 6.5
- Votes cast: 187
- Agreement rate: 78% (vs. community consensus)
- Reputation: Trusted User ⭐

---

## 🎓 Voting Best Practices

### For New Users

1. **Watch the scene first**: Don't vote based on description alone
2. **Consider objective accuracy**: Is the timestamp correct? Is the type right?
3. **Don't downvote disagreements**: If severity is subjective, abstain
4. **Upvote helpful warnings**: Even if you personally don't need them

### For Trusted Users

1. **Lead by example**: Submit high-quality warnings
2. **Educate new users**: Comment on why you voted down (future feature)
3. **Flag spam proactively**: Don't wait for -5 threshold
4. **Be patient**: Not everyone understands the guidelines at first

### For Moderators (Future)

1. **Act impartially**: Personal preferences shouldn't influence moderation
2. **Explain decisions**: Transparency builds trust
3. **Listen to appeals**: People make honest mistakes
4. **Protect privacy**: Never reveal vote details or user info

---

## 🔄 Dispute Resolution

### Current Process (v2.0)

1. User believes a warning is wrong
2. User downvotes the warning
3. If score drops below -5, warning is hidden
4. Original submitter can edit and resubmit

**Limitations:**
- No direct communication between users
- No appeals process
- Potential for mob rule

### Future Process (v3.0)

1. User flags warning for review (with reason)
2. Moderator investigates within 24 hours
3. Moderator decision:
   - **Keep**: Warning stays, flag dismissed
   - **Edit**: Moderator corrects warning
   - **Remove**: Warning deleted
4. Both users notified of outcome
5. Appeal to senior moderators if needed (30 days)

---

## 📜 Community Guidelines

### Do's

✅ Vote honestly based on accuracy  
✅ Submit warnings to help others  
✅ Be respectful in descriptions  
✅ Assume good faith from others  
✅ Report spam/abuse through proper channels  

### Don'ts

❌ Vote based on whether you personally need the warning  
❌ Submit joke/fake warnings  
❌ Include spoilers in descriptions  
❌ Downvote en masse to harass users  
❌ Create multiple accounts to manipulate votes  
❌ Retaliate against users who downvoted you  

**Consequences:**
- First violation: Warning
- Second violation: 7-day ban
- Third violation: 30-day ban
- Fourth violation: Permanent ban

---

## 🔮 Future Features

### Planned Improvements

- **Vote explanations**: Optional text explaining why you voted down
- **Warning discussions**: Threaded comments on disputed warnings
- **Vote history**: See your past votes and change them
- **Blind voting**: Hide vote counts until you vote (prevents bandwagoning)
- **Quality scores**: Warnings with high confidence displayed more prominently
- **Automatic translation**: Community can translate warnings into other languages

### Advanced Features (Research Phase)

- **Bayesian voting**: Weight votes by user accuracy history
- **Reputation decay**: Inactive users lose trusted status
- **Topic experts**: Users specialize in certain trigger types (e.g., "spider expert")
- **Machine learning**: AI suggests votes based on patterns
- **Federated moderation**: Distribute moderation across regional teams

---

## 📊 Success Metrics

How we measure community health:

| Metric | Target | Current |
|--------|--------|---------|
| Avg. warning score | > 5 | TBD |
| % warnings with confidence ≥ Moderate | > 80% | TBD |
| Spam rate | < 2% | TBD |
| User participation (voters/viewers) | > 20% | TBD |
| Moderator response time | < 24h | N/A |

---

## 🙏 Thank You, Community!

This system only works because of **you**. Every vote, every warning submitted, every report filed—it all contributes to making streaming accessible for everyone.

**Top Contributors** (coming soon):
- Most accurate warnings
- Most helpful votes
- Best moderators

Want to be featured? Keep submitting quality content!

---

<div align="center">

**Questions about moderation?** [Open a discussion](https://github.com/mitchlabeetch/Trigger_Warnings/discussions) 💬

[Back to README](../README.md)

</div>
