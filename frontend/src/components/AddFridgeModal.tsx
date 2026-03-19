import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { createSysadminDevice, getSysadminAdmins, SysadminAdmin } from '../api/client';

interface AddFridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}

interface AddFridgeFormData {
  name: string;
  locationDescription: string;
  latitude: string;
  longitude: string;
  defaultTemperature: string;
  shelfCount: string;
  sessionLimit: string;
  assignedAdminId: string;
}

const getInitialFormData = (): AddFridgeFormData => ({
  name: '',
  locationDescription: '',
  latitude: '41.0082',
  longitude: '28.9784',
  defaultTemperature: '4.0',
  shelfCount: '5',
  sessionLimit: '100',
  assignedAdminId: '',
});

const parseOptionalNumber = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export default function AddFridgeModal({ isOpen, onClose, onCreated }: AddFridgeModalProps) {
  const [formData, setFormData] = useState<AddFridgeFormData>(getInitialFormData());
  const [admins, setAdmins] = useState<SysadminAdmin[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadAdmins = async () => {
      try {
        const response = await getSysadminAdmins({ limit: 100 });
        if (isMounted) setAdmins(response.data);
      } catch (error) {
        console.error('Failed to load admins', error);
        if (isMounted) setAdmins([]);
      }
    };

    setErrorMessage('');
    setFormData(getInitialFormData());
    loadAdmins();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const isCreateDisabled = useMemo(() => {
    return isSubmitting || !formData.name.trim() || !formData.locationDescription.trim();
  }, [formData.locationDescription, formData.name, isSubmitting]);

  if (!isOpen) {
    return null;
  }

  const handleFieldChange = (key: keyof AddFridgeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (isCreateDisabled) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await createSysadminDevice({
        name: formData.name.trim(),
        location_description: formData.locationDescription.trim(),
        gps_latitude: parseOptionalNumber(formData.latitude),
        gps_longitude: parseOptionalNumber(formData.longitude),
        default_temperature: parseOptionalNumber(formData.defaultTemperature),
        shelf_count: parseOptionalNumber(formData.shelfCount),
        session_limit: parseOptionalNumber(formData.sessionLimit),
        assigned_admin_id: formData.assignedAdminId || undefined,
      });

      await onCreated();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create fridge';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />

      <div
        className="fixed z-50 bg-white"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '640px',
          borderRadius: '12px',
          padding: '24px 24px 20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1C1E', lineHeight: '27px' }}>Add Fridge</h3>
          <button
            onClick={onClose}
            className="transition-colors hover:bg-gray-100 rounded p-1"
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
          >
            <X size={18} style={{ color: '#6B7280' }} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px', lineHeight: '19.5px' }}>
          Register a new smart fridge device
        </p>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A1C1E', marginBottom: '12px', lineHeight: '22.5px' }}>Basic Information</p>

          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1C1E', marginBottom: '6px' }}>
            Fridge Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="e.g., Main Entrance Fridge"
            className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            style={{
              height: '40px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              padding: '0 12px',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          />

          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1C1E', marginBottom: '6px' }}>
            Location Description *
          </label>
          <input
            type="text"
            value={formData.locationDescription}
            onChange={(e) => handleFieldChange('locationDescription', e.target.value)}
            placeholder="e.g., Building A - Floor 2"
            className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            style={{
              height: '40px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              padding: '0 12px',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A1C1E', marginBottom: '2px', lineHeight: '22.5px' }}>Location & Configuration</p>
          <p style={{ fontSize: '12px', color: '#6B7280', fontStyle: 'italic', marginBottom: '12px', lineHeight: '18px' }}>
            Used for device tracking and analytics
          </p>

          <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1C1E', marginBottom: '6px' }}>
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => handleFieldChange('latitude', e.target.value)}
                className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  padding: '0 12px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1C1E', marginBottom: '6px' }}>
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => handleFieldChange('longitude', e.target.value)}
                className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  padding: '0 12px',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1C1E', marginBottom: '6px' }}>
            Default Temperature (°C)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.defaultTemperature}
            onChange={(e) => handleFieldChange('defaultTemperature', e.target.value)}
            className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            style={{
              height: '40px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              padding: '0 12px',
              fontSize: '14px',
            }}
          />
          <p style={{ fontSize: '12px', color: '#6B7280', fontStyle: 'italic', marginTop: '4px', lineHeight: '18px' }}>
            Recommended range: 2°C - 8°C
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A1C1E', marginBottom: '12px', lineHeight: '22.5px' }}>Operational Settings</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1C1E', marginBottom: '6px' }}>
                Shelf Count
              </label>
              <input
                type="number"
                min={1}
                value={formData.shelfCount}
                onChange={(e) => handleFieldChange('shelfCount', e.target.value)}
                className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  padding: '0 12px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1C1E', marginBottom: '6px' }}>
                Session Limit
              </label>
              <input
                type="number"
                min={1}
                value={formData.sessionLimit}
                onChange={(e) => handleFieldChange('sessionLimit', e.target.value)}
                className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  padding: '0 12px',
                  fontSize: '14px',
                }}
              />
              <p style={{ fontSize: '12px', color: '#6B7280', fontStyle: 'italic', marginTop: '4px', lineHeight: '18px' }}>
                Maximum allowed active session duration
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A1C1E', marginBottom: '12px', lineHeight: '22.5px' }}>Admin Assignment</p>

          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1C1E', marginBottom: '6px' }}>
            Assigned Admin
          </label>
          <select
            value={formData.assignedAdminId}
            onChange={(e) => handleFieldChange('assignedAdminId', e.target.value)}
            className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            style={{
              height: '40px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              padding: '0 12px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <option value="">Select admin</option>
            {admins.map((admin) => (
              <option key={admin.user_id} value={admin.user_id}>
                {[admin.first_name, admin.last_name].filter(Boolean).join(' ') || admin.email}
              </option>
            ))}
          </select>
        </div>

        {errorMessage ? (
          <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '10px' }}>{errorMessage}</p>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 transition-colors hover:bg-gray-100"
            style={{
              height: '40px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              backgroundColor: 'white',
              color: '#6B7280',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isCreateDisabled}
            className="flex-1 transition-colors"
            style={{
              height: '40px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isCreateDisabled ? '#D1D5DB' : '#2563EB',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isCreateDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Fridge'}
          </button>
        </div>
      </div>
    </>
  );
}
