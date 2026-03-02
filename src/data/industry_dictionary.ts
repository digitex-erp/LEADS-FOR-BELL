export interface MockLead {
  name: string;
  city: string;
  state: string;
  lead_score: number;
}

export const INDUSTRY_DATA: Record<string, MockLead[]> = {
  'Agriculture': [
    { name: 'Kisan Agro Solutions', city: 'Nashik', state: 'Maharashtra', lead_score: 92 },
    { name: 'Green Field Fertilizers', city: 'Amritsar', state: 'Punjab', lead_score: 85 },
    { name: 'Harvest Moon Organics', city: 'Mysuru', state: 'Karnataka', lead_score: 78 },
    { name: 'Punjab Agri Exports', city: 'Ludhiana', state: 'Punjab', lead_score: 88 },
    { name: 'Desi Seeds Co.', city: 'Indore', state: 'Madhya Pradesh', lead_score: 74 },
    { name: 'Modern Irrigation Systems', city: 'Coimbatore', state: 'Tamil Nadu', lead_score: 81 },
    { name: 'FarmFresh Logistics', city: 'Nagpur', state: 'Maharashtra', lead_score: 89 },
    { name: 'Soil Rich Nutrients', city: 'Vijayawada', state: 'Andhra Pradesh', lead_score: 76 },
    { name: 'AgroTech Machinery', city: 'Rajkot', state: 'Gujarat', lead_score: 94 },
    { name: 'Bhoomitra Bio-Pesticides', city: 'Lucknow', state: 'Uttar Pradesh', lead_score: 82 }
  ],
  'Apparel': [
    { name: 'Vastra Textiles', city: 'Surat', state: 'Gujarat', lead_score: 95 },
    { name: 'Indigo Weaves', city: 'Jaipur', state: 'Rajasthan', lead_score: 87 },
    { name: 'Urban Threads', city: 'Tiruppur', state: 'Tamil Nadu', lead_score: 91 },
    { name: 'Silk Route Fashion', city: 'Kanchipuram', state: 'Tamil Nadu', lead_score: 84 },
    { name: 'Classic Cotton Mills', city: 'Ahmedabad', state: 'Gujarat', lead_score: 79 },
    { name: 'TrendSetter Apparels', city: 'Ludhiana', state: 'Punjab', lead_score: 82 },
    { name: 'Royal Ethnic Wear', city: 'Varanasi', state: 'Uttar Pradesh', lead_score: 88 },
    { name: 'ActiveWear India', city: 'Bangalore', state: 'Karnataka', lead_score: 76 },
    { name: 'Denim Dynamics', city: 'Mumbai', state: 'Maharashtra', lead_score: 93 },
    { name: 'Loom & Thread', city: 'Kolkata', state: 'West Bengal', lead_score: 81 }
  ],
  'Automobile': [
    { name: 'Apex Motors India', city: 'Chennai', state: 'Tamil Nadu', lead_score: 94 },
    { name: 'GearShift Components', city: 'Pune', state: 'Maharashtra', lead_score: 89 },
    { name: 'Swift Automotive', city: 'Gurugram', state: 'Haryana', lead_score: 92 },
    { name: 'Turbo Precision Parts', city: 'Pimpri-Chinchwad', state: 'Maharashtra', lead_score: 86 },
    { name: 'National Brake Systems', city: 'Jamshedpur', state: 'Jharkhand', lead_score: 81 },
    { name: 'DriveTrain Solutions', city: 'Hosur', state: 'Tamil Nadu', lead_score: 78 },
    { name: 'AutoCore Casting', city: 'Belagavi', state: 'Karnataka', lead_score: 83 },
    { name: 'Velocity Engine Spares', city: 'Aurangabad', state: 'Maharashtra', lead_score: 87 },
    { name: 'Pioneer Wheels', city: 'Pantnagar', state: 'Uttarakhand', lead_score: 85 },
    { name: 'SmartAuto Electronics', city: 'Hyderabad', state: 'Telangana', lead_score: 90 }
  ],
  'Iron & Steel': [
    { name: 'Bharatiya Steel Works', city: 'Bhilai', state: 'Chhattisgarh', lead_score: 96 },
    { name: 'Indo Metal Alloys', city: 'Rourkela', state: 'Odisha', lead_score: 91 },
    { name: 'Solid Structural Steel', city: 'Durgapur', state: 'West Bengal', lead_score: 88 },
    { name: 'Iron Guard Pipes', city: 'Raipur', state: 'Chhattisgarh', lead_score: 84 },
    { name: 'Steel Force Rods', city: 'Visakhapatnam', state: 'Andhra Pradesh', lead_score: 87 },
    { name: 'Metallic Precision Bars', city: 'Salem', state: 'Tamil Nadu', lead_score: 82 },
    { name: 'Heavy Duty Plates', city: 'Ghent', state: 'Gujarat', lead_score: 79 },
    { name: 'Global Casting & Forging', city: 'Ludhiana', state: 'Punjab', lead_score: 85 },
    { name: 'Mega Metallurgy', city: 'Bellary', state: 'Karnataka', lead_score: 93 },
    { name: 'Supreme Slag Processing', city: 'Nagpur', state: 'Maharashtra', lead_score: 80 }
  ],
  'EVs': [
    { name: 'VoltDrive Electric', city: 'Bangalore', state: 'Karnataka', lead_score: 98 },
    { name: 'EcoCharged Scooters', city: 'Pune', state: 'Maharashtra', lead_score: 95 },
    { name: 'Lithium Core Batteries', city: 'Hyderabad', state: 'Telangana', lead_score: 92 },
    { name: 'GreenMotion Vehicles', city: 'Manesar', state: 'Haryana', lead_score: 89 },
    { name: 'Zenith EV Chargers', city: 'Noida', state: 'Uttar Pradesh', lead_score: 87 },
    { name: 'CleanRide Systems', city: 'Chennai', state: 'Tamil Nadu', lead_score: 91 },
    { name: 'Spark EV Solutions', city: 'Ahmedabad', state: 'Gujarat', lead_score: 84 },
    { name: 'NextGen e-Bikes', city: 'Indore', state: 'Madhya Pradesh', lead_score: 82 },
    { name: 'Titan EV Components', city: 'Coimbatore', state: 'Tamil Nadu', lead_score: 88 },
    { name: 'FutureFleet Electric', city: 'Mumbai', state: 'Maharashtra', lead_score: 93 }
  ]
};
