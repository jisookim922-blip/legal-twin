/**
 * PII Auto-Masking
 *
 * Detects and masks personally identifiable information (PII) before sending
 * to external AI services. After receiving the response, the masking can be
 * reversed using the returned PIIMap.
 *
 * Compliance: 弁護士法23条 守秘義務、個人情報保護法28条（越境移転規制）
 */

export interface PIIMap {
  /** original → placeholder mapping */
  forward: Record<string, string>;
  /** placeholder → original mapping (for de-masking) */
  reverse: Record<string, string>;
}

export interface MaskingResult {
  maskedText: string;
  piiMap: PIIMap;
  detectedCount: number;
}

// --- Detection patterns ---

const PATTERNS = {
  // 電話番号: 03-1234-5678, 090-1234-5678, +81-90-1234-5678 等
  phone: /(\+?81[-\s]?)?(\(?0\d{1,4}\)?[-\s]?)\d{1,4}[-\s]?\d{4}/g,

  // メール
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

  // 郵便番号
  postalCode: /〒?\s*\d{3}-?\d{4}/g,

  // クレカ番号（4桁×4 or 連続16桁）
  creditCard: /\b(?:\d[ -]*?){13,19}\b/g,

  // マイナンバー（12桁）
  myNumber: /(?<!\d)\d{4}[-\s]?\d{4}[-\s]?\d{4}(?!\d)/g,

  // 銀行口座（普通預金、当座預金等の前後）
  bankAccount: /(普通|当座|貯蓄)\s*[口店]?座?\s*\d{4,8}/g,

  // 事件番号: 令和X年(ワ)第XXXX号、平成XX年(ネ)第XXXX号 等
  caseNumber:
    /(令和|平成|昭和)\s*\d+\s*年\s*\([一-龥]\)\s*第\s*\d+\s*号/g,
};

// 名前・住所は AI で検出する（正規表現では難しいため）
// ただし、ケース情報から既知の固有名詞は確実にマスクする

/**
 * Mask known case-specific entities (client name, opposing party, case name)
 */
function maskKnownEntities(
  text: string,
  knownEntities: { clientName?: string; opposingParty?: string; caseName?: string }
): { text: string; replacements: Record<string, string> } {
  let result = text;
  const replacements: Record<string, string> = {};

  if (knownEntities.clientName?.trim()) {
    const placeholder = "[CLIENT_A]";
    const regex = new RegExp(escapeRegex(knownEntities.clientName), "g");
    if (regex.test(result)) {
      replacements[placeholder] = knownEntities.clientName;
      result = result.replace(regex, placeholder);
    }
  }

  if (knownEntities.opposingParty?.trim()) {
    const placeholder = "[PARTY_B]";
    const regex = new RegExp(escapeRegex(knownEntities.opposingParty), "g");
    if (regex.test(result)) {
      replacements[placeholder] = knownEntities.opposingParty;
      result = result.replace(regex, placeholder);
    }
  }

  if (knownEntities.caseName?.trim()) {
    const placeholder = "[CASE_NAME]";
    const regex = new RegExp(escapeRegex(knownEntities.caseName), "g");
    if (regex.test(result)) {
      replacements[placeholder] = knownEntities.caseName;
      result = result.replace(regex, placeholder);
    }
  }

  return { text: result, replacements };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Mask PII in text. Returns the masked text and a map for de-masking.
 *
 * @param text The text to mask
 * @param knownEntities Optional case-specific entities to mask
 */
export function maskPII(
  text: string,
  knownEntities: {
    clientName?: string;
    opposingParty?: string;
    caseName?: string;
  } = {}
): MaskingResult {
  let maskedText = text;
  const forward: Record<string, string> = {};
  const reverse: Record<string, string> = {};
  let detectedCount = 0;

  // Step 1: Mask known entities
  const knownResult = maskKnownEntities(maskedText, knownEntities);
  maskedText = knownResult.text;
  for (const [placeholder, original] of Object.entries(knownResult.replacements)) {
    forward[original] = placeholder;
    reverse[placeholder] = original;
    detectedCount++;
  }

  // Step 2: Mask pattern-based PII
  const patternCounters = {
    phone: 0,
    email: 0,
    postalCode: 0,
    creditCard: 0,
    myNumber: 0,
    bankAccount: 0,
    caseNumber: 0,
  };

  for (const [type, pattern] of Object.entries(PATTERNS) as [
    keyof typeof PATTERNS,
    RegExp,
  ][]) {
    maskedText = maskedText.replace(pattern, (match) => {
      // Skip if already a placeholder
      if (match.startsWith("[") && match.endsWith("]")) return match;

      // Reuse existing placeholder for same value
      if (forward[match]) return forward[match];

      patternCounters[type]++;
      const placeholder = `[${type.toUpperCase()}_${patternCounters[type]}]`;
      forward[match] = placeholder;
      reverse[placeholder] = match;
      detectedCount++;
      return placeholder;
    });
  }

  return {
    maskedText,
    piiMap: { forward, reverse },
    detectedCount,
  };
}

/**
 * Restore original values from a masked text using the PII map.
 */
export function unmaskPII(maskedText: string, piiMap: PIIMap): string {
  let result = maskedText;
  // Sort by placeholder length descending to avoid partial replacements
  const sortedPlaceholders = Object.keys(piiMap.reverse).sort(
    (a, b) => b.length - a.length
  );
  for (const placeholder of sortedPlaceholders) {
    const original = piiMap.reverse[placeholder];
    result = result.replaceAll(placeholder, original);
  }
  return result;
}

/**
 * Detect if text contains potential PII (lightweight check, no masking).
 * Used for UI warnings.
 */
export function hasPotentialPII(text: string): boolean {
  for (const pattern of Object.values(PATTERNS)) {
    pattern.lastIndex = 0; // Reset state
    if (pattern.test(text)) return true;
  }
  return false;
}

/**
 * Get a human-readable summary of detected PII types.
 */
export function summarizePII(piiMap: PIIMap): string[] {
  const types = new Set<string>();
  for (const placeholder of Object.keys(piiMap.reverse)) {
    const match = placeholder.match(/^\[([A-Z_]+)/);
    if (match) {
      const type = match[1].split("_")[0];
      const label =
        {
          CLIENT: "依頼者名",
          PARTY: "相手方名",
          CASE: "事件名",
          PHONE: "電話番号",
          EMAIL: "メール",
          POSTALCODE: "郵便番号",
          CREDITCARD: "クレカ番号",
          MYNUMBER: "マイナンバー",
          BANKACCOUNT: "銀行口座",
          CASENUMBER: "事件番号",
        }[type] ?? type;
      types.add(label);
    }
  }
  return Array.from(types);
}
