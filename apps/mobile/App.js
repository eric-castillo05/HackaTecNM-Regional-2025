import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

// =============================================================================
// 🚀 STEPVOICE AI - NAVEGACIÓN PRINCIPAL
// =============================================================================

// 📱 Pantallas de Autenticación y Onboarding
import StartScreen from "./Interfaces/StartScreen";
import EmpecemosScreen from "./Interfaces/EmpecemosScreen";
import SignIn from "./Interfaces/SignIn";
import SignUp from "./Interfaces/SignUp";

// 🏠 Pantalla Principal y Navegación
import MainScreen from "./Interfaces/MainScreen";

// 🤖 STEPVOICE AI - Sistema de IA Conversacional
import StepVoiceAIAssistant from "./Interfaces/StepVoiceAIAssistant";
import AI3DExplorerScreen from "./Interfaces/AI3DExplorerScreen";
import testAssemblyAI from "./Interfaces/testAssemblyAI"; // Testing/Debug

// 🎯 Exploración y Visualización 3D
import XploitScreen from "./Interfaces/XploitScreen";
import explosionado from "./Interfaces/explosionado.js";
import DashExplorer from "./Interfaces/DashExplorer.js";
import PlotlyExplorer from "./Interfaces/PlotlyExplorer.js";

// 📚 Gestión de Modelos y Catálogo
import ModelosScreen from "./Interfaces/ModelosScreen";
import CatalogoScreen from "./Interfaces/CatalogoScreen";
import CompatibilidadScreen from "./Interfaces/CompatibilidadScreen";

// ⚙️ Utilidades y Configuración
import QRScreen from "./Interfaces/QRScreen";
import ConfiguracionScreen from "./Interfaces/ConfiguracionScreen";


const Stack = createStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Start" // Pantalla inicial
                screenOptions={{
                    headerShown: false, // Ocultar encabezados
                    gestureEnabled: true, // Habilitar gestos de navegación
                    cardStyleInterpolator: ({ current, layouts }) => {
                        return {
                            cardStyle: {
                                transform: [
                                    {
                                        translateX: current.progress.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [layouts.screen.width, 0],
                                        }),
                                    },
                                ],
                            },
                        };
                    },
                }}
            >
                {/* =================================================================== */}
                {/* 📱 FLUJO DE ONBOARDING Y AUTENTICACIÓN */}
                {/* =================================================================== */}
                <Stack.Screen 
                    name="Start" 
                    component={StartScreen}
                    options={{ title: 'Bienvenido a STEPVOICE' }}
                />
                <Stack.Screen 
                    name="Empecemos" 
                    component={EmpecemosScreen}
                    options={{ title: 'Empecemos' }}
                />
                <Stack.Screen 
                    name="SignIn" 
                    component={SignIn}
                    options={{ title: 'Iniciar Sesión' }}
                />
                <Stack.Screen 
                    name="SignUp" 
                    component={SignUp}
                    options={{ title: 'Registro' }}
                />

                {/* =================================================================== */}
                {/* 🏠 PANTALLA PRINCIPAL - Hub de navegación */}
                {/* =================================================================== */}
                <Stack.Screen 
                    name="Main" 
                    component={MainScreen}
                    options={{ title: 'STEPVOICE - Principal' }}
                />

                {/* =================================================================== */}
                {/* 🤖 STEPVOICE AI - SISTEMA DE IA CONVERSACIONAL */}
                {/* =================================================================== */}
                <Stack.Screen 
                    name="StepVoiceAI" 
                    component={StepVoiceAIAssistant}
                    options={{ 
                        title: '🤖 STEPVOICE AI Assistant',
                        headerBackTitle: 'Volver'
                    }}
                />
                <Stack.Screen 
                    name="AI3DExplorer" 
                    component={AI3DExplorerScreen}
                    options={{ 
                        title: '🎯 AI 3D Explorer',
                        headerBackTitle: 'Volver'
                    }}
                />

                {/* =================================================================== */}
                {/* 🎯 EXPLORACIÓN Y VISUALIZACIÓN 3D */}
                {/* =================================================================== */}
                <Stack.Screen 
                    name="Xploit" 
                    component={XploitScreen}
                    options={{ title: '🎯 Explorador 3D' }}
                />
                <Stack.Screen 
                    name="exploit" 
                    component={explosionado}
                    options={{ title: '💥 Modelo Explosionado' }}
                />
                <Stack.Screen 
                    name="DashExplorer" 
                    component={DashExplorer}
                    options={{ title: '📊 Dash Explorer' }}
                />
                <Stack.Screen 
                    name="PlotlyExplorer" 
                    component={PlotlyExplorer}
                    options={{ title: '📈 Plotly Explorer' }}
                />

                {/* =================================================================== */}
                {/* 📚 GESTIÓN DE MODELOS Y CATÁLOGO */}
                {/* =================================================================== */}
                <Stack.Screen 
                    name="Modelos" 
                    component={ModelosScreen}
                    options={{ title: '📦 Mis Modelos 3D' }}
                />
                <Stack.Screen 
                    name="Catalogo" 
                    component={CatalogoScreen}
                    options={{ title: '🗂️ Catálogo Completo' }}
                />
                <Stack.Screen 
                    name="Compatibilidad" 
                    component={CompatibilidadScreen}
                    options={{ title: '🔗 Compatibilidad' }}
                />

                {/* =================================================================== */}
                {/* ⚙️ UTILIDADES Y CONFIGURACIÓN */}
                {/* =================================================================== */}
                <Stack.Screen 
                    name="QR" 
                    component={QRScreen}
                    options={{ title: '📱 Escáner QR' }}
                />
                <Stack.Screen 
                    name="Configuracion" 
                    component={ConfiguracionScreen}
                    options={{ title: '⚙️ Configuración' }}
                />

                {/* =================================================================== */}
                {/* 🧪 DESARROLLO Y TESTING */}
                {/* =================================================================== */}
                <Stack.Screen 
                    name="test" 
                    component={testAssemblyAI}
                    options={{ title: '🧪 Test AssemblyAI' }}
                />

            </Stack.Navigator>
        </NavigationContainer>
    );
}

// =============================================================================
// 📋 FLUJO DE NAVEGACIÓN RECOMENDADO:
// =============================================================================
//
// 1. Start → Empecemos → SignIn/SignUp → Main
// 2. Main → [Cualquier pantalla]
// 3. StepVoiceAI → AI3DExplorer (Para experiencia completa de IA)
// 4. Modelos → Catalogo → Compatibilidad (Para gestión de modelos)
// 5. QR → [Pantalla específica según código]
//
// =============================================================================
// 🎯 PANTALLAS DESTACADAS PARA HACKATECNM:
// =============================================================================
//
// • StepVoiceAI: IA conversacional pura con reconocimiento de voz
// • AI3DExplorer: IA + Modelos 3D integrados
// • test: Para debugging del reconocimiento de voz
//
// =============================================================================
