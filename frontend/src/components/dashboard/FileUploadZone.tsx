import React, { useState, useRef } from 'react';
import { Box, Paper, Typography, CircularProgress, Fade, Stack, Chip } from '@mui/material';
import { CloudUpload, CheckCircle } from '@mui/icons-material';
import { useData } from '../../contexts/DataContext';

interface UploadResult {
  added: number;
  card_name: string;
  card_id: string;
  transactions: Array<{ description: string; amount: number; date: string; category: string }>;
}

export const FileUploadZone: React.FC = () => {
  const { uploadStatement, summary } = useData();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await handleUpload(file);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    console.log('📁 Starting upload:', file.name, file.type);
    setIsUploading(true);
    setUploadResult(null);
    try {
      const result = await uploadStatement('', file);
      console.log('✅ Upload result:', result);
      setUploadResult(result);
      setTimeout(() => setUploadResult(null), 8000);
    } catch (err) {
      console.error('❌ Upload failed:', err);
      alert('Error en la carga: ' + (err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Paper
      elevation={0}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        border: isDragging ? '2px dashed #1A4F43' : '2px dashed #ccc',
        borderRadius: 3,
        p: 4,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        background: isDragging ? 'rgba(26, 79, 67, 0.02)' : 'transparent',
        '&:hover': {
          borderColor: '#1A4F43',
          background: 'rgba(26, 79, 67, 0.02)',
        },
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      {isUploading ? (
        <Box>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Procesando archivo con IA...
          </Typography>
        </Box>
      ) : uploadResult ? (
        <Fade in>
          <Box>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="success.main" sx={{ fontWeight: 600, mb: 1 }}>
              ✓ {uploadResult.added} transacciones extraídas
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Añadidas a {uploadResult.card_name}
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" sx={{ gap: 1 }}>
              {uploadResult.transactions.slice(0, 3).map((tx, i) => (
                <Chip 
                  key={i} 
                  label={`${tx.description.substring(0, 20)}: $${tx.amount.toFixed(2)}`}
                  size="small"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
              {uploadResult.transactions.length > 3 && (
                <Chip label={`+${uploadResult.transactions.length - 3} más`} size="small" />
              )}
            </Stack>
          </Box>
        </Fade>
      ) : (
        <Box>
          <CloudUpload sx={{ fontSize: 48, color: '#1A4F43', mb: 2, opacity: 0.6 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Suelta el extracto aquí
          </Typography>
          <Typography variant="body2" color="text.secondary">
            o haz clic para explorar
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Archivos PDF o imágenes • Extracción con IA
          </Typography>
        </Box>
      )}
    </Paper>
  );
};
