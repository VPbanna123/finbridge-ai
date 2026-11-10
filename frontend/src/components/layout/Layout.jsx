import { Outlet, useLocation } from "react-router-dom";
import Topbar from "./Topbar";
import Footer from "./Footer";

export default function Layout() {
  const { pathname } = useLocation();
  const isChat = pathname.startsWith("/chat");

  return (
    <div className={`app-shell ${isChat ? "chat-shell" : ""}`}>
      <Topbar />
      <main className="page-container">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
