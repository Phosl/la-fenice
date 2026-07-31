type JsonLdPrimitive = boolean | null | number | string;

export type JsonLdValue =
  | JsonLdPrimitive
  | readonly JsonLdValue[]
  | { readonly [key: string]: JsonLdValue | undefined };

interface JsonLdProps {
  data: JsonLdValue;
  id?: string;
}

/**
 * Renders server-owned structured data and escapes opening angle brackets so
 * user-provided copy cannot terminate the script element.
 */
export function JsonLd({ data, id }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      dangerouslySetInnerHTML={{ __html: json }}
      id={id}
      type="application/ld+json"
    />
  );
}
