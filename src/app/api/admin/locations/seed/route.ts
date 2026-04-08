import { prisma } from "@/lib/database";
import { getAuthEmail } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";

// NE India + all Indian states with districts & HQ towns
// Source: Census of India / Ministry of Home Affairs
const DATA: Record<string, Record<string, string[]>> = {
  "Meghalaya": {
    "East Khasi Hills": ["Shillong","Sohra","Pynursla","Mawkynrew","Mawphlang","Mylliem"],
    "West Khasi Hills": ["Nongstoin","Mairang","Mawshynrut"],
    "South West Khasi Hills": ["Mawkyrwat"],
    "Eastern West Khasi Hills": ["Mairang"],
    "Ri Bhoi": ["Nongpoh","Umroi","Byrnihat","Umsning"],
    "West Jaintia Hills": ["Jowai","Laskein","Amlarem"],
    "East Jaintia Hills": ["Khliehriat","Saipung"],
    "North Garo Hills": ["Resubelpara","Kharkutta"],
    "East Garo Hills": ["Williamnagar","Rongjeng","Samanda"],
    "South Garo Hills": ["Baghmara","Chokpot"],
    "West Garo Hills": ["Tura","Dadenggre","Selsella"],
    "South West Garo Hills": ["Ampati","Tikrikilla"],
  },
  "Assam": {
    "Baksa": ["Mushalpur"], "Barpeta": ["Barpeta"], "Biswanath": ["Biswanath Chariali"],
    "Bongaigaon": ["Bongaigaon"], "Cachar": ["Silchar"], "Charaideo": ["Sonari"],
    "Chirang": ["Kajalgaon"], "Darrang": ["Mangaldoi"], "Dhemaji": ["Dhemaji"],
    "Dhubri": ["Dhubri"], "Dibrugarh": ["Dibrugarh"], "Dima Hasao": ["Haflong"],
    "Goalpara": ["Goalpara"], "Golaghat": ["Golaghat"], "Hailakandi": ["Hailakandi"],
    "Hojai": ["Hojai"], "Jorhat": ["Jorhat"], "Kamrup": ["Amingaon"],
    "Kamrup Metropolitan": ["Guwahati","Dispur"], "Karbi Anglong": ["Diphu"],
    "Karimganj": ["Karimganj"], "Kokrajhar": ["Kokrajhar"],
    "Lakhimpur": ["North Lakhimpur"], "Majuli": ["Garamur"], "Morigaon": ["Morigaon"],
    "Nagaon": ["Nagaon"], "Nalbari": ["Nalbari"], "Sivasagar": ["Sivasagar"],
    "Sonitpur": ["Tezpur"], "South Salmara-Mankachar": ["Hatsingimari"],
    "Tinsukia": ["Tinsukia"], "Udalguri": ["Udalguri"],
    "West Karbi Anglong": ["Hamren"],
  },
  "Arunachal Pradesh": {
    "Tawang": ["Tawang"], "West Kameng": ["Bomdila"], "East Kameng": ["Seppa"],
    "Papum Pare": ["Yupia"], "Kurung Kumey": ["Koloriang"], "Kra Daadi": ["Jamin"],
    "Lower Subansiri": ["Ziro"], "Upper Subansiri": ["Daporijo"],
    "West Siang": ["Aalo"], "East Siang": ["Pasighat"], "Siang": ["Boleng"],
    "Upper Siang": ["Yingkiong"], "Lower Siang": ["Likabali"],
    "Lower Dibang Valley": ["Roing"], "Dibang Valley": ["Anini"],
    "Anjaw": ["Hawai"], "Lohit": ["Tezu"], "Namsai": ["Namsai"],
    "Changlang": ["Changlang"], "Tirap": ["Khonsa"], "Longding": ["Longding"],
    "Capital Complex": ["Itanagar","Naharlagun"],
  },
  "Manipur": {
    "Bishnupur": ["Bishnupur"], "Chandel": ["Chandel"],
    "Churachandpur": ["Churachandpur"], "Imphal East": ["Porompat"],
    "Imphal West": ["Imphal","Lamphelpat"], "Jiribam": ["Jiribam"],
    "Kakching": ["Kakching"], "Kamjong": ["Kamjong"], "Kangpokpi": ["Kangpokpi"],
    "Noney": ["Noney"], "Pherzawl": ["Pherzawl"], "Senapati": ["Senapati"],
    "Tamenglong": ["Tamenglong"], "Tengnoupal": ["Tengnoupal"],
    "Thoubal": ["Thoubal"], "Ukhrul": ["Ukhrul"],
  },
  "Mizoram": {
    "Aizawl": ["Aizawl"], "Lunglei": ["Lunglei"], "Champhai": ["Champhai"],
    "Serchhip": ["Serchhip"], "Kolasib": ["Kolasib"], "Lawngtlai": ["Lawngtlai"],
    "Mamit": ["Mamit"], "Saiha": ["Saiha"], "Khawzawl": ["Khawzawl"],
    "Hnahthial": ["Hnahthial"], "Saitual": ["Saitual"],
  },
  "Nagaland": {
    "Kohima": ["Kohima"], "Dimapur": ["Dimapur"], "Mokokchung": ["Mokokchung"],
    "Mon": ["Mon"], "Wokha": ["Wokha"], "Zunheboto": ["Zunheboto"],
    "Tuensang": ["Tuensang"], "Longleng": ["Longleng"], "Kiphire": ["Kiphire"],
    "Peren": ["Peren"], "Phek": ["Phek"], "Noklak": ["Noklak"],
    "Chumoukedima": ["Chumoukedima"],
  },
  "Sikkim": {
    "East Sikkim": ["Gangtok"], "West Sikkim": ["Gyalshing"],
    "North Sikkim": ["Mangan"], "South Sikkim": ["Namchi"],
    "Pakyong": ["Pakyong"], "Soreng": ["Soreng"],
  },
  "Tripura": {
    "West Tripura": ["Agartala"], "South Tripura": ["Belonia"],
    "Gomati": ["Udaipur"], "Dhalai": ["Ambassa"], "North Tripura": ["Dharmanagar"],
    "Unakoti": ["Kailashahar"], "Khowai": ["Khowai"], "Sepahijala": ["Bishramganj"],
  },
  "Andhra Pradesh": {
    "Anantapur": ["Anantapur"], "Chittoor": ["Chittoor"],
    "East Godavari": ["Kakinada"], "Guntur": ["Guntur"],
    "Krishna": ["Machilipatnam"], "Kurnool": ["Kurnool"],
    "Prakasam": ["Ongole"], "Srikakulam": ["Srikakulam"],
    "Visakhapatnam": ["Visakhapatnam"], "Vizianagaram": ["Vizianagaram"],
    "West Godavari": ["Eluru"], "YSR Kadapa": ["Kadapa"],
    "Tirupati": ["Tirupati"], "NTR": ["Vijayawada"], "Nandyal": ["Nandyal"],
    "Konaseema": ["Amalapuram"], "Bapatla": ["Bapatla"],
    "Palnadu": ["Narasaraopet"], "Sri Sathya Sai": ["Puttaparthi"],
    "Anakapalli": ["Anakapalli"], "Nellore": ["Nellore"],
  },
  "Bihar": {
    "Araria": ["Araria"], "Arwal": ["Arwal"], "Aurangabad": ["Aurangabad"],
    "Banka": ["Banka"], "Begusarai": ["Begusarai"], "Bhagalpur": ["Bhagalpur"],
    "Bhojpur": ["Arrah"], "Buxar": ["Buxar"], "Darbhanga": ["Darbhanga"],
    "East Champaran": ["Motihari"], "Gaya": ["Gaya"], "Gopalganj": ["Gopalganj"],
    "Jamui": ["Jamui"], "Jehanabad": ["Jehanabad"], "Kaimur": ["Bhabua"],
    "Katihar": ["Katihar"], "Khagaria": ["Khagaria"], "Kishanganj": ["Kishanganj"],
    "Lakhisarai": ["Lakhisarai"], "Madhepura": ["Madhepura"],
    "Madhubani": ["Madhubani"], "Munger": ["Munger"], "Muzaffarpur": ["Muzaffarpur"],
    "Nalanda": ["Bihar Sharif"], "Nawada": ["Nawada"], "Patna": ["Patna"],
    "Purnia": ["Purnia"], "Rohtas": ["Sasaram"], "Saharsa": ["Saharsa"],
    "Samastipur": ["Samastipur"], "Saran": ["Chapra"], "Sheikhpura": ["Sheikhpura"],
    "Sheohar": ["Sheohar"], "Sitamarhi": ["Sitamarhi"], "Siwan": ["Siwan"],
    "Supaul": ["Supaul"], "Vaishali": ["Hajipur"], "West Champaran": ["Bettiah"],
  },
  "Chhattisgarh": {
    "Bastar": ["Jagdalpur"], "Bilaspur": ["Bilaspur"], "Durg": ["Durg"],
    "Raipur": ["Raipur"], "Korba": ["Korba"], "Rajnandgaon": ["Rajnandgaon"],
    "Raigarh": ["Raigarh"], "Surguja": ["Ambikapur"], "Dantewada": ["Dantewada"],
    "Janjgir-Champa": ["Janjgir"], "Kanker": ["Kanker"], "Mahasamund": ["Mahasamund"],
    "Dhamtari": ["Dhamtari"], "Kondagaon": ["Kondagaon"], "Sukma": ["Sukma"],
    "Balod": ["Balod"], "Bemetara": ["Bemetara"], "Bijapur": ["Bijapur"],
  },
  "Goa": {
    "North Goa": ["Panaji","Mapusa","Vasco da Gama"],
    "South Goa": ["Margao","Ponda"],
  },
  "Gujarat": {
    "Ahmedabad": ["Ahmedabad"], "Amreli": ["Amreli"], "Anand": ["Anand"],
    "Banaskantha": ["Palanpur"], "Bharuch": ["Bharuch"], "Bhavnagar": ["Bhavnagar"],
    "Gandhinagar": ["Gandhinagar"], "Jamnagar": ["Jamnagar"], "Junagadh": ["Junagadh"],
    "Kutch": ["Bhuj"], "Mehsana": ["Mehsana"], "Panchmahal": ["Godhra"],
    "Rajkot": ["Rajkot"], "Surat": ["Surat"], "Vadodara": ["Vadodara"],
    "Valsad": ["Valsad"], "Porbandar": ["Porbandar"], "Dahod": ["Dahod"],
    "Narmada": ["Rajpipla"], "Navsari": ["Navsari"], "Patan": ["Patan"],
    "Sabarkantha": ["Himatnagar"], "Surendranagar": ["Surendranagar"],
    "Morbi": ["Morbi"], "Kheda": ["Nadiad"],
  },
  "Haryana": {
    "Ambala": ["Ambala"], "Bhiwani": ["Bhiwani"], "Faridabad": ["Faridabad"],
    "Gurugram": ["Gurugram"], "Hisar": ["Hisar"], "Jhajjar": ["Jhajjar"],
    "Jind": ["Jind"], "Kaithal": ["Kaithal"], "Karnal": ["Karnal"],
    "Kurukshetra": ["Kurukshetra"], "Panipat": ["Panipat"], "Rewari": ["Rewari"],
    "Rohtak": ["Rohtak"], "Sirsa": ["Sirsa"], "Sonipat": ["Sonipat"],
    "Yamunanagar": ["Yamunanagar"], "Panchkula": ["Panchkula"],
    "Palwal": ["Palwal"], "Nuh": ["Nuh"], "Mahendragarh": ["Narnaul"],
    "Fatehabad": ["Fatehabad"],
  },
  "Himachal Pradesh": {
    "Bilaspur": ["Bilaspur"], "Chamba": ["Chamba"], "Hamirpur": ["Hamirpur"],
    "Kangra": ["Dharamshala"], "Kinnaur": ["Reckong Peo"],
    "Kullu": ["Kullu","Manali"], "Lahaul and Spiti": ["Keylong"],
    "Mandi": ["Mandi"], "Shimla": ["Shimla"], "Sirmaur": ["Nahan"],
    "Solan": ["Solan"], "Una": ["Una"],
  },
  "Jharkhand": {
    "Bokaro": ["Bokaro Steel City"], "Dhanbad": ["Dhanbad"], "Deoghar": ["Deoghar"],
    "Dumka": ["Dumka"], "East Singhbhum": ["Jamshedpur"], "Giridih": ["Giridih"],
    "Hazaribagh": ["Hazaribagh"], "Ranchi": ["Ranchi"], "Palamu": ["Daltonganj"],
    "Garhwa": ["Garhwa"], "Godda": ["Godda"], "Gumla": ["Gumla"],
    "Koderma": ["Koderma"], "Lohardaga": ["Lohardaga"], "Pakur": ["Pakur"],
    "Ramgarh": ["Ramgarh"], "Sahebganj": ["Sahebganj"], "Simdega": ["Simdega"],
    "West Singhbhum": ["Chaibasa"], "Chatra": ["Chatra"], "Jamtara": ["Jamtara"],
    "Khunti": ["Khunti"], "Latehar": ["Latehar"],
  },
  "Karnataka": {
    "Bengaluru Urban": ["Bengaluru"], "Mysuru": ["Mysuru"], "Mangaluru": ["Mangaluru"],
    "Belagavi": ["Belagavi"], "Ballari": ["Ballari"], "Kalaburagi": ["Kalaburagi"],
    "Dharwad": ["Dharwad"], "Shivamogga": ["Shivamogga"], "Tumakuru": ["Tumakuru"],
    "Davanagere": ["Davanagere"], "Hassan": ["Hassan"], "Udupi": ["Udupi"],
    "Kodagu": ["Madikeri"], "Mandya": ["Mandya"], "Raichur": ["Raichur"],
    "Bidar": ["Bidar"], "Bagalkot": ["Bagalkot"], "Chitradurga": ["Chitradurga"],
    "Gadag": ["Gadag"], "Haveri": ["Haveri"], "Koppal": ["Koppal"],
    "Vijayapura": ["Vijayapura"], "Uttara Kannada": ["Karwar"],
    "Dakshina Kannada": ["Mangaluru"], "Chikkamagaluru": ["Chikkamagaluru"],
  },
  "Kerala": {
    "Thiruvananthapuram": ["Thiruvananthapuram"], "Kollam": ["Kollam"],
    "Alappuzha": ["Alappuzha"], "Pathanamthitta": ["Pathanamthitta"],
    "Kottayam": ["Kottayam"], "Idukki": ["Painavu"], "Ernakulam": ["Kochi"],
    "Thrissur": ["Thrissur"], "Palakkad": ["Palakkad"], "Malappuram": ["Malappuram"],
    "Kozhikode": ["Kozhikode"], "Wayanad": ["Kalpetta"], "Kannur": ["Kannur"],
    "Kasaragod": ["Kasaragod"],
  },
  "Madhya Pradesh": {
    "Bhopal": ["Bhopal"], "Indore": ["Indore"], "Gwalior": ["Gwalior"],
    "Jabalpur": ["Jabalpur"], "Ujjain": ["Ujjain"], "Sagar": ["Sagar"],
    "Rewa": ["Rewa"], "Satna": ["Satna"], "Dewas": ["Dewas"],
    "Vidisha": ["Vidisha"], "Chhindwara": ["Chhindwara"], "Hoshangabad": ["Hoshangabad"],
    "Ratlam": ["Ratlam"], "Balaghat": ["Balaghat"], "Betul": ["Betul"],
    "Dhar": ["Dhar"], "Katni": ["Katni"], "Mandla": ["Mandla"],
    "Morena": ["Morena"], "Neemuch": ["Neemuch"], "Panna": ["Panna"],
    "Shahdol": ["Shahdol"], "Shivpuri": ["Shivpuri"], "Tikamgarh": ["Tikamgarh"],
  },
  "Maharashtra": {
    "Mumbai City": ["Mumbai"], "Mumbai Suburban": ["Mumbai"], "Pune": ["Pune"],
    "Nagpur": ["Nagpur"], "Thane": ["Thane"], "Nashik": ["Nashik"],
    "Aurangabad": ["Aurangabad"], "Solapur": ["Solapur"], "Kolhapur": ["Kolhapur"],
    "Sangli": ["Sangli"], "Satara": ["Satara"], "Ratnagiri": ["Ratnagiri"],
    "Ahmednagar": ["Ahmednagar"], "Akola": ["Akola"], "Amravati": ["Amravati"],
    "Beed": ["Beed"], "Chandrapur": ["Chandrapur"], "Dhule": ["Dhule"],
    "Jalgaon": ["Jalgaon"], "Latur": ["Latur"], "Nanded": ["Nanded"],
    "Palghar": ["Palghar"], "Raigad": ["Alibag"], "Wardha": ["Wardha"],
    "Yavatmal": ["Yavatmal"], "Buldhana": ["Buldhana"], "Gondia": ["Gondia"],
    "Jalna": ["Jalna"], "Osmanabad": ["Osmanabad"], "Parbhani": ["Parbhani"],
    "Washim": ["Washim"], "Hingoli": ["Hingoli"], "Nandurbar": ["Nandurbar"],
  },
  "Odisha": {
    "Khordha": ["Bhubaneswar"], "Cuttack": ["Cuttack"], "Ganjam": ["Chatrapur"],
    "Balasore": ["Balasore"], "Mayurbhanj": ["Baripada"], "Sambalpur": ["Sambalpur"],
    "Puri": ["Puri"], "Koraput": ["Koraput"], "Sundargarh": ["Sundargarh"],
    "Jharsuguda": ["Jharsuguda"], "Angul": ["Angul"], "Dhenkanal": ["Dhenkanal"],
    "Jajpur": ["Jajpur"], "Kendrapara": ["Kendrapara"], "Bargarh": ["Bargarh"],
    "Bhadrak": ["Bhadrak"], "Kalahandi": ["Bhawanipatna"],
    "Rayagada": ["Rayagada"], "Nabarangpur": ["Nabarangpur"],
    "Kandhamal": ["Phulbani"], "Nayagarh": ["Nayagarh"],
  },
  "Punjab": {
    "Amritsar": ["Amritsar"], "Ludhiana": ["Ludhiana"], "Jalandhar": ["Jalandhar"],
    "Patiala": ["Patiala"], "Bathinda": ["Bathinda"], "Mohali": ["Mohali"],
    "Hoshiarpur": ["Hoshiarpur"], "Gurdaspur": ["Gurdaspur"],
    "Ferozepur": ["Ferozepur"], "Kapurthala": ["Kapurthala"],
    "Moga": ["Moga"], "Sangrur": ["Sangrur"], "Barnala": ["Barnala"],
    "Faridkot": ["Faridkot"], "Mansa": ["Mansa"], "Pathankot": ["Pathankot"],
    "Rupnagar": ["Rupnagar"], "Tarn Taran": ["Tarn Taran"],
    "Fazilka": ["Fazilka"], "Muktsar": ["Sri Muktsar Sahib"],
    "Fatehgarh Sahib": ["Fatehgarh Sahib"],
  },
  "Rajasthan": {
    "Jaipur": ["Jaipur"], "Jodhpur": ["Jodhpur"], "Udaipur": ["Udaipur"],
    "Kota": ["Kota"], "Bikaner": ["Bikaner"], "Ajmer": ["Ajmer"],
    "Alwar": ["Alwar"], "Bharatpur": ["Bharatpur"], "Bhilwara": ["Bhilwara"],
    "Sikar": ["Sikar"], "Jaisalmer": ["Jaisalmer"], "Barmer": ["Barmer"],
    "Chittorgarh": ["Chittorgarh"], "Nagaur": ["Nagaur"], "Pali": ["Pali"],
    "Jhunjhunu": ["Jhunjhunu"], "Sri Ganganagar": ["Sri Ganganagar"],
    "Bundi": ["Bundi"], "Churu": ["Churu"], "Dungarpur": ["Dungarpur"],
    "Hanumangarh": ["Hanumangarh"], "Tonk": ["Tonk"],
    "Sawai Madhopur": ["Sawai Madhopur"], "Sirohi": ["Sirohi"],
    "Rajsamand": ["Rajsamand"], "Banswara": ["Banswara"],
  },
  "Tamil Nadu": {
    "Chennai": ["Chennai"], "Coimbatore": ["Coimbatore"], "Madurai": ["Madurai"],
    "Tiruchirappalli": ["Tiruchirappalli"], "Salem": ["Salem"],
    "Tirunelveli": ["Tirunelveli"], "Erode": ["Erode"], "Vellore": ["Vellore"],
    "Thanjavur": ["Thanjavur"], "Dindigul": ["Dindigul"], "Kancheepuram": ["Kancheepuram"],
    "Tiruppur": ["Tiruppur"], "Cuddalore": ["Cuddalore"],
    "Krishnagiri": ["Krishnagiri"], "Nilgiris": ["Ooty"],
    "Ramanathapuram": ["Ramanathapuram"], "Sivaganga": ["Sivaganga"],
    "Thoothukudi": ["Thoothukudi"], "Virudhunagar": ["Virudhunagar"],
    "Namakkal": ["Namakkal"], "Dharmapuri": ["Dharmapuri"],
    "Nagapattinam": ["Nagapattinam"], "Karur": ["Karur"],
    "Chengalpattu": ["Chengalpattu"], "Tiruvallur": ["Tiruvallur"],
    "Ranipet": ["Ranipet"], "Kallakurichi": ["Kallakurichi"],
    "Tenkasi": ["Tenkasi"], "Tirupattur": ["Tirupattur"],
  },
  "Telangana": {
    "Hyderabad": ["Hyderabad"], "Rangareddy": ["Hyderabad"],
    "Medchal-Malkajgiri": ["Medchal"], "Warangal Urban": ["Warangal"],
    "Karimnagar": ["Karimnagar"], "Nizamabad": ["Nizamabad"],
    "Khammam": ["Khammam"], "Nalgonda": ["Nalgonda"],
    "Mahabubnagar": ["Mahabubnagar"], "Adilabad": ["Adilabad"],
    "Siddipet": ["Siddipet"], "Sangareddy": ["Sangareddy"],
    "Kamareddy": ["Kamareddy"], "Mancherial": ["Mancherial"],
    "Jagtial": ["Jagtial"], "Suryapet": ["Suryapet"],
    "Peddapalli": ["Peddapalli"], "Vikarabad": ["Vikarabad"],
  },
  "Uttar Pradesh": {
    "Lucknow": ["Lucknow"], "Kanpur Nagar": ["Kanpur"], "Agra": ["Agra"],
    "Varanasi": ["Varanasi"], "Meerut": ["Meerut"], "Allahabad": ["Prayagraj"],
    "Ghaziabad": ["Ghaziabad"], "Bareilly": ["Bareilly"],
    "Aligarh": ["Aligarh"], "Moradabad": ["Moradabad"],
    "Gorakhpur": ["Gorakhpur"], "Jhansi": ["Jhansi"], "Mathura": ["Mathura"],
    "Ayodhya": ["Ayodhya"], "Saharanpur": ["Saharanpur"],
    "Gautam Buddh Nagar": ["Noida"], "Muzaffarnagar": ["Muzaffarnagar"],
    "Azamgarh": ["Azamgarh"], "Sitapur": ["Sitapur"], "Sultanpur": ["Sultanpur"],
    "Unnao": ["Unnao"], "Jaunpur": ["Jaunpur"], "Basti": ["Basti"],
    "Shahjahanpur": ["Shahjahanpur"], "Rae Bareli": ["Rae Bareli"],
    "Ballia": ["Ballia"], "Deoria": ["Deoria"],
    "Fatehpur": ["Fatehpur"], "Hardoi": ["Hardoi"],
  },
  "Uttarakhand": {
    "Dehradun": ["Dehradun"], "Haridwar": ["Haridwar"], "Nainital": ["Nainital"],
    "Almora": ["Almora"], "Udham Singh Nagar": ["Rudrapur"], "Chamoli": ["Gopeshwar"],
    "Champawat": ["Champawat"], "Pauri Garhwal": ["Pauri"],
    "Pithoragarh": ["Pithoragarh"], "Rudraprayag": ["Rudraprayag"],
    "Tehri Garhwal": ["New Tehri"], "Uttarkashi": ["Uttarkashi"],
    "Bageshwar": ["Bageshwar"],
  },
  "West Bengal": {
    "Kolkata": ["Kolkata"], "Howrah": ["Howrah"], "Darjeeling": ["Darjeeling"],
    "Jalpaiguri": ["Jalpaiguri"], "Cooch Behar": ["Cooch Behar"],
    "Malda": ["English Bazar"], "Murshidabad": ["Baharampur"],
    "Nadia": ["Krishnanagar"], "North 24 Parganas": ["Barasat"],
    "South 24 Parganas": ["Alipore"], "Hooghly": ["Chinsurah"],
    "Bankura": ["Bankura"], "Birbhum": ["Suri"], "Purulia": ["Purulia"],
    "Alipurduar": ["Alipurduar"], "Kalimpong": ["Kalimpong"],
    "Jhargram": ["Jhargram"], "Purba Medinipur": ["Tamluk"],
    "Paschim Medinipur": ["Medinipur"], "Purba Bardhaman": ["Bardhaman"],
    "Paschim Bardhaman": ["Asansol"], "Dakshin Dinajpur": ["Balurghat"],
    "Uttar Dinajpur": ["Raiganj"],
  },
  "Delhi": {
    "Central Delhi": ["New Delhi"], "East Delhi": ["Preet Vihar"],
    "New Delhi": ["New Delhi"], "North Delhi": ["Civil Lines"],
    "South Delhi": ["Saket"], "West Delhi": ["Rajouri Garden"],
    "North East Delhi": ["Seelampur"], "South East Delhi": ["Defence Colony"],
    "South West Delhi": ["Dwarka"], "Shahdara": ["Shahdara"],
    "North West Delhi": ["Kanjhawala"],
  },
  "Jammu and Kashmir": {
    "Srinagar": ["Srinagar"], "Jammu": ["Jammu"], "Anantnag": ["Anantnag"],
    "Baramulla": ["Baramulla"], "Budgam": ["Budgam"], "Pulwama": ["Pulwama"],
    "Kupwara": ["Kupwara"], "Doda": ["Doda"], "Kathua": ["Kathua"],
    "Rajouri": ["Rajouri"], "Poonch": ["Poonch"], "Udhampur": ["Udhampur"],
    "Bandipora": ["Bandipora"], "Ganderbal": ["Ganderbal"], "Kulgam": ["Kulgam"],
    "Shopian": ["Shopian"], "Kishtwar": ["Kishtwar"], "Ramban": ["Ramban"],
    "Reasi": ["Reasi"], "Samba": ["Samba"],
  },
  "Ladakh": { "Leh": ["Leh"], "Kargil": ["Kargil"] },
  "Chandigarh": { "Chandigarh": ["Chandigarh"] },
  "Puducherry": {
    "Puducherry": ["Puducherry"], "Karaikal": ["Karaikal"],
    "Mahe": ["Mahe"], "Yanam": ["Yanam"],
  },
  "Andaman and Nicobar Islands": {
    "South Andaman": ["Port Blair"], "Nicobar": ["Car Nicobar"],
    "North and Middle Andaman": ["Mayabunder"],
  },
  "Lakshadweep": { "Lakshadweep": ["Kavaratti"] },
};

