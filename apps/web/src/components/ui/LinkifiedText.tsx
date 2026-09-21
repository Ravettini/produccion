import { Fragment } from "react";
import { cn } from "../../utils/cn";

const LINK_RE =
  /(https?:\/\/[^\s<]+|www\.[^\s<]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

function normalizeHref(raw: string): string {
  if (raw.includes("@") && !raw.includes("://") && !raw.startsWith("www.")) {
    return `mailto:${raw}`;
  }
  if (raw.startsWith("www.")) return `https://${raw}`;
  return raw;
}

function splitTrailingPunctuation(token: string): { url: string; trail: string } {
  const match = token.match(/^(.*?)([.,;:!?)}\]]+)$/);
  if (!match || !match[1]) return { url: token, trail: "" };
  return { url: match[1], trail: match[2] ?? "" };
}

function isLinkToken(token: string): boolean {
  return (
    /^https?:\/\//i.test(token) ||
    /^www\./i.test(token) ||
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(token)
  );
}

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

/** Texto plano con URLs y emails convertidos en links clickeables. */
export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  if (!text) return null;

  const parts = text.split(LINK_RE);

  return (
    <p className={cn("whitespace-pre-wrap leading-relaxed", className)}>
      {parts.map((part, i) => {
        if (!part) return null;
        if (!isLinkToken(part)) {
          return <Fragment key={i}>{part}</Fragment>;
        }
        const { url, trail } = splitTrailingPunctuation(part);
        if (!isLinkToken(url)) {
          return <Fragment key={i}>{part}</Fragment>;
        }
        const href = normalizeHref(url);
        const external = href.startsWith("http");
        return (
          <Fragment key={i}>
            <a
              href={href}
              className="text-brand-700 underline underline-offset-2 break-all hover:text-brand-800"
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {url}
            </a>
            {trail}
          </Fragment>
        );
      })}
    </p>
  );
}
