import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';

// Database operations
const DatabaseOperations = {
  async initializeDatabase() {
    const database = await SQLite.openDatabaseAsync('little_lemon');

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS menu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        image TEXT,
        category TEXT
      );
    `);

    return database;
  },

  async getAllMenuItems(database) {
    return await database.getAllAsync('SELECT * FROM menu ORDER BY name');
  },

  async saveMenuItems(database, menuItems) {
    for (const item of menuItems) {
      await database.runAsync(
        'INSERT INTO menu (name, price, description, image, category) VALUES (?, ?, ?, ?, ?)',
        [item.name, item.price, item.description, item.image, item.category || 'Main']
      );
    }
  },

  async filterByCategories(database, categories) {
    if (categories.length === 0) {
      return await this.getAllMenuItems(database);
    }

    const placeholders = categories.map(() => '?').join(',');
    const query = `SELECT * FROM menu WHERE category IN (${placeholders}) ORDER BY name`;
    return await database.getAllAsync(query, categories);
  },

  async filterBySearchAndCategories(database, searchText, categories) {
    let query = 'SELECT * FROM menu WHERE 1=1';
    const params = [];

    if (searchText && searchText.trim()) {
      query += ' AND name LIKE ?';
      params.push(`%${searchText.trim()}%`);
    }

    if (categories.length > 0) {
      const placeholders = categories.map(() => '?').join(',');
      query += ` AND category IN (${placeholders})`;
      params.push(...categories);
    }

    query += ' ORDER BY name';
    return await database.getAllAsync(query, params);
  },

  async getCategories(database) {
    const result = await database.getAllAsync('SELECT DISTINCT category FROM menu ORDER BY category');
    return result.map(row => row.category);
  }
};

// Category Button Component
const CategoryButton = ({ category, isSelected, onPress }) => (
  <TouchableOpacity
    style={[
      styles.categoryButton,
      isSelected && styles.categoryButtonSelected
    ]}
    onPress={() => onPress(category)}
  >
    <Text style={[
      styles.categoryButtonText,
      isSelected && styles.categoryButtonTextSelected
    ]}>
      {category}
    </Text>
  </TouchableOpacity>
);

// Banner Component
const Banner = ({ searchText, onSearchChange }) => (
  <View style={styles.bannerSection}>
    <Text style={styles.restaurantName}>Little Lemon</Text>
    <Text style={styles.restaurantLocation}>Chicago</Text>
    <View style={styles.bannerContent}>
      <View style={styles.bannerText}>
        <Text style={styles.bannerDescription}>
          We are a family owned Mediterranean restaurant, focused on traditional recipes served with a modern twist.
        </Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#7C7C7C" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search menu..."
            placeholderTextColor="#7C7C7C"
            value={searchText}
            onChangeText={onSearchChange}
          />
        </View>
      </View>
      <Image
        source={require('../assets/Hero image.png')}
        style={styles.bannerImage}
        resizeMode="cover"
      />
    </View>
  </View>
);

const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [db, setDb] = useState(null);

  // Debounce hook
  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedSearchText = useDebounce(searchText, 500);

  // Initialize database and load data
  useEffect(() => {
    initializeDatabase();
  }, []);

  // Load user data when screen focuses
  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });
    return unsubscribe;
  }, [navigation]);

  // Handle filtering when search text or categories change
  useEffect(() => {
    if (db) {
      handleFilter();
    }
  }, [debouncedSearchText, selectedCategories, db]);

  const initializeDatabase = async () => {
    try {
      const database = await DatabaseOperations.initializeDatabase();
      setDb(database);

      await loadMenuData(database);
      await loadCategories(database);
    } catch (error) {
      console.error('Database initialization error:', error);
      setLoading(false);
    }
  };

  const loadMenuData = async (database) => {
    try {
      const result = await DatabaseOperations.getAllMenuItems(database);

      if (result.length > 0) {
        console.log('Loading menu from database');
        setMenuItems(result);
        setFilteredMenuItems(result);
      } else {
        console.log('Fetching menu from API');
        await fetchAndStoreMenuData(database);
      }
    } catch (error) {
      console.error('Error loading menu data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAndStoreMenuData = async (database) => {
    try {
      const response = await fetch('https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/capstone.json');
      const data = await response.json();

      if (data.menu && Array.isArray(data.menu)) {
        await DatabaseOperations.saveMenuItems(database, data.menu);

        const storedItems = await DatabaseOperations.getAllMenuItems(database);
        setMenuItems(storedItems);
        setFilteredMenuItems(storedItems);
      }
    } catch (error) {
      console.error('Error fetching menu data:', error);
      Alert.alert('Error', 'Failed to load menu data. Please check your internet connection.');
    }
  };

  const loadCategories = async (database) => {
    try {
      const categoryList = await DatabaseOperations.getCategories(database);
      setCategories(categoryList);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleFilter = async () => {
    if (!db) return;

    try {
      const filtered = await DatabaseOperations.filterBySearchAndCategories(
        db,
        debouncedSearchText,
        selectedCategories
      );
      setFilteredMenuItems(filtered);
    } catch (error) {
      console.error('Error filtering menu items:', error);
    }
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const loadUserData = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem('userData');
      const profileSettings = await AsyncStorage.getItem('profileSettings');

      if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        let combinedData = { ...parsedUserData };

        if (profileSettings) {
          const parsedSettings = JSON.parse(profileSettings);
          combinedData = { ...combinedData, ...parsedSettings };
        }

        setUserData(combinedData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const getInitials = () => {
    if (!userData?.firstName || !userData?.lastName) return 'LL';
    const firstInitial = userData.firstName.charAt(0).toUpperCase();
    const lastInitial = userData.lastName.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  };

  const getImageUrl = (imageName) => {
    return `https://github.com/Meta-Mobile-Developer-PC/Working-With-Data-API/blob/main/images/${imageName}?raw=true`;
  };


  const renderMenuItem = ({ item }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemName}>{item.name}</Text>
        <Text style={styles.menuItemDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
      </View>
      <Image
        source={{ uri: getImageUrl(item.image) }}
        style={styles.menuItemImage}
        resizeMode="cover"
      />
    </View>
  );

  if (!userData || loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Image
            source={require('../assets/Logo.png')}
            style={styles.loadingLogo}
            resizeMode="contain"
          />
          <ActivityIndicator size="large" color="#F4CE14" style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../assets/Logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          {userData.avatar ? (
            <Image source={{ uri: userData.avatar }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.profileInitials}>{getInitials()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Banner with Search */}
      <Banner
        searchText={searchText}
        onSearchChange={setSearchText}
      />

      {/* Order for Delivery Title */}
      <View style={styles.deliveryTitleContainer}>
        <Text style={styles.deliveryTitle}>ORDER FOR DELIVERY!</Text>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScrollContent}
        >
          {categories.map((category) => (
            <CategoryButton
              key={category}
              category={category}
              isSelected={selectedCategories.includes(category)}
              onPress={handleCategoryToggle}
            />
          ))}
        </ScrollView>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <FlatList
          data={filteredMenuItems}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item.id?.toString() || item.name}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.menuList}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No dishes found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or category filters</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#495E57',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingLogo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    color: '#F4CE14',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDEFEE',
  },
  headerLeft: {
    flex: 1,
    alignItems: 'center',
  },
  headerLogo: {
    width: 185,
    height: 40,
  },
  profileButton: {
    width: 50,
    height: 50,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profilePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#495E57',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bannerSection: {
    backgroundColor: '#495E57',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  restaurantName: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#F4CE14',
    marginBottom: 4,
    fontFamily: 'serif',
  },
  restaurantLocation: {
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 16,
    fontFamily: 'serif',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bannerText: {
    flex: 1,
    marginRight: 16,
  },
  bannerDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    paddingVertical: 4,
  },
  bannerImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  deliveryTitleContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  deliveryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoriesScrollContent: {
    paddingVertical: 8,
  },
  categoryButton: {
    backgroundColor: '#EDEFEE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#EDEFEE',
  },
  categoryButtonSelected: {
    backgroundColor: '#495E57',
    borderColor: '#495E57',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495E57',
    textTransform: 'capitalize',
  },
  categoryButtonTextSelected: {
    color: '#FFFFFF',
  },
  menuSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  menuList: {
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  menuItemContent: {
    flex: 1,
    marginRight: 16,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#7C7C7C',
    lineHeight: 20,
    marginBottom: 8,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495E57',
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#EDEFEE',
    marginVertical: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7C7C7C',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7C7C7C',
    textAlign: 'center',
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#7C7C7C',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HomeScreen;