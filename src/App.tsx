import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import AddTransaction from "./pages/AddTransaction";
import Accounts from "./pages/Accounts";

export default function App() {
  // Init default data on load
  useEffect(() => {
    fetch('/api/finance/init-defaults', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).catch(console.error);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="add-transaction" element={<AddTransaction />} />
          <Route path="accounts" element={<Accounts />} />
        </Route>
      </Routes>
    </Router>
  );
}
