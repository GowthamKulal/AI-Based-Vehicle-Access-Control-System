"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
import { Car, User, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { authorizedVisitorSchema } from "@/lib/validators";
import { z } from "zod";
import Loader from "@/public/icons/Loader";
import { addVisitorRequest } from "@/lib/actions/visitor.action";
import { nextInt } from "@/lib/utils";
import React from "react";

const AuthorizedForm = () => {
  // Initialize form with react-hook-form and Zod resolver
  const form = useForm<z.infer<typeof authorizedVisitorSchema>>({
    resolver: zodResolver(authorizedVisitorSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      plate: "",
      vehicleType: "",
    },
  });

  // Form submission handler
  async function onSubmit(values: z.infer<typeof authorizedVisitorSchema>) {
    const visitorId = nextInt().toString();

    const response = await addVisitorRequest({
      visitorId: visitorId,
      name: values.name,
      email: values.email,
      phone: values.phone,
      plate: values.plate,
      vehicleType: values.vehicleType,
      reason: "",
      authorizationTill: undefined,
      isApproved: true,
      visitorType: "authorized",
      createdAt: new Date(),
    });

    if (response.success) {
      toast.success("Authorized visitor added successfully!");
      form.reset();
    } else {
      toast.error("Something went wrong. Please try again later.");
    }
  }

  return (
    <div className="w-full mx-auto my-5">
      <div className="w-full h-[1px] bg-offblack mb-10" />
      <span className="font-semibold text-xl mt-10">
        Add authorized visitor
      </span>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 mt-5 flex flex-col"
        >
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
                        placeholder="Enter full name"
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
                        placeholder="Enter an email address"
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

          <Button
            type="submit"
            className="w-full max-w-4xl mx-auto mt-5 bg-darkblue hover:bg-blue-800 text-white py-4 font-medium text-base"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? <Loader /> : "Add visitor"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default AuthorizedForm;
