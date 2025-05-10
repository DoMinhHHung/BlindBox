import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Eye, EyeOff, ShoppingBag } from "lucide-react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { apiService } from "../../services/api";
import LoadingTruck from "../ui/LoadingTruck";
import Notification from "../ui/Notification";

interface LoginFormProps {
  onToggleForm: () => void;
  onForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onToggleForm,
  onForgotPassword,
}) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [errors, setErrors] = useState({
    identifier: "",
    password: "",
    form: "",
  });
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate form
    const newErrors = {
      identifier: !identifier ? "Email or phone is required" : "",
      password: !password
        ? "Password is required"
        : password.length < 8
        ? "Password must be at least 8 characters"
        : "",
      form: "",
    };
    setErrors(newErrors);
    // If no errors, submit the form
    if (!newErrors.identifier && !newErrors.password) {
      setLoading(true);
      try {
        await apiService.login(identifier, password);
        setNotification({ message: "Login successful!", type: "success" });
        // TODO: Redirect to dashboard or homepage
      } catch (error: any) {
        setLoginError(true);
        setNotification({
          message: error?.response?.data?.message || "Invalid credentials",
          type: "error",
        });
        setTimeout(() => setLoginError(false), 500);
      }
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className={`bg-white/20 backdrop-blur-lg rounded-xl border border-white/30 shadow-2xl p-8 w-full max-w-md ${
        loginError ? "animate-shake" : ""
      }`}
      style={{ animationDuration: "0.4s" }}
    >
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="bg-gradient-to-br from-primary-600 to-accent-600 p-3 rounded-full mb-3">
          <ShoppingBag className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-semibold text-neutral-800">
          Welcome Back
        </h2>
        <p className="text-neutral-600 mt-2">Sign in to your account</p>
      </div>
      <Notification
        message={notification?.message || ""}
        type={notification?.type}
        onClose={() => setNotification(null)}
      />
      <AnimatePresence mode="wait">
        {errors.form && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md mb-4"
          >
            {errors.form}
          </motion.div>
        )}
      </AnimatePresence>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email or Phone"
          type="text"
          placeholder="Enter your email or phone number"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={errors.identifier}
          leftIcon={<User className="w-5 h-5" />}
        />
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          leftIcon={<Lock className="w-5 h-5" />}
          rightIcon={
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          }
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-neutral-700"
            >
              Remember me
            </label>
          </div>
          <div className="text-sm">
            <Button
              variant="link"
              type="button"
              className="text-primary-600 hover:text-primary-500"
              onClick={onForgotPassword}
            >
              Forgot your password?
            </Button>
          </div>
        </div>
        {loading ? (
          <LoadingTruck />
        ) : (
          <Button type="submit" className="w-full" isLoading={loading}>
            Sign in
          </Button>
        )}
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            Don't have an account?{" "}
            <Button
              variant="link"
              type="button"
              className="text-primary-600 hover:text-primary-500 font-medium"
              onClick={onToggleForm}
            >
              Sign up
            </Button>
          </p>
        </div>
      </form>
    </motion.div>
  );
};

export default LoginForm;
