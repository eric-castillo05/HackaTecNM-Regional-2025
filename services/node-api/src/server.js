const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const aiService = require('./services/aiService');

const app = express();
const PORT = process.env.PORT || 8052;

// Middleware de seguridad
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // máximo 30 requests por minuto por IP
  message: {
    error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.',
    retryAfter: 60
  }
});

app.use(limiter);

// CORS para permitir requests desde el frontend React Native
app.use(cors({
  origin: ['http://localhost:19006', 'exp://192.168.0.39:19000'], // Expo web y mobile
  methods: ['GET', 'POST'],
  credentials: true
}));

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/ai/health', (req, res) => {
  try {
    const healthStatus = {
      service: 'STEPVOICE AI Backend',
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      openai_configured: !!process.env.OPENAI_API_KEY
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      service: 'STEPVOICE AI Backend',
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Chat endpoint - IA principal
app.post('/ai/chat', async (req, res) => {
  try {
    const { text, language = 'es' } = req.body;

    // Validación de entrada
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Texto requerido',
        code: 'MISSING_TEXT'
      });
    }

    if (text.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Texto demasiado largo (máximo 500 caracteres)',
        code: 'TEXT_TOO_LONG'
      });
    }

    console.log(`🤖 Procesando chat: "${text}" (idioma: ${language})`);

    // Llamar al servicio de IA
    const aiResponse = await aiService.processChat(text, language);

    if (!aiResponse) {
      throw new Error('No se pudo generar respuesta de IA');
    }

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString(),
      language: language
    });

  } catch (error) {
    console.error('Error en /ai/chat:', error);

    // Determinar tipo de error
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';

    if (error.message.includes('API key')) {
      statusCode = 503;
      errorCode = 'API_UNAVAILABLE';
    } else if (error.message.includes('rate limit')) {
      statusCode = 429;
      errorCode = 'RATE_LIMITED';
    }

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Error interno del servidor',
      code: errorCode,
      timestamp: new Date().toISOString()
    });
  }
});

// Fallback para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    available_endpoints: [
      'GET /ai/health',
      'POST /ai/chat'
    ],
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n🚀 =======================================');
  console.log(`🤖 STEPVOICE AI Backend iniciado`);
  console.log(`🌐 Puerto: ${PORT}`);
  console.log(`🔐 OpenAI configurado: ${!!process.env.OPENAI_API_KEY ? '✅' : '❌'}`);
  console.log(`📅 Tiempo: ${new Date().toISOString()}`);
  console.log('=======================================\n');
});

// Manejo de señales de cierre
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando STEPVOICE AI Backend...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando STEPVOICE AI Backend...');
  process.exit(0);
});

module.exports = app;
