"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import { cn } from "@/lib/utils";

const SmartAlertDialog = ({
  component,
  title,
  description,
  cancelButtonText,
  confirmButtonText,
  className,
  cancelButtonClassName,
  confirmButtonClassName,
  onConfirmClick,
}: {
  component: React.ReactNode;
  title: string;
  description: string;
  cancelButtonText: string;
  confirmButtonText: string;
  className?: string;
  cancelButtonClassName?: string;
  confirmButtonClassName?: string;
  onConfirmClick: () => void;
}) => {
  return (
    <div className={cn(className, "relative")}>
      <AlertDialog>
        <AlertDialogTrigger asChild>{component}</AlertDialogTrigger>
        <AlertDialogContent className="w-[90%] md:w-full border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={cn(cancelButtonClassName, "mt-2 md:mt-0 h-10 md:h-9")}
            >
              {cancelButtonText}
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                confirmButtonClassName,
                "bg-red-500 border-red-500 text-white hover:bg-red-500 hover:border-red-500 h-10 md:h-9"
              )}
              onClick={onConfirmClick}
            >
              {confirmButtonText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SmartAlertDialog;
