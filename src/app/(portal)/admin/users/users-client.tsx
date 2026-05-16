"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

type Role = "EMPLOYEE" | "MANAGER" | "ADMIN";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  managerId: string | null;
  manager: { id: string; name: string } | null;
}

const ROLE_BADGE: Record<Role, "default" | "secondary" | "outline"> = {
  ADMIN: "default",
  MANAGER: "secondary",
  EMPLOYEE: "outline",
};

export function UsersClient({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [managerEdit, setManagerEdit] = useState<string | null>(null);

  async function handleRoleChange(user: UserRow, newRole: Role) {
    setSavingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) { alert("Failed to update role"); return; }
      const updated: UserRow = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    } finally {
      setSavingId(null);
    }
  }

  async function handleManagerChange(user: UserRow, newManagerId: string | null) {
    setSavingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId: newManagerId }),
      });
      if (!res.ok) { alert("Failed to update manager"); return; }
      const updated: UserRow = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      setManagerEdit(null);
    } finally {
      setSavingId(null);
    }
  }

  const managers = users.filter((u) => u.role === "MANAGER" || u.role === "ADMIN");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Users</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Manager</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={ROLE_BADGE[user.role]}>{user.role}</Badge>
                      {user.role !== "ADMIN" && (
                        <Button
                          size="xs"
                          variant="ghost"
                          disabled={savingId === user.id}
                          onClick={() =>
                            handleRoleChange(
                              user,
                              user.role === "EMPLOYEE" ? "MANAGER" : "EMPLOYEE"
                            )
                          }
                        >
                          {savingId === user.id
                            ? "..."
                            : user.role === "EMPLOYEE"
                            ? "→ Manager"
                            : "→ Employee"}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.department ?? "—"}
                  </TableCell>
                  <TableCell>
                    {managerEdit === user.id ? (
                      <div className="flex items-center gap-1.5">
                        <select
                          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                          defaultValue={user.managerId ?? ""}
                          onChange={(e) =>
                            handleManagerChange(user, e.target.value || null)
                          }
                        >
                          <option value="">— None —</option>
                          {managers
                            .filter((m) => m.id !== user.id)
                            .map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                        </select>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setManagerEdit(null)}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <button
                        className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                        onClick={() => setManagerEdit(user.id)}
                      >
                        {user.manager?.name ?? "— Assign"}
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
