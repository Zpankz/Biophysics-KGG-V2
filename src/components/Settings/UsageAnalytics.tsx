import { useState, useEffect } from 'react';
import { getUsageStats } from '../../lib/usageLogger';

export function UsageAnalytics() {
  const [stats, setStats] = useState<{
    totalCost: number;
    totalCalls: number;
    byProvider: Record<string, { calls: number; cost: number }>;
    byTask: Record<string, { calls: number; cost: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadStats();
  }, [days]);

  async function loadStats() {
    setLoading(true);
    const result = await getUsageStats(days);
    setStats(result);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Failed to load usage statistics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Usage & Analytics</h3>
          <p className="text-gray-400 text-sm">
            Track your API usage and costs across different providers.
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-lg border border-blue-700">
          <p className="text-blue-300 text-sm font-medium mb-1">Total API Calls</p>
          <p className="text-3xl font-bold text-white">{stats.totalCalls.toLocaleString()}</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-green-900/40 to-green-800/20 rounded-lg border border-green-700">
          <p className="text-green-300 text-sm font-medium mb-1">Total Cost</p>
          <p className="text-3xl font-bold text-white">${stats.totalCost.toFixed(4)}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">Usage by Provider</h4>
        {Object.keys(stats.byProvider).length === 0 ? (
          <p className="text-gray-400 text-sm">No usage data available</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(stats.byProvider).map(([provider, data]) => (
              <div
                key={provider}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-white font-medium capitalize">{provider}</p>
                  <p className="text-gray-400 text-sm">{data.calls} calls</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">${data.cost.toFixed(4)}</p>
                  <p className="text-gray-400 text-xs">
                    ${(data.cost / data.calls).toFixed(6)}/call
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">Usage by Task Type</h4>
        {Object.keys(stats.byTask).length === 0 ? (
          <p className="text-gray-400 text-sm">No usage data available</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(stats.byTask).map(([task, data]) => (
              <div
                key={task}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-white font-medium capitalize">{task}</p>
                  <p className="text-gray-400 text-sm">{data.calls} calls</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">${data.cost.toFixed(4)}</p>
                  <p className="text-gray-400 text-xs">
                    ${(data.cost / data.calls).toFixed(6)}/call
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {stats.totalCalls === 0 && (
        <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 text-center">
          <p className="text-gray-400">
            No usage data yet. Start using the knowledge graph to see your analytics here!
          </p>
        </div>
      )}
    </div>
  );
}
