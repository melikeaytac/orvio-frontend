import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Plus, X, Edit2, Trash2, UserCog, Power } from 'lucide-react';
import { EmptyState } from './ui/empty-state';
import { ExportButton } from './ui/export-button';
import { TableSkeleton } from './ui/table-skeleton';
import { exportData } from '../utils/export';
import {
  createSysadminAdmin,
  createSysadminAssignment,
  deleteSysadminAdmin,
  getSysadminAdmins,
  getSysadminAssignments,
  getSysadminDevices,
  updateSysadminAdmin,
  updateSysadminAssignment,
} from '../api/client';

interface AdminManagementScreenProps {
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'System Admin';
  assignedFridges: string[];
  status: 'Active' | 'Disabled';
}

const USER_ROLE = {
  ADMIN: 0,
  SYSTEM_ADMIN: 1,
} as const;

const isSystemAdminRole = (roleId: string | number) =>
  roleId === USER_ROLE.SYSTEM_ADMIN || roleId === '1' || roleId === 'SYSTEM_ADMIN';

export default function AdminManagementScreen({ onLogout, onNavigate }: AdminManagementScreenProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Admin' as 'Admin' | 'System Admin',
    assignedFridges: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [assignments, setAssignments] = useState<{ assignment_id: string; device_id: string; admin_user_id: string; is_active: boolean }[]>([]);
  const [devices, setDevices] = useState<{ id: string; name: string }[]>([]);
  const [isFetching, setIsFetching] = useState(false);



  const refreshData = async () => {
    setIsFetching(true);
    setIsLoading(true);
    try {
      const [adminsResponse, devicesResponse, assignmentsResponse] = await Promise.all([
        getSysadminAdmins({ limit: 100 }),
        getSysadminDevices({ limit: 100 }),
        getSysadminAssignments({ limit: 100 }),
      ]);
      console.log("Gelen Adminler:", adminsResponse.data);
      const deviceOptions = devicesResponse.data.map((device) => ({
        id: device.device_id,
        name: device.name || device.device_id,
      }));

      const nextAssignments = assignmentsResponse.data.map((assignment) => ({
        assignment_id: assignment.assignment_id,
        device_id: assignment.device_id,
        admin_user_id: assignment.admin_user_id,
        is_active: assignment.is_active,
      }));

      const nextAdmins = adminsResponse.data.map((admin) => {
        const assigned = nextAssignments
          .filter((assignment) => assignment.admin_user_id === admin.user_id && assignment.is_active)
          .map((assignment) => assignment.device_id);
        return {
          id: admin.user_id,
          name: [admin.first_name, admin.last_name].filter(Boolean).join(' ') || admin.email,
          email: admin.email,
          role: isSystemAdminRole(admin.role_id) ? 'System Admin' : 'Admin',
          assignedFridges: assigned,
          status: admin.active === false ? 'Disabled' : 'Active',
        } as Admin;
      });

      setAdmins(nextAdmins);
      setDevices(deviceOptions);
      setAssignments(nextAssignments);
    } catch (error) {
      console.error('Failed to load admin data', error);
      setAdmins([]);
      setDevices([]);
      setAssignments([]);
    } finally {
      setIsFetching(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleExport = async (format: 'csv' | 'png' | 'pdf') => {
    const data = admins.map(admin => ({
      ID: admin.id,
      Name: admin.name,
      Email: admin.email,
      Role: admin.role,
      'Assigned Fridges': admin.assignedFridges.length,
      Status: admin.status
    }));
    
    if (format === 'csv') {
      await exportData(format, data, { filename: 'admin-list' });
    } else {
      await exportData(format, 'admin-table', { 
        filename: 'admin-list',
        title: 'Admin Management'
      });
    }
  };

  const handleAddAdmin = () => {
    setEditingAdmin(null);
    setFormData({
      name: '',
      lastName: '',
      email: '',
      password: '',
      role: 'Admin',
      assignedFridges: []
    });
    setShowModal(true);
  };

  const handleEditAdmin = (admin: Admin) => {
    setEditingAdmin(admin);
    const [firstName, ...lastNameParts] = admin.name.split(' ');
    setFormData({
      name: firstName,
      lastName: lastNameParts.join(' '),
      email: admin.email,
      password: '',
      role: admin.role,
      assignedFridges: admin.assignedFridges
    });
    setShowModal(true);
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (confirm('Are you sure you want to delete this admin?')) {
      try {
        await deleteSysadminAdmin(adminId);
        await refreshData();
      } catch (error) {
        console.error('Failed to delete admin', error);
      }
    }
  };

  const handleToggleAdminStatus = async (admin: Admin) => {
    const shouldActivate = admin.status === 'Disabled';
    const actionLabel = shouldActivate ? 'activate' : 'disable';

    if (!confirm(`Are you sure you want to ${actionLabel} this admin?`)) {
      return;
    }

    try {
      await updateSysadminAdmin(admin.id, { active: shouldActivate });
      await refreshData();
    } catch (error) {
      console.error('Failed to update admin status', error);
    }
  };

  const handleSaveAdmin = async () => {
    try {
      if (editingAdmin) {
        await updateSysadminAdmin(editingAdmin.id, {
          first_name: formData.name,
          last_name: formData.lastName,
          email: formData.email,
          role_id: formData.role === 'System Admin' ? USER_ROLE.SYSTEM_ADMIN : USER_ROLE.ADMIN,
          ...(formData.password ? { password: formData.password } : {}),
        });

        const nextAssignments = new Set(formData.assignedFridges);
        const currentAssignments = assignments.filter(
          (assignment) => assignment.admin_user_id === editingAdmin.id && assignment.is_active
        );

        await Promise.all(
          currentAssignments
            .filter((assignment) => !nextAssignments.has(assignment.device_id))
            .map((assignment) => updateSysadminAssignment(assignment.assignment_id, { is_active: false }))
        );

        await Promise.all(
          Array.from(nextAssignments)
            .filter((deviceId) => !currentAssignments.some((assignment) => assignment.device_id === deviceId))
            .map((deviceId) => createSysadminAssignment({ device_id: deviceId, admin_user_id: editingAdmin.id }))
        );
      } else {
        const created = await createSysadminAdmin({
          first_name: formData.name,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          role_id: formData.role === 'System Admin' ? USER_ROLE.SYSTEM_ADMIN : USER_ROLE.ADMIN,
        });

        await Promise.all(
          formData.assignedFridges.map((deviceId) =>
            createSysadminAssignment({ device_id: deviceId, admin_user_id: created.user_id })
          )
        );
      }
      setShowModal(false);
      await refreshData();
    } catch (error) {
      console.error('Failed to save admin', error);
    }
  };

  const handleFridgeToggle = (fridgeId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedFridges: prev.assignedFridges.includes(fridgeId)
        ? prev.assignedFridges.filter(id => id !== fridgeId)
        : [...prev.assignedFridges, fridgeId]
    }));
  };

  const getRoleBadgeStyle = (role: string) => {
    if (role === 'System Admin') {
      return {
        backgroundColor: '#2563EB',
        color: 'white'
      };
    }
    return {
      backgroundColor: '#EFF6FF',
      color: '#2563EB'
    };
  };

  const getStatusColor = (status: string) => {
    return status === 'Active' ? '#10B981' : '#9CA3AF';
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      <Sidebar activePage="Admin Management" onNavigate={onNavigate} />

      <div className="flex-1 flex flex-col">
        <Topbar onLogout={onLogout} pageTitle="Admin Management" />

        <main style={{ padding: '24px' }}>
          {/* Page Header */}
          <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
            <ExportButton onExport={handleExport} disabled={admins.length === 0} />
            <button
              onClick={handleAddAdmin}
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
                cursor: 'pointer'
              }}
            >
              <Plus size={18} />
              Add Admin
            </button>
          </div>

          {/* Admin List Table */}
          <div
            id="admin-table"
            className="bg-white"
            style={{
              borderRadius: '12px',
              boxShadow: '0 3px 8px rgba(0,0,0,0.05)',
              padding: '24px',
              overflow: 'auto',
              minHeight: '400px'
            }}
          >
            {isLoading || isFetching ? (
              <TableSkeleton />
            ) : admins.length === 0 ? (
              <EmptyState 
                icon={<UserCog size={48} strokeWidth={1.5} style={{ color: '#D1D5DB' }} />}
                title="No admins found"
                description="Get started by adding your first admin user to the system."
              />
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                      Name
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                      Email
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                      Role
                    </th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                      Assigned Fridges
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                      Status
                    </th>
                    <th data-export-hide style={{ textAlign: 'center', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin, index) => (
                    <tr
                      key={admin.id}
                      className="transition-colors"
                      style={{
                        borderBottom: index < admins.length - 1 ? '1px solid #F3F4F6' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '16px 8px', fontSize: '14px', fontWeight: 500, color: '#1A1C1E' }}>
                        {admin.name}
                      </td>
                      <td style={{ padding: '16px 8px', fontSize: '14px', color: '#6B7280' }}>
                        {admin.email}
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            ...getRoleBadgeStyle(admin.role)
                          }}
                        >
                          {admin.role}
                        </span>
                      </td>
                      <td style={{ padding: '16px 8px', fontSize: '14px', fontWeight: 600, color: '#1A1C1E', textAlign: 'center' }}>
                        {admin.assignedFridges.length}
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: getStatusColor(admin.status),
                            backgroundColor: `${getStatusColor(admin.status)}15`
                          }}
                        >
                          {admin.status}
                        </span>
                      </td>
                      <td data-export-hide style={{ padding: '16px 8px' }}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditAdmin(admin)}
                            className="transition-colors hover:bg-blue-100 rounded p-2"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                            title="Edit"
                          >
                            <Edit2 size={16} style={{ color: '#2563EB' }} />
                          </button>
                          <button
                            onClick={() => handleToggleAdminStatus(admin)}
                            className="transition-colors hover:bg-gray-100 rounded p-2"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                            title={admin.status === 'Active' ? 'Disable' : 'Activate'}
                          >
                            <Power size={16} style={{ color: admin.status === 'Active' ? '#6B7280' : '#10B981' }} />
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(admin.id)}
                            className="transition-colors hover:bg-red-100 rounded p-2"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                            title="Delete"
                          >
                            <Trash2 size={16} style={{ color: '#DC2626' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="text-center" style={{ marginTop: '32px' }}>
            <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
              © 2025 Smart Fridge System
            </p>
          </div>
        </main>
      </div>

      {/* Add/Edit Admin Modal */}
      {showModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 flex items-center justify-center"
            onClick={() => setShowModal(false)}
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', top: 0, left: 0 }}
          />

          {/* Modal */}
          <div
            className="fixed z-50 bg-white"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '420px',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1C1E' }}>
                {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="transition-colors hover:bg-gray-100 rounded p-1"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <X size={20} style={{ color: '#6B7280' }} />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1C1E', marginBottom: '6px' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px'
                  }}
                  placeholder="Enter name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1C1E', marginBottom: '6px' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px'
                  }}
                  placeholder="Enter last name"
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1C1E', marginBottom: '6px' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px'
                  }}
                  placeholder="Enter email"
                />
              </div>

              {/* Password (only for new admin) */}
              {!editingAdmin && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1C1E', marginBottom: '6px' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    style={{
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px'
                    }}
                    placeholder="Enter password"
                  />
                </div>
              )}

              {/* Role */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1C1E', marginBottom: '6px' }}>
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'Admin' | 'System Admin' })}
                  className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Admin">Admin</option>
                  <option value="System Admin">System Admin</option>
                </select>
              </div>

              {/* Assigned Fridges */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1C1E', marginBottom: '6px' }}>
                  Assigned Fridges
                </label>
                <div
                  className="border rounded-lg p-3"
                  style={{
                    maxHeight: '160px',
                    overflowY: 'auto',
                    border: '1px solid #D1D5DB'
                  }}
                >
                  {devices.map((fridge) => (
                    <label key={fridge.id} className="flex items-center gap-2 cursor-pointer mb-2 last:mb-0">
                      <input
                        type="checkbox"
                        checked={formData.assignedFridges.includes(fridge.id)}
                        onChange={() => handleFridgeToggle(fridge.id)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', color: '#1A1C1E' }}>
                        {fridge.id} - {fridge.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3" style={{ marginTop: '24px' }}>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 transition-colors hover:bg-gray-100"
                style={{
                  height: '40px',
                  backgroundColor: 'transparent',
                  color: '#6B7280',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdmin}
                className="flex-1 transition-colors hover:bg-blue-700"
                style={{
                  height: '40px',
                  backgroundColor: '#2563EB',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}