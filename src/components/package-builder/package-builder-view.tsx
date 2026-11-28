"use client";

import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Download,
  RotateCcw,
  Plus,
  Trash2,
  FileText,
  Loader2,
  Save,
  Check,
  Pencil,
  X,
} from 'lucide-react';
import {
  defaultData,
  PAGES,
  uid,
  GOLD,
  PAGE_WIDTH,
  PAGE_HEIGHT,
  type BrochureData,
  type PageKey,
} from '@/lib/package-builder/brochure-defaults';
import { BrochurePage, buildPageList } from '@/components/package-builder/brochure-pages';
import {
  Field,
  TextInput,
  TextArea,
  ImageUpload,
  ListEditor,
} from '@/components/package-builder/editors';

const STORAGE_KEY = 'adn_brochure_v1';

const migrateSavedData = (saved: unknown): BrochureData => {
  const fresh = defaultData();
  if (!saved || typeof saved !== 'object') return fresh;

  const next = structuredClone(saved) as Partial<BrochureData>;
  const hasGalleryImages = Array.isArray(next.gallery) && next.gallery.some((g) => g?.img);

  if (!hasGalleryImages) {
    next.gallery = fresh.gallery;
  }

  return {
    ...fresh,
    ...next,
    itineraryHeading:
      typeof next.itineraryHeading === 'string' && next.itineraryHeading.trim()
        ? next.itineraryHeading
        : fresh.itineraryHeading || 'Day-wise Itinerary',
    cover: { ...fresh.cover, ...(next.cover || {}) },
    why: Array.isArray(next.why) && next.why.length ? next.why : fresh.why,
    days: Array.isArray(next.days) && next.days.length ? next.days : fresh.days,
    inclusions: Array.isArray(next.inclusions) && next.inclusions.length ? next.inclusions : fresh.inclusions,
    exclusions: Array.isArray(next.exclusions) && next.exclusions.length ? next.exclusions : fresh.exclusions,
    priceRows: Array.isArray(next.priceRows) && next.priceRows.length ? next.priceRows : fresh.priceRows,
    priceNotes: Array.isArray(next.priceNotes) && next.priceNotes.length ? next.priceNotes : fresh.priceNotes,
    gallery: Array.isArray(next.gallery) && next.gallery.length ? next.gallery : fresh.gallery,
    terms: Array.isArray(next.terms) && next.terms.length ? next.terms : fresh.terms,
    paymentCharges: Array.isArray(next.paymentCharges) && next.paymentCharges.length ? next.paymentCharges : fresh.paymentCharges,
    cancellation: Array.isArray(next.cancellation) && next.cancellation.length ? next.cancellation : fresh.cancellation,
    payment: { ...fresh.payment, ...(next.payment || {}) },
  };
};

