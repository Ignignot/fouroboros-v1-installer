// SPDX-License-Identifier: GPL-3.0-only
//
// FOUROBOROS V1 installer — the release gates. Pure checks, shared by the page
// (index.html) and the test harness (test_installer.mjs): nothing reaches the
// update engine (../web/fm1ota.js) unless it passes here first.
//
// - the install package must be the exact FOUROBOROS V1 release bytes
//   (size + SHA-256 + package identity), never just "a .fwsc";
// - the install runs from the official V15 base (device identity FM-1_015),
//   or finishes an interrupted install already sitting in our own loader;
// - the restore file must be the exact official V15, byte for byte; the
//   newer V16 is refused on purpose (unproven as a return target for V1).

import {
  productOf, logicalImage, sha256hex, validateStockPackage,
  STOCK_V15_SHA256, STOCK_V15_SIZE, STOCK_V15_PRODUCT,
} from "../web/fm1pkg.js";

export { STOCK_V15_SHA256, STOCK_V15_SIZE, STOCK_V15_PRODUCT };

export const RELEASE = {
  name: "FOUROBOROS V1",
  commit: "04d0e620485dcb1dc90c644ee17268d7241cdad8",
  pkgFile: "felucca-04d0e62.fwsc",
  pkgSha256: "4bdc3e2cd6099a712c822e5a59419d69703721b23b8e8a2af597e621edd935c3",
  pkgSize: 609912,
  product: "FM-1_900",          // the identity the device reports after install
  requiresIdentity: "FM-1_015", // the only running identity Install starts from
};

export const STOCK = {
  version: "official FM-1 V15",
  fileName: "FM-1.fwsc",
  product: STOCK_V15_PRODUCT,
  size: STOCK_V15_SIZE,
  sha256: STOCK_V15_SHA256,
  downloadPage: "https://www.m-vave.com/download",
  sourcePage: "https://github.com/m-vave/fm1_open/blob/b178ac43c25f010c60a878056fb5331fe693fd62/sdk/firmware/FM-1_015.fwsc",
  sourceRaw: "https://raw.githubusercontent.com/m-vave/fm1_open/b178ac43c25f010c60a878056fb5331fe693fd62/sdk/firmware/FM-1_015.fwsc",
};

/* Recorded future-compatibility context only — never a restore target. */
export const V16_CONTEXT = {
  product: "FM-1_016",
  size: 718196,
  sha256: "d017fb65e70aca97ee29d944470c3515a74581df5c0576bf70de917c7b2b61d5",
};

/* The exact release package, or nothing. Returns { ok, product, image } or
 * { ok: false, code, message } with a plain-language reason. */
export async function verifyReleasePackage(bytes) {
  if (!bytes || bytes.length !== RELEASE.pkgSize)
    return { ok: false, code: "size", message: `wrong size (${bytes ? bytes.length : 0} bytes, expected ${RELEASE.pkgSize})` };
  let product = null;
  try { product = productOf(bytes); } catch (_) { /* too short / not a package */ }
  if (product !== RELEASE.product)
    return { ok: false, code: "product", message: `not the FOUROBOROS V1 package (identity ${product || "unreadable"}, expected ${RELEASE.product})` };
  const hash = await sha256hex(bytes);
  if (hash !== RELEASE.pkgSha256)
    return { ok: false, code: "hash", message: `checksum mismatch (sha256 ${hash})` };
  return { ok: true, product, image: logicalImage(bytes), sha256: hash };
}

/* True when the bytes look like the official V16 package (identity + size),
 * so the page can refuse it with the specific explanation, not a generic one. */
export function looksLikeV16(bytes) {
  if (!bytes || bytes.length !== V16_CONTEXT.size) return false;
  try { return productOf(bytes) === V16_CONTEXT.product; } catch (_) { return false; }
}

/* The restore gate: the exact official V15, byte for byte (the fm1pkg.js
 * validation: size + SHA-256 + identity). V16 gets its own refusal. */
export async function validateRestoreFile(bytes) {
  if (looksLikeV16(bytes))
    return { ok: false, code: "v16", message: "that is the official V16. V16 is unproven as a way back for FOUROBOROS V1, so this page restores the official V15 only." };
  try {
    const v = await validateStockPackage(bytes);
    return { ok: true, product: v.product, image: v.image };
  } catch (e) {
    return { ok: false, code: "notstock", message: e.message };
  }
}

/* What the page may do with what the handshake found.
 * found: null, or { ota: boolean, id: { text, model, version } } — ota means
 * the device is sitting in an update loader rather than running firmware.
 * Returns one of:
 *   none          nothing answered the handshake
 *   ready         running FM-1_015: Install may start
 *   resume        our own loader (ota-FM-1_9xx): Install finishes the write
 *   foreign       another firmware's loader: never written by this page
 *   normalize     any other running identity (older/newer stock, or
 *                 FOUROBOROS itself): stop, put official V15 on first      */
export function classifyDevice(found) {
  if (!found) return { state: "none" };
  const text = found.id && found.id.text ? found.id.text : "";
  if (found.ota) {
    return /^ota-FM-1_9\d\d$/i.test(text)
      ? { state: "resume", identity: text }
      : { state: "foreign", identity: text };
  }
  if (text === RELEASE.requiresIdentity) return { state: "ready", identity: text };
  return { state: "normalize", identity: text };
}
