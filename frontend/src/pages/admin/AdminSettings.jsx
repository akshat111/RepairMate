// ═══════════════════════════════════════════════════════
// ADMIN SETTINGS
// ═══════════════════════════════════════════════════════
//
// Platform configuration page. Shows settings sections
// with current values from backend where available.
// ═══════════════════════════════════════════════════════

const SettingsSection = ({ icon, title, description, children }) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <span className="material-icons text-xl text-slate-600">{icon}</span>
                </div>
                <div>
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                </div>
            </div>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

const SettingsRow = ({ label, value, hint }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
        <div>
            <p className="text-sm font-medium text-slate-700">{label}</p>
            {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
        </div>
        <span className="text-sm text-slate-900 font-medium bg-slate-50 px-3 py-1.5 rounded-lg">{value}</span>
    </div>
);

const AdminSettings = () => {
    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">System Settings</h2>
                <p className="text-sm text-slate-500 mt-1">Platform configuration and preferences</p>
            </div>

            {/* Platform Configuration */}
            <SettingsSection
                icon="tune"
                title="Platform Configuration"
                description="Core platform settings"
            >
                <SettingsRow label="Platform Name" value="RepairMate" />
                <SettingsRow label="Environment" value="Development" hint="Set via NODE_ENV" />
                <SettingsRow label="API Version" value="v1" />
                <SettingsRow label="Payment Gateway" value="Manual" hint="Configurable via PAYMENT_GATEWAY env" />
            </SettingsSection>

            {/* Commission Settings */}
            <SettingsSection
                icon="percent"
                title="Commission Settings"
                description="Revenue sharing configuration"
            >
                <SettingsRow label="Commission Rate" value="15%" hint="Platform commission on each booking" />
                <SettingsRow label="Technician Share" value="85%" hint="Remaining amount goes to technician" />
                <SettingsRow label="Payout Frequency" value="Per-job" hint="Earnings calculated after job completion" />
            </SettingsSection>

            {/* Notification Preferences */}
            <SettingsSection
                icon="notifications"
                title="Notification Preferences"
                description="Alert and notification settings"
            >
                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                        <span className="material-icons text-3xl text-slate-300">notifications_paused</span>
                    </div>
                    <p className="text-sm text-slate-500">Notification preferences are managed via backend configuration</p>
                    <p className="text-xs text-slate-400 mt-1">In-app, email, and SMS channels are available</p>
                </div>
            </SettingsSection>

            {/* Security */}
            <SettingsSection
                icon="security"
                title="Security"
                description="Authentication and authorization"
            >
                <SettingsRow label="Authentication" value="JWT" hint="Access + Refresh token pair" />
                <SettingsRow label="Access Token TTL" value="15 min" />
                <SettingsRow label="Refresh Token TTL" value="7 days" />
                <SettingsRow label="Password Hashing" value="bcrypt (12 rounds)" />
            </SettingsSection>
        </div>
    );
};

export default AdminSettings;
