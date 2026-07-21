import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth.api";
import { AuthFrame, Field } from "./LoginPage";

export function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const mutation = useMutation({
    mutationFn: () => register(email, password, displayName),
    onSuccess: (response) => {
      queryClient.setQueryData(["auth", "me"], response);
      navigate("/settings");
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <AuthFrame title="Create your account" detail="Your workouts and Hevy connection stay attached to this account.">
      <form className="grid gap-4" onSubmit={submit}>
        <Field label="Name" type="text" value={displayName} onChange={setDisplayName} />
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Password (10+ characters)" type="password" value={password} onChange={setPassword} />
        {mutation.isError ? <p className="text-sm text-red-700">{mutation.error.message}</p> : null}
        <button className="focus-ring rounded-md bg-river px-4 py-3 font-semibold text-white disabled:opacity-60" disabled={mutation.isPending || password.length < 10} type="submit">
          {mutation.isPending ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-5 text-sm text-slate-600">Already registered? <Link className="font-semibold text-river" to="/login">Log in</Link></p>
    </AuthFrame>
  );
}
