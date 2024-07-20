
import Nave from "@/components/nav";
import './style.css'
import ProtectedRoute from "../withAuth";
export default function DashboardLayout({ children }) {
    return (
        <div className="container">
            <Nave />
            <ProtectedRoute>
                {children}
            </ProtectedRoute>
        </div>
    );
}
