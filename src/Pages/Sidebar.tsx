import { Home, Info, Phone, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ closeSidebar }: { closeSidebar?: () => void }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    closeSidebar?.(); // 🔹 Close sidebar if provided
    navigate("/login");
  };

  return (
    <div className="w-full h-full bg-white dark:bg-black flex flex-col space-y-4 p-4">
      <Button variant="ghost" className="justify-start" asChild>
        <a href="/">
          <Home className="mr-2 h-5 w-5" /> Home
        </a>
      </Button>

      <Button variant="ghost" className="justify-start" asChild>
        <a href="/chatlist">
          <Info className="mr-2 h-5 w-5" /> Chats
        </a>
      </Button>

      <Button variant="ghost" className="justify-start" asChild>
        <a href="/login">
          <Phone className="mr-2 h-5 w-5" /> Login
        </a>
      </Button>

      <Button
        variant="ghost"
        className="justify-start text-red-600"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-5 w-5" /> Logout
      </Button>
    </div>
  );
};

export default Sidebar;



