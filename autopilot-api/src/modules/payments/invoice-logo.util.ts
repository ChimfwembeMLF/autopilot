import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/** Matches Logo.tsx (`h-24` → 96px). */
export const INVOICE_LOGO_HEIGHT_PX = 96;

/** Intrinsic size of public/mako-logo.png */
const LOGO_WIDTH = 677;
const LOGO_HEIGHT = 369;

export function invoiceLogoWidth(height = INVOICE_LOGO_HEIGHT_PX): number {
  return height * (LOGO_WIDTH / LOGO_HEIGHT);
}

const LOGO_FILENAME = 'mako-logo.png';

function logoCandidates(): string[] {
  return [
    join(process.cwd(), 'public', LOGO_FILENAME),
    join(__dirname, '..', '..', '..', 'public', LOGO_FILENAME),
    join(__dirname, 'assets', LOGO_FILENAME),
  ];
}

export function resolveInvoiceLogoPath(): string | null {
  for (const candidate of logoCandidates()) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export function getInvoiceLogoDataUri(): string | null {
  const logoPath = resolveInvoiceLogoPath();
  if (!logoPath) return null;
  const buffer = readFileSync(logoPath);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

export function renderInvoiceLogoHtml(): string {
  const dataUri = getInvoiceLogoDataUri();
  if (!dataUri) {
    return `<div class="brand-logo-fallback" aria-hidden="true">Mako</div>`;
  }
  return `<img src="${dataUri}" alt="Mako" class="brand-logo" />`;
}
