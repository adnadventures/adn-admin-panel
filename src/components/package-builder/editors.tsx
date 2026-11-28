"use client";

import React, { useRef } from 'react';
import { X, Plus, Upload, Trash2 } from 'lucide-react';
import { uid } from '@/lib/package-builder/brochure-defaults';

const readFile = (file: File | undefined, cb: (dataUrl: string) => void) => {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    if (typeof r.result === 'string') {
      cb(r.result);
    }
  };
  r.readAsDataURL(file);
};

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#D4A94A] focus:outline-none focus:ring-1 focus:ring-[#D4A94A] ${
        props.className || ''
      }`}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#D4A94A] focus:outline-none focus:ring-1 focus:ring-[#D4A94A] ${
        props.className || ''
      }`}
    />
  );
}

export function ImageUpload({
  label,
  value,
  onChange,
  vertical = false,
  className = '',
}: {
  label: string;
  value: string | null;
  onChange: (val: string | null) => void;
  vertical?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (ref.current) {
      ref.current.value = '';
    }
    onChange(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFile(file, onChange);
    }
  };

  if (vertical) {
    return (
      <div className={`flex flex-col min-w-0 ${className}`}>
        <span className="mb-1.5 flex min-h-[30px] items-end text-[11px] font-semibold uppercase tracking-wide text-slate-500 leading-tight">
          {label}
        </span>
        <div
          onClick={() => ref.current?.click()}
          className="group relative h-24 w-full cursor-pointer overflow-hidden rounded-md border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-[#D4A94A]"
          title={value ? "Click to change image" : "Click to upload image"}
        >
          {value ? (
            <img src={value} alt={label} className="h-full w-full object-cover transition group-hover:opacity-90" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-slate-400 group-hover:text-[#D4A94A]">
              <Upload size={18} />
              <span className="mt-1 text-[10px] font-medium">Upload</span>
            </div>
          )}
        </div>
        {value && (
          <button
            type="button"
            onClick={handleRemove}
            className="mt-1.5 flex w-full items-center justify-center gap-1 rounded border border-red-200 bg-red-50/80 px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100 hover:text-red-700"
            title="Remove image"
          >
            <Trash2 size={13} className="shrink-0" />
            <span>Remove</span>
          </button>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/jpg"
          hidden
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div className={`mb-3 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <div className="mt-1 flex items-center gap-3">
        <div
          onClick={() => ref.current?.click()}
          className="group relative h-20 w-28 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-[#D4A94A]"
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-slate-400 group-hover:text-[#D4A94A]">
              <Upload size={18} />
              <span className="text-[10px]">Upload</span>
            </div>
          )}
        </div>
        {value && (
          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 hover:text-red-700 shadow-sm"
            title="Remove image"
          >
            <Trash2 size={13} className="shrink-0" />
            <span>Remove</span>
          </button>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/jpg"
          hidden
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

export type ListFieldSpec = {
  key: string;
  placeholder: string;
};

export function ListEditor<T extends { id: string } & Record<string, any>>({
  label,
  items,
  onChange,
  fields = [{ key: 'text', placeholder: 'Item' }],
  newItem,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  fields?: ListFieldSpec[];
  newItem?: Record<string, string>;
}) {
  const update = (id: string, key: string, val: string) =>
    onChange(items.map((it) => (it.id === id ? { ...it, [key]: val } : it)));

  const remove = (id: string) => onChange(items.filter((it) => it.id !== id));

  const add = () =>
    onChange([...items, { id: uid(), ...(newItem || { text: '' }) } as unknown as T]);

  return (
    <div className="mb-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <div className="mt-1 space-y-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-2">
            {fields.map((f) => (
              <input
                key={f.key}
                value={it[f.key] ?? ''}
                placeholder={f.placeholder}
                onChange={(e) => update(it.id, f.key, e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-[#D4A94A] focus:outline-none"
              />
            ))}
            <button
              type="button"
              onClick={() => remove(it.id)}
              className="shrink-0 text-slate-400 hover:text-red-500"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 flex items-center gap-1 text-sm font-medium text-[#7A2E3A] hover:underline"
      >
        <Plus size={14} /> Add Item
      </button>
    </div>
  );
}
