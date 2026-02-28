'use client';

import { useState, useEffect } from 'react';

interface HeatmapData {
  [day: string]: {
    [hour: string]: number;
  };
}

interface BookingHeatmapProps {
  venueId: string;
  startDate: string;
  endDate: string;
}

export function BookingHeatmap({ venueId, startDate, endDate }: BookingHeatmapProps) {
  const [data, setData] = useState<HeatmapData>({});
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

  useEffect(() => {
    fetchHeatmapData();
  }, [venueId, startDate, endDate]);

  const fetchHeatmapData = async () => {
    try {
      const response = await fetch(
        `/api/analytics/heatmap?venueId=${venueId}&startDate=${startDate}&endDate=${endDate}`
      );
      const result = await response.json();
      setData(result.heatmap || {});
    } catch (err) {
      console.error('Failed to fetch heatmap:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get color based on value
  const getColor = (value: number) => {
    if (value === 0) return 'bg-white/5';
    if (value < 10) return 'bg-yellow-900/50';
    if (value < 20) return 'bg-yellow-700/70';
    if (value < 30) return 'bg-yellow-500/80';
    return 'bg-yellow-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="flex mb-2">
          <div className="w-16" />
          {hours.filter((_, i) => i >= 18 && i <= 23).map((hour) => (
            <div
              key={hour}
              className="flex-1 text-center text-xs text-white/40 py-1"
            >
              {hour}:00
            </div>
          ))}
        </div>

        {/* Rows */}
        {days.map((day) => (
          <div key={day} className="flex items-center mb-1">
            <div className="w-16 text-xs text-white/60 py-2">{day.slice(0, 3)}</div>
            {hours
              .filter((_, i) => i >= 18 && i <= 23)
              .map((hour) => {
                const value = data[day.toLowerCase()]?.[hour] || 0;
                return (
                  <div
                    key={hour}
                    className={`flex-1 h-8 mx-0.5 rounded ${getColor(value)} transition-all hover:ring-1 hover:ring-yellow-400/50 cursor-pointer`}
                    title={`${day} ${hour}:00 - ${value} guests`}
                  />
                );
              })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-end mt-4 gap-2">
          <span className="text-xs text-white/40">Low</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded bg-white/5" />
            <div className="w-4 h-4 rounded bg-yellow-900/50" />
            <div className="w-4 h-4 rounded bg-yellow-700/70" />
            <div className="w-4 h-4 rounded bg-yellow-500/80" />
            <div className="w-4 h-4 rounded bg-yellow-400" />
          </div>
          <span className="text-xs text-white/40">High</span>
        </div>
      </div>
    </div>
  );
}

export default BookingHeatmap;
