#!/bin/bash

# Script para iniciar el servicio AI de STEPVOICE
echo "🤖 STEPVOICE AI - Iniciando servicio de IA..."
echo "================================================"

# Verificar si estamos en el directorio correcto
if [ ! -d "backend" ]; then
    echo "❌ Error: Directorio 'backend' no encontrado"
    echo "   Asegúrate de ejecutar este script desde el directorio 'frontend'"
    exit 1
fi

# Cambiar al directorio backend
cd backend

# Verificar si Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python3 no está instalado"
    echo "   Instala Python3 para continuar"
    exit 1
fi

# Verificar dependencias y instalar si es necesario
echo "📦 Verificando dependencias de Python..."
if [ ! -f "requirements.txt" ]; then
    echo "⚠️  Archivo requirements.txt no encontrado, creando uno básico..."
    cat > requirements.txt << EOF
flask>=2.0.0
flask-cors>=4.0.0
asyncio
EOF
fi

# Instalar dependencias
echo "📥 Instalando dependencias..."
python3 -m pip install -r requirements.txt

# Verificar si el archivo del servicio de IA existe
if [ ! -f "ai_service.py" ]; then
    echo "❌ Error: ai_service.py no encontrado"
    exit 1
fi

echo "🚀 Iniciando STEPVOICE AI Service en puerto 8052..."
echo "📱 La aplicación React Native se conectará automáticamente"
echo "🔗 URL del servicio: http://127.0.0.1:8052"
echo ""
echo "⚠️  Para detener el servicio presiona Ctrl+C"
echo "================================================"
echo ""

# Iniciar el servicio
python3 ai_service.py
