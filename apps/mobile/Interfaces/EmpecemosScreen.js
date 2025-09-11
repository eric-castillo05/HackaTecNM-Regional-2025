import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    StatusBar,
    Dimensions,
    ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const EmpecemosScreen = ({ navigation }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollViewRef = useRef(null);
    
    // Carousel images with titles
    const carouselImages = [
      { id: 1, source: require("../assets/startConstr.jpg"), title: "Armado de productos" },
      { id: 2, source: require("../assets/startInd.jpg"), title: "Industria" },
      { id: 3, source: require("../assets/startEdu.jpg"), title: "Educación" },
    ];

    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round((scrollPosition / width));
        setActiveIndex(index);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle='light-content' />
            
            {/* Header with gradient */}
            <LinearGradient
                colors={['#1a237e', '#0d47a1']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <Text style={styles.title}>StepVoice</Text>
            </LinearGradient>

            {/* Main Content */}
            <View style={styles.body}>
                <View style={styles.welcomeContainer}>
                    <Text style={styles.welcomeTitle}>Bienvenido a StepVoice</Text>
                    <Text style={styles.welcomeSubtitle}>
                        Selecciona una opción para continuar
                    </Text>
                </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("SignUp")}
            >
              <FontAwesome5
                name='qrcode'
                size={32}
                color='#484040ff'
              />
              <Text style={styles.cardTitle}>Escanear QR</Text>
              <Text style={styles.cardSubtitle}>VR para el Armado</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("SignIn")}
            >
              <FontAwesome5
                name='qrcode'
                size={32}
                color='#484040ff'
              />
              <Text style={styles.cardTitle}>Escanear QR</Text>
              <Text style={styles.cardSubtitle}>Modelo 3D</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: width * 0.04,
    paddingTop: height * 0.05,
    height: height * 0.12,
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    color: "#fff",
  },
  body: {
    justifyContent: "center",
  },
  welcomeContainer: {
    alignItems: "center",
    marginBottom: height * 0.04,
  },
  robotImage: {
    width: width * 0.7,
    height: height * 0.3,
    resizeMode: "contain",
    marginBottom: height * 0.02,
  },
  welcomeTitle: {
    fontSize: width * 0.07,
    fontWeight: "600",
    color: "#357ABC",
    marginBottom: height * 0.01,
  },
  welcomeSubtitle: {
    fontSize: width * 0.04,
    color: "#666",
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: width * 0.05,
    marginBottom: height * 0.02,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: width * 0.045,
    fontWeight: "600",
    color: "#357ABC",
    marginTop: height * 0.015,
    marginBottom: height * 0.005,
  },
  cardSubtitle: {
    fontSize: width * 0.035,
    color: "#666",
  },
  carouselContainer: {
    backgroundColor: "#fff",
    marginVertical: height * 0.02,
    borderRadius: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: "hidden",
    height: height * 0.25,
  },
  carousel: {
    height: height * 0.22,
  },
  imageContainer: {
    width: width,
    paddingHorizontal: width * 0.04,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  carouselImage: {
    width: width - width * 0.08,
    height: height * 0.16,
    borderRadius: 10,
  },
  imageLabelContainer: {
    position: "absolute",
    bottom: 10,
    left: width * 0.04,
    right: width * 0.04,
    backgroundColor: "rgba(53, 122, 188, 0.9)",
    borderRadius: 8,
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.03,
  },
  imageLabel: {
    color: "#fff",
    fontSize: width * 0.04,
    fontWeight: "600",
    textAlign: "center",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: height * 0.015,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#357ABC",
    width: 12,
    height: 8,
    borderRadius: 4,
  },
});

export default EmpecemosScreen;