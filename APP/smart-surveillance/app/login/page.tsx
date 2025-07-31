import LoginForm from "@/components/admin/login/LoginForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { ADMIN_EMAIL } from "@/lib/constants";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="border-none bg-offblack/50 text-foreground shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-darkblue"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
            <CardDescription>Sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          Need help?{" "}
          <a
            href={`mailto:${ADMIN_EMAIL}`}
            className="font-medium text-darkblue hover:text-darkblue/80"
          >
            Contact admin support
          </a>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          &copy; 2025 Smart Surveillance System Inc. All rights reserved.
        </div>
      </div>
    </div>
  );
}
