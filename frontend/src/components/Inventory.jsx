import { FaPlus } from "react-icons/fa";
import { useState } from "react";

const Inventory = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6 p-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl mb-2">Inventory Monitoring</h1>
          <p className="text-gray-500">Track and manage stock levels</p>
        </div>

        {/* Add Button */}
        <div
          onClick={() => setDialogOpen(true)}
          className="flex py-2 cursor-pointer bg-black rounded-lg text-white items-center justify-center gap-x-3 px-5 font-semibold text-[12.5px]"
        >
          <FaPlus />
          Add Item
        </div>
      </div>

      {/* ✅ MODAL */}
      {dialogOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          onClick={() => setDialogOpen(false)} // 👈 click outside closes
        >

          {/* Modal Box */}
          <div
            className="bg-white p-6 rounded-lg w-[90%] max-w-md shadow-lg"
            onClick={(e) => e.stopPropagation()} // 👈 prevent closing when clicking inside
          >
            <h2 className="text-lg font-semibold mb-4">Add Inventory Item</h2>

            <form className="space-y-4">

              <input
                type="text"
                placeholder="Item Name"
                className="w-full border p-2 rounded"
              />

              <input
                type="number"
                placeholder="Quantity"
                className="w-full border p-2 rounded"
              />

              <input
                type="text"
                placeholder="Category"
                className="w-full border p-2 rounded"
              />

              {/* Only Save button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded"
                >
                  Save
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;