import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const Profile = ({ navigation, onLogout }) => {
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    avatar: null,
    notifications: {
      orderStatuses: true,
      passwordChanges: true,
      specialOffers: true,
      newsletter: true,
    },
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadProfileData();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll permissions to select your profile picture.');
    }
  };

  const loadProfileData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const profileSettings = await AsyncStorage.getItem('profileSettings');

      if (userData) {
        const parsedUserData = JSON.parse(userData);
        setProfileData(prev => ({
          ...prev,
          firstName: parsedUserData.firstName || '',
          lastName: parsedUserData.lastName || '',
          email: parsedUserData.email || '',
        }));
      }

      if (profileSettings) {
        const parsedSettings = JSON.parse(profileSettings);
        setProfileData(prev => ({
          ...prev,
          ...parsedSettings,
        }));
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'phoneNumber') {
      // Format phone number as user types
      const formatted = formatPhoneNumber(value);
      setProfileData(prev => ({ ...prev, [field]: formatted }));
    } else {
      setProfileData(prev => ({ ...prev, [field]: value }));
    }
    setHasChanges(true);
  };

  const handleNotificationChange = (type) => {
    setProfileData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type],
      },
    }));
    setHasChanges(true);
  };

  const formatPhoneNumber = (value) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');

    // Limit to 10 digits
    const truncated = numbers.substring(0, 10);

    // Format as (XXX) XXX-XXXX
    if (truncated.length >= 6) {
      return `(${truncated.substring(0, 3)}) ${truncated.substring(3, 6)}-${truncated.substring(6)}`;
    } else if (truncated.length >= 3) {
      return `(${truncated.substring(0, 3)}) ${truncated.substring(3)}`;
    } else if (truncated.length > 0) {
      return `(${truncated}`;
    }
    return truncated;
  };

  const isValidPhoneNumber = (phone) => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length === 10;
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setProfileData(prev => ({ ...prev, avatar: result.assets[0].uri }));
        setHasChanges(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setProfileData(prev => ({ ...prev, avatar: null }));
            setHasChanges(true);
          },
        },
      ]
    );
  };

  const getInitials = () => {
    const firstInitial = profileData.firstName.charAt(0).toUpperCase();
    const lastInitial = profileData.lastName.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  };

  const saveChanges = async () => {
    // Validate required fields
    if (!profileData.firstName.trim() || !profileData.email.trim()) {
      Alert.alert('Error', 'First name and email are required.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    // Validate phone number if provided
    if (profileData.phoneNumber && !isValidPhoneNumber(profileData.phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      // Save basic user data
      const userData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
      };
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      // Save complete profile settings
      const profileSettings = {
        phoneNumber: profileData.phoneNumber,
        avatar: profileData.avatar,
        notifications: profileData.notifications,
      };
      await AsyncStorage.setItem('profileSettings', JSON.stringify(profileSettings));

      setHasChanges(false);
      Alert.alert('Success', 'Your changes have been saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    }
  };

  const discardChanges = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard all unsaved changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            loadProfileData();
            setHasChanges(false);
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out? All unsaved changes will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['userData', 'profileSettings', 'onboardingCompleted']);
              if (onLogout) {
                onLogout();
              }
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#495E57" />
          </TouchableOpacity>

          <Image
            source={{
              uri: 'https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/logo.png'
            }}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>
            LITTLE LEMON
            </Text>

          <View style={styles.headerRight}>
            {profileData.avatar ? (
              <Image source={{ uri: profileData.avatar }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={styles.headerAvatarText}>{getInitials()}</Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Personal information</Text>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <Text style={styles.sectionLabel}>Avatar</Text>
            <View style={styles.avatarContainer}>
              {profileData.avatar ? (
                <Image source={{ uri: profileData.avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>{getInitials()}</Text>
                </View>
              )}

              <View style={styles.avatarButtons}>
                <TouchableOpacity style={styles.changeButton} onPress={pickImage}>
                  <Text style={styles.changeButtonText}>Change</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={removeImage}
                  disabled={!profileData.avatar}
                >
                  <Text style={[
                    styles.removeButtonText,
                    !profileData.avatar && styles.disabledButtonText
                  ]}>
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Personal Information */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>First name</Text>
            <TextInput
              style={styles.input}
              value={profileData.firstName}
              onChangeText={(text) => handleInputChange('firstName', text)}
              placeholder="Enter your first name"
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Last name</Text>
            <TextInput
              style={styles.input}
              value={profileData.lastName}
              onChangeText={(text) => handleInputChange('lastName', text)}
              placeholder="Enter your last name"
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={profileData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Phone number</Text>
            <TextInput
              style={styles.input}
              value={profileData.phoneNumber}
              onChangeText={(text) => handleInputChange('phoneNumber', text)}
              placeholder="(555) 123-4567"
              keyboardType="phone-pad"
            />
          </View>

          {/* Email Notifications */}
          <View style={styles.notificationSection}>
            <Text style={styles.sectionTitle}>Email notifications</Text>
            
            {Object.entries({
              orderStatuses: 'Order statuses',
              passwordChanges: 'Password changes',
              specialOffers: 'Special offers',
              newsletter: 'Newsletter',
            }).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={styles.checkboxContainer}
                onPress={() => handleNotificationChange(key)}
              >
                <View style={[
                  styles.checkbox,
                  profileData.notifications[key] && styles.checkboxChecked
                ]}>
                  {profileData.notifications[key] && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Log out</Text>
          </TouchableOpacity>
          
          <View style={styles.bottomButtons}>
            <TouchableOpacity 
              style={[styles.discardButton, !hasChanges && styles.disabledButton]} 
              onPress={discardChanges}
              disabled={!hasChanges}
            >
              <Text style={[
                styles.discardButtonText,
                !hasChanges && styles.disabledButtonText
              ]}>
                Discard changes
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveButton, !hasChanges && styles.disabledButton]} 
              onPress={saveChanges}
              disabled={!hasChanges}
            >
              <Text style={[
                styles.saveButtonText,
                !hasChanges && styles.disabledButtonText
              ]}>
                Save changes
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDEFEE',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerLogo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495E57',
    flex: 1,
  },
  headerRight: {
    width: 40,
    height: 40,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#495E57',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginVertical: 20,
  },
  avatarSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#7C7C7C',
    marginBottom: 12,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#495E57',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  avatarButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  changeButton: {
    backgroundColor: '#495E57',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#7C7C7C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#7C7C7C',
    fontSize: 14,
    fontWeight: '500',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#7C7C7C',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#EDEFEE',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
  },
  notificationSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#495E57',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#495E57',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333333',
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#EDEFEE',
    paddingTop: 16,
  },
  logoutButton: {
    backgroundColor: '#F4CE14',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  discardButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#495E57',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  discardButtonText: {
    color: '#495E57',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#495E57',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    opacity: 0.5,
  },
});

export default Profile;