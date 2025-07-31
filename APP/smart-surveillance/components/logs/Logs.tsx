"use client";

import { Log } from "@/lib/typings";
import React, { useEffect, useState } from "react";
import { useFirebase } from "@/app/hooks/useFirebase";
import { redirect } from "next/navigation";
import { getLogs } from "@/lib/actions/admin.action";
import LogCard from "./LogCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";
import { Label } from "../ui/Label";
import { Input } from "../ui/Input";
import { Search } from "lucide-react";

const Logs = () => {
  const { userLoggedIn } = useFirebase();

  if (!userLoggedIn) {
    redirect("/login");
  }

  const [logs, setLogs] = useState<Log[]>([]);
  const [filterActive, setFilterActive] = useState(false);
  const [visitorStatus, setVisitorStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLogs, setFilteredLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function retrieveLogs() {
      setIsLoading(true);
      const response = await getLogs(filterActive, visitorStatus);
      setLogs(response.logs);
      setIsLoading(false);
    }

    retrieveLogs();
  }, [filterActive, visitorStatus]);

  useEffect(() => {
    // Filter logs based on search query
    if (searchQuery.trim() === "") {
      setFilteredLogs(logs);
    } else {
      const filtered = logs.filter((log) =>
        log.plate?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLogs(filtered);
    }
  }, [searchQuery, logs]);

  const handleFilterChange = (status: string) => {
    setVisitorStatus(status);
    setFilterActive(status !== "all");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="w-full mt-10">
      <div className="flex justify-between mb-10">
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <Input
            type="text"
            placeholder="Search license plate..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="visitorFilter" className="text-sm font-medium">
            Filter:
          </Label>
          <Select value={visitorStatus} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select a filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="authorized">Authorized</SelectItem>
              <SelectItem value="unauthorized">Unauthorized</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-6 mt-5">
        <span className="col-span-1 font-medium">Snapshot</span>
        <span className="col-span-1 font-medium">License Plate No</span>
        <span className="col-span-1 font-medium">Status</span>
        <span className="col-span-1 font-medium">Visitor Status</span>
        <span className="col-span-1 font-medium">Timestamp</span>
        <span className="col-span-1 font-medium text-right mr-2">Action</span>
        <div className="col-span-6 w-full h-[2px] bg-gray-800 my-4" />

        {isLoading ? (
          <div className="col-span-6 py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2">Loading logs...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map((log, index) => <LogCard key={index} log={log} />)
        ) : (
          <div className="col-span-6 py-8 text-center">
            <p className="text-gray-500">
              {searchQuery
                ? "No logs found matching your search"
                : "No logs found with the selected filter"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
