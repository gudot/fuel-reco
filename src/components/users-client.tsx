"use client";

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
  { header: "Created", cell: ({ row }) => formatDate(row.original.createdAt) }
];

export function UsersClient() {
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: ["users"], queryFn: () => apiFetch<UsersResponse>("/api/users") });

  const createUser = useMutation({
    mutationFn: (payload: Record<string, FormDataEntryValue>) =>
      apiFetch("/api/users", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
  });

  function submitUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    createUser.mutate(formToObject(form), { onSuccess: () => form.reset() });
  }

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
          <h2>User register</h2>
          <DataTable data={users.data?.users ?? []} columns={columns} />
        </div>
      </section>
    </>
  );
}
