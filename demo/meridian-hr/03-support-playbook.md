# Customer Support Playbook — Meridian HR

**Team:** Customer Support  
**Last updated:** January 2024  
**Maintained by:** Support Lead

---

## Purpose

This playbook covers the most common support queries received by the Meridian HR support team, along with approved response scripts and escalation guidance.

---

## Tier 1: Common queries

### 1. "I can't log in / I didn't receive my invite"

**Likely cause:** Email not whitelisted, invite expired, or SSO misconfiguration.

**Steps:**
1. Ask the customer which email address they used.
2. Check in admin panel under **Users → Pending Invites**.
3. If the invite is older than 7 days, it has expired. Resend via **Resend Invite**.
4. If the customer's company uses SSO, direct them to their IT admin — we cannot bypass SSO from our side.

**Script:**  
> "Thanks for reaching out. Your invite may have expired or been sent to a different address. I've resent an invite to [email] — please check your spam folder and let me know if it hasn't arrived within 5 minutes."

---

### 2. "My review form is blank / questions are missing"

**Likely cause:** Form not published by the admin, or participant added after launch.

**Steps:**
1. Ask for the cycle name and the customer's company.
2. Check the cycle status in the admin panel. If status is **Draft**, the admin has not launched it yet.
3. If the participant was added after the cycle launched, they will see an empty form. The admin must create a new sub-cycle for late additions.

**Script:**  
> "It looks like [cycle name] may still be in draft mode on your admin's side. Could you check with your HR administrator to confirm the cycle has been launched? Once it's launched, you'll see the full form."

---

### 3. "I can't see my review results"

**Likely cause:** Manager has not released results yet.

**Steps:**
1. Confirm the cycle has closed (due date has passed).
2. If closed, results are pending manager release. Advise customer to check with their direct manager.
3. If the cycle is still open, results are not yet available.

**Script:**  
> "Results are controlled by your manager and aren't visible until they choose to release them. This usually happens after the calibration session. I'd recommend checking in with your manager directly."

---

### 4. "How do I add a new employee to an existing review cycle?"

**Response:**  
New employees can be added to a cycle before it launches. Once a cycle is live, new participants cannot be added — a separate cycle must be created for them. Advise the HR admin to:
1. Navigate to the cycle.
2. Click **Participants → Add Employee**.
3. If the cycle is already live, they will see a warning. A new cycle is required.

---

### 5. "Can employees dispute or appeal a review rating?"

**Response:**  
There is currently no formal dispute workflow in the platform. Employees who wish to challenge a rating should speak directly with their manager or HR. This is a known product gap and is on the roadmap for Q3 2024.

Workaround: Managers can manually adjust submitted ratings before releasing results. Adjustments are logged in the audit trail.

---

### 6. "What is Calibration Mode and how do I enable it?"

**Response:**  
Calibration Mode weights manager ratings more heavily in 360 assessments. To enable:
1. Go to **Settings → Review Settings**.
2. Toggle **Calibration Mode** on.
3. Set the manager weighting percentage (default is 60%).

Note: Calibration Mode must be enabled before a cycle is launched. It cannot be changed mid-cycle.

> ⚠️ **Internal note:** The help centre article on 360 reviews states that manager ratings are not weighted differently unless Calibration Mode is enabled — but does not explain how to enable it or what the default weighting is. Flag for documentation update.

---

## Tier 2: Escalation triggers

Escalate to the Support Lead or Customer Success Manager if:

- The customer's data appears corrupted or missing
- A cycle is stuck in a state it cannot exit (e.g. "Closing" for more than 24 hours)
- The customer is requesting a data export for legal/compliance reasons
- A manager has accidentally released results to the wrong team
- The customer mentions a PIP (Performance Improvement Plan) — these have a separate process not currently documented in the platform

---

## Response time SLAs

| Priority | First response | Resolution target |
|----------|---------------|-------------------|
| P1 (data loss, outage) | 1 hour | 4 hours |
| P2 (feature broken) | 4 hours | 1 business day |
| P3 (how-to question) | 1 business day | 3 business days |

---

*All customer communications must be logged in the CRM within 2 hours of the interaction closing.*
