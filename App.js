import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView, Animated, Easing, StatusBar, Platform, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { launchImageLibrary, launchCamera } from "react-native-image-picker";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function App() {
  const [photo, setPhoto] = useState(null);
  const [editedPhoto, setEditedPhoto] = useState(null);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];
  const filterPanelAnim = useState(new Animated.Value(0))[0];
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const [windowHeight, setWindowHeight] = useState(Dimensions.get('window').height);
  const fileInputRef = useRef(null);

  // Verifica se é web para ajustar as animações
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
      setWindowHeight(window.height);
    });
    return () => subscription?.remove();
  }, []);

  // Animação para o painel de filtros
  useEffect(() => {
    Animated.timing(filterPanelAnim, {
      toValue: showFilters ? 1 : 0,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: !isWeb,
    }).start();
  }, [showFilters]);

  // Função para manipular seleção de arquivo (WEB)
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar tipo de arquivo
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      Alert.alert('Erro', 'Por favor, selecione uma imagem válida (JPEG, PNG, GIF ou WebP)');
      return;
    }
    
    // Criar uma URL temporária para a imagem
    const imageUrl = URL.createObjectURL(file);
    
    // Criar objeto similar ao do react-native-image-picker
    const imageAsset = {
      uri: imageUrl,
      type: file.type,
      fileName: file.name,
      fileSize: file.size,
      width: 0,
      height: 0
    };
    
    setPhoto(imageAsset);
    setEditedPhoto(null);
    animateImageAppearance();
    
    // Obter dimensões da imagem
    const img = new Image();
    img.onload = function() {
      setPhoto(prev => ({
        ...prev,
        width: this.width,
        height: this.height
      }));
    };
    img.onerror = function() {
      console.error('Erro ao carregar imagem');
    };
    img.src = imageUrl;
  };

  function openAlbum() {
    if (!isWeb) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: !isWeb,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: !isWeb,
        })
      ]).start();
    }

    // Em ambiente web, use o input de arquivo diretamente
    if (isWeb && fileInputRef.current) {
      fileInputRef.current.click();
      return;
    }

    // Para React Native, use a abordagem original
    const options = {
      mediaType: "photo",
      quality: 0.8,
      selectionLimit: 1,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.error) {
        return;
      }
      setPhoto(response.assets[0]);
      setEditedPhoto(null);
      animateImageAppearance();
    });
  }

  async function openCamera() {
    if (!isWeb) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: !isWeb,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: !isWeb,
        })
      ]).start();
    }

    const options = {
      mediaType: "photo",
      quality: 0.8,
      selectionLimit: 1,
    };

    const response = await launchCamera(options);
    if (response.didCancel || response.error) {
      return;
    }
    setPhoto(response.assets[0]);
    setEditedPhoto(null);
    animateImageAppearance();
  }

  const animateImageAppearance = () => {
    fadeAnim.setValue(0);
    if (!isWeb) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: !isWeb,
      }).start();
    }
  };

  // Mapeamento de prompts para cada filtro
  const filterPrompts = {
    'Ghibli': 'Transforme esta imagem no estilo dos filmes do Studio Ghibli, com elementos mágicos, cores suaves e personagens fofos.',
    'Pixel Art': 'Converta esta imagem em pixel art com cores vibrantes e detalhes em baixa resolução estilo anos 80/90.',
    'Bobbie': 'Aplique um estilo fofo e adorável com tons pastel, elementos fofinhos e uma atmosfera aconchegante.',
    'Cyber': 'Transforme esta imagem em um estilo cyberpunk futurista com neon, elementos tecnológicos e uma estética de cidade futurista.',
    'Pistache': 'Aplique tons verdes suaves, elementos naturais e uma estética fresca e orgânica à imagem.',
    'Vintage': 'Dê um efeito vintage à imagem com sépia, grãos, desbotamento e um estilo retrô anos 70.',
    'P. Branco': 'Converta a imagem para preto e branco com alto contraste e tons dramáticos.',
  };

  // Função para comprimir imagem (apenas web)
  const compressImageIfNeeded = async (file, maxSizeMB = 1.5) => {
    if (file.size <= maxSizeMB * 1024 * 1024) {
      return file; // Não precisa comprimir
    }
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Redimensionar se necessário
        const maxDimension = 1000;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para blob com qualidade reduzida
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, { 
              type: 'image/jpeg',
              lastModified: new Date().getTime()
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          0.7 // Qualidade de 70%
        );
      };
      img.onerror = function() {
        console.error('Erro ao carregar imagem para compressão');
        resolve(file); // Fallback para o arquivo original
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Função para enviar imagem para API (ATUALIZADA)
  const sendImageToAPI = async (filterName) => {
    if (!photo) {
      Alert.alert('Atenção', 'Selecione uma imagem primeiro.');
      return;
    }

    setIsLoading(true);
    setSelectedFilter(filterName);
    
    try {
      let fileToSend;
      
      if (isWeb && fileInputRef.current && fileInputRef.current.files.length > 0) {
        // Usar o arquivo diretamente do input
        fileToSend = fileInputRef.current.files[0];
        // Comprimir se necessário
        fileToSend = await compressImageIfNeeded(fileToSend);
      } else {
        // Para React Native, buscar a imagem da URI
        try {
          const response = await fetch(photo.uri);
          const blob = await response.blob();
          fileToSend = new File([blob], photo.fileName || 'image.jpg', { type: blob.type });
        } catch (error) {
          console.error('Erro ao converter imagem para blob:', error);
          throw new Error('Falha ao processar a imagem');
        }
      }

      // Criar FormData como a API espera
      const formData = new FormData();
      formData.append('imagem', fileToSend);
      formData.append('tema', filterPrompts[filterName] || filterName);

      console.log('Enviando para API...', {
        fileName: fileToSend.name,
        fileType: fileToSend.type,
        fileSize: fileToSend.size,
        tema: filterPrompts[filterName] || filterName
      });

      // Fazer a requisição
      const response = await fetch('https://api-mural.onrender.com/api/editar-imagem', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      // Verificar resposta
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Resposta do servidor:', errorText);
        throw new Error(`Erro ${response.status}: ${errorText || 'Erro no servidor'}`);
      }

      const data = await response.json();
      
      if (data.novaImagemUrl) {
        setEditedPhoto(data.novaImagemUrl);
        Alert.alert('Sucesso', `Imagem transformada com estilo ${filterName}!`);
      } else {
        throw new Error('URL da imagem não retornada pela API');
      }
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      
      let errorMessage = 'Não foi possível processar a imagem. ';
      
      if (error.message.includes('413')) {
        errorMessage += 'Imagem muito grande. Tente uma imagem menor.';
      } else if (error.message.includes('400')) {
        errorMessage += 'Formato inválido ou parâmetros incorretos.';
      } else if (error.message.includes('Network Error')) {
        errorMessage += 'Problema de conexão. Verifique sua internet.';
      } else {
        errorMessage += error.message || 'Tente novamente.';
      }
      
      Alert.alert('Erro', errorMessage);
      
      // Modo de demonstração - simular uma resposta
      simulateApiResponse(filterName);
    } finally {
      setIsLoading(false);
    }
  };

  // Função de fallback para simular resposta da API
  const simulateApiResponse = (filterName) => {
    const filterDemoImages = {
      'Ghibli': 'https://placehold.co/600x400/a8c49e/ffffff?text=Estilo+Ghibli',
      'Pixel Art': 'https://placehold.co/600x400/98DDCA/ffffff?text=Pixel+Art',
      'Bobbie': 'https://placehold.co/600x400/FF7B9C/ffffff?text=Estilo+Bobbie',
      'Cyber': 'https://placehold.co/600x400/00FFFF/000000?text=Cyberpunk',
      'Pistache': 'https://placehold.co/600x400/70AD47/ffffff?text=Estilo+Pistache',
      'Vintage': 'https://placehold.co/600x400/6F4E37/ffffff?text=Vintage',
      'P. Branco': 'https://placehold.co/600x400/333333/EAEAEA?text=Preto+Branco',
    };
    
    setTimeout(() => {
      setEditedPhoto(filterDemoImages[filterName] || 'https://placehold.co/600x400/3c3c3c/ffffff?text=Imagem+Editada');
      Alert.alert('Modo Demonstração', 
        `A API está temporariamente indisponível. Esta é uma imagem de demonstração do estilo ${filterName}.`);
    }, 1500);
  };

  const themes = {
    default: {
      container: { backgroundColor: '#fff' },
      accent: '#121212',
      secondary: '#f0f0f0',
      button: { backgroundColor: '#f8f8f8', text: '#121212' }
    },
    ghibli: {
      container: { backgroundColor: '#f0e9d8' },
      accent: '#a8c49e',
      secondary: '#e2d6b9',
      button: { backgroundColor: '#e2d6b9', text: '#4a5e3f' }
    },
    pixel: {
      container: { backgroundColor: '#394A59' },
      accent: '#98DDCA',
      secondary: '#2c3a47',
      button: { backgroundColor: '#2c3a47', text: '#98DDCA' }
    },
    bobbie: {
      container: { backgroundColor: '#F7C5CC' },
      accent: '#FF7B9C',
      secondary: '#f4b0bc',
      button: { backgroundColor: '#f4b0bc', text: '#c63c5e' }
    },
    cyber: {
      container: { backgroundColor: '#1C2938' },
      accent: '#00FFFF',
      secondary: '#15202b',
      button: { backgroundColor: '#15202b', text: '#00FFFF' }
    },
    pistache: {
      container: { backgroundColor: '#C5E0B4' },
      accent: '#70AD47',
      secondary: '#b5d6a2',
      button: { backgroundColor: '#b5d6a2', text: '#4c7a2f' }
    },
    vintage: {
      container: { backgroundColor: '#D2B48C' },
      accent: '#6F4E37',
      secondary: '#c19a6b',
      button: { backgroundColor: '#c19a6b', text: '#4a3221' }
    },
    pretoBranco: {
      container: { backgroundColor: '#EAEAEA' },
      accent: '#333333',
      secondary: '#d5d5d5',
      button: { backgroundColor: '#d5d5d5', text: '#333333' }
    },
  };

  const getContrastColor = (backgroundColor) => {
    if (!backgroundColor || backgroundColor === '#fff') return '#000000';
    
    const hex = backgroundColor.replace('#', '');
    if (hex.length !== 6) return '#000000';
    
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  const applyFilter = (filterName, filterFunction) => {
    setSelectedFilter(filterName);
    filterFunction();
    sendImageToAPI(filterName);
    
    if (!isWeb) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: !isWeb,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: !isWeb,
          easing: Easing.out(Easing.back(2)),
        })
      ]).start();
    }
  };

  const filters = [
    { 
      name: 'Ghibli', 
      icon: <FontAwesome name="paint-brush" size={30} color="#a8c49e" />, 
      onPress: () => applyFilter('Ghibli', () => setCurrentTheme('ghibli')), 
      color: '#f0e9d8', 
      borderColor: '#a8c49e' 
    },
    { 
      name: 'Pixel Art', 
      icon: <Text style={{ fontSize: 30 }}>👾</Text>, 
      onPress: () => applyFilter('Pixel Art', () => setCurrentTheme('pixel')), 
      color: '#394A59', 
      borderColor: '#98DDCA' 
    },
    { 
      name: 'Bobbie', 
      icon: <FontAwesome name="paw" size={30} color="#FF7B9C" />, 
      onPress: () => applyFilter('Bobbie', () => setCurrentTheme('bobbie')), 
      color: '#F7C5CC', 
      borderColor: '#FF7B9C' 
    },
    { 
      name: 'Cyber', 
      icon: <Text style={{ fontSize: 30 }}>🤖</Text>, 
      onPress: () => applyFilter('Cyber', () => setCurrentTheme('cyber')), 
      color: '#1C2938', 
      borderColor: '#00FFFF' 
    },
    { 
      name: 'Pistache', 
      icon: <FontAwesome name="envira" size={30} color="#70AD47" />, 
      onPress: () => applyFilter('Pistache', () => setCurrentTheme('pistache')), 
      color: '#C5E0B4', 
      borderColor: '#70AD47' 
    },
    { 
      name: 'Vintage', 
      icon: <FontAwesome name="camera-retro" size={30} color="#6F4E37" />, 
      onPress: () => applyFilter('Vintage', () => setCurrentTheme('vintage')), 
      color: '#D2B48C', 
      borderColor: '#6F4E37' 
    },
    { 
      name: 'P. Branco', 
      icon: <FontAwesome name="adjust" size={30} color="#333333" />, 
      onPress: () => applyFilter('P. Branco', () => setCurrentTheme('pretoBranco')), 
      color: '#EAEAEA', 
      borderColor: '#333333' 
    },
  ];

  const currentBgColor = themes[currentTheme].container.backgroundColor;
  const accentColor = themes[currentTheme].accent;
  const secondaryColor = themes[currentTheme].secondary;
  const buttonStyle = themes[currentTheme].button;
  const textColor = getContrastColor(currentBgColor);

  // Estilos condicionais para web vs native
  const webShadow = isWeb ? {
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  } : {};

  const buttonShadow = isWeb ? {
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
  } : {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  };

  const filterButtonShadow = isWeb ? {
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  } : {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  };

  // Ajustar tamanho dos botões de filtro baseado na largura da tela
  const filterButtonSize = windowWidth > 500 ? 90 : 70;

  return (
    <SafeAreaView style={[styles.container, themes[currentTheme].container]}>
      <StatusBar backgroundColor={currentBgColor} barStyle={textColor === '#000000' ? 'dark-content' : 'light-content'} />
      
      {/* Input de arquivo oculto para web */}
      {isWeb && (
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleFileSelect}
        />
      )}
      
      {/* Header com título */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>
          📸 AI PhotoFilters
        </Text>
        <Text style={[styles.subtitle, { color: accentColor }]}>
          Transforme suas fotos com IA
        </Text>
      </View>

      {/* Botões principais com animação */}
      <Animated.View style={[styles.buttons, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity 
          style={[styles.button, { 
            backgroundColor: buttonStyle.backgroundColor,
            borderColor: accentColor,
            ...buttonShadow,
            ...webShadow,
          }]} 
          onPress={openAlbum}
        >
          <Ionicons name="images" size={20} color={buttonStyle.text} />
          <Text style={[styles.text, { color: buttonStyle.text, marginLeft: 8 }]}>
            Abrir Álbum
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, { 
            backgroundColor: buttonStyle.backgroundColor,
            borderColor: accentColor,
            ...buttonShadow,
            ...webShadow,
          }]} 
          onPress={openCamera}
        >
          <Ionicons name="camera" size={20} color={buttonStyle.text} />
          <Text style={[styles.text, { color: buttonStyle.text, marginLeft: 8 }]}>
            Abrir Camera
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Imagem com animação de fade */}
      {(photo !== null || editedPhoto !== null) && (
        <Animated.View style={[styles.imageContainer, { opacity: isWeb ? 1 : fadeAnim }]}>
          <Image 
            source={{ uri: editedPhoto || photo.uri }} 
            style={[styles.image, { borderColor: secondaryColor }]}
            resizeMode="cover"
          />
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Processando com IA...</Text>
            </View>
          )}
          {selectedFilter && !isLoading && (
            <View style={[styles.filterBadge, { backgroundColor: accentColor }]}>
              <Text style={styles.filterBadgeText}>Filtro: {selectedFilter}</Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Botão para mostrar/ocultar filtros */}
      <TouchableOpacity 
        style={[styles.toggleFiltersButton, { backgroundColor: accentColor }]}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Ionicons 
          name={showFilters ? "chevron-down" : "chevron-up"} 
          size={20} 
          color="#FFFFFF" 
        />
        <Text style={styles.toggleFiltersText}>
          {showFilters ? "Ocultar Filtros IA" : "Mostrar Filtros IA"}
        </Text>
      </TouchableOpacity>

      {/* Container dos filtros com animação */}
      <Animated.View 
        style={[
          styles.buttonFilterContainer, 
          { 
            height: filterPanelAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, filterButtonSize + 40]
            }),
            opacity: filterPanelAnim,
            marginBottom: showFilters ? 20 : 0,
            paddingBottom: showFilters ? 15 : 0,
          }
        ]}
      >
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.filterScrollView,
            { paddingHorizontal: windowWidth > 500 ? 30 : 15 }
          ]}
        >
          {filters.map((filter, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.filterButton, 
                { 
                  width: filterButtonSize,
                  height: filterButtonSize,
                  backgroundColor: filter.color, 
                  borderColor: filter.borderColor,
                  transform: [{ scale: selectedFilter === filter.name ? 1.1 : 1 }],
                  ...filterButtonShadow,
                  ...webShadow,
                }
              ]}
              onPress={filter.onPress}
              disabled={isLoading || !photo}
            >
              <View style={styles.filterContent}>
                {filter.icon}
                <Text style={[
                  styles.filterName, 
                  { color: getContrastColor(filter.color) }
                ]}>
                  {filter.name}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Espaçamento adicional na parte inferior quando os filtros estão visíveis */}
      {showFilters && <View style={styles.bottomSpacing} />}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttons: {
    flexDirection: Platform.OS === 'web' ? 'row' : (Dimensions.get('window').width > 500 ? 'row' : 'column'),
    gap: 14,
    marginBottom: 24,
    alignItems: 'center',
  },
  button: {
    padding: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    flexDirection: 'row',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  image: {
    width: Dimensions.get('window').width > 500 ? 400 : 320,
    height: Dimensions.get('window').width > 500 ? 400 : 320,
    borderRadius: 20,
    borderWidth: 3,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontWeight: 'bold',
  },
  filterBadge: {
    position: 'absolute',
    top: 10,
    right: Dimensions.get('window').width > 500 ? 40 : 10,
    padding: 8,
    borderRadius: 15,
    paddingHorizontal: 12,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  infoBox: {
    marginBottom: 15,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    maxWidth: '90%',
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
  },
  toggleFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 20,
    gap: 8,
  },
  toggleFiltersText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonFilterContainer: {
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  filterScrollView: {
    gap: 12,
    alignItems: 'center',
    paddingVertical: 15,
  },
  filterButton: {
    borderWidth: 2,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  filterName: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});