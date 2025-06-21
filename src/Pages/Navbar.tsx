import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 py-3 shadow-md bg-white dark:bg-black">
      <div className="text-xl font-bold">ImPlus</div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger>
            <Menu className="w-6 h-6" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex space-x-6 items-center">
        <a href="/" className="text-sm font-medium hover:underline">Home</a>
        <a href="/chatlist" className="text-sm font-medium hover:underline">Chats</a>
        <a href="/login" className="text-sm font-medium hover:underline">Login</a>
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Logout
        </button>
      </nav>
    </header>
  );
};

export default Navbar;
