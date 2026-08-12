export const PROVIDERS = [
  { id: 'mtn', label: 'MTN MoMo', code: 'MTN' },
  { id: 'airtel', label: 'Airtel Money', code: 'AIRTEL' },
  { id: 'zamtel', label: 'Zamtel Kwacha', code: 'ZAMTEL' },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomRef(prefix, length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${out}`;
}

export async function simulateMobileMoney({ provider, phone, amount }, onStage) {
  const stages = [
    'Requesting payment from wallet',
    'Processing at provider',
    'Crediting wallet',
  ];
  for (let i = 0; i < stages.length; i += 1) {
    if (onStage) onStage(stages[i]);
    await delay(480 + Math.random() * 420);
  }
  return {
    provider: provider.label,
    providerCode: provider.code,
    phone,
    amount,
    reference: randomRef(provider.code),
    status: 'paid',
    timestamp: new Date().toISOString(),
  };
}
