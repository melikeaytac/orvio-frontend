import { useNavigate } from "react-router";
import { FridgeIcon } from "../components/FridgeIcon";

export function WelcomePage() {
  const navigate = useNavigate();

  const handleStartSession = () => {
    navigate("/cart");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero fridge visual - upper half */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12">
        <div className="w-full max-w-md">
          {/* Smart fridge icon illustration */}
          <div className="w-full mb-8 flex justify-center">
            <FridgeIcon className="w-48 h-64" />
          </div>

          {/* Welcome text */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-semibold text-gray-900">
              Welcome!
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Start your smart shopping session with our AI-powered cooler.
            </p>
            
            {/* Session information message */}
            <div className="pt-4 pb-2">
              <p className="text-base text-gray-700 leading-relaxed">
                Your 60-second session will begin as soon as you press Start Session.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Button in lower thumb-reach zone */}
      <div className="px-6 pb-8 pt-4">
        <button
          onClick={handleStartSession}
          className="w-full min-h-[56px] bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-medium py-4 px-6 rounded-2xl shadow-sm transition-colors duration-200 text-lg touch-manipulation"
        >
          Start Session
        </button>
        
        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center leading-relaxed mt-4">
          By starting the session, you agree to all applicable terms, conditions, and policies.
        </p>
      </div>
    </div>
  );
}