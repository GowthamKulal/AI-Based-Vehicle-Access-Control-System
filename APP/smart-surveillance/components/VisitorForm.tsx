"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/TextArea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Car, User, Phone, CalendarIcon, Mail } from "lucide-react";
import { toast } from "sonner";
import { visitorSchema } from "@/lib/validators";
import { z } from "zod";
import Loader from "@/public/icons/Loader";
import { addVisitorRequest } from "@/lib/actions/visitor.action";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { addDays, format } from "date-fns";
import { Calendar } from "@/components/ui/Calendar";
import { cn, nextInt } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import React from "react";

const VisitorForm = () => {
  // Initialize form with react-hook-form and Zod resolver
  const form = useForm<z.infer<typeof visitorSchema>>({
    resolver: zodResolver(visitorSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      plate: "",
      vehicleType: "",
      reason: "",
    },
  });

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), new Date().getDay()),
  });

  // Form submission handler
  async function onSubmit(values: z.infer<typeof visitorSchema>) {
    const visitorId = nextInt().toString();

    const response = await addVisitorRequest({
      visitorId: visitorId,
      name: values.name,
      email: values.email,
      phone: values.phone,
      plate: values.plate,
      vehicleType: values.vehicleType,
      reason: values.reason,
      authorizationTill: date,
      isApproved: false,
      visitorType: "unauthorized",
      createdAt: new Date(),
    });

    if (response.success) {
      try {
        const response = await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            visitorId: visitorId,
            name: values.name,
            email: values.email,
            phone: values.phone,
            plate: values.plate,
            vehicleType: values.vehicleType,
            reason: values.reason,
            authorizationTill: date,
            isApproved: false,
            visitorType: "visitor",
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success("Registration request has been sent!");
          form.reset();
          setDate(undefined);
        } else {
          throw new Error(data.error || "Failed to send email");
        }
      } catch (error) {
        console.error("Registration error:", error);
        toast(
          "Your data was saved but there was an issue sending the notification. Admin will be informed."
        );
      }
    } else {
      toast.error("Something went wrong. Please try again later.");
    }
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Full Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Enter your full name"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Enter your email address"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* License Plate Field */}
            <FormField
              control={form.control}
              name="plate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    License Plate Number
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Car className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Enter license plate number"
                        className="pl-10 uppercase"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vehicle Type Field */}
            <FormField
              control={form.control}
              name="vehicleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    Vehicle Type
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Vehicle Types</SelectLabel>
                        <SelectItem value="car">Car</SelectItem>
                        <SelectItem value="bike">Bike</SelectItem>
                        <SelectItem value="truck">Truck</SelectItem>
                        <SelectItem value="motorcycle">Motorcycle</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <FormLabel className="text-foreground">
                Valid From - Valid Till
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "pl-3 flex items-center justify-start text-left font-normal w-full bg-offblack/10 mr-auto hover:bg-offblack hover:text-foreground",
                        "text-foreground/50"
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "LLL dd, y")} -{" "}
                            {format(date.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(date.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Phone Field */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    Phone Number
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Enter your phone number"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* Reason Field */}
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for Visit</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Please explain the purpose of your visit"
                    className="resize-none min-h-32"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-darkblue hover:bg-blue-800 text-white py-4 font-medium text-base"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? <Loader /> : "Register vehicle"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default VisitorForm;
