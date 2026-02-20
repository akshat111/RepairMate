import { useState, useEffect, useCallback } from 'react';
import inventoryService from '../../services/inventoryService';

// ═══════════════════════════════════════════════════════
// ADMIN INVENTORY
// ═══════════════════════════════════════════════════════

const AdminInventory = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: 'Other',
        quantity: 0,
        unitPrice: 0,
        lowStockThreshold: 5,
    });

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const res = await inventoryService.getAllItems();
            setItems(res.data?.data || []);
            setError(null);
        } catch (err) {
            setError('Failed to load inventory items');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'quantity' || name === 'unitPrice' || name === 'lowStockThreshold'
                ? parseFloat(value) || 0
                : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await inventoryService.updateItem(editingItem._id, formData);
            } else {
                await inventoryService.createItem(formData);
            }
            setIsModalOpen(false);
            setEditingItem(null);
            resetForm();
            fetchItems();
        } catch (err) {
            alert(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await inventoryService.deleteItem(id);
                fetchItems();
            } catch (err) {
                alert('Failed to delete item');
            }
        }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                sku: item.sku,
                category: item.category,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                lowStockThreshold: item.lowStockThreshold,
            });
        } else {
            setEditingItem(null);
            resetForm();
        }
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            sku: '',
            category: 'Other',
            quantity: 0,
            unitPrice: 0,
            lowStockThreshold: 5,
        });
    };

    // Calculate summary stats
    const totalItems = items.length;
    const lowStockItems = items.filter(i => i.quantity <= i.lowStockThreshold).length;
    const totalValue = items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Inventory & Stocks</h2>
                    <p className="text-sm text-slate-500 mt-1">Track repair parts and supplies</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                >
                    <span className="material-icons text-lg">add</span>
                    Add Item
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
                            <span className="material-icons text-2xl text-white">inventory_2</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{totalItems}</p>
                            <p className="text-sm text-slate-500 mt-0.5">Total Items</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600">
                            <span className="material-icons text-2xl text-white">warning_amber</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{lowStockItems}</p>
                            <p className="text-sm text-slate-500 mt-0.5">Low Stock</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-600">
                            <span className="material-icons text-2xl text-white">trending_up</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">₹{totalValue.toLocaleString()}</p>
                            <p className="text-sm text-slate-500 mt-0.5">Total Value</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading inventory...</div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-500">{error}</div>
                    ) : items.length === 0 ? (
                        <div className="p-16 text-center">
                            <span className="material-icons text-4xl text-slate-300">inventory_2</span>
                            <p className="text-sm text-slate-500 mt-2">No items in inventory</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider bg-slate-50/80">
                                    <th className="px-6 py-3 font-medium">Part Name</th>
                                    <th className="px-6 py-3 font-medium">Category</th>
                                    <th className="px-6 py-3 font-medium">SKU</th>
                                    <th className="px-6 py-3 font-medium">Stock</th>
                                    <th className="px-6 py-3 font-medium">Unit Price</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                                        <td className="px-6 py-4 text-slate-600">{item.category}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.sku}</td>
                                        <td className="px-6 py-4 font-semibold text-slate-900">
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">₹{item.unitPrice}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${item.quantity <= item.lowStockThreshold
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                }`}>
                                                {item.quantity <= item.lowStockThreshold ? 'Low Stock' : 'In Stock'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(item)}
                                                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                                >
                                                    <span className="material-icons text-lg">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                                >
                                                    <span className="material-icons text-lg">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-semibold text-slate-900">
                                {editingItem ? 'Edit Item' : 'Add New Item'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Part Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="e.g. iPhone 13 Screen"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                                    <input
                                        type="text"
                                        name="sku"
                                        value={formData.sku}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="e.g. SCR-IP13"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    >
                                        <option value="Screen">Screen</option>
                                        <option value="Battery">Battery</option>
                                        <option value="Charging Port">Charging Port</option>
                                        <option value="Camera">Camera</option>
                                        <option value="Speaker">Speaker</option>
                                        <option value="Motherboard">Motherboard</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Low Stock Alert</label>
                                    <input
                                        type="number"
                                        name="lowStockThreshold"
                                        value={formData.lowStockThreshold}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price (₹)</label>
                                    <input
                                        type="number"
                                        name="unitPrice"
                                        value={formData.unitPrice}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark"
                                >
                                    {editingItem ? 'Save Changes' : 'Add Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInventory;
