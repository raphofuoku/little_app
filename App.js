import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import SplashScreen from './screens/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import Onboarding from './screens/Onboarding';
import Profile from './screens/Profile';

const Stack = createNativeStackNavigator();

function App() {
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // Check onboarding status on app launch
  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const onboardingStatus = await AsyncStorage.getItem('onboardingCompleted');

      if (onboardingStatus === 'true') {
        setIsOnboardingCompleted(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const handleOnboardingComplete = async (userInfo) => {
    try {
      // Save onboarding completion status
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      await AsyncStorage.setItem('userData', JSON.stringify(userInfo));

      // Update state to show main app
      setIsOnboardingCompleted(true);

      Alert.alert(
        'Welcome to Little Lemon!',
        `Hello ${userInfo.firstName}! Your account has been created successfully.`,
        [{ text: 'Get Started', style: 'default' }]
      );
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['onboardingCompleted', 'userData', 'profileSettings']);
      setIsOnboardingCompleted(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // Show loading screen while checking onboarding status
  if (isLoading) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="#495E57" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false, // We'll handle headers in individual screens
          }}
        >
          {!isOnboardingCompleted ? (
            // Onboarding flow
            <Stack.Screen name="Onboarding">
              {(props) => (
                <Onboarding
                  {...props}
                  onComplete={handleOnboardingComplete}
                />
              )}
            </Stack.Screen>
          ) : (
            // Main app flow
            <>
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{
                  title: 'Little Lemon',
                }}
              />
              <Stack.Screen
                name="Profile"
                options={{
                  title: 'Profile',
                  headerShown: false, // Profile handles its own header
                }}
              >
                {(props) => (
                  <Profile
                    {...props}
                    onLogout={handleLogout}
                  />
                )}
              </Stack.Screen>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default App;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#495E57',
  },
});