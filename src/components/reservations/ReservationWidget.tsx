'use client';

import { useState, useEffect } from 'react';

interface ReservationWidgetProps {
  venueId: string;
  venueName: string;
  onSuccess?: (reservation: { id: string; confirmationCode: string }) => void;
}

const tableTypes = [
  { id: 'regular', name: 'Meja Regular', price: 0, description: 'Meja standar untuk grup kecil' },
  { id: 'vip', name: 'Meja VIP', price: 150000, description: 'Meja VIP dengan service khusus' },
  { id: 'royal', name: 'Meja Royal', price: 300000, description: 'Meja premium dengan fasilitas eksklusif' },
  { id: 'booth', name: 'Booth Private', price: 500000, description: 'Booth private untuk grup besar' },
];

export function ReservationWidget({ venueId, venueName, onSuccess }: ReservationWidgetProps) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [tableType, setTableType] = useState('regular');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async () => {
    try {
      const response = await fetch(
        `/api/availability?venueId=${venueId}&date=${selectedDate}`
      );
      const data = await response.json();
      
      if (data.slots) {
        setAvailableSlots(data.slots);
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !guestName || !guestPhone) {
      setError('Mohon isi semua field yang wajib');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId,
          guestName,
          guestPhone,
          guestEmail,
          date: selectedDate,
          time: selectedTime,
          pax: guestCount,
          tableType,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create reservation');
      }

      if (onSuccess) {
        onSuccess(data.reservation);
      }

      setStep(3); // Success step
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Glassmorphism Container */}
      <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        {/* Gold Gradient Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-yellow-600 to-yellow-400" />
        
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-1">
              Reservasi Meja
            </h3>
            <p className="text-white/60 text-sm">{venueName}</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step >= s
                      ? 'bg-yellow-500 text-black'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-12 h-0.5 mx-1 ${
                      step > s ? 'bg-yellow-500' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Date, Time, Guests */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Date Picker */}
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Tanggal *
                </label>
                <input
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <label className="block text-white/80 text-sm mb-2">
                    Jam *
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.slice(0, 12).map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          selectedTime === slot.time
                            ? 'bg-yellow-500 text-black'
                            : slot.available
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-white/5 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Guest Count */}
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Jumlah Tamu: {guestCount}
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value))}
                  className="w-full accent-yellow-500"
                />
                <div className="flex justify-between text-xs text-white/40">
                  <span>1</span>
                  <span>20</span>
                </div>
              </div>

              {/* Table Type */}
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Tipe Meja
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {tableTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setTableType(type.id)}
                      className={`p-3 rounded-xl text-left transition-all ${
                        tableType === type.id
                          ? 'bg-yellow-500/20 border border-yellow-500'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-white font-medium text-sm">
                        {type.name}
                      </div>
                      <div className="text-white/60 text-xs">
                        {type.price > 0
                          ? `+Rp ${type.price.toLocaleString('id-ID')}`
                          : 'Gratis'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Next Button */}
              <button
                onClick={() => setStep(2)}
                disabled={!selectedDate || !selectedTime}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-xl hover:from-yellow-400 hover:to-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Lanjutkan
              </button>
            </div>
          )}

          {/* Step 2: Guest Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">
                  No. WhatsApp *
                </label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Email (Opsional)
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Request khusus..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-all"
                >
                  Kembali
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-xl hover:from-yellow-400 hover:to-yellow-500 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Memproses...' : 'Konfirmasi Reservasi'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">
                Reservasi Berhasil!
              </h4>
              <p className="text-white/60 text-sm mb-4">
                Konfirmasi telah dikirim ke WhatsApp Anda
              </p>
              <div className="bg-white/10 rounded-xl p-4 mb-4">
                <p className="text-white/60 text-xs mb-1">Detail Reservasi</p>
                <p className="text-white font-medium">
                  {selectedDate} • {selectedTime} • {guestCount} tamu
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReservationWidget;
