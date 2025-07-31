"use client";

import { getAuthorizedVisitors } from "@/lib/actions/visitor.action";
import { Visitor } from "@/lib/typings";
import React, { useEffect, useState } from "react";
import AuthorizedCard from "./AuthorizedCard";
import { useFirebase } from "@/app/hooks/useFirebase";
import { redirect } from "next/navigation";

const Authorized = () => {
  const { userLoggedIn } = useFirebase();

  if (!userLoggedIn) {
    redirect("/login");
  }

  const [visitors, setVisitors] = useState<Visitor[]>([]);

  useEffect(() => {
    async function retrieveAuthorizedVisitors() {
      const response = await getAuthorizedVisitors();
      setVisitors(response.visitors);
    }

    retrieveAuthorizedVisitors();
  }, []);

  return (
    <div className="grid grid-cols-8 mt-5">
      <span className="col-span-1 font-medium">Visitor ID</span>
      <span className="col-span-2 font-medium">Name</span>
      <span className="col-span-2 font-medium">Email</span>
      <span className="col-span-1 font-medium">Phone No</span>
      <span className="col-span-1 font-medium">License Plate No</span>
      <span className="col-span-1 font-medium">Action</span>
      <div className="col-span-8 w-full h-[2px] bg-gray-800 my-4" />

      {visitors.map((visitor, index) => (
        <AuthorizedCard key={index} visitor={visitor} />
      ))}
    </div>
  );
};

export default Authorized;
