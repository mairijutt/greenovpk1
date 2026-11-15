import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Thermometer,
  Droplets,
  Layers,
  CheckCircle,
  MapPin,
  X,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { Farm, Flock } from '../types/farm';
import { StatCard, UIButton, UIInput, UITextarea, RecordDetailModal } from './ui';

interface FarmsViewProps {
  farms: Farm[];
  flocks: Flock[];
  onAddFarm?: (farm: Farm) => void;
  onEditFarm?: (farm: Farm) => void;
  onDeleteFarm?: (id: string) => void;
  onUpdateFarms?: (farms: Farm[]) => void;
}

export const FarmsView: React.FC<FarmsViewProps> = ({
  farms,
  flocks,
  onAddFarm,
  onEditFarm,
  onDeleteFarm,
  onUpdateFarms,
}) => {
  const [farmList, setFarmList] = useState<Farm[]>(farms);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  useEffect(() => {
    setFarmList(farms);
  }, [farms]);

  const [showModal, setShowModal] = useState(false);
  const [editingFarmId, setEditingFarmId] = useState<string | null>(null);
  const [viewingFarm, setViewingFarm] = useState<Farm | null>(null);
  const [confirmDeleteFarmId, setConfirmDeleteFarmId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    description: '',
    capacity: 0,
    manager: '',
  });

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingFarmId(null);
    setFormError(null);
    setFormData({
      name: '',
      code: '',
      location: '',
      description: '',
      capacity: 0,
      manager: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (farm: Farm) => {
    setEditingFarmId(farm.id);
    setFormError(null);
    setFormData({
      name: farm.name,
      code: farm.code || '',
      location: farm.location,
      description: farm.description || '',
      capacity: farm.capacity || 50000,
      manager: farm.manager || 'Farm Supervisor',
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (farmList.length <= 1) {
      showNotice('At least one farm record must be maintained.');
      return;
    }
    const nextList = farmList.filter((f) => String(f.id) !== String(id));
    setFarmList(nextList);
    onDeleteFarm?.(id);
    onUpdateFarms?.(nextList);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.name.trim()) {
      setFormError('Please enter a Farm Name.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('Please enter a Farm Code.');
      return;
    }
    if (!formData.location.trim()) {
      setFormError('Please enter the Farm Location.');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Please enter a Description.');
      return;
    }
    if (!formData.capacity || Number(formData.capacity) <= 0) {
      setFormError('Please enter Total Capacity (Birds) greater than 0.');
      return;
    }
    if (!formData.manager.trim()) {
      setFormError('Please enter Manager In-Charge.');
      return;
    }

    if (editingFarmId) {
      const existing = farmList.find((f) => String(f.id) === String(editingFarmId));
      const updatedFarm: Farm = {
        ...(existing || {
          id: editingFarmId,
          currentBirds: 0,
          shedsCount: 1,
          temperature: 25,
          humidity: 56,
        }),
        id: editingFarmId,
        name: formData.name,
        code: formData.code || `GVF-${Date.now().toString().slice(-4)}`,
        location: formData.location || 'Multan, Punjab',
        description: formData.description || 'Farm Unit',
        capacity: Number(formData.capacity),
        manager: formData.manager,
      };
      const nextList = farmList.map((f) => (String(f.id) === String(editingFarmId) ? updatedFarm : f));
      setFarmList(nextList);
      onEditFarm?.(updatedFarm);
      onUpdateFarms?.(nextList);
    } else {
      const newFarm: Farm = {
        id: `farm-${Date.now()}`,
        name: formData.name,
        code: formData.code || `GVF-${Date.now().toString().slice(-4)}`,
        location: formData.location || 'Multan, Punjab',
        description: formData.description || 'Main Processing Facility',
        capacity: Number(formData.capacity),
        currentBirds: 0,
        shedsCount: 1,
        manager: formData.manager,
        temperature: 25.0,
        humidity: 56,
      };
      const nextList = [...farmList, newFarm];
      setFarmList(nextList);
      onAddFarm?.(newFarm);
      onUpdateFarms?.(nextList);
    }

    setShowModal(false);
  };

  const totalCapacity = farmList.reduce((acc, f) => acc + f.capacity, 0);
  const totalBirds = farmList.reduce((acc, f) => acc + f.currentBirds, 0);

  return (
    <div className="space-y-6">
      {noticeMessage && (
        <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
          {noticeMessage}
        </div>
      )}
      {/* Top Header matching Screenshot: "Farm Records" & "+ Add Farm" button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Farm Records
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered poultry enterprise locations, processing facilities, and codes
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-emerald-500/70 hover:border-emerald-600 bg-white hover:bg-emerald-50/50 text-emerald-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <Plus className="w-4 h-4 text-emerald-600" />
          <span>+ Add Farm</span>
        </button>
      </div>

      {/* Farm Records Table matching Screenshot (NAME, CODE, LOCATION, DESCRIPTION, ACTIONS) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/60 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-5">NAME</th>
                <th className="py-3.5 px-5">CODE</th>
                <th className="py-3.5 px-5">LOCATION</th>
                <th className="py-3.5 px-5">DESCRIPTION</th>
                <th className="py-3.5 px-5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {farmList.map((farm) => (
                <tr key={farm.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-5 font-bold text-slate-900 text-sm">
                    {farm.name}
                  </td>
                  <td className="py-4 px-5 font-mono font-medium text-slate-700">
                    {farm.code || 'GVF2025'}
                  </td>
                  <td className="py-4 px-5 text-slate-600">
                    {farm.location}
                  </td>
                  <td className="py-4 px-5 text-slate-600">
                    {farm.description || 'Main Processing Facility'}
                  </td>
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewingFarm(farm)}
                        title="View Farm Details"
                        className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(farm)}
                        title="Edit Farm Record"
                        className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {confirmDeleteFarmId !== farm.id && (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteFarmId(farm.id)}
                          title="Delete Farm Record"
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {confirmDeleteFarmId === farm.id && (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[11px]">
                        <span className="font-bold text-rose-900">Delete?</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleDelete(farm.id);
                            setConfirmDeleteFarmId(null);
                          }}
                          className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteFarmId(null)}
                          className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Farm Housing Capacity & Telemetry Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        <StatCard
          title="Total Housing Capacity"
          value={totalCapacity}
          unit="Birds"
          icon={Building2}
          color="emerald"
          badge={{ text: `${farmList.length} Complexes`, color: 'emerald' }}
          subtext="Total maximum farm capacity"
        />

        <StatCard
          title="Current Population"
          value={totalBirds}
          unit="Birds"
          icon={Layers}
          color="blue"
          valueColor="text-blue-700"
          badge={{ text: `${((totalBirds / (totalCapacity || 1)) * 100).toFixed(1)}% Load`, color: 'blue' }}
          subtext="Active layer flock population"
        />

        <StatCard
          title="Average Shed Temp"
          value="25.4°C"
          icon={Thermometer}
          color="amber"
          badge={{ text: 'Optimal 24-26°C', color: 'amber' }}
          subtext="Climate sensors automated"
        />

        <StatCard
          title="Average Humidity"
          value="58% RH"
          icon={Droplets}
          color="sky"
          valueColor="text-sky-700"
          badge={{ text: 'Nominal', color: 'teal' }}
          subtext="Evaporative cooling pads active"
        />
      </div>

      {/* Add / Edit Farm Modal matching Screenshot Requirements */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/50">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingFarmId ? 'Edit Farm Record' : 'Add New Farm'}
                  </h2>
                  <p className="text-xs text-slate-500">Configure farm identification and processing details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} noValidate className="mt-4 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <UIInput
                label="Farm Name"
                required
                placeholder="e.g. GreenOva"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setFormError(null);
                }}
              />

              <div className="grid grid-cols-2 gap-3">
                <UIInput
                  label="Farm Code"
                  required
                  placeholder="e.g. GVF2025"
                  value={formData.code}
                  onChange={(e) => {
                    setFormData({ ...formData, code: e.target.value });
                    setFormError(null);
                  }}
                />
                <UIInput
                  label="Location"
                  required
                  placeholder="e.g. Multan, Punjab"
                  value={formData.location}
                  onChange={(e) => {
                    setFormData({ ...formData, location: e.target.value });
                    setFormError(null);
                  }}
                />
              </div>

              <UIInput
                label="Description"
                required
                placeholder="e.g. Main Processing Facility"
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  setFormError(null);
                }}
              />

              <div className="grid grid-cols-2 gap-3">
                <UIInput
                  label="Total Capacity (Birds)"
                  type="number"
                  min="1"
                  required
                  value={formData.capacity}
                  onFocus={() => {
                    if (Number(formData.capacity) === 0) setFormData({ ...formData, capacity: '' as any });
                  }}
                  onBlur={() => {
                    if ((formData.capacity as any) === '') setFormData({ ...formData, capacity: 0 });
                  }}
                  onChange={(e) => {
                    setFormData({ ...formData, capacity: Number(e.target.value) || 0 });
                    setFormError(null);
                  }}
                />
                <UIInput
                  label="Manager In-Charge"
                  required
                  placeholder="e.g. Farm Supervisor"
                  value={formData.manager}
                  onChange={(e) => {
                    setFormData({ ...formData, manager: e.target.value });
                    setFormError(null);
                  }}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <UIButton
                  type="button"
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </UIButton>
                <UIButton type="submit" variant="primary">
                  {editingFarmId ? 'Update Farm' : 'Save Farm'}
                </UIButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Farm Details Popup Modal */}
      {viewingFarm && (
        <RecordDetailModal
          isOpen={Boolean(viewingFarm)}
          onClose={() => setViewingFarm(null)}
          title={`${viewingFarm.name} — Facility Profile`}
          subtitle={`Farm Code: ${viewingFarm.code || 'GVF2025'}`}
          badge={{ text: viewingFarm.location || 'Active Complex', color: 'emerald' }}
          fields={[
            { label: 'Farm Name', value: viewingFarm.name },
            { label: 'Farm Code', value: viewingFarm.code || 'GVF2025', mono: true },
            { label: 'Location', value: viewingFarm.location || 'Multan, Punjab' },
            { label: 'Manager In-Charge', value: viewingFarm.manager || 'Farm Supervisor' },
            {
              label: 'Housing Capacity',
              value: `${(viewingFarm.capacity || 0).toLocaleString()} Birds`,
              mono: true,
              highlight: true,
            },
            {
              label: 'Current Population',
              value: `${(viewingFarm.currentBirds || 0).toLocaleString()} Birds`,
              mono: true,
            },
            { label: 'Sheds Count', value: viewingFarm.shedsCount || 1, mono: true },
            {
              label: 'Telemetry (Temp / RH)',
              value: `${viewingFarm.temperature ?? 25}°C / ${viewingFarm.humidity ?? 56}% RH`,
              mono: true,
            },
            {
              label: 'Description',
              value: viewingFarm.description || 'Main Processing Facility',
              fullWidth: true,
            },
          ]}
          onEdit={() => handleOpenEdit(viewingFarm)}
          onDelete={
            farmList.length > 1
              ? () => {
                  handleDelete(viewingFarm.id);
                }
              : undefined
          }
        />
      )}
    </div>
  );
};
