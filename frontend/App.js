import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import StartScreen from "./Interfaces/StartScreen";
import XploitScreen from "./Interfaces/XploitScreen";
import MainScreen from "./Interfaces/MainScreen";
import QRScreen from "./Interfaces/QRScreen";
import ModelosScreen from "./Interfaces/ModelosScreen";
import CompatibilidadScreen from "./Interfaces/CompatibilidadScreen";
import CatalogoScreen from "./Interfaces/CatalogoScreen";
import ConfiguracionScreen from "./Interfaces/ConfiguracionScreen";
import SignIn from "./Interfaces/SignIn";
import EmpecemosScreen from "./Interfaces/EmpecemosScreen";
import SignUp from "./Interfaces/SignUp";
import testAssemblyAI from "./Interfaces/testAssemblyAI";
import explosionado from "./Interfaces/explosionado.js";
import DashExplorer from "./Interfaces/DashExplorer.js";
import PlotlyExplorer from "./Interfaces/PlotlyExplorer.js";


const Stack = createStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false, // Oculta el encabezado en todas las pantallas
                }}
            >
                <Stack.Screen name="test" component={testAssemblyAI}/>
                <Stack.Screen name="exploit" component={explosionado}/>
                <Stack.Screen name="DashExplorer" component={DashExplorer}/>
                <Stack.Screen name="PlotlyExplorer" component={PlotlyExplorer}/>
                <Stack.Screen name="Start" component={StartScreen} />
                <Stack.Screen name="Empecemos" component={EmpecemosScreen} />
                <Stack.Screen name="SignUp" component={SignUp} />
                <Stack.Screen name="SignIn" component={SignIn} />
                <Stack.Screen name="Main" component={MainScreen} />
                <Stack.Screen name="Xploit" component={XploitScreen} />
                <Stack.Screen name="QR" component={QRScreen}/>
                <Stack.Screen name="Modelos" component={ModelosScreen}/>
                <Stack.Screen name="Compatibilidad" component={CompatibilidadScreen}/>
                <Stack.Screen name="Catalogo" component={CatalogoScreen}/>
                <Stack.Screen name="Configuracion" component={ConfiguracionScreen}/>
                <Stack.Screen name="Explosionado" component={explosionado}/>

            </Stack.Navigator>
        </NavigationContainer>
    );
}


