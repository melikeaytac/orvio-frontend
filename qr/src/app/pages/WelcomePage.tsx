import { useNavigate } from "react-router";

export function WelcomePage() {
  const navigate = useNavigate();

  const handleStartSession = () => {
    navigate("/cart");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main content - centered vertically */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-full max-w-md text-center space-y-6">
          <h1 className="text-4xl font-semibold text-gray-900">
            Welcome!
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Start your smart shopping session with our AI-powered cooler.
          </p>
          <div className="pt-8">
            <button
              onClick={handleStartSession}
              className="w-full min-h-[56px] bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-medium py-4 px-6 rounded-2xl shadow-sm transition-colors duration-200 text-lg touch-manipulation"
            >
              Start Session
            </button>
          </div>
        </div>
      </div>

      {/* Disclaimer at the bottom */}
      <div className="px-6 pb-8">
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          By starting the session, you agree to all applicable terms, conditions, and policies.
        </p>
      </div>
    </div>
  );
}