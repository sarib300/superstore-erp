import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LockKeyhole,
  Mail,
  LogIn,
} from "lucide-react";

import {
  loginUser,
} from "../services/authService";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!formData.password) {
      setError("Password is required.");
      return;
    }

    try {
      setLoading(true);

      const result = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
      });

      const token = result.data?.token;
      const user = result.data?.user;

      if (!token || !user) {
        setError("Invalid login response.");
        return;
      }

      localStorage.setItem(
        "erp_token",
        token
      );

      localStorage.setItem(
        "erp_user",
        JSON.stringify(user)
      );

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.message ||
        "Login failed.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          ERP
        </div>

        <div className="login-heading">
          <h1>SuperStore ERP</h1>

          <p>
            Sign in to access the management
            system.
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <div className="login-field">
            <label>Email</label>

            <div className="login-input">
              <Mail size={18} />

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@superstore.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="login-field">
            <label>Password</label>

            <div className="login-input">
              <LockKeyhole size={18} />

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            <LogIn size={18} />

            {loading
              ? "Signing In..."
              : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;