# 🚀 Guía: Configurar Groq como IA para STEPVOICE

## ¿Por qué Groq en lugar de OpenAI?

- ✅ **100% GRATUITO** - 6,000 tokens por minuto sin costo
- ⚡ **SÚPER RÁPIDO** - Respuestas en milisegundos 
- 🎯 **FÁCIL SETUP** - Sin tarjeta de crédito requerida
- 🧠 **MODELOS POTENTES** - Mixtral-8x7B y Llama2-70B

## 📋 Pasos para configurar Groq:

### 1. Obtener tu API Key gratuita

1. **Abre tu navegador** y ve a: https://console.groq.com/keys
2. **Crear cuenta** (gratis, solo necesitas email)
3. **Haz clic en "Create API Key"**
4. **Dale un nombre** (ej: "STEPVOICE-AI")
5. **Copia la API key** (empieza con `gsk_...`)

### 2. Configurar la API Key

```bash
# Ve al directorio del servicio AI
cd services/ai-service

# Edita el archivo .env y reemplaza la línea:
# GROQ_API_KEY=gsk_your_groq_api_key_here
# 
# Por tu API key real:
# GROQ_API_KEY=gsk_tu_api_key_real_aqui

# O usa este comando (reemplaza YOUR_ACTUAL_KEY):
sed -i '' 's/gsk_your_groq_api_key_here/YOUR_ACTUAL_KEY/' .env
```

### 3. Reiniciar el servicio AI

```bash
# Detener el servicio actual
pkill -f ai_service.py

# Iniciarlo nuevamente
python3 ai_service.py
```

### 4. Verificar que funciona

```bash
# Probar el servicio
curl -X POST http://192.168.0.39:8052/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"text": "Hola, explícame sobre modelos 3D", "language": "es"}'
```

## 🎯 Tu app ahora tendrá:

- **Conversaciones inteligentes** con IA real
- **Respuestas contextualizadas** sobre modelos 3D
- **Soporte multiidioma** automático
- **Comandos de voz** para controlar modelos 3D
- **Fallback inteligente** cuando no hay conexión

## 🛠️ Scripts útiles:

### Para verificar configuración:
```bash
cd services/ai-service
./setup_groq.sh
```

### Para iniciar fácilmente el servicio:
```bash
cd apps/mobile  
./start_ai_service_fixed.sh
```

## 📊 Límites de Groq (gratis):

- **6,000 tokens por minuto** (suficiente para tu app)
- **Sin límite mensual** 
- **Sin tarjeta de crédito**
- **Múltiples modelos disponibles**

## 🚨 Si algo falla:

1. **Verifica la API key** en el archivo `.env`
2. **Comprueba logs** en `services/ai-service/ai_service.log`
3. **Reinicia el servicio** con los comandos de arriba
4. **Usa el modo fallback** - tu app funciona sin IA también

¡Tu STEPVOICE AI está listo para usar IA de última generación! 🎉
