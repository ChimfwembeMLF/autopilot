import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  User,
  Mail,
  Phone,
  Edit2,
  Lock,
  Check,
  X,
  Loader2,
  KeyRound,
  Calendar,
  FileText,
  Fingerprint,
  ShieldCheck,
  LogOut,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { updateProfile, changePassword } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileFormValues {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  id_type: string;
  id_number: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string) {
  return !phone || /^\+?[\d\s\-()]{7,15}$/.test(phone);
}

function validatePassword(password: string) {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Must contain an uppercase letter";
  if (!/[0-9]/.test(password)) return "Must contain a number";
  return null;
}

function validateProfileForm(values: ProfileFormValues) {
  const errors: Partial<Record<keyof ProfileFormValues, string>> = {};
  if (!values.first_name.trim()) errors.first_name = "First name is required";
  if (!values.last_name.trim()) errors.last_name = "Last name is required";
  if (!values.username.trim()) errors.username = "Username is required";
  else if (values.username.length < 3) errors.username = "Username must be at least 3 characters";
  if (!values.email.trim()) errors.email = "Email is required";
  else if (!validateEmail(values.email)) errors.email = "Enter a valid email address";
  if (!validatePhone(values.phone)) errors.phone = "Enter a valid phone number";
  return errors;
}

