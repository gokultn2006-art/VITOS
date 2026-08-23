import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageSearch, Plus, Search, CheckCircle2, Upload } from 'lucide-react';
import { lostItemsList, currentUser } from '../data/mockData';
import type { LostItem } from '../types';
import { lostFoundService } from '../services/api';
import { LostItemCard } from '../components/LostItemCard';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';

export const LostFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState<LostItem[]>(lostItemsList);
  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [type, setType] = useState<'lost' | 'found'>('lost');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<LostItem['category']>('ID Card');
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');

  const categories: LostItem['category'][] = [
    'ID Card',
    'Electronics',
    'Wallet',
    'Keys',
    'Calculator',
    'Bag',
    'Accessories',
    'Other'
  ];

  const filteredItems = items.filter((item) => {
    const matchesTab = activeTab === 'all' || item.type === activeTab;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesQuery =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.locationName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesCategory && matchesQuery;
  });

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newItem = await lostFoundService.createItem({
      type,
      title,
      category,
      locationName,
      description,
      contactName: currentUser.name,
      contactEmail: currentUser.email,
    });

    setItems((prev) => [newItem, ...prev]);
    setIsModalOpen(false);
    setSuccessMsg('Your report has been published successfully!');

    // Reset Form
    setTitle('');
    setLocationName('');
    setDescription('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#005F73] to-[#0A9396] rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-teal-100 mb-2">
            <PackageSearch className="w-3.5 h-3.5 text-[#94D2BD]" />
            <span>VIT Vellore Student Recovery Desk</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Campus Lost & Found</h1>
          <p className="text-xs md:text-sm text-teal-100/90 mt-1">
            Report lost ID cards, calculators, electronics, or claim items found across campus.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Report Lost/Found Item
        </Button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            {(['all', 'lost', 'found'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-white text-[#005F73] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'all' ? 'All Items' : `${tab} Items`}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID card, calculator, wallet..."
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005F73]"
            />
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-slate-400 uppercase shrink-0">Category:</span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-[#005F73] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#005F73] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <LostItemCard
              key={item.id}
              item={item}
              onNavigate={(loc) => navigate(`/map?dest=${encodeURIComponent(loc)}`)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No lost or found items"
          description="There are currently no items matching your filter criteria."
          actionText="Report New Item"
          onAction={() => setIsModalOpen(true)}
        />
      )}

      {/* Report Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Report Lost or Found Item">
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType('lost')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'lost' ? 'bg-rose-600 text-white' : 'text-slate-600'
              }`}
            >
              Report Lost Item
            </button>
            <button
              type="button"
              onClick={() => setType('found')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'found' ? 'bg-emerald-600 text-white' : 'text-slate-600'
              }`}
            >
              Report Found Item
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Item Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Black Casio Calculator FX-991EX"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#005F73]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#005F73]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. TT-624 or Periyar Library"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#005F73]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide key details like colors, marks, or serial numbers..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#005F73]"
            />
          </div>

          {/* Photo Dropzone UI placeholder */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Item Photo (Optional)</label>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50 hover:bg-slate-100/70 transition-colors cursor-pointer">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-600 font-medium">Click to select photo or drop image file</p>
              <p className="text-[10px] text-slate-400">PNG, JPG up to 5MB</p>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Submit Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
