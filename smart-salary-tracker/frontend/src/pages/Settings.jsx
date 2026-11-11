import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../services/settingsService';

export default function Settings() {
  const [settings, setSettings] = useState({
    base_salary: '',
    standard_work_days: '',
    standard_hour_rate: '',
    overtime_rate: '',
    weekly_off_rate: '',
    holiday_rate: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getSettings().then(res => {
      if (res) setSettings(res);
      setLoading(false);
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        base_salary: parseFloat(settings.base_salary),
        standard_work_days: parseFloat(settings.standard_work_days),
        standard_hour_rate: parseFloat(settings.standard_hour_rate),
        overtime_rate: parseFloat(settings.overtime_rate),
        weekly_off_rate: parseFloat(settings.weekly_off_rate),
        holiday_rate: parseFloat(settings.holiday_rate)
      });
      setMessage('Lưu cấu hình thành công!');
    } catch (err) {
      setMessage('Lỗi khi lưu cấu hình.');
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Cấu hình lương</h1>
      
      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        {message && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lương cơ bản (VND)</label>
            <input 
              type="number" 
              name="base_salary"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" 
              value={settings.base_salary} 
              onChange={handleChange} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số công chuẩn</label>
            <input 
              type="number" 
              name="standard_work_days"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" 
              value={settings.standard_work_days} 
              onChange={handleChange} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá giờ (VND)</label>
            <input 
              type="number" 
              name="standard_hour_rate"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" 
              value={settings.standard_hour_rate} 
              onChange={handleChange} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá OT (VND)</label>
            <input 
              type="number" 
              name="overtime_rate"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" 
              value={settings.overtime_rate} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  );
}
