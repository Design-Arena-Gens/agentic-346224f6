'use client';

import { FormEvent, useState } from "react";

type TagInputProps = {
  label: string;
  helper?: string;
  placeholder?: string;
  name: string;
  tags: string[];
  onChange(tags: string[]): void;
};

export function TagInput({ label, helper, placeholder, name, tags, onChange }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || tags.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...tags, trimmed]);
    setDraft("");
  };

  const removeTag = (value: string) => {
    onChange(tags.filter((tag) => tag !== value));
  };

  return (
    <div className="form-row">
      <label className="form-label" htmlFor={`${name}-input`}>
        {label}
      </label>
      <div className="tag-input">
        {tags.map((tag) => (
          <span key={tag} className="tag-chip">
            <span>{tag}</span>
            <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`}>
              ✕
            </button>
            <input type="hidden" name={`${name}[]`} value={tag} />
          </span>
        ))}
        <form onSubmit={handleSubmit} style={{ display: "inline-flex", flexGrow: 1 }}>
          <input
            id={`${name}-input`}
            className="form-control"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={placeholder ?? "Add a tag and press Enter"}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
        </form>
      </div>
      {helper ? <p className="form-helper">{helper}</p> : null}
    </div>
  );
}
