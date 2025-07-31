"use client";

import { getNewVisitors } from "@/lib/actions/visitor.action";
import { Visitor } from "@/lib/typings";
import React, { useEffect, useState } from "react";
import RequestCard from "./RequestCard";
import { useFirebase } from "@/app/hooks/useFirebase";
import { redirect } from "next/navigation";

const Requests = () => {
  const { userLoggedIn } = useFirebase();

  if (!userLoggedIn) {
    redirect("/login");
  }

  const [visitors, setVisitors] = useState<Visitor[]>([]);

  useEffect(() => {
    async function retrieveNewVisitors() {
      const response = await getNewVisitors();
      setVisitors(response.visitors);
    }

    retrieveNewVisitors();
  }, []);

  return (
    <div className="grid grid-cols-7 mt-5">
      <span className="col-span-2 font-medium">Name</span>
      <span className="col-span-1 font-medium">Phone No</span>
      <span className="col-span-1 font-medium">License Plate No</span>
      <span className="col-span-1 font-medium">Valid from</span>
      <span className="col-span-1 font-medium">Valid till</span>
      <span className="col-span-1 font-medium">Action</span>
      <div className="col-span-7 w-full h-[2px] bg-gray-800 my-4" />

      {visitors.map((visitor, index) => (
        <RequestCard key={index} visitor={visitor} />
      ))}
    </div>
  );
};

export default Requests;
