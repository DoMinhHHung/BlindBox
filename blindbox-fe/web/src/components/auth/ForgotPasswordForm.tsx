import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ShoppingBag } from "lucide-react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import LoadingTruck from "../ui/LoadingTruck";
import { validateEmail, validatePassword } from "../../lib/utils";
import { apiService } from "../../services/api";
import AuthContainer from "./AuthContainer";
import Notification from "../ui/Notification";

interface ForgotPasswordFormProps {
  onToggleForm: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onToggleForm,
}) => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"email" | "otp" | "done">("email");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    otp: "",
    newPassword: "",
    form: "",
  });
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const handleSendOtp = async () => {
    if (!email || !validateEmail(email)) {
      setErrors((prev) => ({
        ...prev,
        email: "Please enter a valid email address",
      }));
      return;
    }
    setLoading(true);
    try {
      await apiService.forgotPassword(email);
      setStep("otp");
      setNotification({ message: "OTP sent to your email", type: "success" });
    } catch (error: any) {
      setNotification({
        message: error?.response?.data?.message || "Failed to send OTP",
        type: "error",
      });
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!otp) {
      setErrors((prev) => ({ ...prev, otp: "Please enter the OTP" }));
      return;
    }
    if (!newPassword || !validatePassword(newPassword).valid) {
      setErrors((prev) => ({
        ...prev,
        newPassword:
          validatePassword(newPassword).message || "Invalid password",
      }));
      return;
    }
    setLoading(true);
    try {
      await apiService.resetPassword(email, otp, newPassword);
      setStep("done");
      setNotification({
        message: "Password reset successfully!",
        type: "success",
      });
    } catch (error: any) {
      setNotification({
        message: error?.response?.data?.message || "Failed to reset password",
        type: "error",
      });
    }
    setLoading(false);
  };

  return (
    <AuthContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/30 shadow-2xl p-8 w-full max-w-md"
      >
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="bg-gradient-to-br from-primary-600 to-accent-600 p-3 rounded-full mb-3">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-neutral-800">
            Forgot Password
          </h2>
          <p className="text-neutral-600 mt-2">Reset your account password</p>
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
        {step === "email" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendOtp();
            }}
            className="space-y-4"
          >
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              leftIcon={<Mail className="w-5 h-5" />}
            />
            {loading ? (
              <LoadingTruck />
            ) : (
              <Button type="submit" className="w-full">
                Send OTP
              </Button>
            )}
          </form>
        )}
        {step === "otp" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleResetPassword();
            }}
            className="space-y-4"
          >
            <Input
              label="OTP Code"
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              error={errors.otp}
              maxLength={6}
              className="text-center tracking-wider"
            />
            <Input
              label="New Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={errors.newPassword}
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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
            {loading ? (
              <LoadingTruck />
            ) : (
              <Button type="submit" className="w-full">
                Reset Password
              </Button>
            )}
          </form>
        )}
        {step === "done" && (
          <div className="text-center">
            <p className="text-green-600 font-semibold mb-4">
              Password reset successfully!
            </p>
            <Button
              className="w-full"
              onClick={() => (window.location.href = "/login")}
            >
              Back to Login
            </Button>
          </div>
        )}
        {step !== "done" && (
          <div className="mt-4 text-center">
            <Button
              variant="link"
              type="button"
              className="text-primary-600 hover:text-primary-500 font-medium"
              onClick={onToggleForm}
            >
              Back to Login
            </Button>
          </div>
        )}
      </motion.div>
    </AuthContainer>
  );
};

export default ForgotPasswordForm;
