import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CryptoAddress } from "@/types";
import { fetchAddresses, addAddress } from "@/utils/firebase";

const Watchlist: React.FC = () => {
  const [addresses, setAddresses] = useState<CryptoAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const fetchedAddresses = await fetchAddresses();
      setAddresses(fetchedAddresses);
      setError(null);
    } catch (err) {
      setError("Failed to load addresses. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const newAddress: Omit<CryptoAddress, "id"> = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      address: (form.elements.namedItem("address") as HTMLInputElement).value,
      blockchain: (form.elements.namedItem("blockchain") as HTMLInputElement)
        .value,
    };

    try {
      await addAddress(newAddress);
      await loadAddresses(); // Reload the list after adding
      form.reset();
    } catch (err) {
      setError("Failed to add address. Please try again.");
    }
  };

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Crypto Watchlist</h1>

      <form onSubmit={handleAddAddress} className="mb-8">
        <div className="flex flex-wrap -mx-2 mb-4">
          <div className="w-full md:w-1/3 px-2 mb-4 md:mb-0">
            <input
              type="text"
              name="name"
              placeholder="Coin Name"
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="w-full md:w-1/3 px-2 mb-4 md:mb-0">
            <input
              type="text"
              name="address"
              placeholder="Wallet Address"
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="w-full md:w-1/3 px-2">
            <input
              type="text"
              name="blockchain"
              placeholder="Blockchain"
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Add Address
        </button>
      </form>

      <AnimatePresence>
        {addresses.map((address) => (
          <motion.div
            key={address.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-white shadow-md rounded-lg p-4 mb-4"
          >
            <h2 className="text-xl font-semibold mb-2">{address.name}</h2>
            <p className="text-gray-600 mb-1">Address: {address.address}</p>
            <p className="text-gray-600">Blockchain: {address.blockchain}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Watchlist;
