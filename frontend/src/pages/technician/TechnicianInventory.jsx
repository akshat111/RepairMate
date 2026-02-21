import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const formatCurrency = (amount) => {
    if (amount == null) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
};

const TechnicianInventory = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchInventory = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get('/inventory');

            // Map the raw data to include our derived status property
            const rawItems = res.data?.data || [];
            const mappedItems = rawItems.map(item => ({
                ...item,
                status: item.quantity === 0 ? 'out_of_stock' : (item.quantity <= (item.lowStockThreshold || 5) ? 'low_stock' : 'in_stock')
            }));

            setInventory(mappedItems);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch inventory');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const filteredInventory = inventory.filter(item => {
        const query = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query) ||
            (item.compatibility && item.compatibility.some(m => m.toLowerCase().includes(query)));
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <span className="material-icons-round text-4xl text-primary animate-spin">refresh</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Parts Inventory</h1>
                    <p className="text-slate-500 dark:text-slate-400">Search and check availability of repair parts.</p>
                </div>

                <div className="w-full md:w-72">
                    <div className="relative">
                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Search parts, categories, models..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-slate-900 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-2">
                    <span className="material-icons-round">error</span>
                    {error}
                </div>
            )}

            <div className="bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">Part Name</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Stock</th>
                                <th className="px-6 py-4">Price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {filteredInventory.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        No inventory items found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredInventory.map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                                            {item.compatibility && item.compatibility.length > 0 && (
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                                                    Fits: {item.compatibility.join(', ')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {item.category}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${item.status === 'in_stock'
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                    : item.status === 'low_stock'
                                                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'in_stock' ? 'bg-green-500' : item.status === 'low_stock' ? 'bg-amber-500' : 'bg-red-500'
                                                    }`}></span>
                                                {item.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                            {formatCurrency(item.unitPrice)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <p className="text-xs text-slate-500 text-center mt-4">
                To request parts for a specific job, return to your active jobs tab and add repair notes. Contact the admin for parts physically out of stock.
            </p>
        </div>
    );
};

export default TechnicianInventory;
