import { prisma } from "../../../config/db";

/**
 * SMS workflow for Fee Management notifications.
 *
 * Reads provider config from existing `sms_settings` table.
 * No SMS transport package is wired in this project — this service
 * reports configuration status honestly and never claims delivery.
 */
export type SmsPayload = {
  to: string;
  body: string;
  notification_type: string;
};

export const getSmsConfigStatus = async () => {
  const settings = await prisma.smsSettings.findFirst({
    where: { status: 1 },
    orderBy: { id: "desc" },
  });

  let parsed: Record<string, unknown> = {};
  if (settings?.config) {
    try {
      parsed = JSON.parse(settings.config);
    } catch {
      parsed = {};
    }
  }

  const hasProviderHint = !!(
    settings?.link ||
    parsed.api_key ||
    parsed.apiKey ||
    parsed.account_sid ||
    parsed.accountSid
  );

  const configured = !!(settings && hasProviderHint);

  return {
    configured,
    source: settings ? "sms_settings" : "none",
    connect_at:
      "backend/src/modules/feeManagementModule/services/feeSms.service.ts → sendFeeSms()",
    table: "sms_settings",
    required_fields: ["identity", "link or config JSON with provider credentials", "status=1"],
    settings_present: !!settings,
    identity: settings?.identity || null,
  };
};

export const sendFeeSms = async (payload: SmsPayload) => {
  const status = await getSmsConfigStatus();

  if (!status.configured) {
    console.info("[FeeSms] SMS skipped — configure sms_settings with a provider.", {
      to: payload.to,
      type: payload.notification_type,
    });
    return {
      queued: false,
      sent: false,
      reason: "SMS_NOT_CONFIGURED",
      documentation: status,
      preview: {
        to: payload.to,
        body: payload.body.slice(0, 160),
      },
    };
  }

  const settings = await prisma.smsSettings.findFirst({
    where: { status: 1 },
    orderBy: { id: "desc" },
  });

  console.info("[FeeSms] Ready to send via configured provider (transport not wired)", {
    identity: settings?.identity,
    to: payload.to,
    type: payload.notification_type,
  });

  return {
    queued: true,
    sent: false,
    reason: "TRANSPORT_READY_AWAITING_PROVIDER_SEND",
    documentation: status,
    preview: {
      to: payload.to,
      body: payload.body,
    },
  };
};
