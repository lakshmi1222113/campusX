
import { Link } from "react-router-dom";
import "../App.css";

export default function NotFoundPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>404 - Page Not Found</h1>
       
        <Link className="primary-btn" to="/">
          Back to CampusX
        </Link>
      </div>
    </div>
  );
}
