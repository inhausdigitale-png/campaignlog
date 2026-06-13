import React, { useState } from "react";
import { UserRolePermission, SimulatedRoleType } from "../types";
import { Shield, ShieldAlert, Check, RotateCcw, Save, Trash, Plus, Info } from "lucide-react";
import { ROLE_PERMISSIONS } from "../utils/indiaHelpers";

interface UserRolesSettingsProps {
  rolePermissions: Record<string, UserRolePermission>;
  onSaveRolePermissions: (permissions: Record<string, UserRolePermission>) => void;
  userRole: SimulatedRoleType;
  onSetUserRole: (role: SimulatedRoleType) => void;
  bypassSecurity: boolean;
  onToggleBypassSecurity: () => void;
}

export default function UserRolesSettings({
  rolePermissions,
  onSaveRolePermissions,
  userRole,
  onSetUserRole,
  bypassSecurity,
  onToggleBypassSecurity,
}: UserRolesSettingsProps) {
  const [selectedRole, setSelectedRole] = useState<string>(userRole);
  const [editedPermissions, setEditedPermissions] = useState<Record<string, UserRolePermission>>({ ...rolePermissions });
  const [isSaved, setIsSaved] = useState(false);

  // States for adding a custom role
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleLabel, setNewRoleLabel] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const activeRoleConfig = editedPermissions[selectedRole] || ROLE_PERMISSIONS.Admin;

  const handlePermissionToggle = (key: keyof Omit<UserRolePermission, "role" | "label" | "description">) => {
    const updated = {
      ...editedPermissions,
      [selectedRole]: {
        ...activeRoleConfig,
        [key]: !activeRoleConfig[key],
      },
    };
    setEditedPermissions(updated);
    setIsSaved(false);
  };

  const handleTextChange = (field: "label" | "description", value: string) => {
    const updated = {
      ...editedPermissions,
      [selectedRole]: {
        ...activeRoleConfig,
        [field]: value,
      },
    };
    setEditedPermissions(updated);
    setIsSaved(false);
  };

  const handleSaveAll = () => {
    onSaveRolePermissions(editedPermissions);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleResetToDefaults = () => {
    if (window.confirm("Are you sure you want to reset all role security policies to factory defaults? Any custom roles will be deleted.")) {
      setEditedPermissions(ROLE_PERMISSIONS);
      onSaveRolePermissions(ROLE_PERMISSIONS);
      setSelectedRole("Admin");
      onSetUserRole("Admin");
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const handleAddCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const formattedKey = newRoleName.replace(/\s+/g, "");
    if (editedPermissions[formattedKey]) {
      alert("A role with this key or name already exists.");
      return;
    }

    const newRole: UserRolePermission = {
      role: formattedKey as any,
      label: newRoleLabel || newRoleName,
      description: newRoleDesc || "Custom security restriction policy.",
      canCreateCampaigns: false,
      canEditCampaigns: false,
      canDeleteCampaigns: false,
      canCreateCreatives: false,
      canDeleteCreatives: false,
      canAnalyzeCreatives: false,
      canManageLeads: false,
      canDeleteLeads: false,
      canManageTargets: false,
      canDeleteTargets: false,
      canManageRules: false,
    };

    const updated = {
      ...editedPermissions,
      [formattedKey]: newRole,
    };

    setEditedPermissions(updated);
    onSaveRolePermissions(updated);
    setSelectedRole(formattedKey);
    setNewRoleName("");
    setNewRoleLabel("");
    setNewRoleDesc("");
    setShowAddModal(false);
    
    // Select this newly added role too
    alert(`Success: Custom Role "${newRole.label}" successfully provisioned.`);
  };

  const handleDeleteCustomRole = (roleKey: string) => {
    if (["Admin", "CampaignManager", "LeadAgent", "Auditor"].includes(roleKey)) {
      alert("System predefined roles cannot be deleted.");
      return;
    }

    if (window.confirm(`Are you sure you want to completely delete the custom role "${roleKey}"?`)) {
      const updated = { ...editedPermissions };
      delete updated[roleKey];
      setEditedPermissions(updated);
      onSaveRolePermissions(updated);
      setSelectedRole("Admin");
      onSetUserRole("Admin");
    }
  };

  const permissionList: { key: keyof Omit<UserRolePermission, "role" | "label" | "description">; label: string; desc: string }[] = [
    { key: "canCreateCampaigns", label: "Create Campaigns", desc: "Allows creating new marketing campaign records." },
    { key: "canEditCampaigns", label: "Edit Campaigns", desc: "Allows modification of existing analytics and budgets." },
    { key: "canDeleteCampaigns", label: "Purge/Delete Campaigns", desc: "Dangerous permission. Allows wiping campaigns and change logs." },
    { key: "canCreateCreatives", label: "Create Creative Variations", desc: "Allows registering and generation of AI ad copies." },
    { key: "canDeleteCreatives", label: "Delete Creatives", desc: "Allows deleting banner variations and media uploads." },
    { key: "canAnalyzeCreatives", label: "Trigger AI Creative Analysis", desc: "Allows calling the intelligent model scoring analysis hooks." },
    { key: "canManageLeads", label: "Manage Leads Profile", desc: "Allows editing Lead Status pipeline details." },
    { key: "canDeleteLeads", label: "Delete Leads", desc: "Allows deleting prospective lead database profiles." },
    { key: "canManageTargets", label: "Manage Weekly Sla Budgets", desc: "Allows modification of strategic target models." },
    { key: "canDeleteTargets", label: "Delete Target Budgets", desc: "Allows flushing budget goals." },
    { key: "canManageRules", label: "Configure Core Rules", desc: "Allows editing the primary CPA & ROAS algorithm configurations." },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-fade-in" id="user-roles-settings-container">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="text-indigo-600" size={20} />
            <h2 className="text-base font-bold text-slate-800 font-sans">User Roles &amp; Permissions Configurator</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure system-wide granular security restrictions. Tailor access rules and assign active policies dynamically.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="role_btn_add_custom"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs py-2 px-3 border border-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Custom Role</span>
          </button>
          
          <button
            id="role_btn_reset_defaults"
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-xs py-2 px-3 border border-slate-200 rounded-xl transition-all cursor-pointer"
            title="Reset all configs to factory default"
          >
            <RotateCcw size={13} />
            <span>Reset Policies</span>
          </button>
        </div>
      </div>

      {/* Production & Debug Settings Section */}
      <div className="my-5 p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-bold text-slate-800">Production Mode Enforcement Settings</h3>
            <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider">Live</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            When developer bypass is disabled, all restrictions governed by the selected role are fully active and enforced client-side.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="role_btn_toggle_bypass"
            onClick={onToggleBypassSecurity}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
              bypassSecurity
                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            <ShieldAlert size={15} className={bypassSecurity ? "text-amber-500 animate-pulse" : "text-emerald-500"} />
            <div>
              <span className="block text-left text-[9.5px] uppercase tracking-wider font-semibold opacity-75">Bypass Developer Overrides</span>
              <span>{bypassSecurity ? "Bypass is active (Sandbox mode relaxed)" : "Enforced (Granular Policies Active)"}</span>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation role list side panel */}
        <div className="lg:col-span-1 space-y-2 border-r border-slate-100 pr-0 lg:pr-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-1">
            Available Profiles / Access Keys
          </span>
          <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 pb-2 lg:pb-0">
            {Object.keys(editedPermissions).map((roleKey) => {
              const r = editedPermissions[roleKey];
              const isPredefined = ["Admin", "CampaignManager", "LeadAgent", "Auditor"].includes(roleKey);
              const isActiveUserRole = userRole === roleKey;
              const isCurrentlySelected = selectedRole === roleKey;

              return (
                <button
                  key={roleKey}
                  id={`role_item_${roleKey}`}
                  onClick={() => setSelectedRole(roleKey)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl transition-all cursor-pointer flex flex-col relative min-w-[150px] lg:min-w-0 ${
                    isCurrentlySelected
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/50"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold leading-none">{r.label}</span>
                    {isActiveUserRole && (
                      <span className={`text-[8px] font-extrabold uppercase py-0.5 px-1.5 rounded-full ${
                        isCurrentlySelected ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
                      }`}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <span className={`text-[9.5px] mt-1 line-clamp-1 ${isCurrentlySelected ? "text-white/80" : "text-slate-400"}`}>
                    {r.description}
                  </span>
                  {!isPredefined && (
                    <button
                      id={`delete_role_${roleKey}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomRole(roleKey);
                      }}
                      className={`absolute right-2 bottom-2 p-1 rounded-md hover:bg-rose-500 hover:text-white transition-all ${
                        isCurrentlySelected ? "text-white/60" : "text-slate-400"
                      }`}
                      title="Delete Custom Role"
                    >
                      <Trash size={11} />
                    </button>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-left">
            <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-widest block mb-1">Set Your Profile Role</span>
            <p className="text-[10px] text-indigo-600 leading-relaxed mb-3">
              Switching your active profile instantly enforces security policies related to that specific credentials hierarchy in checkout screens.
            </p>
            <select
              id="role_select_user_profile"
              value={userRole}
              onChange={(e) => {
                const trg = e.target.value as SimulatedRoleType;
                onSetUserRole(trg);
                setSelectedRole(trg);
              }}
              className="w-full bg-white text-xs font-bold border border-indigo-200 text-indigo-900 py-1.5 px-2.5 rounded-lg shadow-xs focus:ring focus:ring-indigo-200 focus:outline-none cursor-pointer"
            >
              {Object.keys(editedPermissions).map((rk) => (
                <option value={rk} key={rk}>
                  👤 Act as: {editedPermissions[rk].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Configurations edit grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-50/60 border border-slate-200/60 p-4 rounded-xl">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs mb-3">
              <Info size={14} className="text-slate-500" />
              <span>General Description Settings</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Role Label name
                </label>
                <input
                  id="role_input_label_edit"
                  type="text"
                  value={activeRoleConfig.label}
                  onChange={(e) => handleTextChange("label", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-3xs"
                  placeholder="Role Display Name"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Scope Summary / Description
                </label>
                <input
                  id="role_input_desc_edit"
                  type="text"
                  value={activeRoleConfig.description}
                  onChange={(e) => handleTextChange("description", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-600 focus:outline-none focus:border-indigo-500 shadow-3xs"
                  placeholder="Summarize role bounds..."
                />
              </div>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3 pl-1">
              Grantable Permissions policy Matrix
            </span>

            <div className="bg-white border border-slate-150 rounded-xl overflow-hidden divide-y divide-slate-100">
              {permissionList.map((perm) => {
                const isChecked = activeRoleConfig[perm.key];
                return (
                  <div
                    key={perm.key}
                    id={`perm_row_${perm.key}`}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-all gap-4"
                  >
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-700 block">{perm.label}</span>
                      <span className="text-[11px] text-slate-400 leading-none mt-0.5 block">{perm.desc}</span>
                    </div>

                    <button
                      id={`perm_toggle_${perm.key}`}
                      onClick={() => handlePermissionToggle(perm.key)}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                        isChecked ? "bg-indigo-600 justify-end" : "bg-slate-200 justify-start"
                      }`}
                    >
                      <span className="bg-white w-4 h-4 rounded-full shadow-xs transition-all pointer-events-none block" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              id="role_btn_save_configs"
              onClick={handleSaveAll}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs py-2 px-5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Save size={13} />
              <span>{isSaved ? "Saved Successfully!" : "Save Policy Alterations"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Custom Role Modal Frame overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl animate-scale-up" id="role-add-modal-overlay">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="text-indigo-600" size={18} />
              <h3 className="text-sm font-bold text-slate-800">Provision a custom Security Role</h3>
            </div>

            <form onSubmit={handleAddCustomRole} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Unique Role Key Name (no spaces)
                </label>
                <input
                  id="modal_role_key_input"
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. AgencySuper"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Display Label Friendly Name
                </label>
                <input
                  id="modal_role_label_input"
                  type="text"
                  required
                  value={newRoleLabel}
                  onChange={(e) => setNewRoleLabel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-755 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Media Buying Agency Lead"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Description / Bounds summary
                </label>
                <textarea
                  id="modal_role_desc_input"
                  rows={2}
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Provide brief outline on role constraints..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  id="modal_btn_close_role"
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2 px-4 rounded-xl text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200/50 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="modal_btn_submit_role"
                  type="submit"
                  className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-indigo-650 bg-indigo-600 hover:bg-indigo-750 transition-all cursor-pointer"
                >
                  Provision Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
