import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Mail,
  ShoppingBag,
  Send,
  Phone,
  Calendar,
  MapPin,
} from "lucide-react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import LoadingTruck from "../ui/LoadingTruck";
import { validateEmail, validatePassword } from "../../lib/utils";
import { apiService } from "../../services/api";

interface RegisterFormProps {
  onToggleForm: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleForm }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showLoadingTruck, setShowLoadingTruck] = useState(false);
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthDate: "",
    address: "",
    password: "",
    confirmPassword: "",
    otp: "",
    form: "",
  });
  const [otpCooldown, setOtpCooldown] = useState(0); // seconds
  const otpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (otpCooldown > 0) {
      otpTimerRef.current = setTimeout(
        () => setOtpCooldown(otpCooldown - 1),
        1000
      );
    }
    return () => {
      if (otpTimerRef.current) clearTimeout(otpTimerRef.current);
    };
  }, [otpCooldown]);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

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
      await apiService.sendRegistrationOtp(email);
      setOtpSent(true);
      setShowOtpInput(true);
      setOtpCooldown(300); // 5 phút
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        form: error?.response?.data?.message || "Failed to send OTP",
      }));
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate form
    const newErrors = {
      firstName: !firstName ? "First name is required" : "",
      lastName: !lastName ? "Last name is required" : "",
      email: !email
        ? "Email is required"
        : !validateEmail(email)
        ? "Please enter a valid email"
        : "",
      phone: !phone ? "Phone is required" : "",
      birthDate: !birthDate ? "Birth date is required" : "",
      address: !address ? "Address is required" : "",
      password: !password
        ? "Password is required"
        : validatePassword(password).valid
        ? ""
        : validatePassword(password).message || "Invalid password",
      confirmPassword: !confirmPassword
        ? "Please confirm your password"
        : password !== confirmPassword
        ? "Passwords do not match"
        : "",
      otp: showOtpInput && !otp ? "Please enter the OTP" : "",
      form: "",
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some((v) => v)) return;
    if (!otpSent) {
      handleSendOtp();
      return;
    }
    if (!otp) {
      setErrors((prev) => ({ ...prev, otp: "Please enter the OTP" }));
      return;
    }
    setLoading(true);
    setShowLoadingTruck(true);
    try {
      await apiService.register({
        firstName,
        lastName,
        email,
        phone,
        birthDate,
        address,
        password,
        otp,
      });
      // TODO: Redirect to login or dashboard
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        form: error?.response?.data?.message || "Registration failed",
      }));
    }
    setLoading(false);
    setShowLoadingTruck(false);
  };

  return (
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
          Create an Account
        </h2>
        <p className="text-sky-300 mt-2">Join our marketplace community</p>
      </div>
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
        <div className="flex gap-2">
          <Input
            label="First Name"
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={errors.firstName}
            leftIcon={<User className="w-5 h-5" />}
          />
          <Input
            label="Last Name"
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={errors.lastName}
            leftIcon={<User className="w-5 h-5" />}
          />
        </div>
        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          leftIcon={<Mail className="w-5 h-5" />}
          rightIcon={
            !otpSent &&
            (loading ? (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <LoadingTruck />
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSendOtp}
                disabled={loading || otpCooldown > 0}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                {otpCooldown > 0
                  ? `Resend OTP (${Math.floor(otpCooldown / 60)}:${(
                      otpCooldown % 60
                    )
                      .toString()
                      .padStart(2, "0")})`
                  : "Send OTP"}
              </Button>
            ))
          }
        />
        <Input
          label="Phone Number"
          type="text"
          placeholder="Your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
          leftIcon={<Phone className="w-5 h-5" />}
        />
        <Input
          label="Birth Date"
          type="date"
          placeholder="YYYY-MM-DD"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          error={errors.birthDate}
          leftIcon={<Calendar className="w-5 h-5" />}
        />
        <Input
          label="Address"
          type="text"
          placeholder="Your address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          error={errors.address}
          leftIcon={<MapPin className="w-5 h-5" />}
        />
        <AnimatePresence>
          {showOtpInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
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
            </motion.div>
          )}
        </AnimatePresence>
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Create a password"
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
        <Input
          label="Confirm Password"
          type={showPassword ? "text" : "password"}
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          leftIcon={<Lock className="w-5 h-5" />}
        />
        <div className="mt-4">
          {showLoadingTruck ? (
            <LoadingTruck />
          ) : (
            <Button type="submit" className="w-full" isLoading={loading}>
              {otpSent ? "Create Account" : "Send OTP"}
            </Button>
          )}
        </div>
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            Already have an account?{" "}
            <Button
              variant="link"
              type="button"
              className="text-primary-600 hover:text-primary-500 font-medium"
              onClick={onToggleForm}
            >
              Sign in
            </Button>
          </p>
        </div>
      </form>
    </motion.div>
  );
};

export default RegisterForm;
