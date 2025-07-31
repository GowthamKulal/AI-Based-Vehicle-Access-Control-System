import { Log } from "@/lib/typings";
import React from "react";
import MoreAction from "./MoreAction";
import Image from "next/image";
import Link from "next/link";
import { formatLogDate } from "@/lib/utils";

const LogCard = ({ log }: { log: Log }) => {
  return (
    <div
      className={`grid grid-cols-6 col-span-7 my-2 items-center justify-center rounded-md 
      ${log.visitorStatus === "unauthorized" && "bg-red-500/80"}`}
    >
      <Link className="col-span-1" href={log.snapshot_url ?? ""}>
        <Image
          src={log.snapshot_url ?? ""}
          alt={log.plate}
          width={80}
          height={80}
          className="rounded-md"
        />
      </Link>
      <div className="col-span-1 font-bold">{log.plate}</div>
      <div className="col-span-1">{log.status?.toUpperCase()}</div>
      <div className="col-span-1 font-semibold">
        {log.visitorStatus?.toUpperCase()}
      </div>
      <div className="col-span-1">{formatLogDate(log.timestamp)}</div>
      <div className="col-span-1 text-right">
        <MoreAction logId={log.logId} />
      </div>
    </div>
  );
};

export default LogCard;
