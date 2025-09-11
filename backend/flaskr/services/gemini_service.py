import json
from typing import Any, Optional
import requests
from flask.cli import load_dotenv
from flaskr.utils import Config


class gemini_service:
    def __init__(self):
        # Definir los pasos de armado de la silla
        self.assembly_steps = {
            1: {
                "step": "Preparacion inicial",
                "description": "Desempaca todas las 18 partes y verifica que esten completas. Organiza tornillos, tuercas y herramientas necesarias.",
                "parts_involved": ["Todas las partes", "Tornillos", "Tuercas", "Herramientas"],
                "estimated_time": "5 minutos"
            },
            2: {
                "step": "Montaje del respaldo",
                "description": "Une las partes del respaldo principal con los soportes laterales usando los tornillos largos.",
                "parts_involved": ["Respaldo principal", "Soportes laterales", "Tornillos largos"],
                "estimated_time": "8 minutos"
            },
            3: {
                "step": "Ensamble del asiento",
                "description": "Fija la base del asiento con los refuerzos inferiores usando tornillos medianos.",
                "parts_involved": ["Base del asiento", "Refuerzos inferiores", "Tornillos medianos"],
                "estimated_time": "6 minutos"
            },
            4: {
                "step": "Conexion respaldo-asiento",
                "description": "Une el respaldo ensamblado con el asiento usando las bisagras y tornillos de conexion.",
                "parts_involved": ["Respaldo ensamblado", "Asiento ensamblado", "Bisagras", "Tornillos de conexion"],
                "estimated_time": "10 minutos"
            },
            5: {
                "step": "Montaje de patas delanteras",
                "description": "Instala las dos patas delanteras en la base del asiento con tornillos de fijacion.",
                "parts_involved": ["Patas delanteras (2)", "Base del asiento", "Tornillos de fijacion"],
                "estimated_time": "7 minutos"
            },
            6: {
                "step": "Montaje de patas traseras",
                "description": "Instala las dos patas traseras conectandolas tanto al asiento como al respaldo.",
                "parts_involved": ["Patas traseras (2)", "Asiento", "Respaldo", "Tornillos largos"],
                "estimated_time": "8 minutos"
            },
            7: {
                "step": "Instalacion de refuerzos cruzados",
                "description": "Coloca los refuerzos cruzados entre las patas para dar estabilidad estructural.",
                "parts_involved": ["Refuerzos cruzados", "Patas", "Tornillos pequenos"],
                "estimated_time": "6 minutos"
            },
            8: {
                "step": "Montaje de reposabrazos",
                "description": "Instala los reposabrazos conectandolos al respaldo y a las patas delanteras.",
                "parts_involved": ["Reposabrazos (2)", "Respaldo", "Patas delanteras", "Tornillos de reposabrazos"],
                "estimated_time": "9 minutos"
            },
            9: {
                "step": "Ajustes finales y verificacion",
                "description": "Revisa todos los tornillos, ajusta la tension y verifica la estabilidad de la silla.",
                "parts_involved": ["Toda la silla ensamblada", "Herramientas de ajuste"],
                "estimated_time": "5 minutos"
            }
        }

        self.current_step = 1
        self.total_steps = len(self.assembly_steps)

    def init_app(self) -> None:
        pass

    def parse_user_request(self, text: str) -> str:
        """Interpreta la solicitud del usuario y determina que paso mostrar"""
        text_lower = text.lower().strip()

        # Comandos para navegacion
        if any(word in text_lower for word in ["primer paso", "inicio", "empezar", "comenzar", "primero"]):
            self.current_step = 1
            return self.get_step_info(1)

        elif any(word in text_lower for word in ["siguiente", "continuar", "proximo", "sigue"]):
            if self.current_step < self.total_steps:
                self.current_step += 1
                return self.get_step_info(self.current_step)
            else:
                return "Felicidades. Has completado todos los pasos del armado de la silla."

        elif any(word in text_lower for word in ["anterior", "atras", "previo", "volver"]):
            if self.current_step > 1:
                self.current_step -= 1
                return self.get_step_info(self.current_step)
            else:
                return "Ya estas en el primer paso del armado."

        elif any(word in text_lower for word in ["ultimo paso", "paso final", "final", "ultimo"]):
            self.current_step = self.total_steps
            return self.get_step_info(self.total_steps)

        elif any(word in text_lower for word in ["actual", "current", "donde estoy", "paso actual"]):
            return self.get_step_info(self.current_step)

        elif "paso" in text_lower:
            # Extraer numero de paso si se especifica
            words = text_lower.split()
            for i, word in enumerate(words):
                if word == "paso" and i + 1 < len(words):
                    try:
                        step_num = int(words[i + 1])
                        if 1 <= step_num <= self.total_steps:
                            self.current_step = step_num
                            return self.get_step_info(step_num)
                    except ValueError:
                        pass

        elif any(word in text_lower for word in ["ayuda", "help", "comandos", "que puedo hacer"]):
            return self.get_help_info()

        elif any(word in text_lower for word in ["resumen", "overview", "todos los pasos"]):
            return self.get_all_steps_summary()

        # Si no es un comando especifico, usar Gemini para respuesta contextual
        return f"Actualmente estas en el {self.get_step_info(self.current_step)} Necesitas ayuda especifica con este paso?"

    def get_step_info(self, step_num: int) -> str:
        """Obtiene la informacion detallada de un paso especifico"""
        if step_num not in self.assembly_steps:
            return "Paso no valido. Los pasos van del 1 al 9."

        step_data = self.assembly_steps[step_num]
        return f"PASO {step_num} DE {self.total_steps}: {step_data['step'].upper()}. Descripcion: {step_data['description']} Partes necesarias: {', '.join(step_data['parts_involved'])}. Tiempo estimado: {step_data['estimated_time']}. Comandos utiles: siguiente - ir al proximo paso, anterior - volver al paso previo, ayuda - ver todos los comandos."

    def get_help_info(self) -> str:
        """Muestra informacion de ayuda con todos los comandos disponibles"""
        return f"COMANDOS DISPONIBLES PARA EL ARMADO DE SILLA. Navegacion: primer paso - Ir al paso 1, siguiente - Avanzar al siguiente paso, anterior - Retroceder un paso, ultimo paso - Ir al paso final, paso numero - Ir a un paso especifico, paso actual - Ver el paso donde estas. Informacion: resumen - Ver todos los pasos resumidos, ayuda - Mostrar estos comandos. Estado actual: Paso {self.current_step} de {self.total_steps}."

    def get_all_steps_summary(self) -> str:
        """Muestra un resumen de todos los pasos"""
        summary_parts = ["RESUMEN COMPLETO - ARMADO DE SILLA (18 partes)."]

        for step_num, step_data in self.assembly_steps.items():
            status = "COMPLETADO" if step_num < self.current_step else "ACTUAL" if step_num == self.current_step else "PENDIENTE"
            summary_parts.append(f"{status} - Paso {step_num}: {step_data['step']} ({step_data['estimated_time']}).")

        total_time = sum(int(step['estimated_time'].split()[0]) for step in self.assembly_steps.values())
        summary_parts.append(f"Tiempo total estimado: {total_time} minutos.")

        return " ".join(summary_parts)

    def ask(self, text: str) -> None | tuple[str, Any] | tuple[str, int, str]:
        """Maneja las preguntas del usuario, priorizando comandos de armado sobre Gemini"""

        # Primero verificar si es un comando de armado
        assembly_response = self.parse_user_request(text)

        # Si la respuesta no indica que necesita Gemini, devolver directamente
        if not assembly_response.endswith("Necesitas ayuda especifica con este paso?"):
            return "Success", 200, assembly_response

        # Si necesita consulta adicional con Gemini
        try:
            print("DEBUG URL:", Config.URL)
            print("DEBUG KEY:", Config.GEMINI_KEY)

            # Contexto mejorado para Gemini
            context = f"Eres un asistente experto en armado de muebles. El usuario esta armando una silla de 18 partes y actualmente esta en el paso {self.current_step} de {self.total_steps}. Paso actual: {self.assembly_steps[self.current_step]['step']}. Descripcion: {self.assembly_steps[self.current_step]['description']}. Pregunta del usuario: {text}. Proporciona una respuesta util y especifica para ayudar con el armado de la silla. No uses emojis, caracteres especiales ni saltos de linea en tu respuesta. Responde todo en una sola linea de texto."

            headers = {
                "Content-Type": "application/json",
                "X-goog-api-key": Config.GEMINI_KEY,
            }

            data = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": context
                            }
                        ]
                    }
                ]
            }

            response = requests.post(Config.URL, headers=headers, data=json.dumps(data))

            if response.status_code == 200:
                result = response.json()
                gemini_response = result["candidates"][0]["content"]["parts"][0]["text"]

                # Combinar informacion del paso actual con respuesta de Gemini
                combined_response = f"{assembly_response} Asistencia adicional: {gemini_response}"

                return "Success", 200, combined_response

            return "Error:", response.status_code, response.text

        except Exception as e:
            print(f"Error consultando Gemini: {e}")
            # Si falla Gemini, al menos devolver la informacion del paso
            return "Success", 200, assembly_response