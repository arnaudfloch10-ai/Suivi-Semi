// Partage sans backend : on encode réglages + journal dans le fragment (#) de
// l'URL. Le fragment n'est jamais envoyé au serveur → rien ne transite par le
// réseau. Compression gzip si disponible, sinon base64 simple.

import {
  construireSauvegarde,
  validerSauvegarde,
  type Sauvegarde,
} from "../store/storage";
import type { Entree, Reglages } from "../data/types";

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream("gzip");
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(cs);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("gzip");
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Réglages + journal → charge utile pour un lien (préfixe : g=gzip, r=brut). */
export async function encoderPartage(reglages: Reglages, journal: Entree[]): Promise<string> {
  const json = JSON.stringify(construireSauvegarde(reglages, journal));
  const bytes = new TextEncoder().encode(json);
  if (typeof CompressionStream !== "undefined") {
    try {
      return "g" + bytesToB64url(await gzip(bytes));
    } catch {
      /* repli non compressé */
    }
  }
  return "r" + bytesToB64url(bytes);
}

/** Charge utile d'un lien → sauvegarde validée. */
export async function decoderPartage(payload: string): Promise<Sauvegarde> {
  const tag = payload[0];
  let bytes = b64urlToBytes(payload.slice(1));
  if (tag === "g") bytes = await gunzip(bytes);
  const json = new TextDecoder().decode(bytes);
  return validerSauvegarde(JSON.parse(json));
}

/** Construit le lien coach complet à partir de la charge utile. */
export function lienCoach(payload: string): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#c=${payload}`;
}

/** Lit la charge utile coach dans l'URL courante, ou null. */
export function payloadDansUrl(): string | null {
  const m = window.location.hash.match(/[#&]c=([^&]+)/);
  return m ? m[1] : null;
}
