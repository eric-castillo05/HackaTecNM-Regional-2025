#!/usr/bin/env python3
"""
Script de inicio para el servidor Dash
Configurado para funcionar con la aplicación React Native
"""

import os
import sys
import subprocess
import time
import signal
import atexit

# Agregar el directorio actual al path
sys.path.append(os.path.dirname(__file__))

def check_dependencies():
    """Verificar e instalar dependencias"""
    try:
        import dash
        import plotly
        import numpy
        import pandas
        import dash_bootstrap_components
        print("✅ Todas las dependencias están instaladas")
        return True
    except ImportError as e:
        print(f"❌ Dependencia faltante: {e}")
        print("Instalando dependencias...")
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
            print("✅ Dependencias instaladas exitosamente")
            return True
        except subprocess.CalledProcessError:
            print("❌ Error instalando dependencias")
            return False

def start_dash_server():
    """Iniciar servidor Dash"""
    try:
        # Verificar dependencias
        if not check_dependencies():
            return False
            
        # Verificar archivo de datos
        if not os.path.exists('output_chair.json'):
            print("❌ Archivo output_chair.json no encontrado")
            return False
            
        print("🚀 Iniciando servidor Dash en puerto 8051...")
        print("📱 La aplicación React Native se conectará automáticamente")
        print("🔗 URL del servidor: http://127.0.0.1:8051")
        print("📊 Datos del modelo: output_chair.json")
        print("\n⚠️  Para detener el servidor presiona Ctrl+C")
        print("="*50)
        
        # Importar y ejecutar la aplicación
        from app import app
        app.run(debug=False, host='0.0.0.0', port=8051)
        
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido por el usuario")
        return True
    except Exception as e:
        print(f"❌ Error ejecutando servidor: {e}")
        return False

def cleanup():
    """Cleanup al salir"""
    print("🧹 Limpiando recursos...")

# Registrar cleanup
atexit.register(cleanup)

if __name__ == '__main__':
    print("🪑 Visualizador 3D de Silla - Servidor Dash")
    print("="*50)
    
    if start_dash_server():
        print("✅ Servidor ejecutado exitosamente")
    else:
        print("❌ Error ejecutando servidor")
        sys.exit(1)
