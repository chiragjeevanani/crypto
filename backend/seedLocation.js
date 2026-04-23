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
  { name: "India", code: "IN", currencyCode: "INR", currencySymbol: "₹", flag: "🇮🇳", inrValue: 1 },
  { name: "United States", code: "US", currencyCode: "USD", currencySymbol: "$", flag: "🇺🇸", inrValue: 93 },
  { name: "United Kingdom", code: "UK", currencyCode: "GBP", currencySymbol: "£", flag: "🇬🇧", inrValue: 126 },
  { name: "Eurozone", code: "EU", currencyCode: "EUR", currencySymbol: "€", flag: "🇪🇺", inrValue: 110 },
  { name: "Kuwait", code: "KW", currencyCode: "KWD", currencySymbol: "KWD", flag: "🇰🇼", inrValue: 304 },
  { name: "Bahrain", code: "BH", currencyCode: "BHD", currencySymbol: "BHD", flag: "🇧🇭", inrValue: 248 },
  { name: "Oman", code: "OM", currencyCode: "OMR", currencySymbol: "OMR", flag: "🇴🇲", inrValue: 245 },
  { name: "Canada", code: "CA", currencyCode: "CAD", currencySymbol: "$", flag: "🇨🇦", inrValue: 68 },
  { name: "Australia", code: "AU", currencyCode: "AUD", currencySymbol: "$", flag: "🇦🇺", inrValue: 70 },
  { name: "Switzerland", code: "CH", currencyCode: "CHF", currencySymbol: "CHF", flag: "🇨🇭", inrValue: 120 },
  { name: "Singapore", code: "SG", currencyCode: "SGD", currencySymbol: "$", flag: "🇸🇬", inrValue: 74 },
  { name: "UAE", code: "AE", currencyCode: "AED", currencySymbol: "AED", flag: "🇦🇪", inrValue: 25 },
  { name: "New Zealand", code: "NZ", currencyCode: "NZD", currencySymbol: "$", flag: "🇳🇿", inrValue: 55 },
  { name: "Saudi Arabia", code: "SA", currencyCode: "SAR", currencySymbol: "SAR", flag: "🇸🇦", inrValue: 25 },
  { name: "Qatar", code: "QA", currencyCode: "QAR", currencySymbol: "QAR", flag: "🇶🇦", inrValue: 26 },
];

const statesData = {
  IN: ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"],
  US: ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"],
  UK: ["England", "Scotland", "Wales", "Northern Ireland"],
  CA: ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan"],
  AU: ["New South Wales", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia"],
  AE: ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"],
  KW: ["Al Asimah", "Hawalli", "Farwaniya", "Mubarak Al-Kabeer", "Ahmadi", "Jahra"],
  BH: ["Capital", "Muharraq", "Northern", "Southern"],
  OM: ["Muscat", "Dhofar", "Musandam", "Al Buraymi", "Ad Dakhiliyah", "Al Batinah North", "Al Batinah South", "Ash Sharqiyah North", "Ash Sharqiyah South", "Ad Dhahirah", "Al Wusta"],
  CH: ["Zurich", "Berne", "Lucerne", "Uri", "Schwyz", "Obwalden", "Nidwalden", "Glarus", "Zug", "Fribourg", "Solothurn", "Basel-Stadt", "Basel-Landschaft", "Schaffhausen", "Appenzell Ausserrhoden", "Appenzell Innerrhoden", "St. Gallen", "Grisons", "Aargau", "Thurgau", "Ticino", "Vaud", "Valais", "Neuchâtel", "Geneva", "Jura"],
  SG: ["Central Singapore", "North East", "North West", "South East", "South West"],
  NZ: ["Auckland", "Wellington", "Canterbury", "Waikato", "Bay of Plenty", "Manawatu-Wanganui", "Otago", "Southland"],
  SA: ["Riyadh", "Makkah", "Madinah", "Eastern Province", "Asir", "Tabuk", "Hail", "Northern Borders", "Jazan", "Najran", "Al Bahah", "Al Jawf", "Al-Qassim"],
  QA: ["Doha", "Al Rayyan", "Al Wakrah", "Al Khor", "Al Shamal", "Al Daayen", "Umm Salal", "Al Shahaniya"],
  EU: ["Germany", "Italy", "Spain", "Netherlands", "Belgium", "Austria", "Portugal", "Greece", "Finland", "Ireland"]
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
