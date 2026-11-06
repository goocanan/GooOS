/**
 * Standard Product SKU Generator for GooOS GooFlow Product Catalog
 * Format Convention: 3 huruf kapital dan 3 digit angka dipisahkan tanda strip (Contoh: ABC-123)
 */

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";

/**
 * Generate random SKU with 3 uppercase letters and 3 digits: e.g. "ABC-123"
 */
export function generateRandomProductSku(): string {
  let code = "";
  for (let i = 0; i < 3; i++) {
    code += LETTERS.charAt(Math.floor(Math.random() * LETTERS.length));
  }
  code += "-";
  for (let i = 0; i < 3; i++) {
    code += NUMBERS.charAt(Math.floor(Math.random() * NUMBERS.length));
  }
  return code;
}

/**
 * Generate unique random SKU that does not conflict with existing catalog & option SKUs
 */
export function generateUniqueProductSku(
  excludeSkus: (string | null | undefined)[] = []
): string {
  const existing = new Set(
    excludeSkus
      .filter((s): s is string => Boolean(s && String(s).trim()))
      .map((s) => String(s).trim().toUpperCase())
  );

  let candidate = "";
  let attempts = 0;
  do {
    candidate = generateRandomProductSku();
    attempts++;
  } while (existing.has(candidate) && attempts < 100);

  return candidate;
}

/**
 * Generate sequential SKU for product variants / options:
 * If base SKU is "ABC-123", next variant becomes "ABC-124", "ABC-125", etc.
 * Preserves the 3-letter prefix and 3-digit suffix standard.
 */
export function generateNextProductOptionSku(
  baseSku: string | null | undefined,
  index: number,
  existingSkus: (string | null | undefined)[] = []
): string {
  const existingSet = new Set(
    existingSkus
      .filter((s): s is string => Boolean(s && String(s).trim()))
      .map((s) => String(s).trim().toUpperCase())
  );

  let candidate = "";

  if (baseSku && baseSku.trim()) {
    const trimmed = baseSku.trim().toUpperCase();

    // Standard 3 letters + sep + 3 digits: ABC-123
    const stdMatch = trimmed.match(/^([A-Z]{3})([-_ ]?)(\d{3})$/);
    if (stdMatch && stdMatch[1] && stdMatch[3]) {
      const prefix = stdMatch[1];
      const sep = stdMatch[2] || "-";
      const numStr = stdMatch[3];
      const nextNum = (parseInt(numStr, 10) + 1) % 1000;
      candidate = `${prefix}${sep}${String(nextNum).padStart(3, "0")}`;
    } else {
      // General prefix + digits: e.g. XYZ-12
      const genMatch = trimmed.match(/^(.*?)([-_ ]?)(\d+)$/);
      if (genMatch && genMatch[1] && genMatch[3]) {
        const prefix = genMatch[1];
        const sep = genMatch[2] || "-";
        const numStr = genMatch[3];
        const nextNum = parseInt(numStr, 10) + 1;
        const padLen = Math.max(3, numStr.length);
        candidate = `${prefix}${sep}${String(nextNum).padStart(padLen, "0")}`;
      } else {
        candidate = `${trimmed}-${String(index + 1).padStart(3, "0")}`;
      }
    }
  } else {
    candidate = generateUniqueProductSku(existingSkus);
  }

  // Handle collision
  let count = 1;
  let finalSku = candidate;
  while (existingSet.has(finalSku.toUpperCase())) {
    count++;
    const stdMatch = candidate.match(/^([A-Z]{3})([-_ ]?)(\d{3})$/);
    if (stdMatch && stdMatch[1] && stdMatch[3]) {
      const nextNum = (parseInt(stdMatch[3], 10) + count - 1) % 1000;
      finalSku = `${stdMatch[1]}${stdMatch[2] || "-"}${String(nextNum).padStart(3, "0")}`;
    } else {
      finalSku = `${candidate}-${count}`;
    }
  }

  return finalSku;
}

/**
 * Check if a SKU matches standard 3-letter + 3-number format (e.g. ABC-123)
 */
export function isValidProductSkuFormat(sku: string | null | undefined): boolean {
  if (!sku) return false;
  return /^[A-Z]{3}-\d{3}$/.test(sku.trim().toUpperCase());
}
