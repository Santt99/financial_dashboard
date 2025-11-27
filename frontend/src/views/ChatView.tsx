import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Format markdown-like text with lists and bold
const parseMarkdown = (text: string) => {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let buffer: string[] = [];
  let mode: 'ordered' | 'unordered' | null = null;

  const flushBuffer = () => {
    if (!buffer.length) return;
    const tag = mode === 'ordered' ? 'ol' : 'ul';
    result.push(
      <Box key={result.length} component={tag} sx={{ pl: 2, my: 1.5 }}>
        {buffer.map((item, i) => (
          <Typography key={i} component="li" variant="body2" my={0.5}>
            {item.replace(/^(\d+\.|-)?\s*/, '')}
          </Typography>
        ))}
      </Box>
    );
    buffer = [];
    mode = null;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    
    if (!trimmed) {
      if (buffer.length) flushBuffer();
      result.push(<Box key={result.length} my={0.5} />);
      return;
    }

    const isBold = (line.startsWith('**') && line.endsWith('**')) || 
                   (line.startsWith('**') && line.endsWith(':**'));
    const isOrdered = /^\d+\.\s/.test(line);
    const isBullet = line.trim().startsWith('-');

    if (isBold) {
      if (buffer.length) flushBuffer();
      const text = line.slice(2, line.endsWith(':**') ? -3 : -2);
      result.push(
        <Typography key={result.length} variant="body2" fontWeight={700} color="primary" my={1}>
          {text}
        </Typography>
      );
      return;
    }

    if (isOrdered) {
      if (mode !== 'ordered') flushBuffer();
      mode = 'ordered';
      buffer.push(line);
      return;
    }

    if (isBullet) {
      if (mode !== 'unordered') flushBuffer();
      mode = 'unordered';
      buffer.push(line);
      return;
    }

    if (buffer.length) flushBuffer();
    
    const parts = line.split(/\*\*(.*?)\*\*/);
    result.push(
      <Typography key={result.length} variant="body2" my={0.8}>
        {parts.map((part, i) => i % 2 === 0 ? part : <strong key={i}>{part}</strong>)}
      </Typography>
    );
  });

  if (buffer.length) flushBuffer();
  return result;
};

export const ChatView: React.FC = () => {
  const { summary } = useData();
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !token) return;

    const msg = input;
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:8000/chat/ask-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: msg }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`${res.status}: ${err}`);
      }

      let content = '';
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No stream body');

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        content += decoder.decode(value);
        setMessages((prev) => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = { role: 'assistant', content };
          return msgs;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (!summary) {
    return (
      <Box p={3}>
        <Alert severity="info">Cargando contexto financiero...</Alert>
      </Box>
    );
  }

  const hasCards = (summary.cards || []).length > 0;

  return (
    <Box p={3} display="flex" flexDirection="column" height="100vh">
      <Typography variant="h5" fontWeight={600} mb={1}>
        Asesor Financiero IA
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Pregunta sobre tus tarjetas, deudas y planes MSI
      </Typography>

      {!hasCards && (
        <Box mb={2}>
          <Alert severity="warning">
            No tienes tarjetas registradas. Carga un estado de cuenta para comenzar a chatear.
          </Alert>
        </Box>
      )}

      {error && (
        <Box mb={2}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      {/* Messages */}
      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          mb: 2,
          backgroundColor: '#f5f5f5',
        }}
      >
        {messages.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              {hasCards
                ? '¿Cuéntame sobre tus tarjetas y deudas!'
                : 'Carga un estado de cuenta para comenzar'}
            </Typography>
          </Box>
        ) : (
          messages.map((msg, idx) => (
            <Box key={idx} mb={2}>
              <Card
                variant="outlined"
                sx={{
                  backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#ffffff',
                  border: msg.role === 'user' ? '1px solid #90caf9' : '1px solid #e0e0e0',
                  ml: msg.role === 'user' ? 'auto' : 0,
                  mr: msg.role === 'user' ? 0 : 'auto',
                  maxWidth: '85%',
                  boxShadow: msg.role === 'user' ? 'none' : '0px 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    display="block"
                    mb={1}
                    color={msg.role === 'user' ? '#1976d2' : '#666'}
                  >
                    {msg.role === 'user' ? '👤 Tú' : '🤖 Asesor IA'}
                  </Typography>
                  <Box
                    sx={{
                      fontSize: '0.95rem',
                      lineHeight: 1.7,
                      color: '#333',
                      '& strong': { fontWeight: 700, color: '#1976d2' },
                      '& ol': { 
                        pl: 2, 
                        my: 1.5,
                        '& li': { mb: 0.8 }
                      },
                      '& ul': { 
                        pl: 2, 
                        my: 1.5,
                        '& li': { mb: 0.8 }
                      },
                      '& p': { my: 0.5 },
                    }}
                  >
                    {msg.role === 'user' ? msg.content : parseMarkdown(msg.content)}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))
        )}
        {loading && (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Paper>

      {/* Input */}
      <Box display="flex" gap={1}>
        <TextField
          fullWidth
          size="small"
          placeholder="Escribe tu pregunta..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && hasCards) {
              handleSendMessage();
            }
          }}
          disabled={!hasCards || loading}
          multiline
          maxRows={3}
        />
        <Button
          variant="contained"
          endIcon={<SendIcon />}
          onClick={handleSendMessage}
          disabled={!hasCards || !input.trim() || loading}
        >
          Enviar
        </Button>
      </Box>
    </Box>
  );
};
