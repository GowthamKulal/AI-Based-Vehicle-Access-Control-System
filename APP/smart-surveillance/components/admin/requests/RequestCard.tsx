import { Visitor } from "@/lib/typings";
import { format } from "date-fns";
import React from "react";
import MoreAction from "./MoreAction";

const RequestCard = ({ visitor }: { visitor: Visitor }) => {
  return (
    <div className="grid grid-cols-7 col-span-7 my-4">
      <div className="col-span-2">{visitor.name}</div>
      <div className="col-span-1">{visitor.phone}</div>
      <div className="col-span-1">{visitor.plate}</div>
      <div className="col-span-1">
        {format(visitor.authorizationTill?.from ?? "", "LLL dd, y")}
      </div>
      <div className="col-span-1">
        {format(visitor.authorizationTill?.to ?? "", "LLL dd, y")}
      </div>
      <MoreAction visitorId={visitor.visitorId} />
    </div>
  );
};

export default RequestCard;