export function PackageBuilderView() {
  const [data, setData] = useState<BrochureData>(defaultData);
  const [active, setActive] = useState<PageKey>('cover');
  const [activeDay, setActiveDay] = useState<number>(0);
  const [generating, setGenerating] = useState<boolean>(false);
  const [draftSaved, setDraftSaved] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(0.5);
  const previewWrap = useRef<HTMLDivElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);

  // Safe client-side hydration from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        setData(migrateSavedData(JSON.parse(raw)));
      }
    } catch {
      // ignore storage access errors
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
    setDraftSaved(false);
  }, [data]);

  // Responsive preview scaling
  useEffect(() => {
    const fit = () => {
      if (!previewWrap.current) return;
      const w = previewWrap.current.clientWidth - 48;
      setScale(Math.max(0.2, Math.min(1, w / PAGE_WIDTH)));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const set = (fn: (draft: BrochureData) => void) =>
    setData((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });

  const addDay = () => {
    set((d) => {
      const n = d.days.length + 1;
      d.days.push({
        id: uid(),
        dayNumber: n,
        title: `Day ${n}`,
        activities: [{ id: uid(), text: '' }],
        imgTop: null,
        imgBottom: null,
      });
    });
    setActive('days');
    setActiveDay(data.days.length);
  };

  const removeDay = (i: number) => {
    set((d) => {
      d.days.splice(i, 1);
    });
    setActiveDay((p) => Math.max(0, p - (i <= p ? 1 : 0)));
  };

  const reset = () => {
    if (!window.confirm('Clear all fields and start a new package?')) return;
    const fresh = defaultData();
    setData(fresh);
    setActive('cover');
    setActiveDay(0);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // ignore
    }
  };

  const saveDraft = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setDraftSaved(true);
    } catch {
      window.alert('Draft could not be saved. Browser storage may be full or unavailable.');
    }
  };

  const generatePDF = async () => {
    if (!exportRef.current) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 80));
    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
      const pages = Array.from(exportRef.current.querySelectorAll('.brochure-page')) as HTMLElement[];
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: PAGE_WIDTH,
          height: PAGE_HEIGHT,
          windowWidth: PAGE_WIDTH,
          windowHeight: PAGE_HEIGHT,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDocument) => {
            const exportRoot = clonedDocument.querySelector('[data-export-root]');
            const clonedPage = exportRoot?.querySelectorAll('.brochure-page')[i] as HTMLElement | undefined;
            if (clonedPage) {
              clonedPage.style.width = `${PAGE_WIDTH}px`;
              clonedPage.style.height = `${PAGE_HEIGHT}px`;
              clonedPage.style.transform = 'none';
            }
          },
        });
        const img = canvas.toDataURL('image/jpeg', 0.92);
        if (i > 0) pdf.addPage('a4', 'landscape');
        pdf.addImage(img, 'JPEG', 0, 0, 297, 210);
      }
      const name = (data.cover.destination || 'package').toString().toLowerCase().replace(/\s+/g, '-');
      pdf.save(`adn-${name}-tour-package.pdf`);
    } catch (e: any) {
      window.alert('PDF generation failed: ' + (e?.message || String(e)));
    } finally {
      setGenerating(false);
    }
  };

  const previewPage = active === 'days' ? 'day' : active;
  const pageList = buildPageList(data);

  return (
    <div className="flex h-[calc(100vh-5rem)] min-h-[720px] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
      {/* Top bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-md"
            style={{ background: GOLD }}
          >
            <FileText className="text-white" size={20} />
          </div>
          <div>
            <h1
              className="text-base font-bold text-slate-800"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              ADN Adventures
            </h1>
            <p className="text-xs text-slate-500">Tour Package PDF Generator</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={saveDraft}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {draftSaved ? <Check size={15} /> : <Save size={15} />}
            {draftSaved ? 'Draft Saved' : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <RotateCcw size={15} /> Start New
          </button>
          <button
            type="button"
            onClick={generatePDF}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-white shadow transition disabled:opacity-60"
            style={{ background: GOLD }}
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {generating ? 'Generating…' : 'Generate PDF'}
          </button>
        </div>
      </header>

      {/* Page nav */}
      <nav className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-white px-6 py-2">
        {PAGES.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setActive(p.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              active === p.key ? 'text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            style={active === p.key ? { background: GOLD } : {}}
          >
            {p.label}
          </button>
        ))}
      </nav>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Editor panel */}
        <aside className="w-[420px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-6">
          <Editor
            active={active}
            data={data}
            set={set}
            activeDay={activeDay}
            setActiveDay={setActiveDay}
            addDay={addDay}
            removeDay={removeDay}
          />
        </aside>

        {/* Live Preview */}
        <main ref={previewWrap} className="flex-1 overflow-auto bg-slate-200 p-6">
          <div className="mx-auto" style={{ width: PAGE_WIDTH * scale }}>
            <div className="mb-2 text-center text-xs font-medium text-slate-500">
              Live Preview · Landscape A4 · 297 × 210 mm
            </div>
            <div
              className="brochure-scale-wrap shadow-2xl"
              style={{ transform: `scale(${scale})`, height: PAGE_HEIGHT * scale }}
            >
              <BrochurePage page={previewPage} data={data} dayIndex={activeDay} />
            </div>
          </div>
        </main>
      </div>

      {/* Hidden full-size export container for PDF generation */}
      <div
        data-export-root
        style={{
          position: 'fixed',
          left: '-4000px',
          top: 0,
          width: PAGE_WIDTH,
          height: PAGE_HEIGHT,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <div ref={exportRef}>
          {pageList.map((p, i) => (
            <BrochurePage key={i} page={p.page} data={data} dayIndex={p.dayIndex || 0} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-4 border-b border-slate-200 pb-2 text-lg font-bold text-slate-800"
      style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
    >
      {children}
    </h2>
  );
}

function EditableItineraryTitle({
  value,
  onSave,
}: {
  value: string;
  onSave: (val: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!isEditing) {
      setDraft(value);
    }
  }, [value, isEditing]);

  const handleStart = () => {
    setDraft(value);
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmed = draft.trim();
    onSave(trimmed || 'Day-wise Itinerary');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="mb-4 border-b border-slate-200 pb-3">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Edit Itinerary Heading
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-800 focus:border-[#D4A94A] focus:outline-none focus:ring-1 focus:ring-[#D4A94A]"
            placeholder="e.g. Day-wise Itinerary"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSave}
            className="flex shrink-0 items-center gap-1 rounded bg-[#D4A94A] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
            title="Save heading"
          >
            <Check size={14} />
            <span>Save</span>
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex shrink-0 items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            title="Cancel"
          >
            <X size={14} />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-2">
      <h2
        className="text-lg font-bold text-slate-800"
        style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
      >
        {value || 'Day-wise Itinerary'}
      </h2>
      <button
        type="button"
        onClick={handleStart}
        className="flex items-center gap-1 rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-[#D4A94A]"
        title="Edit heading"
      >
        <Pencil size={15} />
      </button>
    </div>
  );
}

function EditableDayTitleHeading({
  value,
  onSave,
}: {
  value: string;
  onSave: (val: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!isEditing) {
      setDraft(value);
    }
  }, [value, isEditing]);

  const handleStart = () => {
    setDraft(value);
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmed = draft.trim();
    onSave(trimmed);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="mb-2 rounded-md border border-[#D4A94A]/40 bg-amber-50/40 p-2.5">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Edit Day Title / Heading
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-800 focus:border-[#D4A94A] focus:outline-none focus:ring-1 focus:ring-[#D4A94A]"
            placeholder="e.g. Day 1 - Arrival & Sightseeing"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSave}
            className="flex shrink-0 items-center gap-1 rounded bg-[#D4A94A] px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
            title="Save title"
          >
            <Check size={14} />
            <span>Save</span>
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex shrink-0 items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            title="Cancel"
          >
            <X size={14} />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-1.5 flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Day Title / Heading
      </span>
      <button
        type="button"
        onClick={handleStart}
        className="flex items-center gap-1 rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-[#D4A94A]"
        title="Edit Day Title"
      >
        <Pencil size={13} />
        <span className="text-[11px] font-medium text-slate-500">Edit</span>
      </button>
    </div>
  );
}

function Editor({
  active,
  data,
  set,
  activeDay,
  setActiveDay,
  addDay,
  removeDay,
}: {
  active: PageKey;
  data: BrochureData;
  set: (fn: (draft: BrochureData) => void) => void;
  activeDay: number;
  setActiveDay: (i: number) => void;
  addDay: () => void;
  removeDay: (i: number) => void;
}) {
  if (active === 'cover') {
    const c = data.cover;
    return (
      <div>
        <SectionTitle>Cover Page</SectionTitle>
        <ImageUpload
          label="Logo (top-left)"
          value={c.logo}
          onChange={(v) =>
            set((d) => {
              d.cover.logo = v;
            })
          }
        />
        <Field label="Destination Name">
          <TextInput
            value={c.destination}
            onChange={(e) =>
              set((d) => {
                d.cover.destination = e.target.value;
              })
            }
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nights">
            <TextInput
              type="number"
              value={c.nights}
              onChange={(e) =>
                set((d) => {
                  d.cover.nights = e.target.value;
                })
              }
            />
          </Field>
          <Field label="Days">
            <TextInput
              type="number"
              value={c.days}
              onChange={(e) =>
                set((d) => {
                  d.cover.days = e.target.value;
                })
              }
            />
          </Field>
        </div>
        <Field label="Tagline">
          <TextInput
            value={c.tagline}
            onChange={(e) =>
              set((d) => {
                d.cover.tagline = e.target.value;
              })
            }
          />
        </Field>
        <div className="mb-4">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <ImageUpload
              label="Cover Image 1 (Left)"
              value={c.img1}
              vertical
              onChange={(v) =>
                set((d) => {
                  d.cover.img1 = v;
                })
              }
            />
            <ImageUpload
              label="Cover Image 2 (Center)"
              value={c.img2}
              vertical
              onChange={(v) =>
                set((d) => {
                  d.cover.img2 = v;
                })
              }
            />
            <ImageUpload
              label="Cover Image 3 (Right)"
              value={c.img3}
              vertical
              onChange={(v) =>
                set((d) => {
                  d.cover.img3 = v;
                })
              }
            />
          </div>
        </div>
      </div>
    );
  }

  if (active === 'why') {
    return (
      <div>
        <SectionTitle>Why Travel With Us?</SectionTitle>
        {data.why.map((item, i) => (
          <div key={item.id} className="mb-4 rounded-md border border-slate-200 p-3">
            <div className="mb-2 text-xs font-bold" style={{ color: GOLD }}>
              Item {i + 1}
            </div>
            <Field label="Title">
              <TextInput
                value={item.title}
                onChange={(e) =>
                  set((d) => {
                    d.why[i].title = e.target.value;
                  })
                }
              />
            </Field>
            <Field label="Description">
              <TextArea
                rows={2}
                value={item.desc}
                onChange={(e) =>
                  set((d) => {
                    d.why[i].desc = e.target.value;
                  })
                }
              />
            </Field>
          </div>
        ))}
      </div>
    );
  }

  if (active === 'days') {
    const day = data.days[activeDay];
    return (
      <div>
        <EditableItineraryTitle
          value={data.itineraryHeading || 'Day-wise Itinerary'}
          onSave={(val) =>
            set((d) => {
              d.itineraryHeading = val;
            })
          }
        />
        <div className="mb-4 flex flex-wrap gap-1.5">
          {data.days.map((dd, i) => (
            <button
              key={dd.id}
              type="button"
              onClick={() => setActiveDay(i)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeDay === i ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={activeDay === i ? { background: GOLD } : {}}
            >
              {dd.title || `Day ${dd.dayNumber}`}
            </button>
          ))}
          <button
            type="button"
            onClick={addDay}
            className="flex items-center gap-1 rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-[#D4A94A]"
          >
            <Plus size={12} /> Add Day
          </button>
        </div>
        {day && (
          <>
            <div className="mb-3 flex items-center gap-2">
              {data.days.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDay(activeDay)}
                  className="mt-2 flex items-center gap-1 rounded-md border border-red-200 px-2 py-1.5 text-xs text-red-500 transition hover:bg-red-50"
                >
                  <Trash2 size={14} /> Remove Day
                </button>
              )}
            </div>
            <div className="mb-3.5">
              <EditableDayTitleHeading
                value={day.title || `Day ${day.dayNumber}`}
                onSave={(val) =>
                  set((d) => {
                    d.days[activeDay].title = val;
                  })
                }
              />
              <TextInput
                value={day.title || `Day ${day.dayNumber}`}
                placeholder="e.g. Day 1 - Sightseeing"
                onChange={(e) =>
                  set((d) => {
                    d.days[activeDay].title = e.target.value;
                  })
                }
              />
            </div>
            <ListEditor
              label="Activities / Places"
              items={day.activities}
              onChange={(v) =>
                set((d) => {
                  d.days[activeDay].activities = v;
                })
              }
              fields={[{ key: 'text', placeholder: 'e.g. Suicide Point' }]}
            />
            <ImageUpload
              label="Day Image 1 (Top Right)"
              value={day.imgTop}
              onChange={(v) =>
                set((d) => {
                  d.days[activeDay].imgTop = v;
                })
              }
            />
            <ImageUpload
              label="Day Image 2 (Bottom Right)"
              value={day.imgBottom}
              onChange={(v) =>
                set((d) => {
                  d.days[activeDay].imgBottom = v;
                })
              }
            />
          </>
        )}
      </div>
    );
  }

  if (active === 'incl') {
    return (
      <div>
        <SectionTitle>Inclusions & Exclusions</SectionTitle>
        <ListEditor
          label="Inclusions"
          items={data.inclusions}
          onChange={(v) =>
            set((d) => {
              d.inclusions = v;
            })
          }
        />
        <ListEditor
          label="Exclusions"
          items={data.exclusions}
          onChange={(v) =>
            set((d) => {
              d.exclusions = v;
            })
          }
        />
      </div>
    );
  }

  if (active === 'price') {
    return (
      <div>
        <SectionTitle>Price Chart</SectionTitle>
        <ListEditor
          label="Table Rows"
          items={data.priceRows}
          onChange={(v) =>
            set((d) => {
              d.priceRows = v;
            })
          }
          fields={[
            { key: 'persons', placeholder: 'Persons' },
            { key: 'rate', placeholder: 'Rate ₹' },
            { key: 'rooms', placeholder: 'Rooms' },
            { key: 'vehicle', placeholder: 'Vehicle' },
          ]}
          newItem={{ persons: '', rate: '', rooms: '', vehicle: '' }}
        />
      </div>
    );
  }

  if (active === 'gallery') {
    return (
      <div>
        <SectionTitle>Customer Gallery (up to 10)</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {data.gallery.map((g, i) => (
            <ImageUpload
              key={g.id}
              label={`Image ${i + 1}`}
              value={g.img}
              onChange={(v) =>
                set((d) => {
                  d.gallery[i].img = v;
                })
              }
            />
          ))}
        </div>
      </div>
    );
  }

  if (active === 'terms') {
    return (
      <div>
        <SectionTitle>Terms & Policies</SectionTitle>
        <Field label="Advance Payment %">
          <TextInput
            type="number"
            value={data.advancePct}
            onChange={(e) =>
              set((d) => {
                d.advancePct = e.target.value;
              })
            }
          />
        </Field>
        <ListEditor
          label="Terms"
          items={data.terms}
          onChange={(v) =>
            set((d) => {
              d.terms = v;
            })
          }
        />
        <ListEditor
          label="Payment Charges"
          items={data.paymentCharges}
          onChange={(v) =>
            set((d) => {
              d.paymentCharges = v;
            })
          }
          fields={[
            { key: 'window', placeholder: 'Payment window' },
            { key: 'charge', placeholder: 'Charge %' },
          ]}
          newItem={{ window: '', charge: '' }}
        />
      </div>
    );
  }

  if (active === 'cancel') {
    return (
      <div>
        <SectionTitle>Cancellation Policy</SectionTitle>
        <ListEditor
          label="Cancellation Rules"
          items={data.cancellation}
          onChange={(v) =>
            set((d) => {
              d.cancellation = v;
            })
          }
        />
        <ListEditor
          label="Price Notes"
          items={data.priceNotes}
          onChange={(v) =>
            set((d) => {
              d.priceNotes = v;
            })
          }
        />
      </div>
    );
  }

  if (active === 'payment') {
    const p = data.payment;
    const f = (k: keyof typeof p) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set((d) => {
        (d.payment as any)[k] = e.target.value;
      });
    return (
      <div>
        <SectionTitle>Payment Details</SectionTitle>
        <Field label="Bank Name">
          <TextInput value={p.bankName} onChange={f('bankName')} />
        </Field>
        <Field label="Account Name">
          <TextInput value={p.accountName} onChange={f('accountName')} />
        </Field>
        <Field label="Account Number">
          <TextInput value={p.accountNo} onChange={f('accountNo')} />
        </Field>
        <Field label="IFSC Code">
          <TextInput value={p.ifsc} onChange={f('ifsc')} />
        </Field>
        <Field label="Branch">
          <TextInput value={p.branch} onChange={f('branch')} />
        </Field>
        <Field label="Phone Number">
          <TextInput value={p.phone} onChange={f('phone')} />
        </Field>
        <Field label="UPI / GPay ID">
          <TextInput value={p.upi} onChange={f('upi')} />
        </Field>
        <ImageUpload
          label="QR Code Image"
          value={p.qr}
          onChange={(v) =>
            set((d) => {
              d.payment.qr = v;
            })
          }
        />
        <Field label="Google Review Rating (out of 5)">
          <TextInput type="number" step="0.1" max="5" value={p.rating} onChange={f('rating')} />
        </Field>
        <Field label="Testimonial Quote">
          <TextArea rows={3} value={p.testimonial} onChange={f('testimonial')} />
        </Field>
      </div>
    );
  }

  return null;
}
