import { useState } from 'react';
import { BsBuildingDash } from "react-icons/bs";
import { IoClose } from "react-icons/io5";
import { GoHome } from "react-icons/go";
import { PiShoppingCartSimpleBold } from "react-icons/pi";
import { FaRegCalendar, FaBoxOpen } from "react-icons/fa";
import { BsCurrencyBitcoin } from "react-icons/bs";
import { IoAnalyticsOutline } from "react-icons/io5";
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <GoHome />, isParent: true },
    { name: "Orders", path: "/admin/dashboard/orders", icon: <PiShoppingCartSimpleBold />, isParent: false },
    { name: "Appointments", path: "/admin/dashboard/appointments", icon: <FaRegCalendar />, isParent: false },
    { name: "Inventory", path: "/admin/dashboard/inventory", icon: <FaBoxOpen />, isParent: false },
    { name: "Commissions", path: "/admin/dashboard/commissions", icon: <BsCurrencyBitcoin />, isParent: false },
    { name: "Reports", path: "/admin/dashboard/reports", icon: <IoAnalyticsOutline />, isParent: false },
  ];

  return (
    <>
      {/* ✅ Overlay (mobile only) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ✅ Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static h-screen`}
      >
        <div className="flex flex-col h-full">

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <BsBuildingDash className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="font-bold text-lg">JBM ELECTRO</h1>
                <p className="text-xs text-gray-400">VENTURES</p>
              </div>
            </div>

            {/* ❌ Close button (mobile only) */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden"
            >
              <IoClose size={24} />
            </button>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.isParent}
                onClick={() => setIsOpen(false)} // auto close on mobile
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-sm">A</span>
              </div>
              <div className="flex-1">
                <p className="text-sm">Admin User</p>
                <p className="text-xs text-gray-400">admin@jbm.com</p>
              </div>
            </div>
          </div>

        </div>
      </aside>

      {/* ✅ OPEN BUTTON (you NEED this somewhere in your layout) */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-3 m-3 bg-gray-900 text-white rounded-lg lg:hidden"
      >
        ☰
      </button>
    </>
  );
};

export default Sidebar;