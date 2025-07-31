"use client";

import { useFirebase } from "@/app/hooks/useFirebase";
import MoreAction from "@/components/admin/dashboard/MoreAction";
import { getVisitors } from "@/lib/actions/visitor.action";
import { Visitor } from "@/lib/typings";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import React, { useEffect, useState } from "react";

const Dashboard = () => {
  const { userLoggedIn } = useFirebase();

  if (!userLoggedIn) {
    redirect("/login");
  }

  const [visitors, setVisitors] = useState<Visitor[]>([]);

  useEffect(() => {
    async function retrieveVisitors() {
      const response = await getVisitors();
      setVisitors(response.visitors);
    }

    retrieveVisitors();
  }, []);

  return (
    <div className="grid grid-cols-7">
      <span className="col-span-2 font-medium">Name</span>
      <span className="col-span-1 font-medium">Phone No</span>
      <span className="col-span-1 font-medium">License Plate No</span>
      <span className="col-span-1 font-medium">Valid from</span>
      <span className="col-span-1 font-medium">Valid till</span>
      <span className="col-span-1 font-medium">Action</span>
      <div className="col-span-7 w-full h-[2px] bg-gray-800 my-4" />

      {visitors.map((visitor, index) => (
        <div key={index} className="grid grid-cols-7 col-span-7 my-4">
          <div className="col-span-2">{visitor.name}</div>
          <div className="col-span-1">{visitor.phone}</div>
          <div className="col-span-1">{visitor.plate}</div>
          {visitor.authorizationTill !== undefined ? (
            <div className="col-span-2 grid grid-cols-2">
              <div className="col-span-1">
                {visitor.authorizationTill.from
                  ? format(visitor.authorizationTill.from, "LLL dd, y")
                  : "N/A"}
              </div>
              <div className="col-span-1">
                {visitor.authorizationTill.to
                  ? format(visitor.authorizationTill.to, "LLL dd, y")
                  : "N/A"}
              </div>
            </div>
          ) : (
            <div className="col-span-2">N/A</div>
          )}
          <MoreAction visitorId={visitor.visitorId} />
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
