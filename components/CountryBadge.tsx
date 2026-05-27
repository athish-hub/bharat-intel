import Link from "next/link";
import { clsx } from "clsx";
import { COUNTRIES_BY_CODE } from "@/lib/countries";
import { STATUS_META } from "@/lib/types";

interface Props {
  code: string;
  /** If true, wrap in a link to /country/[code] */
  linked?: boolean;
  /** Visual size */
  size?: "sm" | "md" | "lg";
}

export default function CountryBadge({ code, linked = true, size = "md" }: Props) {
  const country = COUNTRIES_BY_CODE[code];
  if (!country) return null;

  const status = STATUS_META[country.status];

  const inner = (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 font-medium rounded-full border",
        size === "sm" && "text-xs px-2 py-0.5",
        size === "md" && "text-sm px-2.5 py-1",
        size === "lg" && "text-base px-3 py-1.5",
        status.badge,
        "border-transparent"
      )}
    >
      <span>{country.flag}</span>
      <span>{country.name}</span>
    </span>
  );

  if (!linked) return inner;

  return (
    <Link href={`/country/${code}`} className="hover:opacity-80 transition-opacity">
      {inner}
    </Link>
  );
}
