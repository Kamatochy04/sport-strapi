type Row = {
  sportVerificationId?: string;
  reviewStatus?: string;
  rejectionReason?: string | null;
};

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return undefined;
}

function flattenResult(result: unknown): Row {
  if (!result || typeof result !== 'object') return {};
  let r = result as Record<string, unknown>;
  if (r.data && typeof r.data === 'object') {
    r = r.data as Record<string, unknown>;
  }
  const attrs = r.attributes;
  if (attrs && typeof attrs === 'object') {
    const a = attrs as Record<string, unknown>;
    return {
      sportVerificationId: pickStr(a, 'sportVerificationId', 'sport_verification_id'),
      reviewStatus: pickStr(a, 'reviewStatus', 'review_status'),
      rejectionReason: pickStr(a, 'rejectionReason', 'rejection_reason') ?? null,
    };
  }
  return {
    sportVerificationId: pickStr(r, 'sportVerificationId', 'sport_verification_id'),
    reviewStatus: pickStr(r, 'reviewStatus', 'review_status'),
    rejectionReason: pickStr(r, 'rejectionReason', 'rejection_reason') ?? null,
  };
}

function mergeRowFromEvent(event: { result?: unknown; params?: { data?: unknown } }): Row {
  const fromResult = flattenResult(event.result);
  const raw = event.params?.data;
  if (!raw || typeof raw !== 'object') return fromResult;
  const d = raw as Record<string, unknown>;
  return {
    sportVerificationId:
      fromResult.sportVerificationId ?? pickStr(d, 'sportVerificationId', 'sport_verification_id'),
    reviewStatus: fromResult.reviewStatus ?? pickStr(d, 'reviewStatus', 'review_status'),
    rejectionReason:
      fromResult.rejectionReason ?? pickStr(d, 'rejectionReason', 'rejection_reason') ?? null,
  };
}

async function sendOrganizerDecisionToSport({
  sportVerificationId,
  approve,
  rejectionReason,
}: {
  sportVerificationId: string;
  approve: boolean;
  rejectionReason?: string | null;
}) {
  const base = (process.env.SPORT_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
  const secret = process.env.SPORT_WEBHOOK_SECRET ?? '';
  if (!secret) {
    console.warn(
      '[organizer-verification-request] SPORT_WEBHOOK_SECRET пуст — решение не отправлено в Sport. Задайте секрет в strapi-app/.env',
    );
    return;
  }
  if (!/^[\x20-\x7E]+$/.test(secret)) {
    console.error(
      '[organizer-verification-request] SPORT_WEBHOOK_SECRET должен быть ASCII-строкой без кириллицы, потому что он передаётся в HTTP-заголовке.',
    );
    return;
  }

  try {
    const sportRes = await fetch(`${base}/webhooks/strapi/organizer-decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': secret,
      },
      body: JSON.stringify({
        sportVerificationId,
        approve,
        rejectionReason: approve ? undefined : rejectionReason ?? undefined,
      }),
    });

    if (!sportRes.ok) {
      const text = await sportRes.text().catch(() => '');
      console.error(
        '[organizer-verification-request] Sport отклонил вебхук:',
        sportRes.status,
        text.slice(0, 500),
      );
    }
  } catch (err) {
    console.error('[organizer-verification-request] Sport webhook failed:', err);
  }
}

export default {
  async afterUpdate(event: { result?: unknown; params?: { data?: unknown } }) {
    const { sportVerificationId, reviewStatus, rejectionReason } = mergeRowFromEvent(event);
    if (!sportVerificationId || !reviewStatus || reviewStatus === 'pending') return;

    await sendOrganizerDecisionToSport({
      sportVerificationId,
      approve: reviewStatus === 'approved',
      rejectionReason: reviewStatus === 'rejected' ? rejectionReason : undefined,
    });
  },

  async afterDelete(event: { result?: unknown }) {
    const { sportVerificationId } = flattenResult(event.result);
    if (!sportVerificationId) return;

    await sendOrganizerDecisionToSport({
      sportVerificationId,
      approve: false,
      rejectionReason: 'Заявка удалена модератором в Strapi. Можно отправить новую.',
    });
  },
};
