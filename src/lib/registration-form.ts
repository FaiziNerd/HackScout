import { z } from "zod";

export const FORM_FIELD_TYPES = ["text", "email", "url", "textarea", "select"] as const;
export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

export type RegistrationFormField = {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
};

export const DEFAULT_REGISTRATION_FIELDS: RegistrationFormField[] = [
  { id: "fullName", label: "Full name", type: "text", required: true, placeholder: "Ayesha Khan" },
  { id: "email", label: "Email", type: "email", required: true, placeholder: "you@university.edu.pk" },
  {
    id: "university",
    label: "University / campus",
    type: "text",
    required: true,
    placeholder: "NUST SEECS",
  },
  { id: "teamName", label: "Team name", type: "text", required: false, placeholder: "Optional" },
  { id: "github", label: "GitHub profile", type: "url", required: false, placeholder: "https://github.com/…" },
];

const fieldSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  label: z.string().min(1).max(120),
  type: z.enum(FORM_FIELD_TYPES),
  required: z.boolean(),
  placeholder: z.string().max(160).optional(),
  options: z.array(z.string().min(1).max(80)).max(20).optional(),
});

export function parseFormFields(value: unknown): RegistrationFormField[] {
  if (!Array.isArray(value) || value.length === 0) {
    return DEFAULT_REGISTRATION_FIELDS;
  }

  const parsed: RegistrationFormField[] = [];
  for (const item of value.slice(0, 24)) {
    const result = fieldSchema.safeParse(item);
    if (!result.success) continue;
    parsed.push({
      ...result.data,
      options: result.data.type === "select" ? result.data.options?.filter(Boolean) : undefined,
    });
  }

  const hasEmail = parsed.some((field) => field.id === "email" && field.type === "email");
  const hasName = parsed.some((field) => field.id === "fullName");
  if (!hasEmail || !hasName) {
    return DEFAULT_REGISTRATION_FIELDS;
  }

  return parsed.map((field) =>
    field.id === "email" || field.id === "fullName" ? { ...field, required: true } : field,
  );
}

export function parseFormFieldsFromJson(raw: string | null | undefined): RegistrationFormField[] {
  if (!raw) return DEFAULT_REGISTRATION_FIELDS;
  try {
    return parseFormFields(JSON.parse(raw));
  } catch {
    return DEFAULT_REGISTRATION_FIELDS;
  }
}

export function validateRegistrationPayload(
  fields: RegistrationFormField[],
  body: Record<string, unknown>,
): { email: string; payload: Record<string, string> } {
  const payload: Record<string, string> = {};

  for (const field of fields) {
    const raw = body[field.id];
    const value = typeof raw === "string" ? raw.trim() : "";

    if (field.required && !value) {
      throw new Error(`${field.label} is required.`);
    }

    if (!value) continue;

    if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new Error(`Enter a valid ${field.label.toLowerCase()}.`);
    }

    if (field.type === "url") {
      try {
        new URL(value);
      } catch {
        throw new Error(`Enter a valid URL for ${field.label}.`);
      }
    }

    if (field.type === "select" && field.options?.length && !field.options.includes(value)) {
      throw new Error(`Choose a valid option for ${field.label}.`);
    }

    payload[field.id] = value.slice(0, 2000);
  }

  const email = (payload.email || "").toLowerCase();
  if (!email) {
    throw new Error("Email is required.");
  }

  return { email, payload };
}

export function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function registrationsToCsv(
  fields: RegistrationFormField[],
  rows: { email: string; createdAt: Date; payload: Record<string, string> }[],
) {
  const headers = ["submittedAt", ...fields.map((field) => field.id)];
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        csvEscape(row.createdAt.toISOString()),
        ...fields.map((field) => csvEscape(row.payload[field.id] ?? (field.id === "email" ? row.email : ""))),
      ].join(","),
    ),
  ];
  return lines.join("\n");
}
