"use client";

import { Minus, Plus, Trash } from "@phosphor-icons/react";

import { Input } from "@/components/ui/input";
import {
  DEFAULT_REGISTRATION_FIELDS,
  FORM_FIELD_TYPES,
  type FormFieldType,
  type RegistrationFormField,
} from "@/lib/registration-form";

const labelClass =
  "block font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-foreground";
const fieldClass =
  "h-11 rounded-none border-2 border-foreground bg-card px-3 text-sm focus-visible:border-primary focus-visible:ring-0";
const selectClass =
  "h-11 w-full rounded-none border-2 border-foreground bg-card px-3 text-sm outline-none focus:border-primary";

const TYPE_LABELS: Record<FormFieldType, string> = {
  text: "Short text",
  email: "Email",
  url: "URL",
  textarea: "Long answer",
  select: "Dropdown",
};

function newField(): RegistrationFormField {
  return {
    id: `q_${crypto.randomUUID().replaceAll("-", "").slice(0, 10)}`,
    label: "Custom question",
    type: "text",
    required: false,
    placeholder: "",
  };
}

interface FormFieldBuilderProps {
  fields: RegistrationFormField[];
  onChange: (fields: RegistrationFormField[]) => void;
}

export function FormFieldBuilder({ fields, onChange }: FormFieldBuilderProps) {
  function update(index: number, patch: Partial<RegistrationFormField>) {
    onChange(fields.map((field, i) => (i === index ? { ...field, ...patch } : field)));
  }

  return (
    <div className="space-y-3">
      {fields.map((field, index) => {
        const locked = field.id === "email" || field.id === "fullName";
        return (
          <div key={field.id} className="border-2 border-foreground bg-background p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_8.5rem_auto] sm:items-end">
              <div>
                <label className={labelClass} htmlFor={`field-label-${field.id}`}>
                  Question
                </label>
                <Input
                  id={`field-label-${field.id}`}
                  value={field.label}
                  onChange={(event) => update(index, { label: event.target.value })}
                  className={`mt-2 ${fieldClass}`}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor={`field-type-${field.id}`}>
                  Type
                </label>
                <select
                  id={`field-type-${field.id}`}
                  value={field.type}
                  disabled={locked}
                  onChange={(event) =>
                    update(index, { type: event.target.value as FormFieldType })
                  }
                  className={`mt-2 ${selectClass} disabled:opacity-60`}
                >
                  {FORM_FIELD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex min-h-11 items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={field.required}
                    disabled={locked}
                    onChange={(event) => update(index, { required: event.target.checked })}
                    className="size-4 accent-primary"
                  />
                  Required
                </label>
                {!locked ? (
                  <button
                    type="button"
                    aria-label={`Remove ${field.label}`}
                    onClick={() => onChange(fields.filter((_, i) => i !== index))}
                    className="grid size-11 place-items-center border-2 border-foreground hover:bg-destructive hover:text-white"
                  >
                    <Trash className="size-4" />
                  </button>
                ) : null}
              </div>
            </div>
            {field.type === "select" ? (
              <div className="mt-3">
                <label className={labelClass} htmlFor={`field-options-${field.id}`}>
                  Options (comma separated)
                </label>
                <Input
                  id={`field-options-${field.id}`}
                  value={(field.options ?? []).join(", ")}
                  onChange={(event) =>
                    update(index, {
                      options: event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Beginner, Intermediate, Advanced"
                  className={`mt-2 ${fieldClass}`}
                />
              </div>
            ) : (
              <div className="mt-3">
                <label className={labelClass} htmlFor={`field-placeholder-${field.id}`}>
                  Hint
                </label>
                <Input
                  id={`field-placeholder-${field.id}`}
                  value={field.placeholder ?? ""}
                  onChange={(event) => update(index, { placeholder: event.target.value })}
                  className={`mt-2 ${fieldClass}`}
                />
              </div>
            )}
          </div>
        );
      })}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange([...fields, newField()])}
          className="inline-flex min-h-11 items-center gap-2 border-2 border-foreground px-4 text-[10px] font-semibold uppercase tracking-[0.12em] hover:bg-foreground hover:text-background"
        >
          <Plus className="size-4" />
          Add question
        </button>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_REGISTRATION_FIELDS)}
          className="inline-flex min-h-11 items-center gap-2 border border-foreground px-4 text-[10px] font-semibold uppercase tracking-[0.12em] hover:bg-muted"
        >
          <Minus className="size-4" />
          Reset defaults
        </button>
      </div>
    </div>
  );
}
