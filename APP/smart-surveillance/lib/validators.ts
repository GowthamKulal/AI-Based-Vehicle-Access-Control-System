import { z } from "zod";

export const visitorSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 2 characters" })
    .max(50, { message: "Name cannot exceed 50 characters" }),

  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),

  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits" })
    .max(15, { message: "Phone number cannot exceed 15 digits" })
    .regex(/^\d+$/, { message: "Phone number can only contain digits" }),

  plate: z
    .string()
    .min(2, { message: "License plate number is required" })
    .max(15, { message: "License plate cannot exceed 15 characters" })
    .transform((val) => val.toUpperCase()),

  vehicleType: z.string({
    required_error: "Please select a vehicle type",
  }),

  reason: z
    .string()
    .min(5, { message: "Reason must be at least 5 characters" })
    .max(500, { message: "Reason cannot exceed 500 characters" }),
});

export const authorizedVisitorSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(50, { message: "Name cannot exceed 50 characters" }),

  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),

  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits" })
    .max(15, { message: "Phone number cannot exceed 15 digits" })
    .regex(/^\d+$/, { message: "Phone number can only contain digits" }),

  plate: z
    .string()
    .min(2, { message: "License plate number is required" })
    .max(15, { message: "License plate cannot exceed 15 characters" })
    .transform((val) => val.toUpperCase()),

  vehicleType: z.string({
    required_error: "Please select a vehicle type",
  }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),

  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(6, { message: "Password must be at least 6 characters" }),
});
