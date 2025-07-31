import { DateRange } from "react-day-picker";

export type Visitor = {
  visitorId: string;
  name: string;
  email: string;
  phone: string;
  plate: string;
  vehicleType: string;
  reason: string;
  authorizationTill: DateRange | undefined;
  isApproved: boolean;
  visitorType: string;
  createdAt: Date;
};

export type Log = {
  logId: string;
  plate: string;
  type: string;
  status: string;
  timestamp: string;
  snapshot_url?: string;
  visitorStatus?: string;
  formattedTime?: string;
};

export type User = {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
};
