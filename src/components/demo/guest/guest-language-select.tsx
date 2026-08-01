"use client";

import type { DemoLocale } from "@/lib/demo-portal";

import { guestDemoCopy, guestDemoLocales, isGuestDemoLocale } from "./copy";

type GuestLanguageSelectProps = {
  className: string;
  locale: DemoLocale;
  onChange: (locale: DemoLocale) => void;
};

export function GuestLanguageSelect({
  className,
  locale,
  onChange,
}: GuestLanguageSelectProps) {
  const label = guestDemoCopy[locale].login.languageLabel;

  return (
    <label className={className}>
      <span>{label}</span>
      <select
        aria-label={label}
        onChange={(event) => {
          if (isGuestDemoLocale(event.target.value)) onChange(event.target.value);
        }}
        value={locale}
      >
        {guestDemoLocales.map((optionLocale) => (
          <option key={optionLocale} value={optionLocale}>
            {guestDemoCopy[optionLocale].languageName}
          </option>
        ))}
      </select>
    </label>
  );
}
