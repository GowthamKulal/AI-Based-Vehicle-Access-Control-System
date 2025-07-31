import AdminCard from "@/components/admin/AdminCard";
import AuthorizedForm from "@/components/admin/authorized/AuthoriedForm";
import Authorized from "@/components/admin/authorized/Authorized";
import { getVisitorsCount } from "@/lib/actions/visitor.action";
import React from "react";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const { total, authorized } = await getVisitorsCount();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 mt-2">
      <span className="profile-heading">Authorized Visitors</span>
      <div className="grid auto-rows-min grid-cols-2 gap-5 lg:grid-cols-5">
        <AdminCard title="Total Visitors" value={total.toString()} />
        <AdminCard
          title="Total Authorized Visitors"
          value={authorized.toString()}
        />
      </div>
      <Authorized />
      <AuthorizedForm />
    </div>
  );
}
