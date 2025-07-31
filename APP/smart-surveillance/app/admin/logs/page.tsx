import AdminCard from "@/components/admin/AdminCard";
import Logs from "@/components/logs/Logs";
import { getLogsCount } from "@/lib/actions/admin.action";
import React from "react";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const { total, unauthorized, authorized, visitor } = await getLogsCount();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 mt-2">
      <span className="profile-heading">Logs</span>
      <div className="grid auto-rows-min grid-cols-2 gap-5 lg:grid-cols-5">
        <AdminCard title="Total Logs" value={total.toString()} />
        <AdminCard title="Authorized" value={authorized.toString()} />
        <AdminCard title="Unauthorized" value={unauthorized.toString()} />
        <AdminCard title="Visitors" value={visitor.toString()} />
      </div>
      <Logs />
    </div>
  );
}
