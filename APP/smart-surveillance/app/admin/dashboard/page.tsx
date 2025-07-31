import Dashboard from "@/components/admin/dashboard/Dashboard";
import UploadVideoButton from "@/components/admin/dashboard/UploadVideoButton";
import React from "react";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 mt-2">
      <span className="profile-heading">Dashboard</span>
      <UploadVideoButton />
      <span className="font-semibold text-xl mt-10">Total visitors</span>
      <Dashboard />
    </div>
  );
}
