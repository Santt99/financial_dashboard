import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { DashboardSummary, CardDetail } from '../types/api';
import { useAuth } from './AuthContext';

interface DataContextValue {
  summary: DashboardSummary | null;
  selectedCard: string | null;
  cardDetail: CardDetail | null;
  aggregateCategories: { category: string; total: number }[] | null;
  aggregateProjections: { month: string; projected_balance: number; projected_min_payment: number; projected_interest: number; no_interest_payment: number; total_debt: number }[] | null;
  selectCard: (id: string | null) => void;
  refresh: () => Promise<void>;
  uploadStatement: (cardId: string, file: File) => Promise<any>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

type ProviderProps = { children: React.ReactNode };
export const DataProvider = ({ children }: ProviderProps) => {
  const { token } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [cardDetail, setCardDetail] = useState<CardDetail | null>(null);
  const [aggregateCategories, setAggregateCategories] = useState<{ category: string; total: number }[] | null>(null);
  const [aggregateProjections, setAggregateProjections] = useState<{ month: string; projected_balance: number; projected_min_payment: number; projected_interest: number; no_interest_payment: number }[] | null>(null);

  async function refresh() {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const s = await axios.get('http://localhost:8000/dashboard/summary', { headers });
    setSummary(s.data);
    if (selectedCard) {
      const cd = await axios.get(`http://localhost:8000/dashboard/card/${selectedCard}`, { headers });
      setCardDetail(cd.data);
      setAggregateCategories(null);
      setAggregateProjections(null);
    } else {
      setCardDetail(null);
      // build aggregates across all cards by fetching each card detail in parallel
      if (s.data?.cards?.length) {
        const details = await Promise.all(
          s.data.cards.map((c: { id: string }) => axios.get(`http://localhost:8000/dashboard/card/${c.id}`, { headers }).then((r: any) => r.data).catch(()=>null))
        );
        const valid = details.filter(Boolean) as CardDetail[];
        // categories aggregate
        const catMap: Record<string, number> = {};
        valid.forEach(d => d.category_aggregates.forEach(ca => { catMap[ca.category] = (catMap[ca.category] || 0) + ca.total; }));
        const categoriesAgg = Object.entries(catMap).map(([category, total]) => ({ category, total })).sort((a,b)=> b.total - a.total);
        // projections aggregate (by month sum values)
        const projMap: Record<string, { balance: number; min: number; interest: number; noInterest: number; totalDebt: number; count: number }> = {};
        valid.forEach(d => d.projections.forEach(p => {
          const cur = projMap[p.month] || { balance:0, min:0, interest:0, noInterest:0, totalDebt:0, count:0 };
            cur.balance += p.projected_balance;
            cur.min += p.projected_min_payment;
            cur.interest += (p.projected_interest || 0);
            cur.noInterest += p.no_interest_payment;
            cur.totalDebt += (p.total_debt || 0);
            cur.count += 1;
            projMap[p.month] = cur;
        }));
        const projectionsAgg = Object.entries(projMap).map(([month, v]) => ({
          month,
          projected_balance: v.balance,
          projected_min_payment: v.min,
          projected_interest: v.interest,
          no_interest_payment: v.noInterest,
          total_debt: v.totalDebt
        })).sort((a,b)=> a.month.localeCompare(b.month));
        setAggregateCategories(categoriesAgg);
        setAggregateProjections(projectionsAgg.slice(0,6));
      } else {
        setAggregateCategories(null);
        setAggregateProjections(null);
      }
    }
  }

  function selectCard(id: string | null) {
    setSelectedCard(id);
  }

  async function uploadStatement(cardId: string, file: File) {
    if (!token) return;
    console.log('🚀 Uploading to API...');
    const form = new FormData();
    form.append('f', file);
    const response = await axios.post(`http://localhost:8000/files/upload`, form, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
    });
    console.log('📦 API Response:', response.data);
    await refresh();
    console.log('🔄 Data refreshed');
    return response.data; // Return upload results for display
  }

  useEffect(() => { 
    if (token) {
      refresh();
    }
  }, [token, selectedCard]);

  return <DataContext.Provider value={{ summary, selectedCard, cardDetail, aggregateCategories, aggregateProjections, selectCard, refresh, uploadStatement }}>{children}</DataContext.Provider>;
};

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
