import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  ActivityIndicator,
  Image,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  useColorScheme,
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

const API_KEY = '84c6939eb3cc184ff59a5f63b2c13827';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 70,
    paddingHorizontal: 20,
  },
  searchSection: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  input: {
    flex: 1,
    borderColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
  },
  localWeather: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  cityName: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
    marginTop: 10,
  },
  temp: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 10,
  },
  description: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#e0f7fa',
    textTransform: 'capitalize',
  },
  icon: {
    width: 120,
    height: 120,
  },
  scrollableBottom: {
    flexGrow: 1,
  },
  forecastSection: {
    height: 170,
    marginTop: 10,
  },
  forecastTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  forecastItem: {
    width: 100,
    backgroundColor: '#caf0f8',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  tempForecast: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#023e8a',
    marginTop: 4,
  },
  date: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  detailsSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#0077b6',
    borderRadius: 10,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#fff',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default function App() {
  const [city, setCity] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);

  const colorScheme = useColorScheme();

  const fetchWeatherByCity = async (cityName) => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`
      );
      const data = await res.json();

      if (res.ok) {
        setCurrentWeather(data);
        fetchForecast(cityName);
        setErrorMsg(null);
      } else {
        setErrorMsg('City not found or forecast error');
      }
    } catch {
      setErrorMsg('Failed to fetch weather for city.');
    } finally {
      setLoading(false);
      Keyboard.dismiss();
    }
  };

  const fetchForecast = async (cityName) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric`
      );
      const data = await res.json();

      if (res.ok) {
        const daily = data.list.filter((item) => item.dt_txt.includes('12:00:00'));
        setForecast(daily);
      } else {
        setForecast(null);
        setErrorMsg('Forecast not available.');
      }
    } catch {
      setForecast(null);
      setErrorMsg('Failed to fetch forecast.');
    }
  };

  const fetchLocalWeather = async () => {
    try {
      setLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location denied');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
      );
      const data = await res.json();

      if (res.ok) {
        setCurrentWeather(data);
        fetchForecast(data.name);
      } else {
        setErrorMsg('Unable to fetch local weather');
      }
    } catch (error) {
      setErrorMsg('Error getting local weather.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalWeather();
  }, []);

  const getGradientColors = () => {
    if (!currentWeather || !currentWeather.main) return ['#2193b0', '#6dd5ed'];

    const temp = currentWeather.main.temp;
    if (temp <= 0) return ['#e0eafc', '#cfdef3'];
    if (temp <= 10) return ['#89f7fe', '#66a6ff'];
    if (temp <= 20) return ['#56CCF2', '#2F80ED'];
    if (temp <= 30) return ['#f7971e', '#ffd200'];
    return ['#ff512f', '#dd2476'];
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient colors={getGradientColors()} style={styles.container}>
        <View style={styles.searchSection}>
          <TextInput
            style={styles.input}
            placeholder="Search for a city"
            value={city}
            onChangeText={setCity}
            placeholderTextColor="#666"
          />
          <Button title="Search" onPress={() => fetchWeatherByCity(city.trim())} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#ffffff" />
        ) : currentWeather && currentWeather.main && currentWeather.weather ? (
          <View style={styles.localWeather}>
            <Text style={styles.cityName}>{currentWeather.name}</Text>
            {currentWeather.weather[0]?.icon && (
              <Image
                source={{ uri: `https://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@4x.png` }}
                style={styles.icon}
              /> 
            )}
            <Text style={styles.temp}>{currentWeather.main.temp.toFixed(1)}°C</Text>
            <Text style={styles.description}>{currentWeather.weather[0].description}</Text>
          </View>
        ) : (
          <Text style={styles.errorText}>{errorMsg}</Text>
        )}

        <ScrollView style={styles.scrollableBottom}>
          {forecast && forecast.length > 0 && (
            <View style={styles.forecastSection}>
              <Text style={styles.forecastTitle}>5-Day Forecast</Text>
              <FlatList
                data={forecast}
                horizontal
                keyExtractor={(item) => item.dt.toString()}
                renderItem={({ item }) => (
                  <View style={styles.forecastItem}>
                    <Text style={styles.date}>{new Date(item.dt_txt).toLocaleDateString()}</Text>
                    {item.weather?.[0]?.icon && (
                      <Image
                        source={{ uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png` }}
                        style={{ width: 50, height: 50 }}
                      />
                    )}
                    <Text style={styles.tempForecast}>{item.main.temp.toFixed(1)}°C</Text>
                  </View>
                )}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          {currentWeather && currentWeather.main && (
            <View style={styles.detailsSection}>
              <Text style={styles.detailsTitle}>Current Weather Details</Text>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Humidity:</Text>
                <Text style={styles.detailValue}>{currentWeather.main.humidity}%</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Wind Speed:</Text>
                <Text style={styles.detailValue}>{currentWeather.wind?.speed} m/s</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Pressure:</Text>
                <Text style={styles.detailValue}>{currentWeather.main.pressure} hPa</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Sunrise:</Text>
                <Text style={styles.detailValue}>{new Date(currentWeather.sys?.sunrise * 1000).toLocaleTimeString()}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Sunset:</Text>
                <Text style={styles.detailValue}>{new Date(currentWeather.sys?.sunset * 1000).toLocaleTimeString()}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}
