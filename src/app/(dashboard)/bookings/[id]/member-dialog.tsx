"use client";
import { useRef, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { addMember, updateMember } from "@/actions/members";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABEL, GENDER_LABEL } from "@/lib/booking-utils";
import { CURRENCIES, formatMoney, fromMinor, toMinor } from "@/lib/finance/currency";
import {
  CATEGORIES, GENDERS, memberInputSchema, type MemberInput,
} from "@/lib/validators/booking";
import type { AgeCategory, Booking, Member } from "@/types/models";

const selectClass = "border-input bg-background h-9 w-full rounded-md border px-2 text-sm";
const msg = (m?: string) => (m && /expected|nan/i.test(m) ? "Enter a valid number" : m);
const Err = ({ m }: { m?: string }) => (m ? <p className="text-destructive text-xs">{msg(m)}</p> : null);

type Source = { id: string; name: string };

export function MemberDialog({
  open, onOpenChange, booking, sources, member,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  booking: Booking;
  sources: Source[];
  member: Member | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{member ? "Edit member" : "Add member"}</DialogTitle>
        </DialogHeader>
        {open && (
          <MemberForm
            key={member?.id ?? "new"}
            booking={booking}
            sources={sources}
            member={member}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function MemberForm({
  booking, sources, member, onDone,
}: { booking: Booking; sources: Source[]; member: Member | null; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const another = useRef(false);
  const prevCategory = useRef<AgeCategory>(member?.category ?? "adult");

  const blank = (sourceId = ""): MemberInput => ({
    name: "", gender: "male", category: "adult", age: "", phone: "",
    sourceId, price: fromMinor(booking.rates.adult), note: "",
  });

  const {
    register, control, handleSubmit, reset, setValue, getValues, setFocus,
    formState: { errors },
  } = useForm<MemberInput>({
    resolver: zodResolver(memberInputSchema),
    defaultValues: member
      ? {
          name: member.name, gender: member.gender, category: member.category,
          age: member.age === null ? "" : String(member.age), phone: member.phone,
          sourceId: member.sourceId, price: fromMinor(member.price), note: member.note,
        }
      : blank(sources.length === 1 ? sources[0].id : ""),
  });

  const category = useWatch({ control, name: "category" });
  const price = useWatch({ control, name: "price" });
  const standard = booking.rates[category];
  const custom = Number.isFinite(price) && toMinor(price) !== standard;
  const symbol = CURRENCIES[booking.currency].symbol;

  // Switching category swaps the price to that category's rate, unless the price was customised
  function onCategoryChange(next: AgeCategory) {
    const current = toMinor(Number(getValues("price")));
    if (current === booking.rates[prevCategory.current]) setValue("price", fromMinor(booking.rates[next]));
    prevCategory.current = next;
  }

  function onSubmit(v: MemberInput) {
    startTransition(async () => {
      const res = member
        ? await updateMember(booking.id, member.id, v)
        : await addMember(booking.id, v);
      const keepOpen = another.current;
      another.current = false;

      if (!res.ok) { toast.error(res.error); return; }
      toast.success(member ? "Member updated" : `${v.name} added`);
      if (keepOpen) {
        prevCategory.current = "adult";
        reset(blank(v.sourceId));
        setFocus("name");
      } else {
        onDone();
      }
    });
  }

  const hasOldSource = member && !sources.some((s) => s.id === member.sourceId);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mname">Full name</Label>
        <Input id="mname" autoFocus autoComplete="off" {...register("name")} />
        <Err m={errors.name?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="mgender">Gender</Label>
          <select id="mgender" className={selectClass} {...register("gender")}>
            {GENDERS.map((g) => <option key={g} value={g}>{GENDER_LABEL[g]}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mcat">Category</Label>
          <select
            id="mcat" className={selectClass}
            {...register("category", { onChange: (e) => onCategoryChange(e.target.value as AgeCategory) })}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mage">Age (optional)</Label>
          <Input id="mage" inputMode="numeric" {...register("age")} />
          <Err m={errors.age?.message} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mphone">Phone (optional)</Label>
          <Input id="mphone" type="tel" {...register("phone")} />
          <Err m={errors.phone?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="msource">Order source</Label>
          <select id="msource" className={selectClass} {...register("sourceId")}>
            <option value="">Select source</option>
            {hasOldSource && <option value={member!.sourceId}>{member!.sourceName} (inactive)</option>}
            {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <Err m={errors.sourceId?.message} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mprice">Price ({symbol})</Label>
        <Input id="mprice" type="number" step="0.01" min={0} {...register("price", { valueAsNumber: true })} />
        <p className="text-muted-foreground text-xs">
          Standard {CATEGORY_LABEL[category].toLowerCase()} rate: {formatMoney(standard, booking.currency)}
          {custom && <span className="text-foreground font-medium"> · custom price</span>}
        </p>
        <Err m={errors.price?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mnote">Note (optional)</Label>
        <Textarea id="mnote" rows={2} {...register("note")} />
        <Err m={errors.note?.message} />
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>Cancel</Button>
        {!member && (
          <Button
            type="submit" variant="outline" disabled={pending}
            onClick={() => { another.current = true; }}
          >
            Save &amp; add another
          </Button>
        )}
        <Button type="submit" disabled={pending} onClick={() => { another.current = false; }}>
          {pending ? "Saving…" : member ? "Save changes" : "Save member"}
        </Button>
      </div>
    </form>
  );
}