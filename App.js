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
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { OPENWEATHER_API_KEY } from '@env';

export default function App() {
  const [city, setCity] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [hourlyForecast, setHourlyForecast] = useState([]);

  const fetchWeatherByLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      const currentData = await currentRes.json();
      setCurrentWeather(currentData);
      setCity(currentData.name);
      fetchForecast(currentData.name);
    } catch (error) {
      setErrorMsg('Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  };

  const fetchForecast = async (cityName) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      const data = await res.json();
      if (res.ok) {
        const daily = data.list.filter((item) =>
          item.dt_txt.includes('12:00:00')
        );
        setForecast(daily);
        setHourlyForecast(data.list.slice(0, 8));
        setErrorMsg(null);
      } else {
        setErrorMsg('City not found');
      }
    } catch {
      setErrorMsg('Error fetching forecast');
    }
  };

  const handleSearch = () => {
    if (city.trim()) {
      setLoading(true);
      fetchForecast(city.trim());
      fetchCityWeather(city.trim());
      Keyboard.dismiss();
    }
  };

  const fetchCityWeather = async (cityName) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      const data = await res.json();
      if (res.ok) {
        setCurrentWeather(data);
        setErrorMsg(null);
      } else {
        setErrorMsg('City not found');
      }
    } catch {
      setErrorMsg('Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherByLocation();
  }, []);

  const getGradientColors = () => {
    if (!currentWeather) return ['#415a77', '#1b263b'];
    const temp = currentWeather.main.temp;
    const hour = new Date().getHours();
    if (hour < 6 || hour > 18) return ['#0f2027', '#203a43'];
    if (temp >= 30) return ['#ef473a', '#cb2d3e'];
    if (temp >= 20) return ['#f3904f', '#ef473a'];
    return ['#1e3c72', '#2a5298'];
  };

  const getBoxGradientColors = () => {
    const base = getGradientColors();
    return base.map((color) => color + 'cc');
  };

  const convertWindToMph = (ms) => (ms * 2.23694).toFixed(1);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient colors={getGradientColors()} style={styles.container}>
        <ScrollView>
          <View style={styles.searchSection}>
            <TextInput
              style={styles.input}
              placeholder="Enter city"
              value={city}
              placeholderTextColor="#eee"
              onChangeText={setCity}
            />
            <Button title="Search" onPress={handleSearch} />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : currentWeather ? (
            <View style={styles.weatherBox}>
              <Text style={styles.cityName}>{currentWeather.name}</Text>
              <Image
                source={{
                  uri: `https://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@4x.png`,
                }}
                style={styles.icon}
              />
              <Text style={styles.temp}>
                {currentWeather.main.temp.toFixed(1)}°C
              </Text>
              <Text style={styles.description}>
                {currentWeather.weather[0].description}
              </Text>
            </View>
          ) : (
            <Text style={styles.errorText}>{errorMsg}</Text>
          )}

          {hourlyForecast.length > 0 && (
            <LinearGradient colors={getBoxGradientColors()} style={styles.forecastBox}>
              <Text style={styles.forecastTitle}>Hourly Forecast</Text>
              <FlatList
                data={hourlyForecast}
                horizontal
                keyExtractor={(item) => item.dt.toString()}
                renderItem={({ item }) => (
                  <View style={styles.forecastItem}>
                    <Text style={styles.forecastText}>
                      {new Date(item.dt_txt).getHours()}:00
                    </Text>
                    <Image
                      source={{
                        uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
                      }}
                      style={{ width: 50, height: 50 }}
                    />
                    <Text style={styles.forecastText}>
                      {item.main.temp.toFixed(1)}°C
                    </Text>
                  </View>
                )}
                showsHorizontalScrollIndicator={false}
              />
            </LinearGradient>
          )}

          {forecast && (
            <LinearGradient colors={getBoxGradientColors()} style={styles.forecastBox}>
              <Text style={styles.forecastTitle}>5-Day Forecast</Text>
              <FlatList
                data={forecast}
                horizontal
                keyExtractor={(item) => item.dt.toString()}
                renderItem={({ item }) => (
                  <View style={styles.forecastItem}>
                    <Text style={styles.forecastText}>
                      {new Date(item.dt_txt).toLocaleDateString()}
                    </Text>
                    <Image
                      source={{
                        uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
                      }}
                      style={{ width: 50, height: 50 }}
                    />
                    <Text style={styles.forecastText}>
                      {item.main.temp.toFixed(1)}°C
                    </Text>
                  </View>
                )}
                showsHorizontalScrollIndicator={false}
              />
            </LinearGradient>
          )}

          {currentWeather && (
            <LinearGradient colors={getBoxGradientColors()} style={styles.detailsBox}>
              <Text style={styles.detailsTitle}>Current Details</Text>
              <Text style={styles.detail}>Humidity: {currentWeather.main.humidity}%</Text>
              <Text style={styles.detail}>Wind: {convertWindToMph(currentWeather.wind.speed)} mph</Text>
              <Text style={styles.detail}>Pressure: {currentWeather.main.pressure} hPa</Text>
              <Text style={styles.detail}>
                Sunrise: {new Date(currentWeather.sys.sunrise * 1000).toLocaleTimeString()}
              </Text>
              <Text style={styles.detail}>
                Sunset: {new Date(currentWeather.sys.sunset * 1000).toLocaleTimeString()}
              </Text>
              <Text style={styles.detail}>Cloud Cover: {currentWeather.clouds.all}%</Text>
              <Text style={styles.detail}>Visibility: {currentWeather.visibility / 1000} km</Text>
            </LinearGradient>
          )}
        </ScrollView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  searchSection: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    color: '#fff',
    backgroundColor: '#ffffff22',
  },
  weatherBox: {
    alignItems: 'center',
    marginBottom: 30,
  },
  cityName: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
  },
  temp: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  description: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#fff',
    textTransform: 'capitalize',
  },
  icon: {
    width: 120,
    height: 120,
  },
  forecastBox: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    backgroundColor: '#ffffff10',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  forecastTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  forecastItem: {
    backgroundColor: '#ffffff22',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  forecastText: {
    color: '#fff',
  },
  detailsBox: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 30,
    backgroundColor: '#ffffff10',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  detail: {
    color: '#fff',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});
