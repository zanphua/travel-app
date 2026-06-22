import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { TripDetail, TripIndexRedirect } from "./pages/TripDetail";
import { ItineraryTab } from "./pages/ItineraryTab";
import { ExpensesTab } from "./pages/ExpensesTab";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/trip/:tripId" element={<TripDetail />}>
          <Route index element={<TripIndexRedirect />} />
          <Route path="itinerary" element={<ItineraryTab />} />
          <Route path="expenses" element={<ExpensesTab />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
