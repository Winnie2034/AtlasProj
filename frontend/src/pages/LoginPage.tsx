import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth.api";

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (response) => {
      queryClient.setQueryData(["auth", "me"], response);
      navigate("/");
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <AuthFrame title="Welcome back" detail="Log in to view your workouts and dashboard.">
      <form className="grid gap-4" onSubmit={submit}>
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Password" type="password" value={password} onChange={setPassword} />
        {mutation.isError ? <p className="text-sm text-red-700">{mutation.error.message}</p> : null}
        <button className="focus-ring rounded-md bg-river px-4 py-3 font-semibold text-white disabled:opacity-60" disabled={mutation.isPending} type="submit">
          {mutation.isPending ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="mt-5 text-sm text-slate-600">New to Atlas? <Link className="font-semibold text-river" to="/register">Create an account</Link></p>
    </AuthFrame>
  );
}

export function AuthFrame({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <section className="w-full max-w-md rounded-md border border-line bg-white p-7 shadow-panel">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-river">Atlas</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">{title}</h1>
        <p className="mb-6 mt-2 text-sm text-slate-600">{detail}</p>
        {children}
      </section>
    </main>
  );
}

export function Field({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-ink">
      {label}
      <input className="focus-ring rounded-md border border-line px-3 py-2.5" required type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
