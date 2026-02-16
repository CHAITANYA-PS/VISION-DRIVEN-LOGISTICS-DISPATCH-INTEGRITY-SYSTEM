import Header from "./Header";
import Sidebar from "./Sidebar";
import { ToastProvider, useToast } from "../common/ToastContainer";
import { NotificationProvider } from "../../context/NotificationContext";

function NotificationProviderWrapper({ children }) {
  const { addToast } = useToast();
  return <NotificationProvider addToast={addToast}>{children}</NotificationProvider>;
}

export default function Layout({ children }) {
  return (
    <ToastProvider>
      <NotificationProviderWrapper>
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
      </NotificationProviderWrapper>
    </ToastProvider>
  );
}
