// =============================================================================
// 🚀 STEPVOICE AI - CONFIGURACIÓN DE RUTAS DE NAVEGACIÓN
// =============================================================================

/**
 * Configuración centralizada de todas las rutas de la aplicación
 * Facilita el mantenimiento y la navegación programática
 */

export const ROUTES = {
    // 📱 ONBOARDING Y AUTENTICACIÓN
    START: 'Start',
    EMPECEMOS: 'Empecemos', 
    SIGN_IN: 'SignIn',
    SIGN_UP: 'SignUp',
    
    // 🏠 PANTALLA PRINCIPAL
    MAIN: 'Main',
    
    // 🤖 STEPVOICE AI SYSTEM
    STEPVOICE_AI: 'StepVoiceAI',
    AI_3D_EXPLORER: 'AI3DExplorer',
    
    // 🎯 EXPLORACIÓN 3D
    XPLOIT: 'Xploit',
    EXPLOIT: 'exploit',
    DASH_EXPLORER: 'DashExplorer',
    PLOTLY_EXPLORER: 'PlotlyExplorer',
    
    // 📚 GESTIÓN DE MODELOS
    MODELOS: 'Modelos',
    CATALOGO: 'Catalogo',
    COMPATIBILIDAD: 'Compatibilidad',
    
    // ⚙️ UTILIDADES
    QR: 'QR',
    CONFIGURACION: 'Configuracion',
    
    // 🧪 DESARROLLO
    TEST: 'test'
};

/**
 * Flujos de navegación predefinidos
 */
export const NAVIGATION_FLOWS = {
    // Flujo de onboarding completo
    ONBOARDING: [
        ROUTES.START,
        ROUTES.EMPECEMOS, 
        ROUTES.SIGN_IN,
        ROUTES.MAIN
    ],
    
    // Flujo de IA conversacional
    AI_EXPERIENCE: [
        ROUTES.STEPVOICE_AI,
        ROUTES.AI_3D_EXPLORER
    ],
    
    // Flujo de exploración 3D
    EXPLORATION_3D: [
        ROUTES.XPLOIT,
        ROUTES.EXPLOIT,
        ROUTES.DASH_EXPLORER,
        ROUTES.PLOTLY_EXPLORER
    ],
    
    // Flujo de gestión de modelos
    MODEL_MANAGEMENT: [
        ROUTES.MODELOS,
        ROUTES.CATALOGO,
        ROUTES.COMPATIBILIDAD
    ]
};

/**
 * Configuración de pantallas para navegación avanzada
 */
export const SCREEN_CONFIG = {
    [ROUTES.START]: {
        title: 'Bienvenido a STEPVOICE',
        icon: '🚀',
        description: 'Pantalla de bienvenida'
    },
    
    [ROUTES.STEPVOICE_AI]: {
        title: 'STEPVOICE AI Assistant',
        icon: '🤖',
        description: 'IA conversacional con reconocimiento de voz',
        featured: true
    },
    
    [ROUTES.AI_3D_EXPLORER]: {
        title: 'AI 3D Explorer', 
        icon: '🎯',
        description: 'IA integrada con modelos 3D',
        featured: true
    },
    
    [ROUTES.MAIN]: {
        title: 'STEPVOICE Principal',
        icon: '🏠',
        description: 'Pantalla principal de navegación'
    },
    
    [ROUTES.TEST]: {
        title: 'Test AssemblyAI',
        icon: '🧪',
        description: 'Testing de reconocimiento de voz',
        debug: true
    }
};

/**
 * Helpers para navegación programática
 */
export const NavigationHelpers = {
    /**
     * Obtener la siguiente pantalla en un flujo
     */
    getNextScreen: (currentScreen, flow) => {
        const flowScreens = NAVIGATION_FLOWS[flow];
        if (!flowScreens) return null;
        
        const currentIndex = flowScreens.indexOf(currentScreen);
        return currentIndex !== -1 && currentIndex < flowScreens.length - 1 
            ? flowScreens[currentIndex + 1] 
            : null;
    },
    
    /**
     * Obtener pantallas destacadas para HackaTecNM
     */
    getFeaturedScreens: () => {
        return Object.keys(SCREEN_CONFIG)
            .filter(route => SCREEN_CONFIG[route].featured)
            .map(route => ({
                route,
                ...SCREEN_CONFIG[route]
            }));
    },
    
    /**
     * Obtener información de una pantalla
     */
    getScreenInfo: (route) => {
        return SCREEN_CONFIG[route] || {
            title: route,
            icon: '📱',
            description: 'Pantalla de la aplicación'
        };
    }
};

/**
 * Configuración de transiciones de pantalla
 */
export const SCREEN_TRANSITIONS = {
    // Transición por defecto (slide desde la derecha)
    DEFAULT: {
        cardStyleInterpolator: ({ current, layouts }) => ({
            cardStyle: {
                transform: [{
                    translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                    }),
                }],
            },
        }),
    },
    
    // Transición modal (slide desde abajo)
    MODAL: {
        cardStyleInterpolator: ({ current, layouts }) => ({
            cardStyle: {
                transform: [{
                    translateY: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.height, 0],
                    }),
                }],
            },
        }),
    },
    
    // Fade in/out
    FADE: {
        cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
                opacity: current.progress,
            },
        }),
    }
};

export default {
    ROUTES,
    NAVIGATION_FLOWS,
    SCREEN_CONFIG,
    NavigationHelpers,
    SCREEN_TRANSITIONS
};
