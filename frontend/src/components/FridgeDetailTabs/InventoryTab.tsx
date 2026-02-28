import { useEffect, useMemo, useState } from 'react';
import { Package } from 'lucide-react';
import { EmptyState } from '../ui/empty-state';
import { TableSkeleton } from '../ui/table-skeleton';
import { getDeviceInventory } from '../../api/client';

interface InventoryTabProps {
  fridgeId: string;
  isLoading?: boolean;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  threshold: number;
  category: string;
  image?: string;
}

export default function InventoryTab({ fridgeId, isLoading = false }: InventoryTabProps) {
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isFetching, setIsFetching] = useState(false);



  useEffect(() => {
    let isMounted = true;
    const loadInventory = async () => {
      setIsFetching(true);
      try {
        const response = await getDeviceInventory(fridgeId, { limit: 100 });
        const inventory = response.data;
        const mapped = inventory.map((item) => ({
          id: item.product_id,
          name: item.product_name,
          sku: item.product_id.slice(0, 8).toUpperCase(),
          quantity: item.current_stock,
          threshold: item.critic_stock,
          category: item.brand_name || 'Uncategorized',
        }));
        if (isMounted) {
          setProducts(mapped);
        }
      } catch (error) {
        console.error('Failed to load inventory', error);
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setIsFetching(false);
      }
    };

    loadInventory();
    return () => {
      isMounted = false;
    };
  }, [fridgeId]);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((product) => product.category))).sort();
  }, [products]);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    const matchesLowStock = !showLowStockOnly || product.quantity < product.threshold;
    return matchesCategory && matchesLowStock;
  });

  const getStatus = (quantity: number, threshold: number) => {
    return quantity >= threshold ? 'OK' : 'Low';
  };

  const getStatusColor = (status: string) => {
    return status === 'OK' ? '#10B981' : '#DC2626';
  };

  return (
    <div
      className="bg-white"
      style={{
        width: '100%',
        minHeight: '360px',
        borderRadius: '12px',
        boxShadow: '0 3px 8px rgba(0,0,0,0.05)',
        padding: '24px'
      }}
    >
      {/* Header with Filters */}
      <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1C1E' }}>
          Inventory
        </h2>

        <div className="flex items-center gap-3">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            style={{
              width: '160px',
              height: '36px',
              padding: '0 12px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {/* Low Stock Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer'
              }}
            />
            <span style={{ fontSize: '14px', color: '#6B7280' }}>
              Show only low stock
            </span>
          </label>
        </div>
      </div>

      {/* Products Table */}
      <div style={{ overflowX: 'auto' }}>
        {isLoading ? (
          <TableSkeleton columns={5} rows={5} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState 
            title="No products found"
            description="No inventory items match the selected filters."
            icon={<Package size={48} strokeWidth={1.5} />}
          />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                  Product
                </th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                  SKU
                </th>
                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                  Quantity
                </th>
                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                  Threshold
                </th>
                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => {
                const status = getStatus(product.quantity, product.threshold);
                return (
                  <tr
                    key={product.id}
                    className="transition-colors"
                    style={{
                      borderBottom: index < filteredProducts.length - 1 ? '1px solid #F3F4F6' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '16px 8px' }}>
                      <div className="flex items-center gap-3">
                        {/* Product Image */}
                        <div
                          className="flex items-center justify-center"
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '8px',
                            backgroundColor: '#F3F4F6'
                          }}
                        >
                          <Package size={24} style={{ color: '#9CA3AF' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: '#1A1C1E' }}>
                            {product.name}
                          </p>
                          <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
                            {product.category}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 8px', fontSize: '14px', color: '#6B7280' }}>
                      {product.sku}
                    </td>
                    <td style={{ padding: '16px 8px', fontSize: '14px', fontWeight: 600, color: '#1A1C1E', textAlign: 'center' }}>
                      {product.quantity}
                    </td>
                    <td style={{ padding: '16px 8px', fontSize: '14px', color: '#6B7280', textAlign: 'center' }}>
                      {product.threshold}
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: getStatusColor(status),
                          backgroundColor: `${getStatusColor(status)}15`
                        }}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}