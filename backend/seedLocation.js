const mongoose = require("mongoose");
const Country = require("./models/Country");
const State = require("./models/State");
const dns = require("dns");
const dotenv = require("dotenv");
dotenv.config();

// Fix for DNS issues in some networks
const dnsServers = (process.env.DNS_SERVERS || "1.1.1.1,8.8.8.8")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

if (dnsServers.length > 0) {
  dns.setServers(dnsServers);
}

const countries = [
  { name: "India", code: "IN", currencyCode: "INR", currencySymbol: "₹", flag: "🇮🇳" },
  { name: "United States", code: "US", currencyCode: "USD", currencySymbol: "$", flag: "🇺🇸" },
  { name: "United Kingdom", code: "UK", currencyCode: "GBP", currencySymbol: "£", flag: "🇬🇧" },
  { name: "Eurozone", code: "EU", currencyCode: "EUR", currencySymbol: "€", flag: "🇪🇺" },
  { name: "UAE", code: "AE", currencyCode: "AED", currencySymbol: "AED", flag: "🇦🇪" },
  { name: "Oman", code: "OM", currencyCode: "OMR", currencySymbol: "OMR", flag: "🇴🇲" },
  { name: "Jordan", code: "JO", currencyCode: "JOD", currencySymbol: "JOD", flag: "🇯🇴" },
  { name: "Switzerland", code: "CH", currencyCode: "CHF", currencySymbol: "CHF", flag: "🇨🇭" },
  { name: "Canada", code: "CA", currencyCode: "CAD", currencySymbol: "$", flag: "🇨🇦" },
  { name: "Australia", code: "AU", currencyCode: "AUD", currencySymbol: "$", flag: "🇦🇺" },
  { name: "Singapore", code: "SG", currencyCode: "SGD", currencySymbol: "$", flag: "🇸🇬" },
  { name: "Russia", code: "RU", currencyCode: "RUB", currencySymbol: "₽", flag: "🇷🇺" },
  { name: "France", code: "FR", currencyCode: "EUR", currencySymbol: "€", flag: "🇫🇷" },
];

const statesData = {
  IN: [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Chandigarh", "Jammu and Kashmir"
  ],
  US: [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", 
    "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", 
    "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", 
    "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", 
    "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ],
  UK: ["England", "Scotland", "Wales", "Northern Ireland"],
  CA: ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan"],
  AU: ["New South Wales", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia", "Northern Territory", "Australian Capital Territory"],
  AE: ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"],
  OM: ["Muscat", "Dhofar", "Musandam", "Al Buraymi", "Ad Dakhiliyah", "Al Batinah North", "Al Batinah South", "Ash Sharqiyah North", "Ash Sharqiyah South", "Ad Dhahirah", "Al Wusta"],
  CH: ["Zurich", "Berne", "Lucerne", "Uri", "Schwyz", "Obwalden", "Nidwalden", "Glarus", "Zug", "Fribourg", "Solothurn", "Basel-Stadt", "Basel-Landschaft", "Schaffhausen", "Appenzell Ausserrhoden", "Appenzell Innerrhoden", "St. Gallen", "Grisons", "Aargau", "Thurgau", "Ticino", "Vaud", "Valais", "Neuchâtel", "Geneva", "Jura"],
  FR: ["Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Brittany", "Centre-Val de Loire", "Corsica", "Grand Est", "Hauts-de-France", "Île-de-France", "Normandy", "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Provence-Alpes-Côte d'Azur"],
  RU: ["Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Nizhny Novgorod", "Kazan", "Chelyabinsk", "Omsk", "Samara", "Rostov-on-Don", "Ufa", "Volgograd", "Perm", "Krasnoyarsk", "Voronezh"],
  JO: ["Amman", "Irbid", "Zarqa", "Aqaba", "Mafraq", "Jarash", "Ajloun", "Balqa", "Madaba", "Karak", "Tafilah", "Ma'an"],
  SG: ["Central Singapore", "North East", "North West", "South East", "South West"],
  EU: ["Germany", "Italy", "Spain", "Netherlands", "Belgium", "Austria", "Portugal", "Greece", "Finland", "Ireland"] // Eurozone members as 'states' for simple selection
};

const seedDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error("ERROR: MONGO_URI is not defined in .env file!");
      process.exit(1);
    }

    console.log(`Connecting to: ${uri.substring(0, 20)}...`);
    await mongoose.connect(uri);
    console.log("SUCCESS: Connected to MongoDB");

    // Clear existing
    await Country.deleteMany({});
    await State.deleteMany({});
    console.log("Cleared existing countries and states");

    // Seed Countries
    const createdCountries = await Country.insertMany(countries);
    console.log(`Seeded ${createdCountries.length} countries`);

    // Map countries by code for easy reference
    const countryMap = {};
    createdCountries.forEach(c => {
      countryMap[c.code] = c._id;
    });

    // Prepare states
    const statesToInsert = [];
    Object.keys(statesData).forEach(code => {
      const countryId = countryMap[code];
      if (countryId) {
        statesData[code].forEach(stateName => {
          statesToInsert.push({
            name: stateName,
            countryCode: code,
            countryId: countryId
          });
        });
      }
    });

    // Seed States
    await State.insertMany(statesToInsert);
    console.log(`Seeded ${statesToInsert.length} states across ${Object.keys(statesData).length} countries`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDB();
