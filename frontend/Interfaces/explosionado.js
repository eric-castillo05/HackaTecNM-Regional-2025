import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

// Importa tu JSON de vectores
import vectorsData from '../assets/output_chair.json';

const { width, height } = Dimensions.get('window');

const Explosionado = () => {
    const [plotlyHTML, setPlotlyHTML] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        generatePlotlyVisualization();
    }, []);

    const generatePlotlyVisualization = () => {
        try {
            console.log('Generating Plotly visualization...');

            // Extraer los vectores del JSON
            const vectors = vectorsData.v;
            console.log('Vectors loaded:', vectors.length, 'triangles');

            // Preparar los datos para Plotly (mesh3d)
            const x = [];
            const y = [];
            const z = [];
            const i = []; // índices de vértices para triángulos
            const j = [];
            const k = [];

            let vertexIndex = 0;

            // Procesar cada triángulo
            vectors.forEach(triangle => {
                // Añadir los 3 vértices del triángulo
                triangle.forEach(vertex => {
                    x.push(vertex[0]);
                    y.push(vertex[1]);
                    z.push(vertex[2]);
                });

                // Definir el triángulo usando los índices de los vértices
                i.push(vertexIndex);
                j.push(vertexIndex + 1);
                k.push(vertexIndex + 2);

                vertexIndex += 3;
            });

            // Crear el HTML con Plotly embebido
            const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>3D Model Viewer</title>
    <script src="https://cdn.plot.ly/plotly-2.26.0.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
        }
        #plotDiv {
            width: 100%;
            height: 1000%;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 16px;
            color: #666;
        }
    </style>
</head>
<body>
    <div id="plotDiv">
        <div class="loading">Cargando modelo 3D...</div>
    </div>

    <script>
        try {
            console.log('Initializing Plotly 3D visualization...');
            
            // Datos para el mesh 3D
            const data = [{
                type: 'mesh3d',
                x: ${JSON.stringify(x)},
                y: ${JSON.stringify(y)},
                z: ${JSON.stringify(z)},
                i: ${JSON.stringify(i)},
                j: ${JSON.stringify(j)},
                k: ${JSON.stringify(k)},
                
                // Configuración del material y colores
                color: 'pink',
                opacity: 0.8,
                
                // Iluminación y sombreado
                lighting: {
                    ambient: 0.5,
                    diffuse: 0.9,
                    fresnel: 0.2,
                    specular: 1.5,
                    roughness: 0.05,
                    facenormalsepsilon: 1e-15,
                    vertexnormalsepsilon: 1e-15
                },
                
                // Mostrar bordes
                flatshading: false,
                
                // Hover info
                hovertemplate: 'X: %{x}<br>Y: %{y}<br>Z: %{z}<extra></extra>'
            }];

            // Configuración del layout
            const layout = {
                scene: {
                    bgcolor: '#f8f9fa',
                    xaxis: {
                        title: '',
                        gridcolor: '#e9ecef',
                        zerolinecolor: '#dee2e6',
                        showticklabels: false,
                        showGrid: false,
                        zeroline: false,
                      
                    },
                    yaxis: {
                        title: '', 
                        gridcolor: '#e9ecef',
                        zerolinecolor: '#dee2e6',
                        showticklabels: false,
                        showGrid: false,
                        zeroline: false,
                    },
                    zaxis: {
                        title: '',
                        gridcolor: '#e9ecef',
                        zerolinecolor: '#dee2e6',
                        showticklabels: false,
                        showGrid: false,
                        zeroline: false,
                    },
                    camera: {
                        eye: {
                            x: 1.2,
                            y: 1.2, 
                            z: 1.2
                        }
                    },
                    aspectmode: 'cube'
                },
                margin: { l: 0, r: 0, b: 0, t: 40 },
                autosize: true,
                responsive: true
            };

            // Configuración de controles
            const config = {
                displayModeBar: true,
                modeBarButtonsToRemove: ['pan2d', 'lasso2d'],
                displaylogo: false,
                responsive: true
            };

            // Crear el gráfico
            Plotly.newPlot('plotDiv', data, layout, config).then(() => {
                console.log('Plotly plot created successfully');
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage("loaded");
                }
                
                // Opcional: Añadir animación de rotación automática
                // setInterval(() => {
                //     const update = {
                //         'scene.camera.eye': {
                //             x: 1.2 * Math.cos(Date.now() * 0.001),
                //             y: 1.2 * Math.sin(Date.now() * 0.001),
                //             z: 1.2
                //         }
                //     };
                //     Plotly.relayout('plotDiv', update);
                // }, 50);
                
            }).catch(error => {
                console.error('Error creating Plotly plot:', error);
                document.getElementById('plotDiv').innerHTML = 
                    '<div class="loading" style="color: red;">Error cargando el modelo: ' + error.message + '</div>';
            });

        } catch (error) {
            console.error('JavaScript error:', error);
            document.getElementById('plotDiv').innerHTML = 
                '<div class="loading" style="color: red;">Error: ' + error.message + '</div>';
        }
    </script>
</body>
</html>`;

            setPlotlyHTML(html);
            setIsLoading(false);
            console.log('HTML generated successfully');

        } catch (error) {
            console.error('Error generating visualization:', error);
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Preparando visualización 3D...</Text>
                <Text style={styles.debugText}>
                    Cargando {vectorsData.v?.length || 0} triángulos
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <WebView
                source={{ html: plotlyHTML }}
                style={styles.webView}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.webViewLoading}>
                        <ActivityIndicator size="large" color="#0000ff" />
                        <Text>Cargando modelo 3D...</Text>
                    </View>
                )}
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('WebView error: ', nativeEvent);
                }}
                onHttpError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('WebView HTTP error: ', nativeEvent);
                }}
                onMessage={(event) => {
                    if (event.nativeEvent.data === "loaded") {
                        setIsLoading(false);
                    }
                    console.log('WebView message:', event.nativeEvent.data);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    debugText: {
        marginTop: 10,
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    webView: {
        flex: 1,
    },
    webViewLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
});

export default Explosionado;