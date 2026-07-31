import type { SVGProps } from "react";

type PhoenixMarkProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

/**
 * A lightweight line-art interpretation of the historic La Fenice mark.
 * It deliberately keeps the bird, fan-tail and hanging amulets while
 * remaining readable at navigation and favicon sizes.
 */
export function PhoenixMark({ title, className = "", ...props }: PhoenixMarkProps) {
  const labelled = Boolean(title);

  return (
    <svg
      aria-hidden={labelled ? undefined : true}
      aria-label={title}
      className={`phoenix-mark ${className}`}
      fill="none"
      role={labelled ? "img" : undefined}
      viewBox="0 0 240 150"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g className="phoenix-mark__drawing" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M151 38c11-17 29-21 40-11 7 7 5 17-4 21 11 1 18 6 21 14-12 1-22-1-30-7-2 24-12 42-31 53-23 13-57 8-71-14 12-1 22-4 31-9-20-5-37-16-50-34 31-5 62-1 94 12" />
        <path d="M77 78c24-23 53-28 84-13-8 24-27 38-56 40" />
        <path d="M94 77c16-8 32-8 49-1-11 9-23 15-38 18" />
        <path d="M104 63c-12-11-24-19-37-24-3 12-1 23 5 34" />
        <path d="M86 58c-14-16-30-25-49-28 0 17 8 32 24 45" />
        <path d="M67 65C48 53 29 49 12 53c7 17 22 29 44 35" />
        <path d="M57 88c-17-4-31-2-43 7 13 12 30 16 51 11" />
        <path d="M187 36c4-1 8 0 11 2" />
        <circle cx="181" cy="37" fill="currentColor" r="1.8" stroke="none" />
        <path d="M130 105c-2 8-1 15 3 22m21-27c1 10 5 18 12 24" />
        <path d="M121 127h23m35-3h-26" />
        <path d="M86 102c-1 12-5 22-12 31m29-28c0 14 3 25 9 34m58-37c4 12 10 21 19 28" />
        <path d="M68 134l6-8 6 8-6 8-6-8Zm37 6 7-10 7 10-7 7-7-7Zm77-8 7-8 7 8-7 8-7-8Z" />
        <path d="M23 52c2-5 6-7 11-8m-9 57c4-3 9-4 14-3m4-63c2 5 5 8 10 10" />
        <circle cx="24" cy="54" r="3" />
        <circle cx="25" cy="101" r="3" />
        <circle cx="44" cy="35" r="3" />
        <path d="M164 47c-4 6-5 12-3 19m9-17c-3 8-3 15 0 22" />
      </g>
    </svg>
  );
}
