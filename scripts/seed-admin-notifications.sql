-- Demo in-app notifications for admin@factoryshield.dev (Notifications UI)
-- Idempotent: skips if admin already has seeded rows.

INSERT INTO "Notifications" (
  "Id", "Type", "Stage", "CreatedAt", "RecipientId", "Channel",
  "Subject", "Body", "DeepLinkPath", "TriggerEvent", "IdempotencyKey",
  "SentAt", "IsRead", "ReadAt", "DeliveryStatus", "ReminderSent"
)
SELECT * FROM (VALUES
  (gen_random_uuid(), 'INCIDENT_CRITICAL', 'INCIDENT_CRITICAL', NOW() - INTERVAL '9 minutes',
   '0456f049-71e1-422e-b230-f58f69bddb93'::uuid, 'InApp',
   'Critical Incident Reported', 'Chemical spill in Finishing section — INC-2024-0891',
   '/incidents/INC-2024-0891', 'INCIDENT_CRITICAL', 'seed-admin-critical-0891',
   NOW() - INTERVAL '9 minutes', false, NULL, 'Sent', false),

  (gen_random_uuid(), 'APPROVAL_GATE', 'APPROVAL_GATE', NOW() - INTERVAL '1 hour',
   '0456f049-71e1-422e-b230-f58f69bddb93'::uuid, 'InApp',
   'Approval Required', 'CAPA verification pending for INC-2024-0879',
   '/approver/queue', 'APPROVAL_GATE', 'seed-admin-approval-0879',
   NOW() - INTERVAL '1 hour', false, NULL, 'Sent', false),

  (gen_random_uuid(), 'CAPA_OVERDUE', 'CAPA_OVERDUE', NOW() - INTERVAL '3 hours',
   '0456f049-71e1-422e-b230-f58f69bddb93'::uuid, 'InApp',
   'CAPA Overdue', 'Action CA-005 is 2 days past due date',
   '/capa', 'CAPA_OVERDUE', 'seed-admin-capa-005',
   NOW() - INTERVAL '3 hours', false, NULL, 'Sent', false),

  (gen_random_uuid(), 'INVESTIGATION', 'INVESTIGATION', NOW() - INTERVAL '5 hours',
   '0456f049-71e1-422e-b230-f58f69bddb93'::uuid, 'InApp',
   'Investigation Completed', 'INC-2024-0888 investigation report submitted',
   '/incidents/INC-2024-0888', 'INVESTIGATION', 'seed-admin-investigation-0888',
   NOW() - INTERVAL '5 hours', true, NOW() - INTERVAL '4 hours 55 minutes', 'Sent', false),

  (gen_random_uuid(), 'INCIDENT_CLOSED', 'INCIDENT_CLOSED', NOW() - INTERVAL '1 day',
   '0456f049-71e1-422e-b230-f58f69bddb93'::uuid, 'InApp',
   'Incident Closed', 'INC-2024-0880 has been successfully closed',
   '/incidents/INC-2024-0880', 'INCIDENT_CLOSED', 'seed-admin-closed-0880',
   NOW() - INTERVAL '1 day', true, NOW() - INTERVAL '23 hours', 'Sent', false)
) AS v("Id", "Type", "Stage", "CreatedAt", "RecipientId", "Channel",
         "Subject", "Body", "DeepLinkPath", "TriggerEvent", "IdempotencyKey",
         "SentAt", "IsRead", "ReadAt", "DeliveryStatus", "ReminderSent")
WHERE NOT EXISTS (
  SELECT 1 FROM "Notifications"
  WHERE "RecipientId" = '0456f049-71e1-422e-b230-f58f69bddb93'::uuid
    AND "IdempotencyKey" LIKE 'seed-admin-%'
);
