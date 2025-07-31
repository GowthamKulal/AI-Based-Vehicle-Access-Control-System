import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import VisitorForm from "@/components/VisitorForm";
import { Car, User, FileText, AlertCircle } from "lucide-react";
import Image from "next/image";
import React from "react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="md:w-1/3 bg-background text-white p-8 md:p-12 flex flex-col items-center justify-center">
        <div className="mb-12">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">
            Smart Surveillance System
          </h1>
          <p className="text-blue-200">
            Secure entry management for your premises
          </p>
        </div>

        <div className="space-y-8">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-800 p-3 rounded-full">
              <User className="h-6 w-6 text-blue-200" />
            </div>
            <div>
              <h3 className="font-medium">Personal Information</h3>
              <p className="text-sm text-blue-200">
                We use this to identify you
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="bg-blue-800 p-3 rounded-full">
              <Car className="h-6 w-6 text-blue-200" />
            </div>
            <div>
              <h3 className="font-medium">Vehicle Details</h3>
              <p className="text-sm text-blue-200">
                Your vehicle will be registered in our system
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="bg-blue-800 p-3 rounded-full">
              <FileText className="h-6 w-6 text-blue-200" />
            </div>
            <div>
              <h3 className="font-medium">Visit Purpose</h3>
              <p className="text-sm text-blue-200">
                Let us know why you&apos;re visiting
              </p>
            </div>
          </div>
        </div>

        <div className="w-full flex items-center justify-center">
          <Image src="/images/car.png" alt="Car" width={200} height={200} />
        </div>

        <div className="mt-auto">
          <div className="flex items-center space-x-2 text-sm text-blue-200">
            <AlertCircle className="h-4 w-4" />
            <p>All information is securely stored</p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="flex-1 bg-background p-6 md:p-12 lg:p-16">
        <Card className="w-full max-w-4xl mx-auto border-0 bg-offblack/50 text-foreground">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
              Visitor Registration
            </CardTitle>
            <CardDescription className="text-foreground">
              Please complete the form below to register your vehicle for entry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VisitorForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
