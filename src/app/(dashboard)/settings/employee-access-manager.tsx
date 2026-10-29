"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import {
  createEmployee,
  setEmployeeDisabled,
  updateEmployeeModules,
  type EmployeeAccount,
} from "@/actions/employee-access";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { EMPLOYEE_MODULES, type ModuleKey } from "@/types/roles";

const MODULE_OPTIONS = EMPLOYEE_MODULES.map((id) => ({
  id,
  label: NAV_ITEMS.find((item) => item.module === id)?.label ?? id,
}));

function isSelected(modules: ModuleKey[], module: ModuleKey) {
  return modules.includes(module);
}

function toggleModule(modules: ModuleKey[], module: ModuleKey, checked: boolean) {
  return checked
    ? [...modules, module]
    : modules.filter((value) => value !== module);
}

function ModuleChoices({
  idPrefix,
  selected,
  onChange,
}: {
  idPrefix: string;
  selected: ModuleKey[];
  onChange: (modules: ModuleKey[]) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Sidebar modules</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {MODULE_OPTIONS.map(({ id, label }) => (
          <label key={id} htmlFor={`${idPrefix}-${id}`} className="flex items-center gap-2 text-sm">
            <input
              id={`${idPrefix}-${id}`}
              type="checkbox"
              checked={isSelected(selected, id)}
              onChange={(event) => onChange(toggleModule(selected, id, event.target.checked))}
              className="size-4 accent-primary"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function EmployeeRow({
  employee,
  onUpdate,
}: {
  employee: EmployeeAccount;
  onUpdate: (employee: EmployeeAccount) => void;
}) {
  const [selected, setSelected] = useState(employee.modules);
  const [pending, startTransition] = useTransition();

  function saveModules() {
    startTransition(async () => {
      const result = await updateEmployeeModules(employee.uid, selected);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onUpdate({ ...employee, modules: selected });
      toast.success(`Access updated for ${employee.name || employee.email}`);
    });
  }

  function changeStatus(enabled: boolean) {
    startTransition(async () => {
      const result = await setEmployeeDisabled(employee.uid, !enabled);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onUpdate({ ...employee, disabled: !enabled });
      toast.success(enabled ? "Employee account enabled" : "Employee account disabled");
    });
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">{employee.name || "Employee"}</p>
          <p className="text-muted-foreground text-sm">{employee.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`enabled-${employee.uid}`} className="text-sm">
            {employee.disabled ? "Disabled" : "Active"}
          </Label>
          <Switch
            id={`enabled-${employee.uid}`}
            checked={!employee.disabled}
            onCheckedChange={changeStatus}
            disabled={pending}
          />
        </div>
      </div>
      <ModuleChoices
        idPrefix={employee.uid}
        selected={selected}
        onChange={setSelected}
      />
      <Button
        type="button"
        variant="outline"
        onClick={saveModules}
        disabled={
          pending
          || selected.length === 0
          || (selected.length === employee.modules.length
            && selected.every((module) => employee.modules.includes(module)))
        }
      >
        {pending ? "Saving…" : "Save access"}
      </Button>
    </div>
  );
}

export function EmployeeAccessManager({
  initialEmployees,
}: {
  initialEmployees: EmployeeAccount[];
}) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [modules, setModules] = useState<ModuleKey[]>([]);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    startTransition(async () => {
      const result = await createEmployee({
        name: data.get("name"),
        email: data.get("email"),
        password: data.get("password"),
        modules,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setEmployees((current) => [...current, result.employee]);
      setModules([]);
      form.reset();
      toast.success("Employee account created");
    });
  }

  function replaceEmployee(updated: EmployeeAccount) {
    setEmployees((current) => current.map((employee) =>
      employee.uid === updated.uid ? updated : employee,
    ));
  }

  return (
    <section className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Employee access</CardTitle>
          <CardDescription>
            Create an employee login and choose which sidebar modules it can open.
            Settings stays available to admins only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employee-name">Employee name</Label>
                <Input id="employee-name" name="name" autoComplete="name" required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee-email">Email</Label>
                <Input id="employee-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="employee-password">Temporary password</Label>
                <Input
                  id="employee-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                />
                <p className="text-muted-foreground text-xs">
                  Share this password securely. The employee can use it on the existing login page.
                </p>
              </div>
            </div>
            <ModuleChoices idPrefix="new-employee" selected={modules} onChange={setModules} />
            <Button type="submit" disabled={pending || modules.length === 0}>
              {pending ? "Creating…" : "Create employee account"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employee accounts</CardTitle>
          <CardDescription>
            Access changes take effect immediately and require the employee to sign in again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {employees.length === 0 ? (
            <p className="text-muted-foreground text-sm">No employee accounts yet.</p>
          ) : (
            employees.map((employee) => (
              <EmployeeRow key={employee.uid} employee={employee} onUpdate={replaceEmployee} />
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
