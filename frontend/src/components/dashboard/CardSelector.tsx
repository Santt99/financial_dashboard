import React from 'react';
import { Select, MenuItem } from '@mui/material';
import { CardSummary } from '../../types/api';

interface Props { cards: CardSummary[]; selected: string | null; onSelect: (id: string | null) => void; }
export const CardSelector: React.FC<Props> = ({ cards, selected, onSelect }) => (
  <Select size="small" value={selected || ''} onChange={(e) => onSelect((e.target.value as string) || null)} displayEmpty>
    <MenuItem value="">All Cards</MenuItem>
  {cards.map((c: CardSummary) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
  </Select>
);