function validatePasswordForm(values: PasswordFormValues) {
  const errors: Partial<Record<keyof PasswordFormValues, string>> = {};
  if (!values.currentPassword) errors.currentPassword = "Current password is required";
  if (!values.newPassword) {
    errors.newPassword = "New password is required";
  } else {
    const pwError = validatePassword(values.newPassword);
    if (pwError) errors.newPassword = pwError;
  }
  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your new password";
  } else if (values.newPassword !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }
  return errors;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-semibold text-foreground truncate mt-0.5">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "••••••••"}
        disabled={disabled}
        className="h-11 rounded-xl bg-muted/30 border-muted pr-10"
        autoComplete="off"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── Profile edit state ──────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [profileErrors, setProfileErrors] = useState<
    Partial<Record<keyof ProfileFormValues, string>>
  >({});
  const [profileForm, setProfileForm] = useState<ProfileFormValues>({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    username: user?.username ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    gender: user?.gender ?? "male",
    date_of_birth: user?.date_of_birth ?? "",
    id_type: user?.id_type ?? "NRC",
    id_number: user?.id_number ?? "",
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // ── Password change state ───────────────────────────────────────────────────
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<
    Partial<Record<keyof PasswordFormValues, string>>
  >({});
  const [passwordForm, setPasswordForm] = useState<PasswordFormValues>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleStartEdit = useCallback(() => {
    setProfileForm({
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      username: user?.username ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      gender: user?.gender ?? "male",
      date_of_birth: user?.date_of_birth ?? "",
      id_type: user?.id_type ?? "NRC",
      id_number: user?.id_number ?? "",
    });
    setProfileErrors({});
    setIsEditing(true);
  }, [user]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setProfileErrors({});
  }, []);

  const handleProfileFieldChange = useCallback(
    (field: keyof ProfileFormValues, value: string) => {
      setProfileForm((prev) => ({ ...prev, [field]: value }));
      // Clear field error on change
      if (profileErrors[field]) {
        setProfileErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [profileErrors]
  );

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateProfileForm(profileForm);
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setUpdatingProfile(true);
    try {
      await updateProfile(profileForm);
      await refreshProfile();
      setIsEditing(false);
      setProfileErrors({});
      toast({ title: "Profile Updated", description: "Your details have been saved." });
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err?.message ?? "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleCancelPassword = useCallback(() => {
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordErrors({});
    setIsChangingPassword(false);
  }, []);

  const handlePasswordFieldChange = useCallback(
    (field: keyof PasswordFormValues, value: string) => {
      setPasswordForm((prev) => ({ ...prev, [field]: value }));
      if (passwordErrors[field]) {
        setPasswordErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [passwordErrors]
  );

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validatePasswordForm(passwordForm);
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await changePassword({
        current_password: passwordForm.currentPassword,
        password: passwordForm.newPassword,
        password_confirmation: passwordForm.confirmPassword,
      });

      if (res?.status === 1) throw new Error(res.message ?? "Invalid current password");

      handleCancelPassword();
      toast({ title: "Password Changed", description: "Your password was updated successfully." });
    } catch (err: any) {
      // Surface specific field error if it's the current password
      const msg: string = err?.message ?? "Invalid current password";
      if (msg.toLowerCase().includes("current") || msg.toLowerCase().includes("incorrect")) {
        setPasswordErrors({ currentPassword: msg });
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      toast({ title: "Error", description: "Failed to sign out.", variant: "destructive" });
    }
  };

  // ── Display data ─────────────────────────────────────────────────────────────

  const personalInfo = [
    { icon: User, label: "First Name", value: user?.first_name ?? "" },
    { icon: User, label: "Last Name", value: user?.last_name ?? "" },
    { icon: User, label: "Username", value: user?.username ?? "" },
    { icon: Mail, label: "Email Address", value: user?.email ?? "" },
    { icon: Phone, label: "Phone Number", value: user?.phone ?? "" },
    { icon: User, label: "Gender", value: user?.gender ?? "" },
    { icon: Calendar, label: "Date of Birth", value: user?.date_of_birth ?? "" },
    { icon: FileText, label: "ID Type", value: user?.id_type ?? "" },
    { icon: Fingerprint, label: "ID Number", value: user?.id_number ?? "" },
  ];

  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "U";
  const isAdmin = user?.type === "COURIER_ADMIN";

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="px-4 pt-6 pb-24 safe-top animate-fade-in space-y-5 max-w-md mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 rounded-xl gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be returned to the login screen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Sign Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* ── Hero ── */}
        <Card className="rounded-3xl border-muted shadow-sm">
          <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
            <Avatar className="h-20 w-20 bg-emerald-500/10">
              <AvatarFallback className="text-2xl font-extrabold text-emerald-600 bg-emerald-500/10">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold leading-tight">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">@{user?.username}</p>
            </div>
            <Badge
              variant="outline"
              className={
                isAdmin
                  ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                  : "text-blue-700 border-blue-200 bg-blue-50"
              }
            >
              {isAdmin ? "Admin" : "Agent"}
            </Badge>
          </CardContent>
        </Card>

        {/* ── Personal Information ── */}
        <Card className="rounded-3xl border-muted shadow-sm">
          <CardHeader className="pb-3 px-5 pt-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                Personal Information
              </CardTitle>
              {!isEditing && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleStartEdit}
                      className="h-8 rounded-lg text-xs font-semibold text-accent hover:bg-accent/5 gap-1"
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit Profile
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit your personal details</TooltipContent>
                </Tooltip>
              )}
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="px-5 pt-4 pb-5">
            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-5 animate-fade-in" noValidate>

                {/* Account Credentials */}
                <section className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-accent/80">
                    Account Credentials
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="username" className="text-[10px] font-bold text-muted-foreground uppercase">
                        Username *
                      </Label>
                      <Input
                        id="username"
                        value={profileForm.username}
                        onChange={(e) => handleProfileFieldChange("username", e.target.value)}
                        className={`h-10 rounded-xl bg-muted/30 border-muted focus:border-accent text-sm ${profileErrors.username ? "border-destructive focus:border-destructive" : ""}`}
                        aria-invalid={!!profileErrors.username}
                        aria-describedby={profileErrors.username ? "username-error" : undefined}
                        disabled={updatingProfile}
                      />
                      <FieldError message={profileErrors.username} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-[10px] font-bold text-muted-foreground uppercase">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => handleProfileFieldChange("email", e.target.value)}
                        className={`h-10 rounded-xl bg-muted/30 border-muted focus:border-accent text-sm ${profileErrors.email ? "border-destructive" : ""}`}
                        aria-invalid={!!profileErrors.email}
                        disabled={updatingProfile}
                      />
                      <FieldError message={profileErrors.email} />
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Personal Details */}
                <section className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-accent/80">
                    Personal Details
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="firstName" className="text-[10px] font-bold text-muted-foreground uppercase">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        value={profileForm.first_name}
                        onChange={(e) => handleProfileFieldChange("first_name", e.target.value)}
                        className={`h-10 rounded-xl bg-muted/30 border-muted focus:border-accent text-sm ${profileErrors.first_name ? "border-destructive" : ""}`}
                        disabled={updatingProfile}
                      />
                      <FieldError message={profileErrors.first_name} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lastName" className="text-[10px] font-bold text-muted-foreground uppercase">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        value={profileForm.last_name}
                        onChange={(e) => handleProfileFieldChange("last_name", e.target.value)}
                        className={`h-10 rounded-xl bg-muted/30 border-muted focus:border-accent text-sm ${profileErrors.last_name ? "border-destructive" : ""}`}
                        disabled={updatingProfile}
                      />
                      <FieldError message={profileErrors.last_name} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-[10px] font-bold text-muted-foreground uppercase">
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => handleProfileFieldChange("phone", e.target.value)}
                        className={`h-10 rounded-xl bg-muted/30 border-muted focus:border-accent text-sm ${profileErrors.phone ? "border-destructive" : ""}`}
                        disabled={updatingProfile}
                      />
                      <FieldError message={profileErrors.phone} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="gender" className="text-[10px] font-bold text-muted-foreground uppercase">
                        Gender
                      </Label>
                      <Select
                        value={profileForm.gender}
                        onValueChange={(v) => handleProfileFieldChange("gender", v)}
                        disabled={updatingProfile}
                      >
                        <SelectTrigger id="gender" className="h-10 rounded-xl bg-muted/30 border-muted text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="dob" className="text-[10px] font-bold text-muted-foreground uppercase">
                      Date of Birth
                    </Label>
                    <Input
                      id="dob"
                      type="date"
                      value={profileForm.date_of_birth}
                      onChange={(e) => handleProfileFieldChange("date_of_birth", e.target.value)}
                      className="h-10 rounded-xl bg-muted/30 border-muted focus:border-accent text-sm"
                      disabled={updatingProfile}
                    />
                  </div>
                </section>

                <Separator />

                {/* Identity Verification */}
                <section className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-accent/80">
                    Identity Verification
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="idType" className="text-[10px] font-bold text-muted-foreground uppercase">
                        ID Type
                      </Label>
                      <Select
                        value={profileForm.id_type}
                        onValueChange={(v) => handleProfileFieldChange("id_type", v)}
                        disabled={updatingProfile}
                      >
                        <SelectTrigger id="idType" className="h-10 rounded-xl bg-muted/30 border-muted text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NRC">NRC</SelectItem>
                          <SelectItem value="Passport">Passport</SelectItem>
                          <SelectItem value="DriversLicense">Driver's License</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="idNumber" className="text-[10px] font-bold text-muted-foreground uppercase">
                        ID Number
                      </Label>
                      <Input
                        id="idNumber"
                        value={profileForm.id_number}
                        onChange={(e) => handleProfileFieldChange("id_number", e.target.value)}
                        className="h-10 rounded-xl bg-muted/30 border-muted focus:border-accent text-sm"
                        disabled={updatingProfile}
                      />
                    </div>
                  </div>
                </section>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={updatingProfile}
                    className="h-10 rounded-xl flex-1 text-xs gap-1"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updatingProfile}
                    className="h-10 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 flex-1 text-xs gap-1"
                  >
                    {updatingProfile ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" /> Save Details
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3.5">
                {personalInfo.map((item) => (
                  <InfoRow key={item.label} {...item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Security & Password ── */}
        <Card className="rounded-3xl border-muted shadow-sm">
          <CardHeader className="pb-3 px-5 pt-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                Security & Credentials
              </CardTitle>
              {!isChangingPassword && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsChangingPassword(true)}
                      className="h-8 rounded-lg text-xs font-semibold text-accent hover:bg-accent/5 gap-1"
                    >
                      <Lock className="h-3 w-3" /> Change Password
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Update your password</TooltipContent>
                </Tooltip>
              )}
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="px-5 pt-4 pb-5">
            {isChangingPassword ? (
              <form onSubmit={handleChangePassword} className="space-y-4 animate-fade-in" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="current-pass" className="text-xs font-semibold text-muted-foreground">
                    Current Password
                  </Label>
                  <PasswordInput
                    id="current-pass"
                    value={passwordForm.currentPassword}
                    onChange={(v) => handlePasswordFieldChange("currentPassword", v)}
                    disabled={updatingPassword}
                  />
                  <FieldError message={passwordErrors.currentPassword} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-pass" className="text-xs font-semibold text-muted-foreground">
                    New Password
                  </Label>
                  <PasswordInput
                    id="new-pass"
                    value={passwordForm.newPassword}
                    onChange={(v) => handlePasswordFieldChange("newPassword", v)}
                    disabled={updatingPassword}
                  />
                  <FieldError message={passwordErrors.newPassword} />
                  {!passwordErrors.newPassword && (
                    <p className="text-[10px] text-muted-foreground">
                      Min 8 characters, one uppercase letter, one number.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pass" className="text-xs font-semibold text-muted-foreground">
                    Confirm New Password
                  </Label>
                  <PasswordInput
                    id="confirm-pass"
                    value={passwordForm.confirmPassword}
                    onChange={(v) => handlePasswordFieldChange("confirmPassword", v)}
                    disabled={updatingPassword}
                  />
                  <FieldError message={passwordErrors.confirmPassword} />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelPassword}
                    disabled={updatingPassword}
                    className="h-10 rounded-xl flex-1 text-xs gap-1"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updatingPassword}
                    className="h-10 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 flex-1 text-xs gap-1"
                  >
                    {updatingPassword ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" /> Update Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Password
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5 tracking-widest">
                    ••••••••••••
                  </p>
                </div>
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}