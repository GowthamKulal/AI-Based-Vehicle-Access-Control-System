"use client";

import SmartAlertDialog from "@/components/SmartAlerDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { deleteLog } from "@/lib/actions/admin.action";
import { cn } from "@/lib/utils";
import { DeleteIcon, MoreHorizontalIcon } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

const MoreAction = ({ logId }: { logId: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  async function removeLog() {
    const response = await deleteLog(logId);

    if (response.success) {
      toast.success("Log deleted successfully");
    } else {
      toast.error("Something went wrong while removing log.");
    }

    setIsOpen(false);

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center justify-end mr-6">
          <div
            className={cn(
              "flex items-center justify-center rounded-full hover:bg-background/50 p-2 cursor-pointer",
              isOpen && "bg-background/50"
            )}
          >
            <MoreHorizontalIcon className="h-4 w-4" />
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-50 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuGroup>
          <SmartAlertDialog
            component={
              <DropdownMenuItem
                className="text-red hover:text-red!"
                onSelect={(event) => {
                  // Prevent the dropdown from closing
                  event.preventDefault();
                }}
              >
                <DeleteIcon />
                Delete Log
              </DropdownMenuItem>
            }
            title={"Are you sure?"}
            description={
              "This action cannot be undone. This log will be removed permanently."
            }
            cancelButtonText={"Cancel"}
            confirmButtonText={"Confirm"}
            onConfirmClick={removeLog}
          />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MoreAction;
