import { cn } from "@/lib/utils";
import React from "react";

const AdminCard = ({
  title,
  value,
  className,
}: {
  title: string;
  value?: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        className,
        "bg-offblack rounded-lg p-5 flex flex-col gap-2"
      )}
    >
      <span className="text-sm md:text-base text-white/80">{title}</span>
      <span className="font-belanosima text-4xl">{value}</span>
    </div>
  );
};

export default AdminCard;
