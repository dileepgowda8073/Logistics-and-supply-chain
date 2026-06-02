import React, { useState } from 'react';
import { Globe, X, Loader2 } from 'lucide-react';
import { useStore } from '../store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddRegionModal({ isOpen, onClose }: Props) {
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const generateRegion = useStore((s) => s.generateRegion);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!country.trim()) return;

    try {
      setLoading(true);
      setError('');
      await generateRegion(country);
      setCountry('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to find country. Try another name.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-navy-800 border border-navy-600 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-navy-700">
          <div className="flex items-center space-x-2 text-teal-400">
            <Globe size={20} />
            <h2 className="font-semibold text-white">Add Global Region</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-gray-400 text-sm mb-4">
            Enter a country name (e.g. "Brazil", "Japan", "Germany"). SupplyWatch will connect to global mapping APIs and instantly generate live logistics data for that region.
          </p>

          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Country Name
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-navy-900 border border-navy-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
              placeholder="e.g. Australia"
              disabled={loading}
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-navy-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !country.trim()}
              className="flex items-center justify-center min-w-[120px] bg-teal-500 hover:bg-teal-400 text-navy-900 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Generate Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
