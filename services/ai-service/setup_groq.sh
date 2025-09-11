#!/bin/bash

echo "🚀 Configurando Groq como proveedor de IA para STEPVOICE"
echo "=================================================="
echo ""

# Verificar si ya hay una API key configurada
if grep -q "GROQ_API_KEY=gsk_" .env 2>/dev/null; then
    echo "✅ Groq API Key ya está configurada"
    echo ""
else
    echo "📋 PASOS PARA OBTENER TU GROQ API KEY GRATUITA:"
    echo ""
    echo "1. 🌐 Abre tu navegador y ve a: https://console.groq.com/keys"
    echo "2. 🔑 Crea una cuenta gratuita (si no tienes una)"
    echo "3. ➕ Haz clic en 'Create API Key'"
    echo "4. 📝 Dale un nombre (ej: 'STEPVOICE-AI')"
    echo "5. 📋 Copia la API key (empieza con 'gsk_')"
    echo ""
    echo "6. 🔧 Luego ejecuta este comando reemplazando YOUR_KEY:"
    echo "   sed -i '' 's/gsk_your_groq_api_key_here/YOUR_ACTUAL_KEY/' .env"
    echo ""
    echo "📊 GROQ ES GRATUITO Y OFRECE:"
    echo "   • 6,000 tokens por minuto GRATIS"
    echo "   • Modelos potentes como Mixtral"
    echo "   • Respuestas súper rápidas"
    echo "   • Sin necesidad de tarjeta de crédito"
    echo ""
fi

echo "🧪 Probando configuración actual..."
python3 -c "
import os
from dotenv import load_dotenv
load_dotenv()

groq_key = os.getenv('GROQ_API_KEY')
openai_key = os.getenv('OPENAI_API_KEY')

print('')
if groq_key and groq_key != 'gsk_your_groq_api_key_here':
    print('✅ Groq API Key configurada')
    try:
        from groq import Groq
        print('✅ Groq cliente disponible')
        print('🎯 ¡Tu STEPVOICE AI usará Groq como proveedor principal!')
    except ImportError:
        print('❌ Groq no instalado. Ejecuta: pip install groq')
elif openai_key:
    print('⚠️  Solo OpenAI disponible (configurar Groq es recomendado)')
    print('💡 Groq es gratuito y más rápido que OpenAI')
else:
    print('❌ Sin proveedores de IA configurados')
    print('📝 Configura Groq siguiendo los pasos de arriba')
print('')
"

echo "=================================================="
echo "💡 TIP: Una vez configurado Groq, reinicia el servicio AI"
echo "    Ejecuta: pkill -f ai_service.py && python3 ai_service.py"
