import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

const Onboarding = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContinue = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      if (onComplete) {
        onComplete(userData);
      }
    }
  };

  const handleSkipTutorial = () => {
    if (onComplete) {
      onComplete(userData);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return userData.firstName.trim() !== '' && userData.lastName.trim() !== '';
      case 2:
        return userData.email.trim() !== '' && userData.email.includes('@');
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/Logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Welcome!</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleContinue}
            >
              <Text style={styles.primaryButtonText}>Let's get started!</Text>
            </TouchableOpacity>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>What's your name?</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={userData.firstName}
                onChangeText={(text) => handleInputChange('firstName', text)}
                placeholderTextColor="#8EA3A3"
              />

              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={userData.lastName}
                onChangeText={(text) => handleInputChange('lastName', text)}
                placeholderTextColor="#8EA3A3"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                !isStepValid() && styles.disabledButton
              ]}
              onPress={handleContinue}
              disabled={!isStepValid()}
            >
              <Text style={[
                styles.primaryButtonText,
                !isStepValid() && styles.disabledButtonText
              ]}>
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Nice to meet you!</Text>
            <Text style={styles.subtitle}>How about your email address?</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={userData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#8EA3A3"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                !isStepValid() && styles.disabledButton
              ]}
              onPress={handleContinue}
              disabled={!isStepValid()}
            >
              <Text style={[
                styles.primaryButtonText,
                !isStepValid() && styles.disabledButtonText
              ]}>
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Thanks! Now let's find out what this app can do for you!</Text>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleContinue}
              >
                <Text style={styles.primaryButtonText}>Yes please!</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleSkipTutorial}
              >
                <Text style={styles.secondaryButtonText}>Skip tutorial</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  stepContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#495E57',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#7C7C7C',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#EDEFEE',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    color: '#333333',
  },
  buttonGroup: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#495E57',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#495E57',
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#495E57',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  disabledButtonText: {
    color: '#888888',
  },
});

export default Onboarding;