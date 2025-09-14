import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calculator, DollarSign, Leaf, Zap, TreePine } from "lucide-react";

interface CalculationResults {
  systemSize: number;
  panelCount: number;
  energyGeneration: number;
  monthlySavings: number;
  annualSavings: number;
  twentyYearSavings: number;
  co2Reduction: number;
  treesEquivalent: number;
  monthlyProduction: number;
  usageCovered: number;
  excessEnergy: number;
}

export default function SolarCalculator() {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [electricityRate, setElectricityRate] = useState(0.12); // $ per kWh
  const [monthlyUsage, setMonthlyUsage] = useState(1000); // kWh per month
  const [desiredSystemSize, setDesiredSystemSize] = useState(8); // kW
  const [solarIrradiance, setSolarIrradiance] = useState(1200); // kWh/kW/year default
  const [currentWeather, setCurrentWeather] = useState<{
    temp: number;
    clouds: number;
    description: string;
    location: string;
  } | null>(null);
  const [dataStatus, setDataStatus] = useState<{
    isLive: boolean;
    message: string;
  } | null>(null);
  const [results, setResults] = useState<CalculationResults | null>(null);

  // Real solar irradiance data for major cities (kWh/kW/year)
  const solarDataLookup: Record<string, number> = {
    // US Cities
    'Phoenix, AZ': 1800, 'Tucson, AZ': 1750, 'Las Vegas, NV': 1700,
    'Los Angeles, CA': 1650, 'San Diego, CA': 1600, 'Sacramento, CA': 1550,
    'San Francisco, CA': 1400, 'Denver, CO': 1500, 'Miami, FL': 1550,
    'Tampa, FL': 1500, 'Orlando, FL': 1480, 'Atlanta, GA': 1400,
    'Honolulu, HI': 1650, 'Chicago, IL': 1200, 'Indianapolis, IN': 1250,
    'Kansas City, MO': 1300, 'New Orleans, LA': 1400, 'Boston, MA': 1200,
    'Detroit, MI': 1150, 'Albuquerque, NM': 1650, 'New York, NY': 1200,
    'Charlotte, NC': 1350, 'Columbus, OH': 1200, 'Oklahoma City, OK': 1400,
    'Portland, OR': 1100, 'Philadelphia, PA': 1250, 'Nashville, TN': 1300,
    'Austin, TX': 1500, 'Dallas, TX': 1450, 'Houston, TX': 1400,
    'San Antonio, TX': 1500, 'Salt Lake City, UT': 1450, 'Seattle, WA': 1000,
    'Milwaukee, WI': 1150,
    
    // Canada
    'Toronto, Canada': 1200, 'Vancouver, Canada': 1100, 'Montreal, Canada': 1150,
    'Calgary, Canada': 1300, 'Edmonton, Canada': 1250, 'Ottawa, Canada': 1180,
    'Winnipeg, Canada': 1280, 'Quebec City, Canada': 1160,
    
    // Europe
    'Madrid, Spain': 1600, 'Barcelona, Spain': 1450, 'Seville, Spain': 1750,
    'Rome, Italy': 1500, 'Milan, Italy': 1300, 'Naples, Italy': 1550,
    'Athens, Greece': 1650, 'Thessaloniki, Greece': 1500,
    'Lisbon, Portugal': 1550, 'Porto, Portugal': 1400,
    'Paris, France': 1200, 'Lyon, France': 1300, 'Marseille, France': 1600,
    'Berlin, Germany': 1000, 'Munich, Germany': 1100, 'Hamburg, Germany': 950,
    'London, UK': 950, 'Manchester, UK': 900, 'Edinburgh, UK': 850,
    'Amsterdam, Netherlands': 1000, 'Rotterdam, Netherlands': 1020,
    'Vienna, Austria': 1150, 'Zurich, Switzerland': 1100,
    'Brussels, Belgium': 950, 'Copenhagen, Denmark': 1000,
    'Stockholm, Sweden': 950, 'Oslo, Norway': 900,
    'Helsinki, Finland': 950, 'Warsaw, Poland': 1050,
    'Prague, Czech Republic': 1100, 'Budapest, Hungary': 1200,
    'Bucharest, Romania': 1300, 'Sofia, Bulgaria': 1350,
    
    // Middle East
    'Dubai, UAE': 1800, 'Abu Dhabi, UAE': 1850, 'Doha, Qatar': 1750,
    'Riyadh, Saudi Arabia': 1900, 'Jeddah, Saudi Arabia': 1800,
    'Kuwait City, Kuwait': 1750, 'Tehran, Iran': 1600,
    'Baghdad, Iraq': 1700, 'Amman, Jordan': 1650,
    'Beirut, Lebanon': 1500, 'Alexandria, Egypt': 1750, 
    'Tel Aviv, Israel': 1650,
    
    // Asia
    'Tokyo, Japan': 1200, 'Osaka, Japan': 1250, 'Kyoto, Japan': 1200,
    'Seoul, South Korea': 1300, 'Busan, South Korea': 1350,
    'Beijing, China': 1400, 'Shanghai, China': 1300, 'Guangzhou, China': 1450,
    'Shenzhen, China': 1400, 'Hong Kong, China': 1350,
    'Mumbai, India': 1600, 'Delhi, India': 1650, 'Bangalore, India': 1700,
    'Chennai, India': 1750, 'Kolkata, India': 1550, 'Hyderabad, India': 1650,
    'Pune, India': 1650, 'Ahmedabad, India': 1750,
    'Bangkok, Thailand': 1550, 'Jakarta, Indonesia': 1600,
    'Manila, Philippines': 1650, 'Kuala Lumpur, Malaysia': 1600,
    'Singapore, Singapore': 1550, 'Ho Chi Minh City, Vietnam': 1600,
    'Hanoi, Vietnam': 1500,
    
    // Australia & New Zealand
    'Sydney, Australia': 1550, 'Melbourne, Australia': 1400, 'Brisbane, Australia': 1650,
    'Perth, Australia': 1700, 'Adelaide, Australia': 1600, 'Darwin, Australia': 1800,
    'Auckland, New Zealand': 1300, 'Wellington, New Zealand': 1250,
    
    // Africa
    'Cairo, Egypt': 1800, 'Cape Town, South Africa': 1750,
    'Johannesburg, South Africa': 1650, 'Lagos, Nigeria': 1600,
    'Nairobi, Kenya': 1700, 'Casablanca, Morocco': 1650,
    'Tunis, Tunisia': 1600, 'Algiers, Algeria': 1550,
    
    // South America
    'São Paulo, Brazil': 1500, 'Rio de Janeiro, Brazil': 1600,
    'Buenos Aires, Argentina': 1450, 'Santiago, Chile': 1650,
    'Lima, Peru': 1700, 'Bogotá, Colombia': 1550,
    'Caracas, Venezuela': 1650, 'Quito, Ecuador': 1600,
    
    // Pakistan Cities (excellent solar potential)
    'Karachi, Pakistan': 1750, 'Karachi, PK': 1750,
    'Lahore, Pakistan': 1700, 'Lahore, PK': 1700,
    'Islamabad, Pakistan': 1650, 'Islamabad, PK': 1650,
    'Rawalpindi, Pakistan': 1650, 'Rawalpindi, PK': 1650,
    'Faisalabad, Pakistan': 1700, 'Faisalabad, PK': 1700,
    'Multan, Pakistan': 1750, 'Multan, PK': 1750,
    'Peshawar, Pakistan': 1600, 'Peshawar, PK': 1600,
    'Quetta, Pakistan': 1800, 'Quetta, PK': 1800,
    'Hyderabad, Pakistan': 1750, 'Hyderabad, PK': 1750,
    'Gujranwala, Pakistan': 1680, 'Gujranwala, PK': 1680
  };

  // Create list of available cities with their states/countries
  const availableCities = Object.keys(solarDataLookup).map(location => {
    const [cityName, region] = location.split(', ');
    return {
      value: location,
      label: location,
      city: cityName,
      region: region
    };
  }).filter((city, index, self) => 
    // Remove duplicates (like Karachi appearing for both "Pakistan" and "PK")
    index === self.findIndex(c => c.city === city.city && c.region.length > 2)
  ).sort((a, b) => a.city.localeCompare(b.city));

  const handleCitySelection = (selectedLocation: string) => {
    const [selectedCity, selectedRegion] = selectedLocation.split(', ');
    setCity(selectedCity);
    setState(selectedRegion);
  };

  const fetchSolarData = async () => {
    if (!city || !state) return;
    
    try {
      // Try real-time solar data from OpenWeatherMap
      // Map regions to proper country codes
      const countryMapping: Record<string, string> = {
        'Pakistan': 'PK', 'PK': 'PK',
        'Canada': 'CA', 'Spain': 'ES', 'Italy': 'IT', 'Greece': 'GR', 'Portugal': 'PT',
        'France': 'FR', 'Germany': 'DE', 'UK': 'GB', 'Netherlands': 'NL', 'Austria': 'AT',
        'Switzerland': 'CH', 'Belgium': 'BE', 'Denmark': 'DK', 'Sweden': 'SE', 'Norway': 'NO',
        'Finland': 'FI', 'Poland': 'PL', 'Czech Republic': 'CZ', 'Hungary': 'HU',
        'Romania': 'RO', 'Bulgaria': 'BG', 'UAE': 'AE', 'Qatar': 'QA', 'Saudi Arabia': 'SA',
        'Kuwait': 'KW', 'Iran': 'IR', 'Iraq': 'IQ', 'Jordan': 'JO', 'Lebanon': 'LB',
        'Egypt': 'EG', 'Israel': 'IL', 'Japan': 'JP', 'South Korea': 'KR', 'China': 'CN',
        'India': 'IN', 'Thailand': 'TH', 'Indonesia': 'ID', 'Philippines': 'PH',
        'Malaysia': 'MY', 'Singapore': 'SG', 'Vietnam': 'VN', 'Australia': 'AU',
        'New Zealand': 'NZ', 'South Africa': 'ZA', 'Nigeria': 'NG', 'Kenya': 'KE',
        'Morocco': 'MA', 'Tunisia': 'TN', 'Algeria': 'DZ', 'Brazil': 'BR', 'Argentina': 'AR',
        'Chile': 'CL', 'Peru': 'PE', 'Colombia': 'CO', 'Venezuela': 'VE', 'Ecuador': 'EC'
      };
      const countryCode = countryMapping[state] || 'US';
      const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)},${countryCode}&limit=1&appid=75c08492a79e3907a021a8027e280c6b`;
      console.log('Geo API URL:', geoUrl);
      const geoResponse = await fetch(geoUrl);
      
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        console.log('Geo API response:', geoData);
        if (geoData.length > 0) {
          const { lat, lon } = geoData[0];
          
          // Get current solar radiation data
          const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=75c08492a79e3907a021a8027e280c6b&units=metric`);
          
          if (weatherResponse.ok) {
            const weatherData = await weatherResponse.json();
            
            // Store current weather information
            setCurrentWeather({
              temp: Math.round(weatherData.main.temp),
              clouds: weatherData.clouds.all,
              description: weatherData.weather[0].description,
              location: `${weatherData.name}, ${state.toUpperCase()}`
            });
            
            // Calculate annual solar irradiance estimate based on current conditions and latitude
            const baseIrradiance = calculateBaseIrradiance(lat);
            const cloudAdjustment = weatherData.clouds ? (100 - weatherData.clouds.all) / 100 : 0.8;
            const adjustedIrradiance = Math.round(baseIrradiance * (0.7 + cloudAdjustment * 0.3));
            
            setSolarIrradiance(adjustedIrradiance);
            setDataStatus({
              isLive: true,
              message: `✅ Live weather data retrieved for ${weatherData.name}, ${state.toUpperCase()}`
            });
            return;
          }
        }
      }
    } catch (error) {
      console.log('Weather API error:', error);
      setDataStatus({
        isLive: false,
        message: `❌ Live weather data not accessible for ${city}, ${state}. Using historical data.`
      });
    }
    
    // Clear weather data when using fallback
    setCurrentWeather(null);
    
    // Fallback to lookup table
    // Try exact match first (as selected from dropdown)
    const exactLocationKey = `${city}, ${state}`;
    let exactMatch = solarDataLookup[exactLocationKey];
    
    // If not found, try with uppercase state (for US states)
    if (!exactMatch) {
      const uppercaseLocationKey = `${city}, ${state.toUpperCase()}`;
      exactMatch = solarDataLookup[uppercaseLocationKey];
    }
    
    if (exactMatch) {
      setSolarIrradiance(exactMatch);
      setDataStatus({
        isLive: false,
        message: `📊 Using historical solar data for ${city}, ${state}`
      });
      return;
    }
    
    // Try state/country-based estimates
    const regionAverages: Record<string, number> = {
      // US States
      'AZ': 1700, 'CA': 1500, 'CO': 1450, 'FL': 1500, 'GA': 1400,
      'HI': 1650, 'IL': 1200, 'IN': 1250, 'KS': 1350, 'LA': 1400,
      'MA': 1200, 'MI': 1150, 'MO': 1300, 'NV': 1650, 'NM': 1600,
      'NY': 1200, 'NC': 1350, 'OH': 1200, 'OK': 1400, 'OR': 1100,
      'PA': 1250, 'TN': 1300, 'TX': 1450, 'UT': 1400, 'WA': 1000,
      'WI': 1150,
      // Countries
      'PAKISTAN': 1700, 'PK': 1700
    };
    
    const regionAverage = regionAverages[state.toUpperCase()];
    if (regionAverage) {
      setSolarIrradiance(regionAverage);
      const regionName = state.toLowerCase() === 'pakistan' || state.toLowerCase() === 'pk' ? 'Pakistan' : `${state.toUpperCase()} state`;
      setDataStatus({
        isLive: false,
        message: `📍 City not found. Using average data for ${regionName}.`
      });
    } else {
      setSolarIrradiance(1400); // Global average (higher than US due to Pakistan's excellent solar potential)
      setDataStatus({
        isLive: false,
        message: `⚠️ Location not recognized. Using global average solar data.`
      });
    }
  };

  const calculateBaseIrradiance = (latitude: number) => {
    // Calculate base solar irradiance based on latitude
    const absLat = Math.abs(latitude);
    if (absLat < 25) return 1800; // Tropical regions
    if (absLat < 35) return 1600; // Subtropical regions  
    if (absLat < 45) return 1400; // Temperate regions
    if (absLat < 55) return 1200; // Northern temperate
    return 1000; // Far northern regions
  };

  const calculateSolar = () => {
    // Use user's desired system size (more accurate than roof-based estimates)
    const systemSize = desiredSystemSize;
    const panelCount = Math.ceil(systemSize / 0.32); // Assuming 320W panels
    
    // Real-world system losses (industry standard: 14-20% total losses)
    const inverterLoss = 0.03; // 3% inverter efficiency loss
    const wiringLoss = 0.02; // 2% DC and AC wiring losses
    const soilingLoss = 0.02; // 2% dirt and debris on panels
    const shadingLoss = 0.03; // 3% shading losses (conservative)
    const temperatureLoss = 0.04; // 4% temperature coefficient losses
    const systemLoss = 0.02; // 2% other system losses (mismatch, etc.)
    
    const totalSystemLoss = 1 - (inverterLoss + wiringLoss + soilingLoss + shadingLoss + temperatureLoss + systemLoss);
    
    // Calculate ideal generation first, then apply real-world losses
    const idealGeneration = systemSize * solarIrradiance;
    const realWorldGeneration = Math.round(idealGeneration * totalSystemLoss);
    const monthlyProduction = Math.round(realWorldGeneration / 12);
    
    // Account for panel degradation over time (0.5% per year)
    const firstYearGeneration = realWorldGeneration;
    const averageGenerationOver20Years = Math.round(realWorldGeneration * 0.95); // Average accounting for degradation
    
    // Calculate how much of user's usage is covered by solar
    const annualUsage = monthlyUsage * 12;
    const usageCovered = Math.min(100, Math.round((firstYearGeneration / annualUsage) * 100));
    const excessEnergy = Math.max(0, firstYearGeneration - annualUsage);
    
    // Calculate financial savings using user's specific electricity rate
    const firstYearSavings = Math.round(firstYearGeneration * electricityRate);
    const monthlySavings = Math.round(firstYearSavings / 12);
    
    // 20-year savings accounting for degradation and inflation
    const electricityInflation = 1.03; // 3% annual electricity rate increase
    let twentyYearSavings = 0;
    for (let year = 1; year <= 20; year++) {
      const yearlyGeneration = realWorldGeneration * Math.pow(0.995, year - 1); // 0.5% degradation per year
      const yearlyRate = electricityRate * Math.pow(electricityInflation, year - 1);
      twentyYearSavings += yearlyGeneration * yearlyRate;
    }
    twentyYearSavings = Math.round(twentyYearSavings);
    
    // Calculate environmental impact
    const co2ReductionPerYear = Math.round((firstYearGeneration * 0.0007) * 10) / 10; // tons CO2 per year
    const treesEquivalent = Math.round(co2ReductionPerYear * 25); // trees equivalent

    setResults({
      systemSize,
      panelCount,
      energyGeneration: firstYearGeneration,
      monthlySavings,
      annualSavings: firstYearSavings,
      twentyYearSavings,
      co2Reduction: co2ReductionPerYear,
      treesEquivalent,
      monthlyProduction,
      usageCovered,
      excessEnergy
    });
  };

  useEffect(() => {
    if (city && state) {
      fetchSolarData();
    }
  }, [city, state]);

  useEffect(() => {
    if (solarIrradiance > 0) {
      calculateSolar();
    }
  }, [electricityRate, monthlyUsage, desiredSystemSize, solarIrradiance]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-12">
        {/* Calculator Input */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Calculator className="h-6 w-6 text-blue-600" />
              Calculate Your Solar Potential
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="city-select" className="text-sm font-medium text-gray-700">
                Select Your City
              </Label>
              <Select 
                value={city && state ? `${city}, ${state}` : ""} 
                onValueChange={handleCitySelection}
              >
                <SelectTrigger className="mt-2" data-testid="select-city">
                  <SelectValue placeholder="Choose a city from our database..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((cityOption) => (
                    <SelectItem key={cityOption.value} value={cityOption.value}>
                      {cityOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {city && state && (
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {city}, {state}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="electricity-rate" className="text-sm font-medium text-gray-700">
                  Electricity Rate ($/kWh)
                </Label>
                <Input
                  id="electricity-rate"
                  type="number"
                  step="0.01"
                  value={electricityRate}
                  onChange={(e) => setElectricityRate(Number(e.target.value))}
                  placeholder="e.g., 0.12"
                  className="mt-2"
                  data-testid="input-electricity-rate"
                />
              </div>
              <div>
                <Label htmlFor="monthly-usage" className="text-sm font-medium text-gray-700">
                  Monthly Usage (kWh)
                </Label>
                <Input
                  id="monthly-usage"
                  type="number"
                  value={monthlyUsage}
                  onChange={(e) => setMonthlyUsage(Number(e.target.value))}
                  placeholder="e.g., 1000"
                  className="mt-2"
                  data-testid="input-monthly-usage"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="desired-system-size" className="text-sm font-medium text-gray-700">
                Desired System Size (kW)
              </Label>
              <Input
                id="desired-system-size"
                type="number"
                step="0.1"
                value={desiredSystemSize}
                onChange={(e) => setDesiredSystemSize(Number(e.target.value))}
                placeholder="e.g., 8"
                className="mt-2"
                data-testid="input-desired-system-size"
              />
            </div>
            
            {/* Data Status Display */}
            {dataStatus && (
              <div className={`p-3 border rounded-lg ${dataStatus.isLive ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                <div className={`text-sm ${dataStatus.isLive ? 'text-green-800' : 'text-orange-800'}`}>
                  <p className="font-semibold">{dataStatus.message}</p>
                  {solarIrradiance !== 1200 && (
                    <p className="text-xs mt-1">Solar potential: {solarIrradiance.toFixed(0)} kWh/kW/year</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Current Weather Display - Only when live data is available */}
            {currentWeather && dataStatus?.isLive && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg">
                <div className="text-sm text-sky-800">
                  <p className="font-semibold mb-1">🌤️ Current Weather in {currentWeather.location}:</p>
                  <div className="flex items-center justify-between text-xs">
                    <span>{currentWeather.temp}°C, {currentWeather.description}</span>
                    <span>☁️ {currentWeather.clouds}% cloud coverage</span>
                  </div>
                  <p className="text-xs mt-1 text-sky-600">Solar calculations adjusted for current conditions</p>
                </div>
              </div>
            )}
            
            {/* Important Disclaimers */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-2">⚠️ Important Disclaimer</p>
                <p className="mb-1"><strong>These are estimates only.</strong> Actual solar production can vary significantly based on:</p>
                <ul className="ml-4 space-y-1 text-xs">
                  <li>• Roof orientation, tilt, and shading conditions</li>
                  <li>• Weather patterns and seasonal variations</li>
                  <li>• Panel quality, inverter efficiency, and installation quality</li>
                  <li>• Local regulations and net metering policies</li>
                  <li>• System maintenance and cleaning frequency</li>
                </ul>
                <p className="mt-2 text-xs"><strong>Always consult professional solar installers for accurate site-specific assessments.</strong></p>
              </div>
            </div>
            
            <Button 
              onClick={calculateSolar} 
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              data-testid="button-calculate"
            >
              Calculate Solar Impact
            </Button>
          </CardContent>
        </Card>

        {/* Results Display */}
        {results && (
          <div className="space-y-6">
            {/* Accuracy Banner */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-sm text-amber-800">
                <p className="font-semibold">📊 Enhanced Accuracy Features:</p>
                <p className="text-xs mt-1">Real-world system losses (~16%), panel degradation (0.5%/year), electricity inflation (3%/year), and weather-adjusted data</p>
              </div>
            </div>
            
            {/* Cost Savings */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-green-600">
                  <DollarSign className="h-5 w-5" />
                  Financial Savings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600" data-testid="text-monthly-savings">
                      ${results.monthlySavings.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Monthly Savings</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600" data-testid="text-annual-savings">
                      ${results.annualSavings.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Annual Savings</div>
                  </div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
                  <div className="text-3xl font-bold text-green-700" data-testid="text-twenty-year-savings">
                    ${results.twentyYearSavings.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">20-Year Savings</div>
                </div>
              </CardContent>
            </Card>

            {/* Environmental Impact */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-green-600">
                  <Leaf className="h-5 w-5" />
                  Environmental Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Leaf className="text-green-500 text-xl" />
                    <span className="font-medium">CO₂ Reduction (Annual)</span>
                  </div>
                  <span className="text-xl font-bold text-green-600" data-testid="text-co2-reduction">
                    {results.co2Reduction} tons
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <TreePine className="text-green-500 text-xl" />
                    <span className="font-medium">Trees Equivalent</span>
                  </div>
                  <span className="text-xl font-bold text-green-600" data-testid="text-trees-equivalent">
                    {results.treesEquivalent} trees
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Zap className="text-blue-500 text-xl" />
                    <span className="font-medium">Energy Generation</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600" data-testid="text-energy-generation">
                    {results.energyGeneration.toLocaleString()} kWh
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* System Size & Usage Coverage */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-blue-600">
                  <Zap className="h-5 w-5" />
                  System Specifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600" data-testid="text-system-size">
                      {results.systemSize} kW
                    </div>
                    <div className="text-sm text-gray-600">System Size</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600" data-testid="text-panel-count">
                      {results.panelCount} panels
                    </div>
                    <div className="text-sm text-gray-600">Solar Panels</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600" data-testid="text-monthly-production">
                      {results.monthlyProduction.toLocaleString()} kWh
                    </div>
                    <div className="text-sm text-gray-600">Monthly Production</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600" data-testid="text-usage-covered">
                      {results.usageCovered}%
                    </div>
                    <div className="text-sm text-gray-600">Usage Covered</div>
                  </div>
                </div>
                {results.excessEnergy > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <div className="text-sm text-yellow-700">
                      <strong>Excess Energy:</strong> {results.excessEnergy.toLocaleString()} kWh/year - You'll generate more than you use!
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
