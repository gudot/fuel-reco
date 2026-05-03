"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { apiFetch, formatDate, formToObject } from "@/lib/client-api";
import type { RoleName } from "@/lib/types";
import { DataTable } from "@/components/data-table";

type User = {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  active: boolean;
  createdAt: string;
};

type UsersResponse = { users: User[] };

export function UsersClient() {
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const users = useQuery({ queryKey: ["users"], queryFn: () => apiFetch<UsersResponse>("/api/users") });

  const refreshUsers = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const createUser = useMutation({
    mutationFn: (payload: Record<string, FormDataEntryValue>) =>
      apiFetch("/api/users", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: refreshUsers
  });

  const updateUser = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, FormDataEntryValue> }) =>
      apiFetch(`/api/users?id=${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: () => {
      setEditingUser(null);
      refreshUsers();
    }
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/users?id=${id}`, { method: "DELETE" }),
    onSuccess: refreshUsers
  });

  function submitUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    createUser.mutate(formToObject(form), { onSuccess: () => form.reset() });
  }

  function submitUserUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingUser) {
      return;
    }

    updateUser.mutate({ id: editingUser.id, payload: formToObject(event.currentTarget) });
  }

  const columns: ColumnDef<User>[] = [
    { header: "Name", accessorKey: "name" },
    { header: "Email", accessorKey: "email" },
    { header: "Role", accessorKey: "role" },
    {
      header: "Status",
      cell: ({ row }) => (
        <span className={`badge ${row.original.active ? "ok" : "alert"}`}>{row.original.active ? "Active" : "Inactive"}</span>
      )
    },
    { header: "Created", cell: ({ row }) => formatDate(row.original.createdAt) },
    {
      header: "Actions",
      cell: ({ row }) => (
        <div className="table-actions">
          <button className="mini-button" type="button" onClick={() => setEditingUser(row.original)}>
            Edit
          </button>
          <button
            className="mini-button danger"
            disabled={!row.original.active || deleteUser.isPending}
            type="button"
            onClick={() => {
              if (confirm(`Deactivate ${row.original.name}?`)) {
                deleteUser.mutate(row.original.id);
              }
            }}
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <header className="page-header">
        <div>
          <p className="brand-kicker">Access control</p>
          <h1>Users</h1>
        </div>
      </header>

      <section className="grid two">
        <div className="panel">
          <h2>Create user</h2>
          <form onSubmit={submitUser}>
            <div className="form-grid">
              <div className="field">
                <label>Name</label>
                <input name="name" required />
              </div>
              <div className="field">
                <label>Email</label>
                <input name="email" type="email" required />
              </div>
              <div className="field">
                <label>Role</label>
                <select name="role" defaultValue="OPERATIONS">
                  <option value="ADMIN">Administrator</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="OPERATIONS">Operations</option>
                </select>
              </div>
              <div className="field">
                <label>Password</label>
                <input name="password" type="password" minLength={8} required />
              </div>
            </div>
            {createUser.error ? <div className="error">{createUser.error.message}</div> : null}
            <div className="button-row">
              <button className="button" disabled={createUser.isPending} type="submit">
                Create user
              </button>
            </div>
          </form>
        </div>

        <div className="panel">
          <h2>{editingUser ? "Update user" : "User register"}</h2>
          {editingUser ? (
            <form onSubmit={submitUserUpdate}>
              <div className="form-grid">
                <div className="field">
                  <label>Name</label>
                  <input name="name" defaultValue={editingUser.name} required />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input name="email" type="email" defaultValue={editingUser.email} required />
                </div>
                <div className="field">
                  <label>Role</label>
                  <select name="role" defaultValue={editingUser.role}>
                    <option value="ADMIN">Administrator</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="OPERATIONS">Operations</option>
                  </select>
                </div>
                <div className="field">
                  <label>Status</label>
                  <select name="active" defaultValue={String(editingUser.active)}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="field full">
                  <label>New password</label>
                  <input name="password" type="password" minLength={8} placeholder="Leave blank to keep current password" />
                </div>
              </div>
              {updateUser.error ? <div className="error">{updateUser.error.message}</div> : null}
              <div className="button-row">
                <button className="button" disabled={updateUser.isPending} type="submit">
                  Save user
                </button>
                <button className="button secondary" type="button" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
          <DataTable data={users.data?.users ?? []} columns={columns} />
          {deleteUser.error ? <div className="error">{deleteUser.error.message}</div> : null}
        </div>
      </section>
    </>
  );
}
