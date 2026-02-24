import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, UserPlus, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.jpeg";

export default function LoginPage() {
  const { setUser } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // ✅ NEW STATE
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // ================= LOGIN =================
  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email and password required");
      return;
    }

    setAuthLoading(true);
    setError("");

    try {
      const res = await api.post("/users/login", {
        email,
        password,
      });

      const userData = {
        id: res.data.user._id,
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role,
      };

      setUser(userData);

      localStorage.setItem("st_token", res.data.token);
      localStorage.setItem("st_user", JSON.stringify(userData));

    } catch (err: any) {
      setError(
        err?.response?.data?.msg ||
        err?.response?.data?.error ||
        "Login failed"
      );
    } finally {
      setAuthLoading(false);
    }
  };

  // ================= REGISTER =================
  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("All fields are required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setAuthLoading(true);
    setError("");

    try {
      const res = await api.post("/users/register", {
        name,
        email,
        password,
        role, // ✅ SEND ROLE
      });

      const userData = {
        id: res.data.user._id,
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role,
      };

      setUser(userData);

      localStorage.setItem("st_token", res.data.token);
      localStorage.setItem("st_user", JSON.stringify(userData));

    } catch (err: any) {
      setError(
        err?.response?.data?.msg ||
        err?.response?.data?.error ||
        "Registration failed"
      );
    } finally {
      setAuthLoading(false);
    }
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) return;

    if (isRegister) {
      await handleRegister();
    } else {
      await handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-3">
          <div className="mx-auto w-24 h-24 rounded-full overflow-hidden ring-4 ring-primary/30 shadow-xl">
            <img
              src={logo}
              alt="Sadik Traders"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold">Sadik Traders</h1>
          <p className="text-sm text-muted-foreground">
            Wholesale & Retail — Dry Fruits & Spices
          </p>
          <p className="text-xs italic text-muted-foreground">Since 1989</p>
        </div>

        <div className="p-6 space-y-5 bg-card rounded-xl shadow-lg border border-border">
          <h2 className="text-xl font-semibold text-center">
            {isRegister ? "Create Account" : "Welcome Back"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* ✅ NEW ROLE FIELD (ONLY REGISTER MODE) */}
            {isRegister && (
              <div className="space-y-2">
                <Label>Account Type</Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border rounded px-3 py-2 bg-background"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
                {error}
              </p>
            )}

            <Button type="submit" disabled={authLoading} className="w-full gap-2">
              {authLoading
                ? "Please wait..."
                : isRegister
                ? (
                  <>
                    <UserPlus size={18} /> Register
                  </>
                )
                : (
                  <>
                    <LogIn size={18} /> Login
                  </>
                )}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="text-sm text-primary hover:underline"
            >
              {isRegister
                ? "Already have an account? Login"
                : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}