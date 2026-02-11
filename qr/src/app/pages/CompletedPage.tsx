import { CheckCircle2 } from "lucide-react";

export function CompletedPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Success icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        {/* Success message */}
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-gray-900">
            Thank you for choosing us!
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Your session has been successfully completed.
          </p>
        </div>
      </div>
    </div>
  );
}
