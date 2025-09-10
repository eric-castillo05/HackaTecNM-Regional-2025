import * as THREE from 'three';

// Function to convert JSON vectors back to STL
export function convertVectorsToSTL(jsonData) {
    const { v: vectors } = jsonData;

    // Create a new geometry
    const geometry = new THREE.BufferGeometry();

    // Convert vectors array to Float32Array for Three.js
    const vertices = new Float32Array(vectors);

    // Set the position attribute
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    // Compute normals for proper lighting/rendering
    geometry.computeVertexNormals();

    return geometry;
}

// Function to export geometry to STL format
export function geometryToSTL(geometry) {
    const vertices = geometry.attributes.position.array;
    const normals = geometry.attributes.normal.array;

    let stlString = 'solid exported\n';

    // Process triangles (every 3 vertices = 1 triangle)
    for (let i = 0; i < vertices.length; i += 9) {
        // Calculate triangle normal (or use computed normal)
        const normalIndex = Math.floor(i / 3);
        const nx = normals[normalIndex];
        const ny = normals[normalIndex + 1];
        const nz = normals[normalIndex + 2];

        stlString += `  facet normal ${nx} ${ny} ${nz}\n`;
        stlString += '    outer loop\n';

        // Add the 3 vertices of the triangle
        for (let j = 0; j < 9; j += 3) {
            const x = vertices[i + j];
            const y = vertices[i + j + 1];
            const z = vertices[i + j + 2];
            stlString += `      vertex ${x} ${y} ${z}\n`;
        }

        stlString += '    endloop\n';
        stlString += '  endfacet\n';
    }

    stlString += 'endsolid exported\n';

    return stlString;
}

// Complete function to convert JSON to STL string
export function jsonToSTL(jsonData) {
    const geometry = convertVectorsToSTL(jsonData);
    return geometryToSTL(geometry);
}

// Function to save STL file (React Native)
export async function saveSTLFile(jsonData, filename = 'exported.stl') {
    const stlContent = jsonToSTL(jsonData);

    // For React Native, you'll need to use a file system library like react-native-fs
    // This is a placeholder - implement based on your file saving needs
    try {
        // Example using react-native-fs:
        // import RNFS from 'react-native-fs';
        // const path = `${RNFS.DocumentDirectoryPath}/${filename}`;
        // await RNFS.writeFile(path, stlContent, 'utf8');

        console.log('STL Content:', stlContent);
        return stlContent;
    } catch (error) {
        console.error('Error saving STL file:', error);
        throw error;
    }
}

// Usage example:
/*
const jsonData = {
  v: [
    // Your vector array: [x1, y1, z1, x2, y2, z2, x3, y3, z3, ...]
    0, 0, 0,
    1, 0, 0,
    0, 1, 0,
    // ... more vertices
  ]
};

// Convert to STL
const stlString = jsonToSTL(jsonData);

// Or create Three.js geometry for rendering
const geometry = convertVectorsToSTL(jsonData);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const mesh = new THREE.Mesh(geometry, material);
*/