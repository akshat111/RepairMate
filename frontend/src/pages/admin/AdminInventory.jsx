// ═══════════════════════════════════════════════════════
// ADMIN INVENTORY
// ═══════════════════════════════════════════════════════
//
// Inventory backend DOES NOT exist yet.
// This page renders UI structure only — no mock data,
// no fake CRUD, no simulated stock calculations.
// Future-compatible with backend inventory APIs.
// ═══════════════════════════════════════════════════════

const AdminInventory = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Inventory & Stocks</h2>
                    <p className="text-sm text-slate-500 mt-1">Track repair parts and supplies</p>
                </div>
                <button
                    disabled
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed"
                >
                    <span className="material-icons text-lg">add</span>
                    Add Item
                </button>
            </div>

            {/* Summary Cards (structure only) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { icon: 'inventory_2', label: 'Total Items', color: 'from-blue-500 to-blue-600' },
                    { icon: 'warning_amber', label: 'Low Stock', color: 'from-amber-500 to-amber-600' },
                    { icon: 'trending_up', label: 'Total Value', color: 'from-emerald-500 to-emerald-600' },
                ].map((card) => (
                    <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${card.color}`}>
                                <span className="material-icons text-2xl text-white">{card.icon}</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-300">—</p>
                                <p className="text-sm text-slate-500 mt-0.5">{card.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Structure (empty) */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-slate-500 uppercase tracking-wider bg-slate-50/80">
                                <th className="px-6 py-3 font-medium">Part Name</th>
                                <th className="px-6 py-3 font-medium">Category</th>
                                <th className="px-6 py-3 font-medium">SKU</th>
                                <th className="px-6 py-3 font-medium">Stock</th>
                                <th className="px-6 py-3 font-medium">Unit Price</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                    </table>
                </div>

                {/* Empty State */}
                <div className="p-16 text-center">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                        <span className="material-icons text-4xl text-slate-300">inventory_2</span>
                    </div>
                    <p className="text-lg font-semibold text-slate-700">Inventory System Coming Soon</p>
                    <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                        The inventory management backend is currently under development.
                        This page will automatically connect once the APIs are live.
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <div className="inline-flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-200">
                            <span className="material-icons text-sm">construction</span>
                            Backend in development
                        </div>
                        <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
                            <span className="material-icons text-sm">check_circle</span>
                            UI ready for integration
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminInventory;
