import { createContext, useContext, useMemo, useState } from "react";

const BookingContext = createContext(null);
const EMPTY = { professionalId: null, topicId: null, topicLabel: null, customTopic: "", durationIndex: 1, dayIndex: 0, time: null, confirmed: null, moods: [] };

export function BookingProvider({ children }) {
  const [state, setState] = useState(EMPTY);
  const update = patch => setState(prev => ({ ...prev, ...patch }));
  const reset = () => setState(EMPTY);
  const value = useMemo(() => ({ ...state, update, reset }), [state]);
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBooking must be used inside BookingProvider");
  return context;
}
