import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as THREE from 'three';
import { GLView } from 'expo-gl';
import * as FileSystem from 'expo-file-system';

const chairData = require('../assets/output_chair.json');

const Explosionado = ({ navigation }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [exploded, setExploded] = useState(false);
    const glViewRef = useRef(null);
    const sceneRef = useRef(new THREE.Scene());
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const meshRef = useRef(null);

    // Process JSON vectors (array of triangles: [[[x,y,z], [x,y,z], [x,y,z]], ...])
    const processVectors = (jsonData) => {
        const vectors = jsonData.v;
        if (!vectors || !Array.isArray(vectors) || !vectors.every(triangle =>
                Array.isArray(triangle) && triangle.length === 3 && triangle.every(vertex =>
                    Array.isArray(vertex) && vertex.length === 3
                )
        )) {
            throw new Error('Invalid vectors data: must be an array of triangles with [x,y,z] vertices');
        }

        const vertices = [];
        const triangles = [];

        // Flatten vertices and create triangle indices
        vectors.forEach((triangle, triIndex) => {
            triangle.forEach((vertex, vertexIndex) => {
                vertices.push(...vertex); // Add x, y, z
            });
            // Indices for this triangle (vertices are added in order)
            const baseIndex = triIndex * 3;
            triangles.push([baseIndex, baseIndex + 1, baseIndex + 2]);
        });

        const x = vertices.filter((_, i) => i % 3 === 0);
        const y = vertices.filter((_, i) => i % 3 === 1);
        const z = vertices.filter((_, i) => i % 3 === 2);

        return { x, y, z, triangles, vertexCount: x.length, triangleCount: triangles.length };
    };

    // Create Three.js geometry with optional explosion
    const createGeometry = (processedData, isExploded = false) => {
        const { x, y, z, triangles } = processedData;
        let plotX = [...x];
        let plotY = [...y];
        let plotZ = [...z];

        if (isExploded) {
            const explosionFactor = 2.0;
            triangles.forEach((triangle) => {
                const centerX = (x[triangle[0]] + x[triangle[1]] + x[triangle[2]]) / 3;
                const centerY = (y[triangle[0]] + y[triangle[1]] + y[triangle[2]]) / 3;
                const centerZ = (z[triangle[0]] + z[triangle[1]] + z[triangle[2]]) / 3;

                triangle.forEach((vertexIndex) => {
                    const dx = x[vertexIndex] - centerX;
                    const dy = y[vertexIndex] - centerY;
                    const dz = z[vertexIndex] - centerZ;
                    plotX[vertexIndex] = x[vertexIndex] + dx * explosionFactor;
                    plotY[vertexIndex] = y[vertexIndex] + dy * explosionFactor;
                    plotZ[vertexIndex] = z[vertexIndex] + dz * explosionFactor;
                });
            });
        }

        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(plotX.map((x, i) => [x, plotY[i], plotZ[i]]).flat());
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const indices = triangles.flat();
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return geometry;
    };

    // Export to STL
    const exportToSTL = async (processedData) => {
        const { x, y, z, triangles } = processedData;
        let stlContent = 'solid exported\n';

        triangles.forEach((triangle) => {
            const v1 = [x[triangle[0]], y[triangle[0]], z[triangle[0]]];
            const v2 = [x[triangle[1]], y[triangle[1]], z[triangle[1]]];
            const v3 = [x[triangle[2]], y[triangle[2]], z[triangle[2]]];

            const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
            const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];
            const normal = [
                edge1[1] * edge2[2] - edge1[2] * edge2[1],
                edge1[2] * edge2[0] - edge1[0] * edge2[2],
                edge1[0] * edge2[1] - edge1[1] * edge2[0],
            ];
            const length = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2);
            if (length > 0) {
                normal[0] /= length;
                normal[1] /= length;
                normal[2] /= length;
            }

            stlContent += `  facet normal ${normal[0]} ${normal[1]} ${normal[2]}\n`;
            stlContent += '    outer loop\n';
            stlContent += `      vertex ${v1[0]} ${v1[1]} ${v1[2]}\n`;
            stlContent += `      vertex ${v2[0]} ${v2[1]} ${v2[2]}\n`;
            stlContent += `      vertex ${v3[0]} ${v3[1]} ${v3[2]}\n`;
            stlContent += '    endloop\n';
            stlContent += '  endfacet\n';
        });

        stlContent += 'endsolid exported\n';

        const outputPath = `${FileSystem.documentDirectory}output.stl`;
        await FileSystem.writeAsStringAsync(outputPath, stlContent, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        return outputPath;
    };

    // Initialize stats and validate JSON
    useEffect(() => {
        try {
            const processedData = processVectors(chairData);
            setStats({
                vertices: processedData.vertexCount,
                triangles: processedData.triangleCount,
                size: JSON.stringify(chairData).length,
            });
            setIsLoading(false);
        } catch (error) {
            console.error('Error procesando datos:', error);
            Alert.alert('Error', 'No se pudieron cargar los datos de la silla');
            setIsLoading(false);
        }
    }, []);

    // Update 3D model when exploded state changes
    useEffect(() => {
        if (!glViewRef.current || isLoading) return;

        const updateMesh = () => {
            const processedData = processVectors(chairData);
            const geometry = createGeometry(processedData, exploded);
            if (meshRef.current) {
                sceneRef.current.remove(meshRef.current);
                meshRef.current.geometry.dispose();
            }
            const material = new THREE.MeshPhongMaterial({
                color: 'lightblue',
                opacity: 0.8,
                transparent: true,
            });
            meshRef.current = new THREE.Mesh(geometry, material);
            sceneRef.current.add(meshRef.current);
        };

        updateMesh();
    }, [exploded, isLoading]);

    // Set up Three.js renderer
    const onContextCreate = async (gl) => {
        const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

        rendererRef.current = new THREE.WebGLRenderer({
            context: gl,
            antialias: true,
        });
        rendererRef.current.setSize(width, height);
        rendererRef.current.setClearColor(0xffffff, 1);

        cameraRef.current = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        // Adjust camera based on model size
        const processedData = processVectors(chairData);
        const box = new THREE.Box3().setFromArray(processedData.x.map((x, i) => [x, processedData.y[i], processedData.z[i]]));
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        cameraRef.current.position.set(center.x + maxDim * 1.5, center.y + maxDim * 1.5, center.z + maxDim * 1.5);
        cameraRef.current.lookAt(center);

        const light = new THREE.DirectionalLight(0xffffff, 0.8);
        light.position.set(100, 200, 0);
        sceneRef.current.add(light);

        const animate = () => {
            if (!rendererRef.current) return;
            requestAnimationFrame(animate);
            if (meshRef.current) {
                meshRef.current.rotation.y += 0.01; // Rotate for better visualization
            }
            rendererRef.current.render(sceneRef.current, cameraRef.current);
            gl.flush();
            gl.endFrameEXP();
        };
        animate();
    };

    const toggleExplosion = () => {
        setExploded(!exploded);
    };

    const handleExportSTL = async () => {
        try {
            const processedData = processVectors(chairData);
            const outputPath = await exportToSTL(processedData);
            Alert.alert('Éxito', `STL exportado a ${outputPath}`);
        } catch (error) {
            console.error('Error exporting STL:', error);
            Alert.alert('Error', 'No se pudo exportar el STL');
        }
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Cargando datos de la silla...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Explosionado de Silla 3D</Text>
            <View style={styles.statsContainer}>
                <Text style={styles.statText}>Vértices: {stats.vertices}</Text>
                <Text style={styles.statText}>Triángulos: {stats.triangles}</Text>
                <Text style={styles.statText}>Tamaño: {(stats.size / 1024).toFixed(2)} KB</Text>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={toggleExplosion}>
                    <Text style={styles.buttonText}>
                        {exploded ? 'Vista Normal' : 'Vista Explosionada'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleExportSTL}>
                    <Text style={styles.buttonText}>Exportar STL</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.plotContainer}>
                <GLView style={{ flex: 1, height: 300 }} onContextCreate={onContextCreate} />
                <Text style={styles.plotSubtext}>Estado: {exploded ? 'Explotado' : 'Normal'}</Text>
            </View>
            <View style={styles.dataInfo}>
                <Text style={styles.infoTitle}>Datos del Modelo:</Text>
                <Text style={steps.infoText}>Puntos: {stats.vertices}</Text>
                <Text style={styles.infoText}>Caras: {stats.triangles}</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    loadingText: {
        fontSize: 18,
        textAlign: 'center',
        marginTop: 100,
        color: '#666',
    },
    statsContainer: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statText: {
        fontSize: 16,
        marginVertical: 2,
        color: '#333',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        minWidth: 120,
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    plotContainer: {
        backgroundColor: 'white',
        height: 300,
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    plotSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
        textAlign: 'center',
    },
    dataInfo: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    infoText: {
        fontSize: 14,
        marginVertical: 2,
        color: '#666',
    },
});

export default Explosionado;