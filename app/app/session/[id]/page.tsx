import { notFound } from "next/navigation";
import { getSessionWithTransactions } from "@/lib/data";
import { SessionDetailClient } from "./SessionDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: PageProps) {
  const { id } = await params;
  if (id === "new") {
    notFound();
  }
  const data = await getSessionWithTransactions(id);
  if (!data.session) notFound();

  return (
    <SessionDetailClient
      session={data.session}
      initialTransactions={data.transactions}
      initialTotalInCents={data.totalInCents}
      initialTotalOutCents={data.totalOutCents}
      initialNetCents={data.netCents}
    />
  );
}
