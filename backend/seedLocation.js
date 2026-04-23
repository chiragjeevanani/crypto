const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Country = require("./models/Country");
const State = require("./models/State");

dotenv.config();

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

const states = [
  // India
  { name: "Maharashtra", countryCode: "IN" },
  { name: "Delhi", countryCode: "IN" },
  { name: "Karnataka", countryCode: "IN" },
  { name: "Tamil Nadu", countryCode: "IN" },
  { name: "Gujarat", countryCode: "IN" },
  { name: "Uttar Pradesh", countryCode: "IN" },
  
  // US
  { name: "California", countryCode: "US" },
  { name: "New York", countryCode: "US" },
  { name: "Texas", countryCode: "US" },
  { name: "Florida", countryCode: "US" },
  { name: "Washington", countryCode: "US" },
  
  // UK
  { name: "England", countryCode: "UK" },
  { name: "Scotland", countryCode: "UK" },
  { name: "Wales", countryCode: "UK" },
  { name: "Northern Ireland", countryCode: "UK" },
  
  // Canada
  { name: "Ontario", countryCode: "CA" },
  { name: "Quebec", countryCode: "CA" },
  { name: "British Columbia", countryCode: "CA" },
  { name: "Alberta", countryCode: "CA" },
  
  // Australia
  { name: "New South Wales", countryCode: "AU" },
  { name: "Victoria", countryCode: "AU" },
  { name: "Queensland", countryCode: "AU" },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/crypto-app");
    console.log("Connected to MongoDB");

    // Clear existing
    await Country.deleteMany({});
    await State.deleteMany({});
    console.log("Cleared existing countries and states");

    // Seed Countries
    await Country.insertMany(countries);
    console.log(`Seeded ${countries.length} countries`);

    // Seed States
    await State.insertMany(states);
    console.log(`Seeded ${states.length} states`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDB();
