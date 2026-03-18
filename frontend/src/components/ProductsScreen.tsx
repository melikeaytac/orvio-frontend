import { useEffect, useMemo, useState } from 'react';
import { Edit2, Package, Plus, Search, Trash2, X } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { EmptyState } from './ui/empty-state';
import { ExportButton } from './ui/export-button';
import { TableSkeleton } from './ui/table-skeleton';
import {
  AdminDevice,
  BrandItem,
  ProductItem,
  assignCoolerProduct,
  createProduct,
  deleteProduct,
  getAdminDevices,
  getBrands,
  getCoolerProducts,
  getCurrentUserRole,
  getProducts,
  removeCoolerProduct,
  updateProduct,
} from '../api/client';

interface ProductsScreenProps {
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

interface ProductFormData {
  name: string;
  brand_id: string;
  ai_label: string;
  unit_price: string;
  image_reference: string;
  is_active: boolean;
  assignedFridges: string[];
}

const emptyFormData: ProductFormData = {
  name: '',
  brand_id: '',
  ai_label: '',
  unit_price: '',
  image_reference: '',
  is_active: true,
  assignedFridges: [],
};

export default function ProductsScreen({ onLogout, onNavigate }: ProductsScreenProps) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [devices, setDevices] = useState<AdminDevice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fridgeSearchQuery, setFridgeSearchQuery] = useState('');

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null);
  const [originalAssignedFridges, setOriginalAssignedFridges] = useState<string[]>([]);

  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const currentRole = getCurrentUserRole();
  const isSystemAdmin = currentRole === '1' || currentRole === 'SYSTEM_ADMIN';

  const fetchCatalog = async () => {
    const [productsRes, brandsRes, devicesRes] = await Promise.all([
      getProducts({ limit: 100 }),
      getBrands({ limit: 100 }),
      getAdminDevices({ limit: 100 }),
    ]);

    setProducts(productsRes.data);
    setBrands(brandsRes.data);
    setDevices(devicesRes.data);
  };

  const loadAssignmentsForProduct = async (productId: string, sourceDevices?: AdminDevice[]) => {
    const deviceList = sourceDevices || devices;
    if (deviceList.length === 0) return [];

    const assignmentResults = await Promise.all(
      deviceList.map((device) => getCoolerProducts(device.device_id, { limit: 100 }).catch(() => ({ data: [] }))),
    );

    return assignmentResults
      .map((response, index) => {
        const match = response.data.find((item) => item.product_id === productId);
        return match ? deviceList[index].device_id : null;
      })
      .filter((item): item is string => item !== null);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        await fetchCatalog();
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load products');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const productStatus = (product: ProductItem) => (product.is_active === false ? 'Passive' : 'Active');
  const statusColor = (status: 'Active' | 'Passive') => (status === 'Active' ? '#10B981' : '#9CA3AF');

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

        const brandName = product.brand?.brand_name || '';
        const aiLabel = product.ai_label || '';
        return (
          product.name.toLowerCase().includes(query) ||
          brandName.toLowerCase().includes(query) ||
          aiLabel.toLowerCase().includes(query)
        );
      }),
    [products, searchQuery],
  );

  const filteredFridges = useMemo(() => {
    const query = fridgeSearchQuery.toLowerCase().trim();
    const base = !query
      ? devices
      : devices.filter((device) => (device.name || device.device_id).toLowerCase().includes(query));

    return [...base].sort((a, b) => {
      const aSelected = formData.assignedFridges.includes(a.device_id);
      const bSelected = formData.assignedFridges.includes(b.device_id);
      if (aSelected === bSelected) return 0;
      return aSelected ? -1 : 1;
    });
  }, [devices, fridgeSearchQuery, formData.assignedFridges]);

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingProduct(null);
    setOriginalAssignedFridges([]);
    setFridgeSearchQuery('');
    setFormData(emptyFormData);
  };

  const openCreateModal = () => {
    if (!isSystemAdmin) return;
    setEditingProduct(null);
    setOriginalAssignedFridges([]);
    setFridgeSearchQuery('');
    setFormData(emptyFormData);
    setError('');
    setMessage('');
    setShowFormModal(true);
  };

  const openEditModal = async (product: ProductItem) => {
    if (!isSystemAdmin) return;

    setError('');
    setMessage('');
    setEditingProduct(product);
    setShowFormModal(true);
    setFridgeSearchQuery('');

    const productAssignments = await loadAssignmentsForProduct(product.product_id);
    setOriginalAssignedFridges(productAssignments);

    setFormData({
      name: product.name,
      brand_id: product.brand_id,
      ai_label: product.ai_label || '',
      unit_price: String(product.unit_price),
      image_reference: product.image_reference || '',
      is_active: product.is_active !== false,
      assignedFridges: productAssignments,
    });
  };

  const handleFridgeToggle = (fridgeId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedFridges: prev.assignedFridges.includes(fridgeId)
        ? prev.assignedFridges.filter((id) => id !== fridgeId)
        : [...prev.assignedFridges, fridgeId],
    }));
  };

  const handleSelectAllFridges = () => {
    setFormData((prev) => ({
      ...prev,
      assignedFridges: devices.map((device) => device.device_id),
    }));
  };

  const handleClearFridges = () => {
    setFormData((prev) => ({ ...prev, assignedFridges: [] }));
  };

  const handleSaveProduct = async () => {
    if (!isSystemAdmin) return;

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const unitPrice = Number(formData.unit_price);
      if (!formData.name.trim() || !formData.brand_id || !formData.ai_label.trim() || Number.isNaN(unitPrice)) {
        setError('Name, brand, AI label and valid unit price are required');
        return;
      }

      if (editingProduct) {
        await updateProduct(editingProduct.product_id, {
          name: formData.name.trim(),
          brand_id: formData.brand_id,
          ai_label: formData.ai_label.trim(),
          unit_price: unitPrice,
          image_reference: formData.image_reference.trim() || undefined,
          is_active: formData.is_active,
        });

        const currentIds = new Set(originalAssignedFridges);
        const nextIds = new Set(formData.assignedFridges);
        const toAdd = Array.from(nextIds).filter((deviceId) => !currentIds.has(deviceId));
        const toRemove = Array.from(currentIds).filter((deviceId) => !nextIds.has(deviceId));

        if (toAdd.length > 0) {
          await Promise.all(
            toAdd.map((deviceId) =>
              assignCoolerProduct(deviceId, {
                product_id: editingProduct.product_id,
              }),
            ),
          );
        }

        if (toRemove.length > 0) {
          await Promise.all(toRemove.map((deviceId) => removeCoolerProduct(deviceId, editingProduct.product_id)));
        }

        setMessage('Product updated');
      } else {
        const created = await createProduct({
          name: formData.name.trim(),
          brand_id: formData.brand_id,
          ai_label: formData.ai_label.trim(),
          unit_price: unitPrice,
          image_reference: formData.image_reference.trim() || undefined,
          is_active: formData.is_active,
        });

        if (formData.assignedFridges.length > 0) {
          await Promise.all(
            formData.assignedFridges.map((deviceId) =>
              assignCoolerProduct(deviceId, {
                product_id: created.product_id,
              }),
            ),
          );
        }

        setMessage('Product created');
      }

      await fetchCatalog();
      closeFormModal();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Save failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (product: ProductItem) => {
    if (!isSystemAdmin) return;
    setDeletingProduct(product);
    setShowDeleteModal(true);
    setError('');
    setMessage('');
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct || !isSystemAdmin) return;

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      await deleteProduct(deletingProduct.product_id);
      setShowDeleteModal(false);
      setDeletingProduct(null);
      setMessage('Product deleted');
      await fetchCatalog();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = (format: 'csv' | 'png' | 'pdf') => {
    if (format !== 'csv') {
      window.alert(`Exporting as ${format.toUpperCase()}...`);
      return;
    }

    const headers = ['Product Name', 'Brand', 'AI Label', 'Unit Price', 'Status'];
    const rows = products.map((product) => [
      product.name,
      product.brand?.brand_name || '',
      product.ai_label || '',
      Number(product.unit_price).toFixed(2),
      productStatus(product),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      <Sidebar activePage="Products" onNavigate={onNavigate} />

      <div className="flex-1 flex flex-col">
        <Topbar onLogout={onLogout} pageTitle="Products" />

        <main style={{ padding: '24px' }}>
          {(message || error) && (
            <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
              {message && (
                <div style={{ backgroundColor: '#ECFDF3', color: '#027A48', borderRadius: '8px', padding: '10px 12px', fontSize: '14px' }}>
                  {message}
                </div>
              )}
              {error && (
                <div style={{ backgroundColor: '#FEF3F2', color: '#B42318', borderRadius: '8px', padding: '10px 12px', fontSize: '14px' }}>
                  {error}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
            <div className="relative">
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9CA3AF',
                }}
              />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{
                  width: '300px',
                  height: '40px',
                  paddingLeft: '40px',
                  paddingRight: '12px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                }}
              />
            </div>

            <div className="flex items-center gap-4">
              <ExportButton onExport={handleExport} disabled={products.length === 0} />
              {isSystemAdmin && (
                <button
                  onClick={openCreateModal}
                  className="flex items-center gap-2 transition-colors hover:bg-blue-700"
                  style={{
                    height: '40px',
                    padding: '0 16px',
                    backgroundColor: '#2563EB',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={18} />
                  Create Product
                </button>
              )}
            </div>
          </div>

          <div
            className="bg-white"
            style={{
              borderRadius: '12px',
              boxShadow: '0 3px 8px rgba(0,0,0,0.05)',
              padding: '24px',
              overflow: 'auto',
              minHeight: '400px',
            }}
          >
            {isLoading ? (
              <TableSkeleton columns={isSystemAdmin ? 6 : 5} />
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                icon={<Package size={48} strokeWidth={1.5} style={{ color: '#D1D5DB' }} />}
                title={searchQuery ? 'No products found' : 'No products yet'}
                description={searchQuery ? 'Try adjusting your search criteria.' : 'Get started by creating your first product.'}
              />
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>Product Name</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>Brand</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>AI Label</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>Unit Price</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>Status</th>
                    {isSystemAdmin && (
                      <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => {
                    const status = productStatus(product);
                    const color = statusColor(status);

                    return (
                      <tr
                        key={product.product_id}
                        style={{ borderBottom: index < filteredProducts.length - 1 ? '1px solid #F3F4F6' : 'none' }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.backgroundColor = '#F9FAFB';
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td style={{ padding: '16px 8px', fontSize: '14px', fontWeight: 500, color: '#1A1C1E' }}>{product.name}</td>
                        <td style={{ padding: '16px 8px', fontSize: '14px', color: '#6B7280' }}>{product.brand?.brand_name || '-'}</td>
                        <td style={{ padding: '16px 8px' }}>
                          <code
                            style={{
                              fontSize: '13px',
                              color: '#2563EB',
                              backgroundColor: '#EFF6FF',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            {product.ai_label || '-'}
                          </code>
                        </td>
                        <td style={{ padding: '16px 8px', fontSize: '14px', fontWeight: 600, color: '#1A1C1E', textAlign: 'right' }}>
                          ${Number(product.unit_price).toFixed(2)}
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color,
                              backgroundColor: `${color}15`,
                            }}
                          >
                            {status}
                          </span>
                        </td>
                        {isSystemAdmin && (
                          <td style={{ padding: '16px 8px' }}>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => void openEditModal(product)}
                                className="transition-colors hover:bg-blue-100 rounded p-2"
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                title="Edit"
                              >
                                <Edit2 size={16} style={{ color: '#2563EB' }} />
                              </button>
                              <button
                                onClick={() => openDeleteModal(product)}
                                className="transition-colors hover:bg-red-100 rounded p-2"
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                title="Delete"
                              >
                                <Trash2 size={16} style={{ color: '#DC2626' }} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {showFormModal && isSystemAdmin && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeFormModal}
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          />

          <div
            className="fixed z-50 bg-white"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1C1E' }}>
                {editingProduct ? 'Edit Product' : 'Create New Product'}
              </h3>
              <button
                onClick={closeFormModal}
                className="transition-colors hover:bg-gray-100 rounded p-1"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} style={{ color: '#6B7280' }} />
              </button>
            </div>

            <div>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#1A1C1E', marginBottom: '12px' }}>Product Information</h4>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1C1E', marginBottom: '6px' }}>Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                    className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    style={{ height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
                    placeholder="e.g., Coca Cola 330ml"
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1C1E', marginBottom: '6px' }}>Brand *</label>
                  <select
                    value={formData.brand_id}
                    onChange={(event) => setFormData((prev) => ({ ...prev, brand_id: event.target.value }))}
                    className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    style={{
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      cursor: 'pointer',
                      color: formData.brand_id ? '#1A1C1E' : '#9CA3AF',
                    }}
                  >
                    <option value="">Select brand</option>
                    {brands.map((brand) => (
                      <option key={brand.brand_id} value={brand.brand_id}>
                        {brand.brand_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1C1E', marginBottom: '6px' }}>Unit Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(event) => setFormData((prev) => ({ ...prev, unit_price: event.target.value }))}
                    className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    style={{ height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
                    placeholder="0.00"
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1C1E', marginBottom: '6px' }}>AI Label *</label>
                  <input
                    type="text"
                    value={formData.ai_label}
                    onChange={(event) => setFormData((prev) => ({ ...prev, ai_label: event.target.value }))}
                    className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    style={{ height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
                    placeholder="e.g., coca_cola_can_330ml"
                  />
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px', fontStyle: 'italic' }}>
                    Must match AI model output label exactly
                  </p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1C1E', marginBottom: '6px' }}>Image URL (optional)</label>
                  <input
                    type="text"
                    value={formData.image_reference}
                    onChange={(event) => setFormData((prev) => ({ ...prev, image_reference: event.target.value }))}
                    className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    style={{ height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1C1E', marginBottom: '6px' }}>Status</label>
                  <select
                    value={formData.is_active ? 'Active' : 'Passive'}
                    onChange={(event) => setFormData((prev) => ({ ...prev, is_active: event.target.value === 'Active' }))}
                    className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    style={{ height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', cursor: 'pointer' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Passive">Passive</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#1A1C1E' }}>Fridge Assignment</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAllFridges}
                      className="transition-colors hover:bg-gray-100"
                      style={{ fontSize: '12px', color: '#2563EB', padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleClearFridges}
                      className="transition-colors hover:bg-gray-100"
                      style={{ fontSize: '12px', color: '#6B7280', padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                  Selected: {formData.assignedFridges.length} of {devices.length}
                </p>

                <div className="relative" style={{ marginBottom: '8px' }}>
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9CA3AF',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search fridges..."
                    value={fridgeSearchQuery}
                    onChange={(event) => setFridgeSearchQuery(event.target.value)}
                    className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    style={{ height: '36px', paddingLeft: '34px', paddingRight: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px' }}
                  />
                </div>

                <div className="border rounded-lg p-3" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #D1D5DB' }}>
                  {filteredFridges.map((fridge) => (
                    <label key={fridge.device_id} className="flex items-center gap-2 cursor-pointer mb-2 last:mb-0">
                      <input
                        type="checkbox"
                        checked={formData.assignedFridges.includes(fridge.device_id)}
                        onChange={() => handleFridgeToggle(fridge.device_id)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', color: '#1A1C1E' }}>
                        {fridge.device_id} - {fridge.name || 'Unnamed fridge'}
                      </span>
                    </label>
                  ))}
                  {filteredFridges.length === 0 && (
                    <p style={{ fontSize: '13px', color: '#6B7280' }}>No fridge found for this search.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3" style={{ marginTop: '24px' }}>
              <button
                onClick={closeFormModal}
                className="flex-1 transition-colors hover:bg-gray-100"
                style={{ height: '40px', backgroundColor: 'transparent', color: '#6B7280', fontSize: '14px', fontWeight: 600, borderRadius: '8px', border: '1px solid #D1D5DB', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSaveProduct()}
                disabled={isSubmitting}
                className="flex-1 transition-colors hover:bg-blue-700"
                style={{ height: '40px', backgroundColor: '#2563EB', color: 'white', fontSize: '14px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer' }}
              >
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </div>
        </>
      )}

      {showDeleteModal && deletingProduct && isSystemAdmin && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDeleteModal(false)}
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          />

          <div
            className="fixed z-50 bg-white"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '420px',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1C1E' }}>Delete Product</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="transition-colors hover:bg-gray-100 rounded p-1"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} style={{ color: '#6B7280' }} />
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.5' }}>Are you sure you want to delete this product?</p>
              <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '8px', lineHeight: '1.5' }}>This action cannot be undone.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 transition-colors hover:bg-gray-100"
                style={{ height: '40px', backgroundColor: 'transparent', color: '#6B7280', fontSize: '14px', fontWeight: 600, borderRadius: '8px', border: '1px solid #D1D5DB', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleConfirmDelete()}
                disabled={isSubmitting}
                className="flex-1 transition-colors hover:bg-red-700"
                style={{ height: '40px', backgroundColor: '#DC2626', color: 'white', fontSize: '14px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
