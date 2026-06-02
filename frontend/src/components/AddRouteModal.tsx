import React, { useState } from 'react';
import { Route, X, Loader2 } from 'lucide-react';
import { useStore } from '../store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddRouteModal({ isOpen, onClose }: Props) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const generateCustomRoute = useStore((s) => s.generateCustomRoute);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;

    try {
      setLoading(true);
      setError('');
      await generateCustomRoute(origin, destination);
      setOrigin('');
      setDestination('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to find locations. Try being more specific.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-navy-800 border border-navy-600 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-navy-700">
          <div className="flex items-center space-x-2 text-teal-400">
            <Route size={20} />
            <h2 className="font-semibold text-white">Add Custom Route</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-gray-400 text-sm mb-4">
            Enter a source and destination (e.g. "Mumbai" to "Dubai"). SupplyWatch will instantly plot the route and dispatch a mock shipment.
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Source (Origin)
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-navy-900 border border-navy-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                placeholder="e.g. Shenzhen, China"
                disabled={loading}
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Destination
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-navy-900 border border-navy-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                placeholder="e.g. Los Angeles, CA"
                disabled={loading}
              />
            </div>
            
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
              disabled={loading || !origin.trim() || !destination.trim()}
              className="flex items-center justify-center min-w-[120px] bg-teal-500 hover:bg-teal-400 text-navy-900 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Plot Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
