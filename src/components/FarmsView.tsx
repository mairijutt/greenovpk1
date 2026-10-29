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
} from 'lucide-react';
import { Farm, Flock } from '../types/farm';
import { StatCard, UIButton, UIInput, UITextarea } from './ui';

interface FarmsViewProps {
  farms: Farm[];
  flocks: Flock[];
}

const defaultInitialFarms: Farm[] = [
  {
    id: 'farm-1',
    name: 'GreenOva',
    code: 'GVF2025',
    location: 'Multan, Punjab',
    description: 'Main Processing Facility',
    capacity: 100000,
    currentBirds: 85500,
    shedsCount: 3,
    manager: 'Ahsan Nawaz (Super Admin)',
    temperature: 25.4,
    humidity: 58,
  },
  {
    id: 'farm-2',
    name: 'GreenOva South Unit',
    code: 'GVF-SOUTH',
    location: 'Khanewal Road, Multan',
    description: 'Layer and Broiler Complex',
    capacity: 50000,
    currentBirds: 47000,
    shedsCount: 2,
    manager: 'Mustafa (Supervisor)',
    temperature: 24.8,
    humidity: 55,
  },
];

export const FarmsView: React.FC<FarmsViewProps> = ({ farms: initialPropsFarms, flocks }) => {
  const [farmList, setFarmList] = useState<Farm[]>(() => {
    const saved = localStorage.getItem('greenova_farm_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return defaultInitialFarms;
  });

  useEffect(() => {
    localStorage.setItem('greenova_farm_records', JSON.stringify(farmList));
  }, [farmList]);

  const [showModal, setShowModal] = useState(false);
  const [editingFarmId, setEditingFarmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    description: '',
    capacity: 50000,
    manager: 'Farm Supervisor',
  });

  const handleOpenAdd = () => {
    setEditingFarmId(null);
    setFormData({
      name: '',
      code: '',
      location: '',
      description: '',
      capacity: 50000,
      manager: 'Farm Supervisor',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (farm: Farm) => {
    setEditingFarmId(farm.id);
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
      alert('At least one farm record must be maintained.');
      return;
    }
    setFarmList(farmList.filter((f) => f.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingFarmId) {
      setFarmList(
        farmList.map((f) =>
          f.id === editingFarmId
            ? {
                ...f,
                name: formData.name,
                code: formData.code || `GVF-${Date.now().toString().slice(-4)}`,
                location: formData.location || 'Multan, Punjab',
                description: formData.description || 'Farm Unit',
                capacity: Number(formData.capacity),
                manager: formData.manager,
              }
            : f
        )
      );
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
      setFarmList([...farmList, newFarm]);
    }

    setShowModal(false);
  };

  const totalCapacity = farmList.reduce((acc, f) => acc + f.capacity, 0);
  const totalBirds = farmList.reduce((acc, f) => acc + f.currentBirds, 0);

  return (
    <div className="space-y-6">
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
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={() => handleOpenEdit(farm)}
                        title="Edit Farm Record"
                        className="p-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(farm.id)}
                        title="Delete Farm Record"
                        className="p-1 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
              <UIInput
                label="Farm Name"
                required
                placeholder="e.g. GreenOva"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <UIInput
                  label="Farm Code"
                  placeholder="e.g. GVF2025"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
                <UIInput
                  label="Location"
                  placeholder="e.g. Multan, Punjab"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <UIInput
                label="Description"
                placeholder="e.g. Main Processing Facility"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <UIInput
                  label="Total Capacity (Birds)"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                />
                <UIInput
                  label="Manager In-Charge"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
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
    </div>
  );
};
