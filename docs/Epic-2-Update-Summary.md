6/29/26, 5:47 PM 

Epic 2 - Update Summary (Before vs. After) 

## **Epic 2 - Update Summary (Before vs. After)** 

Resolver-Relevant Updates from Figma Design Review 

FactoryShield / gstack-review session 

## **Epic 2 - Update Summary** 

This document summarizes the 8 Resolver-relevant updates applied to docs/Epic-2-Investigate-Resolve-Incident-FIXED.md based on the live Figma dashboard review. Items are ordered by the US section they affect. 

file:///C:/Users/BS01501/AppData/Local/Temp/Epic-2-Update-Summary.html 

1/4 

6/29/26, 5:47 PM 

Epic 2 - Update Summary (Before vs. After) 

## **Before vs. After Comparison Table** 

|**#**|**US**<br>**Section**|**Field / Area**|**Before (Original)**|**After (Updated)**|**Reason**|
|---|---|---|---|---|---|
|1|US-1|Acceptance<br>Criteria|“Given an incident is assigned to<br>me, when I open my dashboard,<br>then it appears in my Assigned<br>Incident list.”|Added: “Given I open my dashboard, then I<br>see badge counts for corrective actions<br>requiring my attention and pending<br>approvals awaiting my submission.”|Dashboard<br>shows<br>“Pending<br>Approvals”<br>widget<br>(Close<br>Investigation,<br>CAPA<br>Verification,<br>Root Cause<br>Sign-off)<br>which the<br>Resolver<br>must action.|
|2|US-1|Acceptance<br>Criteria|Filter: “severity, department, status,<br>or due date”|Filter: “severity, department,**line, equipment**,<br>status, or due date”|Figma<br>dashboard<br>exposes line<br>and<br>equipment<br>as filter chips<br>on incident<br>lists.|
|3|US-1|Acceptance<br>Criteria|“Given I open an incident, then I can<br>view all incident details,<br>attachments, timeline, and previous<br>comments.”|“Given I open an incident detail, then I can<br>view all incident details,**reporter contact**<br>**channel**, attachments, timeline, and previous<br>comments.”|Figma<br>incident<br>detail header<br>shows<br>reporter<br>name +<br>contact<br>channel for<br>follow-up.|
|4|US-1|Fields|Missing:<br>incident_reference ,<br>department ,<br>line ,<br>equipment ,<br>reporter_id ,<br>reporter_name|Added all six fields with FKs and notes<br>(e.g.<br>incident_reference format<br>INC-<br>{YYYY}-{NNNN} ,<br>reporter_name<br>denormalized to survive user<br>rename/delete).|Dashboard<br>cards and<br>detail views<br>rely on these<br>for display,<br>routing, and<br>audit.|
|5|US-1|Fields|severity listed without enum|severity (enum:<br>LOW ,<br>MEDIUM ,<br>HIGH ,<br>CRITICAL )|Severity Mix<br>donut on<br>dashboard<br>uses 4-level<br>scale; enum<br>now defined.|
|6|US-1|Fields|status listed without enum|status (enum:<br>OPEN ,<br>IN_PROGRESS ,<br>INVESTIGATION ,<br>PENDING_APPROVAL ,<br>CLOSED ,<br>REJECTED )|Status filter<br>on<br>dashboard<br>uses 6-state<br>model;|



file:///C:/Users/BS01501/AppData/Local/Temp/Epic-2-Update-Summary.html 

2/4 

6/29/26, 5:47 PM 

Epic 2 - Update Summary (Before vs. After) 

|**#**|**US**<br>**Section**|**Field / Area**|**Before (Original)**|**After (Updated)**|**Reason**|
|---|---|---|---|---|---|
||||||matches<br>GenieERP<br>state<br>machine.|
|7|US-2|Acceptance<br>Criteria|“Given I investigate an incident,<br>then I can record investigation<br>notes.”|Added: “Given I need clarification during<br>investigation, then I can view the reporter’s<br>contact channel (or note ‘anonymous’ for<br>confidential reports) and request follow-up.”|Reporter<br>follow-up is<br>a Resolver<br>workflow in<br>the design;<br>confidential /<br>anonymous<br>reports need<br>a fallback.|
|8|US-2|Fields|Missing:<br>reporter_followup_requested ,<br>reporter_followup_resolved|Added both as boolean fields.|Tracks<br>whether<br>Resolver<br>requested<br>follow-up<br>and whether<br>it was<br>answered;<br>surfaces in<br>audit<br>timeline.|
|9|US-5|Acceptance<br>Criteria|“Given additional approval is<br>required, then I can submit for<br>Manager approval and<br>resolution_status transitions<br>to<br>PENDING .”|“Given I submit for approval, then I select an<br>approval_type (CLOSE_INVESTIGATION,<br>CAPA_VERIFICATION,<br>ROOT_CAUSE_SIGN_OFF, or<br>RESOLUTION_FINAL) and<br>resolution_status transitions to<br>PENDING .”|Dashboard’s<br>“Pending<br>Approvals”<br>widget<br>enumerates<br>3 of 4<br>approval<br>types; spec<br>must let<br>Resolver pick<br>which one.|
|10|US-5|Fields|Missing:<br>approval_type|Added:<br>approval_type (FK →<br>approval_definitions.approval_type ;<br>one of<br>CLOSE_INVESTIGATION ,<br>CAPA_VERIFICATION ,<br>ROOT_CAUSE_SIGN_OFF ,<br>RESOLUTION_FINAL ) — each type has its<br>own reviewer chain, SLA, and required<br>evidence.|Each<br>approval has<br>different<br>reviewer<br>chain<br>(Manager<br>vs. Safety<br>Officer) and<br>SLA; cannot<br>be a single<br>boolean.|
|11|Field<br>Summary|Enumerations|7 enums listed:<br>action_status ,<br>resolution_status ,<br>investigation_status ,<br>SLA_status ,<br>upload_status ,<br>escalation_source ,<br>root_cause_code|Added 3 enums:<br>severity (4 values),<br>incident_status (6 values),<br>approval_type (4 values).|Single-<br>source-of-<br>truth rule:<br>every enum<br>in US<br>sections|



file:///C:/Users/BS01501/AppData/Local/Temp/Epic-2-Update-Summary.html 

3/4 

6/29/26, 5:47 PM 

Epic 2 - Update Summary (Before vs. After) 

|**#**|**US**<br>**Section**|**Field / Area**|**Before (Original)**|**After (Updated)**|**Reason**|
|---|---|---|---|---|---|
||||||must be<br>defined here.|



## **Summary by US Section** 

|**US Section**|**Updates Applied**|
|---|---|
|US-1: View Assigned Incidents|Items 1, 2, 3, 4, 5, 6|
|US-2: Record Investigation & Root Cause|Items 7, 8|
|US-5: Resolve or Escalate Incident|Items 9, 10|
|Field Summary (Enumerations)|Item 11|



## **Out of Scope (Skipped)** 

The following dashboard items were observed on the Figma site but are NOT Resolver-facing and were excluded from this spec: 

- **AI Safety Insight** — appears in Manager / Admin dashboard only. 

- **Bulk actions / filters on “All Incidents”** — Admin-only view. 

file:///C:/Users/BS01501/AppData/Local/Temp/Epic-2-Update-Summary.html 

4/4 

