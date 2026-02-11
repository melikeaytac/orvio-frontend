import { useState } from "react";
import { useNavigate } from "react-router";
import { Minus } from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
}

export function ShoppingCartPage() {
  const navigate = useNavigate();
  
  // Mock cart data - simulating AI-detected items
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { id: "1", name: "Sparkling Water", quantity: 2 },
    { id: "2", name: "Orange Juice", quantity: 1 },
    { id: "3", name: "Greek Yogurt", quantity: 3 },
  ]);

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
    navigate("/completed");
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Your Shopping Cart
        </h1>
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
                <div className="flex items-center justify-between py-4">
                  <div className="flex-1">
                    <p className="text-base text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      x{item.quantity}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDecreaseQuantity(item.id)}
                    className="ml-4 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors duration-200"
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    <Minus className="w-5 h-5 text-gray-700" />
                  </button>
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
            <span className="text-gray-600">Total Items</span>
            <span className="font-semibold text-gray-900">{totalItems}</span>
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
    </div>
  );
}