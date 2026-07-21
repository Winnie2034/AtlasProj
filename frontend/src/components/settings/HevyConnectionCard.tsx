import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { apiRequest } from "../../api/client";
import type { HevyConnectionStatus } from "../../types/api";

export function HevyConnectionCard() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState("");
  const connection = useQuery({
    queryKey: ["hevy-connection"],
    queryFn: () => apiRequest<HevyConnectionStatus>("/hevy-connection"),
  });
  const connect = useMutation({
    mutationFn: () => apiRequest<HevyConnectionStatus>("/hevy-connection", { method: "PUT", body: JSON.stringify({ apiKey }) }),
    onSuccess: () => {
      setApiKey("");
      queryClient.invalidateQueries({ queryKey: ["hevy-connection"] });
    },
  });
  const disconnect = useMutation({
    mutationFn: () => apiRequest<null>("/hevy-connection", { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hevy-connection"] }),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    connect.mutate();
  };

  return (
    <section className="rounded-md border border-line bg-white p-5 shadow-panel">
      <h2 className="text-xl font-semibold">Hevy connection</h2>
      {connection.data?.data.connected ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-emerald-700">Connected</p>
            <p className="mt-1 text-sm text-slate-600">Your encrypted key is stored only on the Atlas backend.</p>
          </div>
          <button className="focus-ring rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-700" disabled={disconnect.isPending} onClick={() => disconnect.mutate()} type="button">Disconnect</button>
        </div>
      ) : (
        <form className="mt-4 grid gap-3" onSubmit={submit}>
          <label className="grid gap-1.5 text-sm font-medium">
            Personal Hevy API key
            <input className="focus-ring rounded-md border border-line px-3 py-2.5" onChange={(event) => setApiKey(event.target.value)} required type="password" value={apiKey} />
          </label>
          <p className="text-xs text-slate-500">Atlas validates the key with Hevy, encrypts it, and never sends it back to your browser.</p>
          {connect.isError ? <p className="text-sm text-red-700">{connect.error.message}</p> : null}
          <button className="focus-ring justify-self-start rounded-md bg-river px-4 py-2.5 font-semibold text-white disabled:opacity-60" disabled={connect.isPending} type="submit">{connect.isPending ? "Connecting..." : "Connect Hevy"}</button>
        </form>
      )}
    </section>
  );
}
