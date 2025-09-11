#!/usr/bin/env python3
"""
Script de inicialización para STEPVOICE AI System
Inicia todos los servicios necesarios para la aplicación de IA y modelos 3D
"""

import os
import sys
import subprocess
import time
import signal
import threading
from pathlib import Path

class StepVoiceAILauncher:
    def __init__(self):
        self.processes = []
        self.base_dir = Path(__file__).parent
        
    def print_banner(self):
        banner = """
███████╗████████╗███████╗██╗   ██╗██████╗  ██████╗ ██╗    ██╗ █████╗ ██╗   ██╗██╗     ███████╗
██╔════╝╚══██╔══╝██╔════╝██║   ██║██╔══██╗██╔═══██╗██║    ██║██╔══██╗██║   ██║██║     ██╔════╝
███████╗   ██║   █████╗  ██║   ██║██████╔╝██║   ██║██║ █╗ ██║███████║██║   ██║██║     █████╗  
╚════██║   ██║   ██╔══╝  ██║   ██║██╔══██╗██║   ██║██║███╗██║██╔══██║██║   ██║██║     ██╔══╝  
███████║   ██║   ███████╗╚██████╔╝██║  ██║╚██████╔╝╚███╔███╔╝██║  ██║╚██████╔╝███████╗███████╗
╚══════╝   ╚═╝   ╚══════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚══╝╚══╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝
                                                                                        v1.0
"""
        print(banner)
        print("=" * 70)
        
    def cleanup_ports(self):
        """Limpiar puertos ocupados por procesos anteriores"""
        ports_to_check = [8051, 8052]
        for port in ports_to_check:
            try:
                result = subprocess.run(['lsof', '-ti', f':{port}'], 
                                      capture_output=True, text=True)
                if result.stdout.strip():
                    pids = result.stdout.strip().split('\n')
                    for pid in pids:
                        if pid:
                            print(f"🧹 Liberando puerto {port} (PID: {pid})")
                            # Intentar terminar gracefully primero
                            subprocess.run(['kill', pid], capture_output=True)
                            time.sleep(1)  # Esperar un segundo
                            # Verificar si el proceso sigue corriendo
                            check_result = subprocess.run(['kill', '-0', pid], 
                                                        capture_output=True)
                            if check_result.returncode == 0:
                                # El proceso aún existe, forzar cierre
                                print(f"🔥 Forzando cierre del PID {pid}")
                                subprocess.run(['kill', '-9', pid], capture_output=True)
                                time.sleep(0.5)
            except Exception as e:
                print(f"⚠️  Error limpiando puerto {port}: {e}")
        
        # Esperar un poco más para asegurar que los puertos se liberen
        time.sleep(2)
    
    def check_requirements(self):
        """Verificar que todas las dependencias estén instaladas"""
        print("🔍 Verificando dependencias...")
        
        required_packages = [
            'flask',
            'flask_cors', 
            'plotly',
            'dash',
            'dash_bootstrap_components',
            'numpy',
            'pandas'
        ]
        
        missing_packages = []
        for package in required_packages:
            try:
                __import__(package.replace('-', '_'))
                print(f"✅ {package}")
            except ImportError:
                missing_packages.append(package)
                print(f"❌ {package}")
        
        if missing_packages:
            print(f"\n⚠️  Paquetes faltantes: {', '.join(missing_packages)}")
            print("💡 Instala con: pip install " + " ".join(missing_packages))
            return False
        
        print("✅ Todas las dependencias están instaladas\n")
        return True
    
    def start_ai_service(self):
        """Iniciar el servicio de IA conversacional"""
        print("🤖 Iniciando STEPVOICE AI Service...")
        ai_service_path = self.base_dir / 'ai_service.py'
        
        if not ai_service_path.exists():
            print(f"❌ No se encontró ai_service.py en {ai_service_path}")
            return False
            
        try:
            process = subprocess.Popen([
                sys.executable, str(ai_service_path)
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, 
               text=True, bufsize=1, universal_newlines=True)
            
            self.processes.append(('AI Service', process))
            print("✅ STEPVOICE AI Service iniciado en puerto 8052")
            return True
            
        except Exception as e:
            print(f"❌ Error iniciando AI Service: {e}")
            return False
    
    def start_3d_service(self):
        """Iniciar el servicio de visualización 3D"""
        print("🎯 Iniciando 3D Model Service...")
        model_service_path = self.base_dir / 'app.py'
        
        if not model_service_path.exists():
            print(f"❌ No se encontró app.py en {model_service_path}")
            return False
            
        try:
            process = subprocess.Popen([
                sys.executable, str(model_service_path)
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE,
               text=True, bufsize=1, universal_newlines=True)
            
            self.processes.append(('3D Model Service', process))
            print("✅ 3D Model Service iniciado en puerto 8051")
            return True
            
        except Exception as e:
            print(f"❌ Error iniciando 3D Service: {e}")
            return False
    
    def monitor_services(self):
        """Monitorear el estado de los servicios"""
        print("👀 Monitoreando servicios...")
        print("💡 Presiona Ctrl+C para detener todos los servicios\n")
        
        failed_services = set()
        
        while True:
            try:
                # Verificar estado de procesos
                running_services = []
                for name, process in self.processes:
                    if process.poll() is None:  # Proceso está corriendo
                        running_services.append(name)
                    else:
                        if name not in failed_services:
                            print(f"⚠️  {name} se detuvo inesperadamente")
                            # Leer stderr para obtener información del error
                            if process.stderr:
                                try:
                                    error_output = process.stderr.read()
                                    if error_output:
                                        print(f"🔴 Error en {name}: {error_output[:200]}...")
                                except:
                                    pass
                            failed_services.add(name)
                
                if len(running_services) == len(self.processes):
                    # Solo imprimir estado si todos están corriendo (para no spamear)
                    if len(failed_services) == 0:  # Primera vez que todos corren bien
                        print(f"✅ Todos los servicios corriendo correctamente")
                elif len(running_services) > 0:
                    print(f"🟨 Servicios corriendo: {len(running_services)}/{len(self.processes)}")
                
                time.sleep(10)  # Verificar cada 10 segundos (más frecuente)
                
            except KeyboardInterrupt:
                print("\n🛑 Deteniendo servicios...")
                self.stop_all_services()
                break
    
    def stop_all_services(self):
        """Detener todos los servicios"""
        for name, process in self.processes:
            try:
                print(f"🛑 Deteniendo {name}...")
                process.terminate()
                process.wait(timeout=5)
                print(f"✅ {name} detenido")
            except subprocess.TimeoutExpired:
                print(f"⚠️  Forzando cierre de {name}...")
                process.kill()
            except Exception as e:
                print(f"❌ Error deteniendo {name}: {e}")
        
        self.processes.clear()
        print("\n🎯 Todos los servicios de STEPVOICE AI han sido detenidos")
    
    def show_usage_instructions(self):
        """Mostrar instrucciones de uso"""
        instructions = """
        📋 INSTRUCCIONES DE USO:
        
        🤖 STEPVOICE AI Assistant:
           • Abre tu app React Native
           • Navega a la pantalla "StepVoiceAI" o "AI3DExplorer"
           • Mantén presionado el botón para hablar
           • Di comandos como: "explotar modelo", "vista normal", "ir a catálogo"
        
        🎯 Explorador 3D con IA:
           • Abre AI3DExplorer en tu app
           • Activa el panel de IA tocando el botón robot
           • Usa comandos de voz para controlar modelos 3D
           
        🌐 Servicios Web:
           • IA Service: http://127.0.0.1:8052
           • 3D Models: http://127.0.0.1:8051
        
        🗣️  Comandos de voz soportados:
           Español: "explotar modelo", "vista normal", "rotar", "zoom"
           English: "explode model", "normal view", "rotate", "zoom"
           Français: "exploser modèle", "vue normale", "tourner"
        
        """
        print(instructions)
    
    def run(self):
        """Ejecutar el launcher completo"""
        self.print_banner()
        
        # Limpiar puertos antes de empezar
        self.cleanup_ports()
        
        # Verificar dependencias
        if not self.check_requirements():
            print("❌ Faltan dependencias requeridas. Instalando...")
            return False
        
        # Iniciar servicios
        services_started = 0
        
        if self.start_ai_service():
            services_started += 1
        
        time.sleep(2)  # Esperar antes de iniciar el siguiente
        
        if self.start_3d_service():
            services_started += 1
        
        if services_started == 0:
            print("❌ No se pudo iniciar ningún servicio")
            return False
        elif services_started < 2:
            print(f"⚠️  Solo {services_started}/2 servicios iniciados")
        else:
            print("🎉 ¡Todos los servicios de STEPVOICE AI iniciados correctamente!")
        
        print(f"\n🚀 {services_started} servicios corriendo...")
        time.sleep(3)
        
        self.show_usage_instructions()
        
        # Monitorear servicios
        try:
            self.monitor_services()
        except Exception as e:
            print(f"Error en monitoreo: {e}")
            self.stop_all_services()

def main():
    # Configurar handler para Ctrl+C
    def signal_handler(signum, frame):
        print("\n\n🛑 Recibida señal de interrupción...")
        launcher.stop_all_services()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    launcher = StepVoiceAILauncher()
    launcher.run()

if __name__ == '__main__':
    main()
