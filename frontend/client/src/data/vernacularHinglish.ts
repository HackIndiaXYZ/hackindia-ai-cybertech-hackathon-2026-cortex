/**
 * vernacularHinglish.ts
 * ---------------------
 * Casual, conversational Hinglish (WhatsApp-style Roman script) translations
 * specifically for the Vernacular Library design detail modal popup.
 *
 * Keeps technical terms (insulation, thermal mass, passive solar, etc.) in English
 * while using natural, friendly Hindi-English conversational phrasing.
 */

export interface HinglishDesignContent {
  description: string;
  whyItWorks: string;
  keyPassiveFeatures: string[];
}

export const HINGLISH_DESIGNS: Record<string, HinglishDesignContent> = {
  "composite-courtyard": {
    description:
      "Ye design north-west India aur composite zones me kaafi common hai. Yahan garmi me 45°C tak taapman pahunch jaata hai, monsoon me humidity badhti hai, aur sardi ki raaton me 5°C tak thand ho jaati hai—ye ghar har mausam ko aaram se sambhal leta hai.",
    whyItWorks:
      "Stone jaali se jab hawa guzarti hai toh Venturi effect se thandi ho jaati hai aur baareek chhanv dhoop ko rokti hai. Moti deewarein sardi me andar ki heat bacha kar rakhti hain, aur beech ka aangan monsoon me badhiya air circulation banaye rakhta hai.",
    keyPassiveFeatures: [
      "Venturi-effect wali stone jaaliyan (hawa ko thanda karti hain)",
      "Seasonal multi-tiered shaded baramde (har mausam ke hisaab se chhanv)",
      "Moti masonry thermal mass (garmi aur sardi dono ko buffer karti hai)",
      "Dual-zone seasonal living quarters (garmi me ground floor, sardi me upar)",
    ],
  },
  "earthship-biotecture": {
    description:
      "Taos, New Mexico ke desert me develop kiya gaya ye Earthship design mitti se bhare tyres ke mote berms aur south-facing greenhouse ka use karta hai, taaki bina AC ya heater ke ghar ka thermal balance hamesha perfect bana rahe.",
    whyItWorks:
      "Arid regions me jahan din me teekhi dhoop aur raat me kaddake ki thand hoti hai, iski moti earth berm din bhar ki garmi soak kar leti hai aur raat me dheere-dheere andar chhodti hai, jisse bina kisi grid power ke 24 ghante aaram rehta hai.",
    keyPassiveFeatures: [
      "Mitti se bhare tyres ke mote berms (zabardast thermal mass)",
      "Passive solar south-facing glazing (dhoop se natural heating)",
      "Thermal chimney aur earth tubes (zameen ke neeche se thandi hawa)",
      "Integrated rainwater harvesting tank (barsaat ka paani store karne ke liye)",
    ],
  },
  "courtyard-haveli": {
    description:
      "Rajasthan aur north India me sadiyon se chala aa raha ye Haveli design moti sandstone deewaron aur beech me ek khule aangan ka use karta hai, jiske chaaron taraf chhanv wale baramde bane hote hain.",
    whyItWorks:
      "Beech ka khula aangan ek natural microclimate bana deta hai. Raat ki thandi hawa aangan me baith jaati hai aur unchi deewarein din bhar us thandak ko bacha kar rakhti hain, jabki jaaliyan garam hawa ko thanda karke kamron me bhejti hain.",
    keyPassiveFeatures: [
      "Beech me khula shaded aangan (natural cooling ka core)",
      "Carved jharokhe aur jaali stone screens (hawa ko compress karke thanda karti hain)",
      "Thick golden sandstone thermal mass (bahar ki heat ko rokti hai)",
      "Nocturnal convective stack ventilation (raat me garam hawa upar se bahar)",
    ],
  },
  "malay-kampung": {
    description:
      "Ye traditional Malay ghar lakdi ke stilts (khambhon) par uncha banaya jaata hai. Isme hawa aane-jaane wale slatted floors, unchi chhat aur lambe chhajje hote hain jo bhaari monsoon aur high humidity me ghar ko dry aur thanda rakhte hain.",
    whyItWorks:
      "Humid tropical ilaqon me paseena jaldi sookhne ke liye hawa ka flow zaroori hota hai. Ghar ko zameen se upar uthane par tez hawa milti hai, zameen ki seelan door rehti hai, aur shaded cross-ventilation 24 ghante chalta rehta hai.",
    keyPassiveFeatures: [
      "Lakdi ke unche stilts foundation (flood aur nami se safe)",
      "Lambi dhalwan chhat aur chhajje (bhaari barsaat aur dhoop se bachav)",
      "Jaalidar bamboo aur lakdi ki screens (hawa ke continuous flow ke liye)",
      "Gable ventilation grilles / Tebing Layar (garam hawa bahar nikaalne ke liye)",
    ],
  },
  "bamboo-longhouse": {
    description:
      "North-east India aur Southeast Asia ka ye traditional community ghar poora bamboo se unche platform par banta hai. Iski jaalidar bamboo ki deewarein aur hawaadar flooring se 24 ghante natural ventilation chalta rehta hai.",
    whyItWorks:
      "Zero thermal mass hone ki wajah se lightweight bamboo din ki heat store nahi karta aur sooraj dhalte hi turant thanda ho jaata hai. Jaalidar deewaron se chipchipi hawa aaram se nikal jaati hai aur dhoop se poori chhanv milti hai.",
    keyPassiveFeatures: [
      "Buni hui breathable bamboo ki deewarein (hawa lagti rehti hai)",
      "Unche platform par stilt design (flood aur paani se safe)",
      "Steep dhalwan thatched roof (barsaat ka paani turant niche gir jaata hai)",
      "Zero-thermal-mass lightweight design (shaam hote hi turant thanda)",
    ],
  },
  "alpine-chalet": {
    description:
      "Himalayas aur European Alps ke thande pahadon me banne wala ye Chalet moti lakdi ke logs aur pathar ke base se banta hai. Iski dhalwan chhat par jami baraf ek natural insulation blanket ki tarah kaam karti hai aur heat bahar nahi jaane deti.",
    whyItWorks:
      "Compact shape hone se bahar ka surface area kam rehta hai jisse heat loss minimum hota hai. Chhat par jami baraf natural blanket ban jaati hai aur moti lakdi ki deewarein freezing thand ko andar aane se rokti hain.",
    keyPassiveFeatures: [
      "Tez dhalwan wali gabled roof (baraf phisal kar gir jaati hai)",
      "Moti solid timber walls (zabardast natural insulation)",
      "Compact surface-to-volume ratio (kam heat loss)",
      "Central hearth aur fireplace (poore ghar ko barabar heat deta hai)",
    ],
  },
  "new-england-saltbox": {
    description:
      "Colonial New England se shuru hua ye Saltbox ghar apni khaas lambi dhalwan chhat (catslide) ke liye jaana jaata hai, jo north ki taraf neeche tak jhuki hoti hai taaki sardi ki tez barafili hawaayein chhat ke upar se nikal jayein.",
    whyItWorks:
      "North ki taraf jhuki lambi aerodynamic chhat freezing hawaon ko ghar ke upar se aaram se nikaal deti hai jisse heat loss nahi hota, aur south ki khidkiyan din me pyari dhoop andar leti hain.",
    keyPassiveFeatures: [
      "North facing asymmetrical catslide roof (thandi hawaon ko deflect karti hai)",
      "Beech me badi brick chimney (heat battery ki tarah garam rehti hai)",
      "South-oriented living windows (thand me direct solar heat capture)",
      "Compact timber-frame envelope (andar ki garmi bachi rehti hai)",
    ],
  },
};

