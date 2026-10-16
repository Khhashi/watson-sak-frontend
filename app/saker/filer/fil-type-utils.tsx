import { FileIcon, FileImageIcon, FilePdfIcon, FileWordIcon } from "@navikt/aksel-icons";
import type { ComponentType, SVGProps } from "react";

type FilIkon = ComponentType<SVGProps<SVGSVGElement>>;

/** Filendelser backend godtar ved opplasting av vedlegg. Brukes som `accept` på filvelgere. */
export const TILLATTE_FILTYPER = ".pdf,.png,.jpg,.jpeg,.docx,.xlsx";

const WORD_CONTENT_TYPES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/** Content types backend kan journalføre som vedlegg (Dokarkiv godtar PDF og XLSX som arkivvariant). */
export const JOURNALFØRBARE_CONTENT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

/** Ikon som representerer en opplastet fils type, basert på `contentType`. */
export function filTypeIkon(contentType: string): FilIkon {
  if (contentType === "application/pdf") return FilePdfIcon;
  if (contentType.startsWith("image/")) return FileImageIcon;
  if (WORD_CONTENT_TYPES.includes(contentType)) return FileWordIcon;
  return FileIcon;
}

/** Kort norsk typetekst for en opplastet fil, basert på `contentType`. */
export function filTypeTekst(contentType: string): string {
  if (contentType === "application/pdf") return "PDF";
  if (contentType.startsWith("image/")) return "Bilde";
  if (WORD_CONTENT_TYPES.includes(contentType)) return "Word";
  return "Fil";
}
