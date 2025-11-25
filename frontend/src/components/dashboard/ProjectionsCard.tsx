import React from 'react';
import { Card, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody, Box, Tooltip, Alert } from '@mui/material';
import { CardDetail, Projection } from '../../types/api';
import { formatCurrency, formatDate } from '../../utils/format';

interface Props { detail: CardDetail | null; aggregate?: Projection[] | null }

export const ProjectionsCard: React.FC<Props> = ({ detail, aggregate }) => {
  const src = detail ? detail.projections : aggregate;
  if (!src || src.length === 0) return null;
  return (
    <Card variant="outlined" sx={{ height: '100%', display:'flex', flexDirection:'column' }}>
      <CardContent sx={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, p:2 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>Proyección de Pagos</Typography>
        <Alert severity="info" sx={{ mb: 2, fontSize: '0.875rem' }}>
          Esta proyección asume que pagarás el monto <strong>sin interés</strong> cada mes para evitar cargos adicionales.
        </Alert>
        <Box sx={{ overflowX:'auto', flex:1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Mes</TableCell>
              <TableCell align="right">Deuda Total</TableCell>
              <TableCell align="right">Saldo</TableCell>
              <TableCell align="right">Pago Mín.</TableCell>
              <TableCell align="right">Sin Interés</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {src.slice(0,6).map((p: any) => (
              <TableRow key={p.month}>
                <TableCell>{formatDate(p.month + '-01', 'month')}</TableCell>
                <TableCell align="right">{formatCurrency(isNaN(p.total_debt) ? (p.no_interest_payment || 0) : (p.total_debt || 0))}</TableCell>
                <TableCell align="right">
                  <Tooltip title={p.projected_interest ? `Interés si paga mínimo: ${formatCurrency(p.projected_interest)}` : ''} arrow>
                    <span>{formatCurrency(p.projected_balance)}</span>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">{formatCurrency(p.projected_min_payment)}</TableCell>
                <TableCell align="right">{formatCurrency(p.no_interest_payment)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </Box>
      </CardContent>
    </Card>
  );
};
