import { Visitor } from "@/lib/typings";
import React from "react";
import MoreAction from "./MoreAction";

const AuthorizedCard = ({ visitor }: { visitor: Visitor }) => {
  return (
    <div className="grid grid-cols-8 col-span-8 my-4">
      <div className="col-span-1">{visitor.visitorId}</div>
      <div className="col-span-2">{visitor.name}</div>
      <div className="col-span-2">{visitor.email}</div>
      <div className="col-span-1">{visitor.phone}</div>
      <div className="col-span-1">{visitor.plate}</div>
      <MoreAction visitorId={visitor.visitorId} />
    </div>
  );
};

export default AuthorizedCard;