export const HINGLISH_REASONS: Record<string, string> = {
  // Composite Zone
  "Envelope insulation mitigates severe summer heat peaks and retains indoor warmth during winter nights.":
    "Envelope insulation garmi ke 45°C peak heat ko rokta hai aur sardi ki raaton me ghar ke andar ki garmi bachaye rakhta hai.",
  "External shading and east/west heat-gain control prevent intense low-angle summer solar radiation.":
    "External shading aur east/west heat-gain control subah aur shaam ki chubhti dhoop ko andar aane se rokte hain.",
  "Includes partial shading features that reduce peak daytime solar heating.":
    "Isme partial shading features hain jo din ke peak time par direct dhoop aur heat ko kam karte hain.",
  "Effective cross-ventilation promotes cooling airflow during humid monsoon spells.":
    "Badhiya cross-ventilation monsoon ke chipchipe mausam me bhi taza aur thandi hawa flow karta rehta hai.",
  "Robust monsoon protection and rainwater runoff channels prevent dampness and water accumulation.":
    "Strong monsoon protection aur paani nikalne ka dhalan barsaat me seelan aur paani jamne nahi deta.",
  "High thermal mass dampens wide diurnal temperature swings typical of composite seasons.":
    "High thermal mass din aur raat ke taapman ke bade utaar-chadhaav ko aaram se stabilize kar leta hai.",

  // Hot-Dry Zone
  "Dense thermal mass buffers extreme arid day-night temperature swings.":
    "Moti thermal mass deewarein registan ke din ki garmi aur raat ki thand ke bade gap ko aaram se jhel leti hain.",
  "Shading devices and small apertures deflect fierce desert radiation.":
    "Shading devices aur chote jharokhe registan ki teekhi dhoop aur heat waves ko bahar hi rok dete hain.",
  "Envelope insulation resists conductive heat transfer from hot ambient air.":
    "Envelope insulation bahar ki loo aur garam hawa ko deewaron ke zariye andar aane se rokta hai.",
  "Stack ventilation purges stored internal heat during cooler night hours.":
    "Stack ventilation raat ke thande ghanton me din ki jama hui heat ko bahar nikaal deta hai.",

  // Warm-Humid Zone
  "Continuous cross-ventilation facilitates skin evaporation in humid conditions.":
    "Continuous cross-ventilation se paseena jaldi sookh jaata hai aur chipchipahat bilkul feel nahi hoti.",
  "Steep runoff roofs and raised platforms prevent ground moisture and flood risk.":
    "Dhalwan chhat aur uncha platform zameen ki nami aur flood ke risk se ghar ko safe rakhte hain.",
  "Generous roof overhangs shade openings while remaining porous to breezes.":
    "Chhat ke lambe chhajje dhoop ko rokte hain aur bina hawa roke kamron me thandak banaye rakhte hain.",
  "Lightweight envelope cools quickly at sunset without re-radiating stored heat.":
    "Lightweight structure hone se ye heat store nahi karta aur suraj dhalte hi turant thanda ho jaata hai.",

  // Cold Zone
  "Heavy insulation layer minimises conductive heat loss in freezing conditions.":
    "Moti insulation freezing thand me ghar ke andar ki garmi ko bahar nikalne se rokti hai.",
  "Thermal core and masonry mass store heat from hearth and passive solar gain.":
    "Thermal core aur masonry mass fireplace aur din ki dhoop ki heat ko lambe time tak store karke rakhte hain.",
  "Steep pitch prevents structural overload from heavy winter snow and freezing rain.":
    "Tez dhalwan wali chhat baraf ko phisal kar gira deti hai taaki chhat par bhaari wajan na pade.",
  "Unimpeded solar access allows beneficial low-angle winter sunlight warming.":
    "Bina kisi rukawat ke aane wali winter dhoop ghar ko naturally garam aur comfortable banaye rakhti hai.",

  // Temperate Zone
  "Good airflow maintains indoor comfort during mild afternoon hours.":
    "Acha air flow dopehar ke time bhi ghar ke andar mast aur pleasant mahool banaye rakhta hai.",
  "Solar shading prevents seasonal overheating during warmer months.":
    "Solar shading garmi ke mahinon me kamron ko zaroorat se zyada garam hone se bachata hai.",
  "Envelope insulation preserves stable ambient indoor temperatures.":
    "Envelope insulation saal bhar ghar ka taapman comfortable aur stable banaye rakhta hai.",
  "Moderate thermal mass maintains steady indoor temperatures.":
    "Moderate thermal mass mausam ke badlaav ke dauran bhi indoor temperature steady rakhta hai.",
};

