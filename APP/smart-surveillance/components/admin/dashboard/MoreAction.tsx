"use client";

import SmartAlertDialog from "@/components/SmartAlerDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { deleteVisitor, updateVisitor } from "@/lib/actions/visitor.action";
import { cn } from "@/lib/utils";
import { BanIcon, DeleteIcon, MoreHorizontalIcon } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

const MoreAction = ({ visitorId }: { visitorId: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  async function retrictVisitor() {
    console.log(visitorId);
    const response = await updateVisitor({
      visitorId: visitorId,
      isApproved: false,
      visitorType: "unauthorized",
    });

    if (response.success) {
      toast.success("Visitor restricted successfully!");
    } else {
      toast.error("Something went wrong while restricting visitor");
    }

    setIsOpen(false);

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  async function removeVisitor() {
    const response = await deleteVisitor(visitorId);

    if (response.success) {
      toast.success("Visitor deleted successfully");
    } else {
      toast.error("Something went wrong while removing visitor.");
    }

    setIsOpen(false);

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div className="col-span-1 flex">
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
          <DropdownMenuItem onClick={retrictVisitor}>
            <BanIcon />
            Restrict visitor
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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
                Delete visitor
              </DropdownMenuItem>
            }
            title={"Are you sure?"}
            description={
              "This action cannot be undone. The visitor will be removed permanently."
            }
            cancelButtonText={"Cancel"}
            confirmButtonText={"Confirm"}
            onConfirmClick={removeVisitor}
          />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MoreAction;
