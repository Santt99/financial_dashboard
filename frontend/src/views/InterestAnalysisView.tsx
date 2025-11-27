import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  ButtonGroup,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useData } from '../contexts/DataContext';
import { formatCurrency } from '../utils/format';

interface TransactionDetail {
  id: string;
  description: string;
  amount: number;
  monthsCompleted: number;
  totalMonths: number;
  monthlyPayment: number;
  totalInterest: number;
}

export const InterestAnalysisView: React.FC = () => {
  const { summary } = useData();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Calculate transaction details
  const calculateTransactionDetails = (t: any): TransactionDetail => {
    const monthsCompleted = Math.max(0, t.months_paid || 0);  // Never negative
    const totalMonths = t.installments || 1;
    const monthlyPayment = totalMonths > 1 ? t.amount / totalMonths : 0;
    
    // Calculate interest projection: 1.5% monthly on remaining balance
    let totalInterest = 0;
    if (totalMonths > 1) {
      let balance = t.amount;
      for (let i = 0; i < totalMonths; i++) {
        if (i >= monthsCompleted) {
          totalInterest += balance * 0.015; // 1.5% monthly interest
        }
        balance -= monthlyPayment;
      }
    }

    return {
      id: t.id,
      description: t.description || `Compra MSI ${totalMonths}x`,
      amount: t.amount,
      monthsCompleted,
      totalMonths,
      monthlyPayment,
      totalInterest: Math.max(0, totalInterest),
    };
  };

  if (!summary) {
    return (
      <Box p={3}>
        <Alert severity="info">Cargando datos...</Alert>
      </Box>
    );
  }

  const cards = summary.cards || [];

  // Filter cards based on selection
  const displayCards = selectedCardId 
    ? cards.filter((c: any) => c.id === selectedCardId)
    : cards;

  // Get all MSI transactions - deduplicate by transaction ID
  const allMSITransactions = displayCards
    .flatMap((card: any) => (card.transactions || []).map((t: any) => ({ ...t, cardId: card.id })))
    .filter((t: any) => t.installments && t.installments > 1);
  
  // Deduplicate transactions by ID
  const uniqueTransactions = Array.from(new Map(allMSITransactions.map((t: any) => [t.id, t])).values())
    .map((t: any) => ({ ...calculateTransactionDetails(t), cardId: t.cardId }));

  // Group by card - deduplicate cards first
  const uniqueCards = Array.from(new Map(displayCards.map((c: any) => [c.id, c])).values());
  
  const groupedByCard = uniqueCards
    .map((card: any) => {
      const cardTransactions = (card.transactions || [])
        .filter((t: any) => t.installments && t.installments > 1)
        .map((t: any) => calculateTransactionDetails(t));
      
      return {
        cardId: card.id,
        cardName: card.name,
        cardLast4: card.last4,
        transactions: cardTransactions,
        totalAmount: cardTransactions.reduce((sum: number, t: TransactionDetail) => sum + t.amount, 0),
        totalInterest: cardTransactions.reduce((sum: number, t: TransactionDetail) => sum + t.totalInterest, 0),
      };
    })
    .filter((c: any) => c.transactions.length > 0);

  // Grand totals
  const grandTotalInterest = uniqueTransactions.reduce((sum: number, t: any) => sum + t.totalInterest, 0);
  const grandTotalAmount = uniqueTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
  const grandTotalPayments = uniqueTransactions.reduce((sum: number, t: any) => sum + t.monthlyPayment, 0);

  if (allMSITransactions.length === 0) {
    return (
      <Box p={3}>
        <Typography variant="h5" fontWeight={600} mb={2}>
          Análisis de Compras sin Interés (MSI)
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Desglose detallado de intereses proyectados por cada transacción MSI.
        </Typography>
        <Alert severity="info">
          No hay transacciones MSI registradas. Carga un estado de cuenta para ver el análisis.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} mb={2}>
        Análisis de Compras sin Interés (MSI)
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Desglose detallado de intereses proyectados por cada transacción MSI y tarjeta.
      </Typography>

      {/* Card Selection Filter */}
      {cards.length > 1 && (
        <Box mb={3}>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Filtrar por tarjeta:
          </Typography>
          <ButtonGroup size="small" variant="outlined">
            <Button 
              variant={selectedCardId === null ? "contained" : "outlined"}
              onClick={() => setSelectedCardId(null)}
            >
              Todas las tarjetas
            </Button>
            {cards.map((card: any) => (
              <Button 
                key={card.id}
                variant={selectedCardId === card.id ? "contained" : "outlined"}
                onClick={() => setSelectedCardId(card.id)}
              >
                {card.name} ({card.last4})
              </Button>
            ))}
          </ButtonGroup>
        </Box>
      )}

      {/* Summary Stats */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Transacciones MSI
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {allMSITransactions.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Monto Total MSI
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {formatCurrency(grandTotalAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Pago Mensual Promedio
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {formatCurrency(grandTotalPayments)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* By Card Details */}
      <Typography variant="subtitle1" fontWeight={600} mb={2}>
        Desglose por Tarjeta
      </Typography>

      {groupedByCard.map((cardGroup: any, cardIdx: number) => (
        <Accordion key={cardIdx} defaultExpanded variant="outlined" sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 2 }}>
              <Box>
                <Typography fontWeight={600}>
                  {cardGroup.cardName} (...{cardGroup.cardLast4})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {cardGroup.transactions.length} transacciones • {formatCurrency(cardGroup.totalAmount)}
                </Typography>
              </Box>
              <Typography fontWeight={600} color="error">
                {formatCurrency(cardGroup.totalInterest)}
              </Typography>
            </Box>
          </AccordionSummary>

          <AccordionDetails>
            <Paper sx={{ overflowX: 'auto', width: '100%', variant: 'outlined' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      Monto
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      Progreso
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      Pago/Mes
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cardGroup.transactions.map((t: TransactionDetail, tidx: number) => (
                    <TableRow key={tidx}>
                      <TableCell variant="body" sx={{ fontSize: 13 }}>
                        {t.description}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(t.amount)}</TableCell>
                      <TableCell align="center">
                        <Typography variant="caption" fontWeight={600}>
                          {t.monthsCompleted}/{t.totalMonths}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{formatCurrency(t.monthlyPayment)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 600 }}>
                      Total Tarjeta
                    </TableCell>
                    <TableCell />
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatCurrency(
                        cardGroup.transactions.reduce((s: number, t: TransactionDetail) => s + t.monthlyPayment, 0)
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Grand Total */}
      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={6}>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Total Monto MSI
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {formatCurrency(grandTotalAmount)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Pago Total Mensual
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {formatCurrency(grandTotalPayments)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Info */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="subtitle2" fontWeight={600} mb={1}>
          📊 Cómo leer:
        </Typography>
        <Typography variant="body2">
          <strong>Progreso:</strong> Cuántos meses llevas pagado de la compra MSI (ej: 1/3 = 1 de 3 meses).
          <br />
          <strong>Pago/Mes:</strong> Lo que pagas mensualmente de esta compra.
          <br />
          <strong>Interés:</strong> Interés total proyectado en los meses pendientes (1.5% mensual).
        </Typography>
      </Alert>
    </Box>
  );
};