export const HINGLISH_LIMITATIONS: Record<string, string> = {
  "Lacks envelope insulation, risking heavy radiant heat ingress in summer and winter heat loss.":
    "Envelope insulation na hone se garmi me deewarein tapne lagengi aur sardi me ghar thanda pad jayega.",
  "Insulation performance rating is unverified.":
    "Insulation ki performance rating abhi field me verify honi baaki hai.",
  "Unprotected east/west facades admit intense morning and late afternoon sun.":
    "East aur west ki taraf shading na hone se subah aur shaam ki seedhi dhoop kamre garam karegi.",
  "Absence of external shading exposes building envelope to scorching summer heat.":
    "External shading na hone ki wajah se garmi ki teekhi dhoop seedhi deewaron par padegi.",
  "Insufficient cross-ventilation causes severe stuffiness during humid monsoon periods.":
    "Cross-ventilation kam hone se monsoon ke mausam me andar kaafi ghutan aur humidity mehsus hogi.",
  "Ventilation permeability unassessed.":
    "Hawa aane-jaane ki ventilation capacity abhi verify nahi hui hai.",
  "Vulnerable to water seepage and pooling during intense monsoon downpours.":
    "Bhaari barsaat ke time paani risne aur chhat ya aangan me jamne ka risk ho sakta hai.",
  "Monsoon resilience unverified.":
    "Bhaari barsaat jhelne ki capacity abhi check nahi hui hai.",
  "Lightweight zero-mass construction cannot buffer composite seasonal extremes (45°C summer heatwaves and chilly 5°C winter nights).":
    "Zero thermal mass hone ki wajah se ye design composite climate ke 45°C garmi aur 5°C sardi ke extremes ko sambhal nahi payega.",
  "Thermal mass characteristics unassessed.":
    "Thermal mass ka behavior abhi scientifically assess nahi hua hai.",
  "Passive feature dataset is incomplete; empirical field verification required.":
    "Passive features ka data abhi poora nahi hai, field verification zaroori hai.",
  "Low thermal mass fails to insulate interior from desert heat extremes.":
    "Thermal mass kam hone se registan ki teekhi garmi seedhi andar ghus sakti hai.",
  "Lacks external shading against direct desert solar glare.":
    "Direct desert glare aur dhoop se bachne ke liye external shading ki kami hai.",
  "Inadequate natural ventilation traps moisture and warm air.":
    "Hawa ka flow kam hone se andar nami aur garam hawa phas sakti hai.",
  "Susceptible to ground moisture and tropical downpours.":
    "Zameen ki nami aur tez barsaat se seelan ka khatra ho sakta hai.",
  "Direct solar exposure raises indoor humidity discomfort.":
    "Direct dhoop padne se andar humidity aur garmi dono badh sakti hain.",
  "Heavy thermal mass retains heat into warm, humid tropical nights.":
    "Heavy thermal mass garmi ko rok lega aur humid raaton me andar heat chhodega.",
  "Insufficient insulation causes dangerous cold bridging and heat loss.":
    "Insulation kam hone se kaddake ki thand me ghar ki garmi bahar nikal jayegi.",
  "Inadequate roof pitch poses risk of snow and ice accumulation.":
    "Chhat par dhalan kam hone se baraf jamne ka khatra rehta hai.",
  "Excessive external shading obstructs crucial winter solar radiation.":
    "Zyada shading hone se sardi ke time zaroori dhoop andar nahi aa payegi.",
  "High ventilation porosity risks freezing cold air infiltration.":
    "Zyada ventilation porosity hone se barafili thandi hawa andar ghus sakti hai.",
};

export function getHinglishDescription(designId: string, fallback: string): string {
  return HINGLISH_DESIGNS[designId]?.description || fallback;
}

export function getHinglishWhyItWorks(designId: string, fallback: string): string {
  return HINGLISH_DESIGNS[designId]?.whyItWorks || fallback;
}

export function getHinglishKeyFeatures(designId: string, fallback: string[]): string[] {
  return HINGLISH_DESIGNS[designId]?.keyPassiveFeatures || fallback;
}

export function toHinglishReason(english: string): string {
  const trimmed = english.trim();
  return HINGLISH_REASONS[trimmed] || english;
}

export function toHinglishLimitation(english: string): string {
  const trimmed = english.trim();
  return HINGLISH_LIMITATIONS[trimmed] || english;
}
