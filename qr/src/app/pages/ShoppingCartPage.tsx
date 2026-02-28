import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Minus } from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export function ShoppingCartPage() {
  const navigate = useNavigate();
  
  // Mock cart data with pricing - simulating AI-detected items
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { id: "1", name: "Sparkling Water", quantity: 2, unitPrice: 2.99 },
    { id: "2", name: "Orange Juice", quantity: 1, unitPrice: 4.99 },
    { id: "3", name: "Greek Yogurt", quantity: 3, unitPrice: 3.49 },
  ]);

  // 60-second countdown timer
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [showExpirationModal, setShowExpirationModal] = useState(false);
  const [autoCompleteCountdown, setAutoCompleteCountdown] = useState(10);

  // Main 60-second timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowExpirationModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 10-second auto-complete countdown in modal
  useEffect(() => {
    if (showExpirationModal) {
      const autoCompleteTimer = setInterval(() => {
        setAutoCompleteCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(autoCompleteTimer);
            handleCompletePurchase();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(autoCompleteTimer);
    }
  }, [showExpirationModal]);

  const handleDecreaseQuantity = (itemId: string) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) =>
          item.id === itemId
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleCompletePurchase = () => {
    // Store cart items for purchase details page
    localStorage.setItem("purchaseItems", JSON.stringify(cartItems));
    navigate("/completed");
  };

  const handleCancelSession = () => {
    // Clear cart and navigate to feedback screen
    setCartItems([]);
    navigate("/feedback");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header with timer */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            Your Shopping Cart
          </h1>
          <div className={`text-lg font-semibold px-3 py-1 rounded-lg ${
            timeRemaining <= 10 
              ? "bg-red-100 text-red-600" 
              : "bg-blue-50 text-blue-600"
          }`}>
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>

      {/* Cart items list */}
      <div className="flex-1 px-6 overflow-y-auto pb-4">
        {cartItems.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400 text-center">
              Your cart is empty
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {cartItems.map((item, index) => (
              <div key={item.id}>
                <div className="py-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-base text-gray-900 font-medium flex-1">{item.name}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Quantity in "3x" format */}
                      <span className="text-base text-gray-700 font-medium min-w-[32px]">
                        {item.quantity}x
                      </span>
                      {/* Minus button */}
                      <button
                        onClick={() => handleDecreaseQuantity(item.id)}
                        className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors duration-200"
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        <Minus className="w-5 h-5 text-gray-700" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        ${item.unitPrice.toFixed(2)} each
                      </p>
                      <p className="text-base text-gray-900 mt-1 font-semibold">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                {index < cartItems.length - 1 && (
                  <div className="h-px bg-gray-100" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary section */}
      <div className="px-6 pb-6 pt-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-lg text-gray-900 font-semibold">Total</span>
            <span className="text-2xl font-bold text-gray-900">
              ${getTotalPrice().toFixed(2)}
            </span>
          </div>
        </div>

        <button
          onClick={handleCompletePurchase}
          disabled={cartItems.length === 0}
          className="w-full min-h-[56px] bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-2xl shadow-sm transition-colors duration-200 text-lg touch-manipulation"
        >
          Complete &amp; Confirm Purchase
        </button>

        {/* Support text */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Need more help?{" "}
          <a
            href="#contact"
            className="text-blue-700 hover:text-blue-800 underline"
          >
            Contact us
          </a>
        </p>
      </div>

      {/* Session Expiration Modal */}
      {showExpirationModal && (
        <div className="fixed inset-0 flex items-center justify-center px-6 z-50">
          {/* Blurred background overlay */}
          <div className="absolute inset-0 backdrop-blur-md bg-black/20" />
          
          {/* Modal card */}
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10">
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Session Time Expired
              </h2>
              <p className="text-lg text-gray-600">
                Would you like to complete your purchase?
              </p>
              
              {/* Auto-complete countdown */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-2">
                  Auto-completing in
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {autoCompleteCountdown}s
                </p>
              </div>

              {/* Action buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleCompletePurchase}
                  className="w-full min-h-[56px] bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-medium py-4 px-6 rounded-2xl shadow-sm transition-colors duration-200 text-lg touch-manipulation"
                >
                  Complete Purchase
                </button>
                <button
                  onClick={handleCancelSession}
                  className="w-full min-h-[56px] bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-medium py-4 px-6 rounded-2xl border-2 border-gray-300 transition-colors duration-200 text-lg touch-manipulation"
                >
                  Cancel Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}