/**
 * POST /api/admin/locations/seed
 * Seeds all Indian states, districts, and HQ towns. Uses upsert — safe to re-run.
 */
export async function POST() {
  try {
    const email = await getAuthEmail();
    if (!email) return ErrorResponse({ message: "Unauthorized", status: 401 });
    const user = await prisma.user.findFirst({
      where: { OR: [{ email }, { secondaryEmail: email }] },
      select: { role: true },
    });
    if (!user || user.role !== "SUPER_ADMIN") {
      return ErrorResponse({ message: "Super admin only", status: 403 });
    }

    let sc = 0, dc = 0, tc = 0;
    for (const [stateName, districts] of Object.entries(DATA)) {
      const state = await prisma.locationState.upsert({
        where: { name: stateName },
        update: {},
        create: { name: stateName },
      });
      sc++;
      for (const [districtName, towns] of Object.entries(districts)) {
        const district = await prisma.locationDistrict.upsert({
          where: { name_stateId: { name: districtName, stateId: state.id } },
          update: {},
          create: { name: districtName, stateId: state.id },
        });
        dc++;
        for (const townName of towns) {
          await prisma.locationTown.upsert({
            where: { name_districtId: { name: townName, districtId: district.id } },
            update: {},
            create: { name: townName, districtId: district.id },
          });
          tc++;
        }
      }
    }

    return SuccessResponse({
      message: `Seeded ${sc} states, ${dc} districts, ${tc} towns/villages`,
    });
  } catch (error) {
    return ErrorResponse({ message: "Failed to seed", error });
  }
}
