import React, { useState } from "react";
import { LogIn, Shield, Users, Mail, Compass, HelpCircle, ArrowRight, Eye, CheckCircle2 } from "lucide-react";
import { SimulatedRoleType, Invite } from "../types";

interface LoginPageProps {
  onGoogleSignIn: () => void;
  onGuestSignIn: (email: string, selectedRole: SimulatedRoleType) => void;
  isFirebaseConfigured: boolean;
  isFirebaseEnabled: boolean;
  invites: Invite[];
}

export default function LoginPage({
  onGoogleSignIn,
  onGuestSignIn,
  isFirebaseConfigured,
  isFirebaseEnabled,
  invites,
}: LoginPageProps) {
  const [emailInput, setEmailInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<SimulatedRoleType>("Admin");
  const [matchedInvite, setMatchedInvite] = useState<Invite | null>(null);
  const [checkedEmail, setCheckedEmail] = useState("");
  const [errorText, setErrorText] = useState("");

  const handleCheckEmailInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    if (!emailInput.trim() || !emailInput.includes("@")) {
      setErrorText("Please specify a valid email address to search for invites.");
      return;
    }

    const email = emailInput.trim().toLowerCase();
    const found = invites.find((inv) => inv.email.toLowerCase() === email && inv.status === "pending");
    
    setCheckedEmail(email);
    if (found) {
      setMatchedInvite(found);
      setSelectedRole(found.role);
    } else {
      setMatchedInvite(null);
    }
  };

  const handleAcceptAndLogin = () => {
    if (matchedInvite && checkedEmail) {
      // Execute role promotion
      onGuestSignIn(checkedEmail, matchedInvite.role);
    }
  };

  const handleStandardGuestLogin = () => {
    if (!emailInput.trim() || !emailInput.includes("@")) {
      setErrorText("Please input a valid email address to log in.");
      return;
    }
    onGuestSignIn(emailInput.trim(), selectedRole);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans select-none" id="login-screen-outer">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative overflow-hidden" id="login-card-container">
        {/* Subtle accent backdrop decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />

        {/* Branding header */}
        <div className="text-center mb-8 pt-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-550 bg-indigo-600 text-white mb-4 shadow-sm shadow-indigo-100">
            <Shield size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
            Campaign Intelligence Copilot
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1 leading-normal uppercase tracking-wider">
            Enterprise Portal &amp; Log Manager
          </p>
        </div>

        {/* Google Sign In option */}
        {isFirebaseConfigured && (
          <div className="mb-6">
            <button
              id="btn_google_signin_primary"
              onClick={onGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-3 px-4 border border-slate-200 rounded-2xl shadow-xs transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Authenticate using Google Workspace</span>
            </button>
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-slate-150" />
              <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or verify email invitation</span>
              <div className="flex-grow border-t border-slate-150" />
            </div>
          </div>
        )}

        {/* Invite verification & Guest login Form */}
        <div className="space-y-5">
          {/* Section info */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 text-left">
            <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-widest block mb-1">
              Simulated Team Environment
            </span>
            <p className="text-[11px] text-indigo-650 text-indigo-700 leading-relaxed">
              Log in with your corporate email address. If an administrator invited you via the User Roles Settings panel, your permissions will be assigned automatically.
            </p>
          </div>

          <form onSubmit={handleCheckEmailInvite} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1 text-left">
                Corporate Email Address
              </label>
              <div className="relative">
                <input
                  id="login_email_input"
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setErrorText("");
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-24 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 block"
                  placeholder="name@company.com"
                />
                <Mail className="absolute left-3.5 top-3.5 text-slate-450 text-slate-400" size={14} />
                <button
                  id="btn_check_invites_trigger"
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase px-3 rounded-lg transition-all cursor-pointer"
                >
                  Verify Access
                </button>
              </div>
              {errorText && <p className="text-[10px] text-rose-500 font-bold mt-1 text-left pl-1">{errorText}</p>}
            </div>
          </form>

          {/* Interactive Case handling of results */}
          {checkedEmail && (
            <div className="border border-dashed border-slate-200 rounded-2xl p-4 text-left animate-fade-in">
              {matchedInvite ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                    <div>
                      <span className="text-xs font-bold text-emerald-800">Pending Invite Discovered!</span>
                      <p className="text-[11px] text-emerald-600 mt-1">
                        You have a pending invitation to join as <span className="font-extrabold">{matchedInvite.role}</span>. Issued by <span className="underline">{matchedInvite.invitedBy}</span>.
                      </p>
                    </div>
                  </div>
                  <button
                    id="btn_accept_role_invite"
                    onClick={handleAcceptAndLogin}
                    className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-[11px] text-white py-2 px-3 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <span>Accept Invite &amp; Establish Profile</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-500">
                    No active pending invites found for <span className="font-semibold text-slate-700">{checkedEmail}</span>. You can establish a new guest profile or proceed with manually simulated capabilities:
                  </p>

                  <div className="grid grid-cols-2 gap-3 pb-1">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">
                        Select Security Profile
                      </label>
                      <select
                        id="login_role_select"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as SimulatedRoleType)}
                        className="w-full bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700 py-2 px-2.5 rounded-xl text-left focus:outline-none cursor-pointer"
                      >
                        <option value="Admin">🛡️ Super Admin</option>
                        <option value="CampaignManager">📣 Campaign Manager</option>
                        <option value="LeadAgent">👥 Sales Lead Agent</option>
                        <option value="Auditor">👁️ View-Only Auditor</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        id="btn_guest_access_submit"
                        type="button"
                        onClick={handleStandardGuestLogin}
                        className="w-full bg-indigo-650 bg-indigo-600 hover:bg-indigo-755 hover:bg-indigo-700 text-white font-bold text-[11px] py-2 px-2 rounded-xl text-center cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>Establish Access</span>
                        <ArrowRight size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info about sandbox mode */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between text-[10px] text-slate-400 font-medium">
          <div className="flex items-center gap-1">
            <Compass size={11} />
            <span>Sandbox Mode Enabled</span>
          </div>
          <div className="flex items-center gap-1">
            <HelpCircle size={11} />
            <span>Support: gouthamarun123@gmail.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
