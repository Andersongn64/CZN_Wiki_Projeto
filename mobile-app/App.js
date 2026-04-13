import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/Home';
import RecommendScreen from './src/screens/Recommend';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" /> {/* Configura a barra de status */}
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1a1a2e', // Cor de fundo do cabeçalho
            },
            headerTintColor: '#e94560', // Cor do texto e ícones do cabeçalho
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'ChaosZero Wiki' }}
          />
          <Stack.Screen
            name="Recommend"
            component={RecommendScreen}
            options={{ title: 'Recomendações' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb', // Cor de fundo padrão para a área segura
  },
});