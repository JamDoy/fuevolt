#!/usr/bin/env node
/**
 * Pre-render script for FueVolt.
 * Runs after `vite build` to generate unique HTML files for every route.
 * Each file has its own <title>, <meta description>, <link rel="canonical">,
 * <h1>, and full page content baked into the HTML so Google can index it
 * without executing JavaScript.
 */

import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

const DIST = path.resolve('dist');
const CONTENT_DIR = path.resolve('public/content/articles');
const BASE_URL = 'https://www.fuevolt.com';
const ADSENSE_PUB_ID = 'ca-pub-7549230738737699';

// Read the base template (built index.html)
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf-8');

// ── Article data ────────────────────────────────────────────────────────
const articles = JSON.parse(
  fs.readFileSync(path.join(CONTENT_DIR, 'index.json'), 'utf-8')
);

function readArticleMarkdown(slug) {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  let md = fs.readFileSync(filePath, 'utf-8');
  // Strip frontmatter
  md = md.replace(/^---[\s\S]*?---\n*/, '');
  return md;
}

function markdownToHtml(md) {
  return marked.parse(md, { breaks: false, gfm: true });
}

// ── City data ───────────────────────────────────────────────────────────
const FUEL_CITIES = [
  { slug: 'sydney', name: 'Sydney' },
  { slug: 'melbourne', name: 'Melbourne' },
  { slug: 'brisbane', name: 'Brisbane' },
  { slug: 'perth', name: 'Perth' },
  { slug: 'adelaide', name: 'Adelaide' },
  { slug: 'gold-coast', name: 'Gold Coast' },
  { slug: 'canberra', name: 'Canberra' },
  { slug: 'newcastle', name: 'Newcastle' },
  { slug: 'wollongong', name: 'Wollongong' },
  { slug: 'hobart', name: 'Hobart' },
  { slug: 'geelong', name: 'Geelong' },
  { slug: 'townsville', name: 'Townsville' },
  { slug: 'cairns', name: 'Cairns' },
  { slug: 'darwin', name: 'Darwin' },
  { slug: 'toowoomba', name: 'Toowoomba' },
  { slug: 'ballarat', name: 'Ballarat' },
  { slug: 'bendigo', name: 'Bendigo' },
  { slug: 'launceston', name: 'Launceston' },
  { slug: 'sunshine-coast', name: 'Sunshine Coast' },
  { slug: 'parramatta', name: 'Parramatta' },
];

const EV_CITIES = [
  { slug: 'sydney', name: 'Sydney' },
  { slug: 'melbourne', name: 'Melbourne' },
  { slug: 'brisbane', name: 'Brisbane' },
  { slug: 'perth', name: 'Perth' },
  { slug: 'adelaide', name: 'Adelaide' },
  { slug: 'gold-coast', name: 'Gold Coast' },
  { slug: 'canberra', name: 'Canberra' },
  { slug: 'hobart', name: 'Hobart' },
  { slug: 'darwin', name: 'Darwin' },
  { slug: 'newcastle', name: 'Newcastle' },
];

// Each city intro is expanded to 300+ words with local suburbs, price trends, and tips
const FUEL_CITY_CONTENT = {
  sydney: {
    intro: 'Sydney drivers face some of the highest fuel prices in Australia due to high demand, congestion surcharges, and limited competition in some suburbs. Prices can vary by 30 cents per litre or more between the cheapest and most expensive stations on any given day.',
    suburbs: 'FueVolt compares prices across the Greater Sydney area including Parramatta, Penrith, Liverpool, Blacktown, Campbelltown, Bankstown, Hornsby, Chatswood, Bondi, Manly, the Northern Beaches, Canterbury, Sutherland, Cronulla, and the Hills District.',
    trends: 'Sydney fuel prices follow a regular weekly cycle. Prices typically rise sharply on Wednesdays or Thursdays and gradually fall over the following week. The cheapest day to fill up is usually Tuesday, when prices hit the bottom of the cycle. Independent stations in Western Sydney suburbs like Fairfield, Auburn, and Granville often undercut the major brands. Motorway service stations and inner-city locations tend to charge the highest prices.',
    tips: 'To save money on fuel in Sydney, fill up at the bottom of the price cycle (typically Tuesday), compare prices between suburbs using FueVolt, and consider driving a few extra minutes to a cheaper station. Costco at Crossroads in Casula and Marsden Park consistently offers some of the lowest prices in the city. Avoid filling up at petrol stations directly on major highways or near the airport.',
  },
  melbourne: {
    intro: 'Melbourne follows a regular weekly fuel price cycle — prices typically peak mid-week and drop on Tuesdays. Understanding this cycle can save you 10-20 cents per litre every fill-up, adding up to hundreds of dollars in annual savings for regular commuters.',
    suburbs: 'FueVolt tracks prices across Melbourne suburbs including Dandenong, Footscray, Werribee, Ringwood, Frankston, Cranbourne, Broadmeadows, Sunshine, Essendon, Brunswick, Preston, Box Hill, Glen Waverley, Mornington, Geelong Road corridor, and the outer growth suburbs of Craigieburn and Pakenham.',
    trends: 'Melbourne fuel prices follow a predictable fortnightly to weekly cycle. Prices rise sharply — usually by 20-40 cents per litre — then gradually fall over 7-14 days. The cheapest time to fill up is typically Monday or Tuesday. Melbourne\'s western suburbs (Werribee, Hoppers Crossing, Deer Park) often have the lowest prices, while inner-city stations in South Yarra, Prahran, and the CBD charge premium rates. The price difference between the cheapest and most expensive Melbourne station can exceed 50 cents per litre.',
    tips: 'Check FueVolt on Monday evenings to catch the bottom of Melbourne\'s price cycle. Independent servos in industrial areas like Laverton, Campbellfield, and Dandenong South frequently offer the best prices. Avoid filling up on Wednesday or Thursday when prices typically spike.',
  },
  brisbane: {
    intro: 'Brisbane and South East Queensland benefit from government-mandated fuel price transparency, meaning every station must report its prices publicly. This transparency makes price comparison especially effective — the price difference between the cheapest and most expensive stations across Greater Brisbane can be 30 cents per litre or more.',
    suburbs: 'FueVolt shows real-time pricing for every servo in the region, from the Brisbane CBD to Ipswich, Logan, Redlands, Moreton Bay, Caboolture, Redcliffe, Chermside, Mt Gravatt, Carindale, Wynnum, and Springfield. Outer suburbs like Beaudesert, Jimboomba, and Samford also covered.',
    trends: 'Brisbane fuel prices tend to follow a fortnightly cycle, though the pattern can be less predictable than Sydney or Melbourne. Prices typically rise sharply over one to two days, then fall gradually over 10-14 days. The southside suburbs (Logan, Browns Plains, Beenleigh) often have lower prices than the northside, while stations near the Brisbane Airport and in Fortitude Valley tend to charge more. Queensland does not have a mandated Tuesday price drop like some other states, so checking FueVolt daily is the best strategy.',
    tips: 'Fill up when prices are at the bottom of the cycle — FueVolt shows you current prices to help identify these dips. Stations along the Ipswich Motorway and Logan Motorway service centres tend to charge premiums. Instead, exit the motorway and fill up at suburban stations nearby for significant savings.',
  },
  perth: {
    intro: 'Perth has a unique fuel pricing system called FuelWatch. Stations must lock in their next-day price by 2pm the day before, so Perth drivers can see tomorrow\'s prices today. This makes Perth one of the most predictable cities in Australia for fuel savings — you can literally plan your fill-up a day in advance.',
    suburbs: 'Compare prices across Perth from Joondalup to Rockingham, Midland to Fremantle, Armadale to Scarborough, Wanneroo, Morley, Cannington, Victoria Park, Osborne Park, Balcatta, Canning Vale, and the outer suburbs of Mandurah, Ellenbrook, and Butler.',
    trends: 'Perth fuel prices follow a very regular weekly cycle, largely driven by the FuelWatch system. Prices typically bottom out on Tuesdays or Wednesdays and peak later in the week. The difference between the top and bottom of the cycle can be 15-30 cents per litre. Northern corridor suburbs (Joondalup, Wanneroo, Butler) often compete aggressively on price. Stations in Fremantle and near Cottesloe Beach tend to be more expensive. The Costco in Perth Airport and independent stations in Canning Vale are consistently among the cheapest.',
    tips: 'Check FueVolt the evening before you plan to fill up — Perth\'s FuelWatch system means tomorrow\'s prices are already set by 2pm today. Fill up on the cheapest day (usually Tuesday). Avoid highway service stations on the Kwinana Freeway and Mitchell Freeway.',
  },
  adelaide: {
    intro: 'Adelaide fuel prices can vary significantly between suburbs, with price differences of 20 cents per litre or more on any given day. While South Australia\'s live government fuel pricing data is still being integrated into FueVolt, nearby border stations with real-time pricing are already available.',
    suburbs: 'FueVolt coverage is expanding across Adelaide including the CBD, North Adelaide, Port Adelaide, Glenelg, Marion, Salisbury, Elizabeth, Modbury, Norwood, Unley, Prospect, Reynella, Morphett Vale, and Mount Barker.',
    trends: 'Adelaide typically sees less dramatic price cycles than Sydney and Melbourne, but savings of 10-20 cents per litre between the cheapest and most expensive stations are common. Northern suburbs like Elizabeth and Salisbury tend to have lower prices than the eastern suburbs and the Adelaide Hills. Petrol stations along main arterials like Port Road, South Road, and Main North Road are generally competitive due to high traffic volumes. Stations in tourist areas like Hahndorf and Victor Harbor often charge premiums.',
    tips: 'Compare prices before heading to the pump. Independent stations in Adelaide\'s outer northern and southern suburbs often offer the best value. Avoid filling up at stations near the Adelaide Oval or along the Adelaide-Crafers Highway. Full SA coverage with live pricing is coming soon to FueVolt.',
  },
  'gold-coast': {
    intro: 'The Gold Coast benefits from Queensland\'s fuel price transparency laws. However, being a major tourist destination means fuel prices can vary dramatically — tourist strips and beachfront stations often charge significant premiums over suburban servos just a few minutes inland.',
    suburbs: 'Compare prices from Coolangatta to Helensvale, Surfers Paradise to Robina, Broadbeach, Southport, Burleigh Heads, Palm Beach, Nerang, Mudgeeraba, Coomera, Oxenford, Varsity Lakes, and Tweed Heads just across the NSW border.',
    trends: 'Gold Coast fuel prices generally follow Brisbane\'s fortnightly cycle but with more volatility in tourist areas. Stations along the Gold Coast Highway and near theme parks (Dreamworld, Movie World, Sea World) consistently charge 10-15 cents more per litre than inland alternatives. The M1 motorway corridor through Coomera and Nerang has competitive pricing due to high traffic volume. Stations near the airport at Coolangatta can also be expensive.',
    tips: 'If you\'re visiting the Gold Coast, fill up before arriving — stations in Logan or Beenleigh on the M1 are usually cheaper. For locals, Nerang, Mudgeeraba, and Varsity Lakes consistently offer better prices than the beachfront. Check FueVolt before heading out to avoid overpaying at tourist-trap servos.',
  },
  canberra: {
    intro: 'Canberra fuel prices tend to be higher than surrounding NSW regional areas due to limited competition and the ACT\'s smaller market. With fewer stations than comparable cities, Canberrans benefit significantly from price comparison — the gap between cheapest and most expensive stations can be 15-25 cents per litre.',
    suburbs: 'ACT coverage is expanding on FueVolt. Nearby NSW stations with live pricing are already available, including Queanbeyan, Fyshwick, Belconnen, Woden, Tuggeranong, Gungahlin, Mitchell, Hume, Kingston, and Majura Park. Cross-border stations in Queanbeyan often offer competitive prices.',
    trends: 'Canberra\'s fuel market has fewer stations than comparable Australian cities, which limits competition. Prices are generally stable without the dramatic weekly cycles seen in Sydney and Melbourne. However, independent stations in Fyshwick and Mitchell tend to undercut the major brands. Stations on Northbourne Avenue and near the Parliamentary Triangle charge premium rates. Queanbeyan, just across the NSW border, sometimes has lower prices than Canberra proper due to different state pricing dynamics.',
    tips: 'Compare Canberra stations with Queanbeyan — cross-border price differences can be significant. Avoid Canberra Avenue and Northbourne Avenue stations during peak hours when prices tend to be highest. Check FueVolt for the cheapest options in your part of the ACT. Full ACT government pricing data is coming soon.',
  },
  newcastle: {
    intro: 'Newcastle and the Hunter Valley region benefit from NSW\'s real-time government fuel pricing. As a major regional city, Newcastle has good competition between fuel retailers, with prices generally tracking 2-5 cents below Sydney averages.',
    suburbs: 'Compare prices across Charlestown, Maitland, Lake Macquarie, Cessnock, Raymond Terrace, Nelson Bay, Toronto, Warners Bay, Adamstown, Hamilton, Wallsend, Mayfield, Merewether, Lambton, Jesmond, and the broader Hunter Valley region.',
    trends: 'Newcastle fuel prices follow the same weekly cycle as Sydney but often sit a few cents lower. The cheapest stations tend to be along the Pacific Highway corridor and in industrial areas like Mayfield and Hexham. Stations near the Newcastle Beach and Honeysuckle precinct charge premium rates. The Hunter Valley wine region stations (Cessnock, Pokolbin) are typically more expensive than Newcastle metropolitan stations due to lower competition.',
    tips: 'Fill up along the Pacific Highway or in Charlestown and Kotara where competition is strongest. Avoid tourist-area stations near Newcastle Beach and in the Hunter Valley wine region. Check FueVolt before road trips from Newcastle to Sydney — prices along the M1 service centres are usually higher than surrounding suburbs.',
  },
  wollongong: {
    intro: 'Wollongong and the Illawarra region have real-time fuel pricing through NSW government data. As a compact regional city, Wollongong offers easy access to multiple competing stations, and prices are often lower than nearby Sydney — making it one of the more affordable places to fill up in NSW.',
    suburbs: 'Find cheap petrol from Helensburgh to Kiama, including Wollongong CBD, Shellharbour, Warrawong, Dapto, Unanderra, Corrimal, Thirroul, Fairy Meadow, Figtree, Berkeley, Albion Park, Gerringong, and the Shoalhaven region down to Nowra.',
    trends: 'Wollongong fuel prices generally follow the Sydney cycle but tend to sit 3-8 cents per litre cheaper. The most competitive pricing is found along the Princes Highway corridor through Dapto, Unanderra, and Albion Park. Stations on Crown Street in the Wollongong CBD and near the beaches are typically more expensive. Shellharbour has good competition between major brands. Heading south toward Kiama and Berry, prices tend to rise slightly due to lower station density.',
    tips: 'Fill up along the Princes Highway where competition keeps prices low. Avoid Helensburgh on the way from Sydney — it\'s often the most expensive in the region. For road trips south, fill up in Albion Park or Shellharbour before heading into the less competitive southern Illawarra and Shoalhaven regions.',
  },
  hobart: {
    intro: 'Hobart and Tasmanian fuel prices are typically higher than mainland Australian capitals due to additional shipping and transport costs to get fuel to the island. This freight premium adds approximately 3-8 cents per litre compared to Melbourne prices.',
    suburbs: 'Fuel price coverage across Hobart is expanding, including the CBD, Sandy Bay, Glenorchy, Moonah, Kingston, Bellerive, Rosny Park, Claremont, New Town, Lindisfarne, and surrounding areas. Regional Tasmanian towns including Launceston, Devonport, Burnie, and Ulverstone are also being added.',
    trends: 'Hobart\'s fuel market is smaller than mainland capitals with fewer stations and less aggressive price competition. Prices tend to be more stable without the dramatic weekly cycles. Northern suburbs like Glenorchy and Moonah generally have lower prices than the CBD and Sandy Bay. Stations along the Brooker Highway are usually competitive. The tourist town of Richmond and stations near the Salamanca waterfront tend to charge premiums.',
    tips: 'Compare prices before filling up — even in a smaller market like Hobart, savings of 10-15 cents per litre are possible. Fill up in Glenorchy or along the Brooker Highway rather than the CBD. For trips around Tasmania, fill up in major towns as rural stations can be significantly more expensive. Full live Tasmanian pricing data is coming soon to FueVolt.',
  },
  darwin: {
    intro: 'Darwin fuel prices are consistently among the highest in Australia due to remote supply chains, high transport costs, and limited competition. The average Darwin fuel price can be 15-25 cents higher per litre than in capital cities like Melbourne or Brisbane, making price comparison especially valuable.',
    suburbs: 'FueVolt is expanding coverage across Darwin including the CBD, Stuart Park, Fannie Bay, Parap, Winnellie, Berrimah, Palmerston, Howard Springs, Humpty Doo, and the rural areas along the Stuart Highway.',
    trends: 'Darwin\'s small market means fewer stations and less price competition than mainland capitals. Prices are generally stable without regular cycles. Stations in the CBD and along the Stuart Highway tend to be more expensive than suburban Palmerston. The Woolworths/Caltex stations in Palmerston sometimes offer the best prices due to supermarket fuel discount schemes. Fuel prices increase significantly heading south along the Stuart Highway toward Alice Springs.',
    tips: 'Always compare prices before filling up in Darwin — the small number of stations means less competition and higher potential for overpaying. Fill up in Palmerston or Berrimah rather than the Darwin CBD. If heading on a road trip south, fill up completely in Darwin as regional NT prices are even higher. Full NT live pricing is coming soon to FueVolt.',
  },
  geelong: {
    intro: 'Geelong benefits from Victoria\'s real-time government fuel pricing, giving drivers access to accurate, up-to-the-minute pricing at every station in the region. As Victoria\'s second-largest city, Geelong has strong competition between fuel retailers, creating genuine opportunities to save.',
    suburbs: 'Compare prices across Geelong, Bellarine Peninsula, the Surf Coast, Lara, Corio, Norlane, North Geelong, Newtown, Highton, Waurn Ponds, Leopold, Ocean Grove, Queenscliff, Torquay, and the surrounding Barwon region.',
    trends: 'Geelong fuel prices tend to follow Melbourne\'s weekly cycle but often sit slightly lower. The Geelong Ring Road corridor and Latrobe Terrace have the most competitive pricing due to high traffic volumes and multiple adjacent stations. Stations along the Surf Coast Highway toward Torquay charge premiums during summer tourist season. Bellarine Peninsula stations (Queenscliff, Point Lonsdale) are consistently more expensive due to lower competition.',
    tips: 'Fill up along the Geelong Ring Road or near Waurn Ponds shopping precinct where competition is strongest. Avoid Surf Coast Highway stations during summer unless absolutely necessary. If driving to Melbourne, compare Geelong prices first — it\'s often cheaper to fill up in Geelong than along the Princes Freeway or in Melbourne\'s western suburbs.',
  },
  toowoomba: {
    intro: 'Toowoomba benefits from Queensland\'s government fuel pricing transparency. As the Darling Downs\' major centre, Toowoomba serves as a refuelling hub for regional drivers across south-western Queensland, making price comparison particularly valuable for both locals and travellers.',
    suburbs: 'Find the cheapest fuel across Toowoomba including the CBD, Highfields, Rangeville, Newtown, Darling Heights, Harristown, Wilsonton, Kearneys Spring, Drayton, and surrounding rural areas including Gatton, Laidley, and Dalby.',
    trends: 'Toowoomba fuel prices are generally higher than Brisbane due to additional transport costs to get fuel up the Great Dividing Range. However, competition within the city keeps prices relatively stable. Stations along James Street and Ruthven Street (the main commercial corridors) tend to have competitive pricing. Rural stations west of Toowoomba (Dalby, Chinchilla, Miles) are significantly more expensive due to lower volume.',
    tips: 'Fill up in Toowoomba before heading west into rural Queensland where prices increase significantly. Compare stations along James Street and the New England Highway for the best deals. If driving from Brisbane, consider whether Toowoomba or Ipswich/Springfield prices are cheaper before heading up the range.',
  },
  cairns: {
    intro: 'Cairns and Far North Queensland have real-time fuel pricing from official government sources. As a regional centre and major tourist destination, Cairns fuel prices tend to be higher than Brisbane due to transport costs, but significant variation exists between stations — savings of 10-20 cents per litre are common.',
    suburbs: 'Compare prices from Smithfield to Edmonton, Palm Cove to Gordonvale, Cairns CBD, Manunda, Manoora, Parramatta Park, Earlville, Woree, White Rock, Mount Sheridan, Trinity Beach, and surrounding areas including Atherton Tablelands, Innisfail, and Port Douglas.',
    trends: 'Cairns prices are typically 5-10 cents higher per litre than Brisbane. The cheapest stations tend to be along the Bruce Highway corridor through Edmonton and Gordonvale. CBD and Esplanade area stations charge premiums, particularly during tourist season (June-October). Port Douglas stations are consistently the most expensive in the region. The Atherton Tablelands (Atherton, Mareeba) often have lower prices than Cairns due to less tourist traffic.',
    tips: 'Fill up in Edmonton or Gordonvale on the Bruce Highway rather than the Cairns CBD. If heading to Port Douglas, fill up in Cairns first. For trips to the Atherton Tablelands, check whether Atherton or Cairns has better prices on FueVolt before setting off.',
  },
  ballarat: {
    intro: 'Ballarat benefits from Victoria\'s real-time fuel pricing system. As one of Victoria\'s fastest-growing regional cities, Ballarat has increasing competition among fuel retailers, creating genuine opportunities to save compared to just filling up at the nearest station.',
    suburbs: 'Compare petrol and diesel across the Ballarat region, including the CBD, Wendouree, Delacombe, Buninyong, Sebastopol, Alfredton, Lucas, Canadian, Mount Helen, Creswick, Daylesford, and surrounding Goldfields communities.',
    trends: 'Ballarat fuel prices tend to follow Melbourne\'s cycle but with a slight delay and generally sit 2-5 cents higher. The Western Highway corridor through Ballarat has the most competitive pricing. Stations in the CBD on Sturt Street can be more expensive than suburban alternatives. The growing suburbs of Lucas and Alfredton have newer stations competing on price. Daylesford and Hepburn Springs stations charge tourist premiums, particularly on weekends.',
    tips: 'Fill up along the Western Highway or in Wendouree where competition is strongest. Avoid CBD stations on Sturt Street during peak times. If driving from Melbourne, compare whether to fill up in Ballarat or Bacchus Marsh — the price difference can go either way depending on the cycle.',
  },
  bendigo: {
    intro: 'Bendigo benefits from Victoria\'s real-time fuel pricing system, giving drivers across Greater Bendigo and the Goldfields region access to live pricing data. Bendigo\'s competitive fuel market means savings are there for those who compare before filling up.',
    suburbs: 'Find cheap fuel across Greater Bendigo including the CBD, Kangaroo Flat, Eaglehawk, Strathfieldsaye, Epsom, Huntly, Golden Square, Long Gully, Maiden Gully, and surrounding towns including Castlemaine, Kyneton, and Heathcote.',
    trends: 'Bendigo fuel prices tend to follow Melbourne\'s cycle with a day or two delay. The Calder Highway corridor and High Street have the most competitive pricing. Kangaroo Flat consistently has some of Bendigo\'s cheapest fuel due to the cluster of competing stations along the highway. Eaglehawk prices are usually in the mid-range. Stations on Pall Mall in the CBD can charge premiums. Smaller surrounding towns like Castlemaine and Heathcote generally have higher prices due to less competition.',
    tips: 'Fill up in Kangaroo Flat along the Calder Highway where competition between stations keeps prices low. Check FueVolt before driving through Bendigo on the Calder Freeway — the on-highway stations may not be the cheapest. For trips toward Echuca or the Murray, fill up in Bendigo first as northern Victoria rural prices tend to be higher.',
  },
  launceston: {
    intro: 'Launceston fuel prices are expanding on FueVolt as Tasmanian coverage develops. Northern Tasmania typically sees slightly lower prices than Hobart but higher than mainland averages due to the island freight premium that adds approximately 3-8 cents per litre.',
    suburbs: 'Coverage across Launceston is expanding, including the CBD, Mowbray, Kings Meadows, Riverside, Prospect, Newstead, Invermay, South Launceston, Youngtown, and surrounding areas including Longford, Perth (TAS), and George Town.',
    trends: 'Launceston\'s fuel market is smaller than Hobart\'s with fewer stations, but the Bass Highway corridor provides some price competition. Stations on Wellington Street and in Kings Meadows tend to be competitive. Invermay\'s industrial area occasionally has lower prices. Prices increase significantly in rural northern Tasmania, particularly along the Great Western Tiers and the East Coast. George Town and surrounding areas have limited station options.',
    tips: 'Fill up in Launceston before heading to rural parts of northern Tasmania where stations are sparse and expensive. Compare prices along Wellington Street and the Bass Highway. For trips to Cradle Mountain or the East Coast, ensure a full tank before leaving the city. Full live Tasmanian pricing data is coming soon to FueVolt.',
  },
  'sunshine-coast': {
    intro: 'The Sunshine Coast benefits from Queensland\'s government fuel pricing transparency, providing live prices at every station across the region. As a popular tourist destination, fuel prices can vary significantly between tourist strips and suburban stations — checking FueVolt before filling up can save you 10-15 cents per litre.',
    suburbs: 'Compare prices from Caloundra to Noosa, Maroochydore to Nambour, Mooloolaba, Buderim, Kawana Waters, Sippy Downs, Palmwoods, Eumundi, Coolum Beach, Bli Bli, Beerwah, Glass House Mountains, and Maleny.',
    trends: 'Sunshine Coast fuel prices generally follow Brisbane\'s fortnightly cycle. Tourist-area stations in Noosa Heads, Hastings Street, and Mooloolaba Esplanade consistently charge premiums of 10-15 cents over inland alternatives. The Bruce Highway corridor through Beerwah, Glass House Mountains, and Caloundra has the most competitive pricing. Nambour and Maroochydore CBD stations offer mid-range pricing. The hinterland towns of Maleny, Montville, and Eumundi tend to be more expensive due to lower station density.',
    tips: 'Fill up along the Bruce Highway before heading to the beach — beachside stations charge tourist premiums. Stations in Sippy Downs and Kawana Waters offer good value due to residential competition. If travelling from Brisbane, compare whether to fill up at Caboolture on the Bruce Highway or on the Sunshine Coast.',
  },
  parramatta: {
    intro: 'Parramatta and Western Sydney have real-time government fuel pricing. As one of Sydney\'s most populated commuter regions, Western Sydney has strong competition between fuel retailers, and prices are generally 3-8 cents lower per litre than Sydney\'s eastern suburbs and CBD.',
    suburbs: 'Find the cheapest petrol across Western Sydney including Parramatta CBD, Blacktown, Penrith, Liverpool, Fairfield, Auburn, Granville, Merrylands, Seven Hills, Castle Hill, Rouse Hill, Marsden Park, St Marys, Mount Druitt, Wetherill Park, and Campbelltown.',
    trends: 'Western Sydney fuel prices follow Sydney\'s weekly cycle but tend to bottom out first, meaning you can often get the cheapest prices in the city before the eastern suburbs drop. The Great Western Highway corridor and Parramatta Road have multiple competing stations. Independent stations in Fairfield, Auburn, and Granville consistently offer some of Sydney\'s cheapest fuel. The Costco at Marsden Park is usually among the lowest-priced stations in all of Sydney. New suburbs like Jordan Springs and Oran Park have newer stations competing on price.',
    tips: 'Costco Marsden Park consistently has the lowest prices in Sydney — if you have a membership, it\'s worth the trip. Independent stations along Parramatta Road and in Fairfield are excellent alternatives. Avoid filling up on the M4 Motorway or M7 service centres where prices are significantly higher than surrounding suburbs.',
  },
  townsville: {
    intro: 'Townsville and North Queensland have real-time fuel pricing from government data. As the largest city in northern Australia, Townsville serves as a fuel hub for travellers heading to Magnetic Island, Mission Beach, and the outback — making price comparison important for both locals and visitors.',
    suburbs: 'Compare prices across Townsville including the CBD, North Ward, South Townsville, Aitkenvale, Cranbrook, Thuringowa, Kirwan, Bohle, Bushland Beach, Deeragun, and surrounding areas including Ayr, Home Hill, and Ingham.',
    trends: 'Townsville fuel prices are typically 5-10 cents higher than Brisbane due to distance from refineries. The most competitive pricing is found along Stuart Drive and Ross River Road where multiple stations compete. CBD and Palmer Street stations tend to charge premiums. Thuringowa and Kirwan have competitive suburban pricing. Prices increase significantly heading west toward Charters Towers and Mount Isa, and north toward Ingham and Cardwell.',
    tips: 'Fill up in Aitkenvale or along Stuart Drive where competition keeps prices low. Before heading to Magnetic Island, fill up in Townsville as island prices are higher. If driving north to Cairns or west to Charters Towers, fill up completely in Townsville — regional prices are significantly more expensive.',
  },
};

const EV_CITY_INTROS = {
  sydney: 'Sydney has one of Australia\'s most extensive EV charging networks, with hundreds of chargers across the CBD, Eastern Suburbs, Northern Beaches, and Western Sydney. From ultra-rapid 350kW chargers at major shopping centres to destination chargers at hotels and restaurants, Sydney EV drivers have plenty of options.',
  melbourne: 'Melbourne\'s EV charging infrastructure is growing rapidly, with chargers throughout the CBD, inner suburbs, and along major arterials. Victoria\'s push for EV adoption means new charging stations are being installed across Melbourne regularly, including in shopping centres, car parks, and along the Great Ocean Road.',
  brisbane: 'Brisbane offers a strong EV charging network spanning the CBD to the outer suburbs. Queensland\'s Electric Super Highway connects Brisbane to Cairns with fast chargers every 150km, making long-distance EV travel increasingly practical from the Sunshine State\'s capital.',
  perth: 'Perth\'s EV charging network is expanding across the metro area, with chargers from Joondalup to Rockingham. Western Australia\'s vast distances make the growing network of fast chargers along major highways particularly important for EV drivers.',
  adelaide: 'Adelaide has a growing network of EV chargers across the city and South Australia. The state\'s high solar adoption makes EV charging particularly cost-effective, with many public chargers powered by renewable energy.',
  'gold-coast': 'The Gold Coast has EV chargers throughout the tourist and residential areas, from Coolangatta to the northern Gold Coast. Many hotels, shopping centres, and attractions now offer EV charging for visitors.',
  canberra: 'Canberra leads Australia in EV adoption rates, and its charging infrastructure reflects this. The ACT has chargers across the city including in government buildings, shopping centres, and residential areas, with plans for significant expansion.',
  hobart: 'Hobart and Tasmania have a growing EV charging network. Key routes around the island are being equipped with fast chargers, making EV travel around Tasmania increasingly practical.',
  darwin: 'Darwin\'s EV charging network is developing, with chargers available in the CBD and surrounding areas. The Northern Territory is working to extend charging along the Stuart Highway to support long-distance EV travel.',
  newcastle: 'Newcastle and the Hunter Valley have a solid EV charging network, with chargers at shopping centres, along the Pacific Highway, and throughout the city. The region\'s growing EV community is driving continued expansion.',
};

// ── FAQ data (19 entries) ───────────────────────────────────────────────
const FAQ_ENTRIES = [
  { q: 'Where does FueVolt get its fuel prices?', a: 'FueVolt pulls real-time fuel prices directly from official Australian government sources. Prices are updated throughout the day as fuel stations report changes.' },
  { q: 'How often are fuel prices updated?', a: 'Fuel prices are updated in real-time as they change throughout the day. Each state has different update frequencies — some update multiple times daily as stations report changes, while others update daily.' },
  { q: 'Which states does FueVolt cover for fuel prices?', a: 'FueVolt currently covers fuel stations across New South Wales, Victoria, Queensland, and Western Australia. We are working to add South Australia, Tasmania, the Northern Territory, and the ACT as government data sources become available.' },
  { q: 'What fuel types can I compare?', a: 'FueVolt lets you compare prices for E10 (ethanol blend), Unleaded 91, Premium 95, Premium 98, Diesel, and LPG. Not all fuel types are available at every station.' },
  { q: 'Why does a station show "Not currently available" for some fuel types?', a: 'This means a price has not been reported for that fuel type at that station. The station may not sell that fuel type, or the price has not been reported yet.' },
  { q: 'Are the fuel prices accurate?', a: 'FueVolt displays prices exactly as reported by official government sources. There can be occasional delays between when a station changes its price and when the data updates, so verify the pump price before purchasing.' },
  { q: 'Where does EV charging station data come from?', a: 'FueVolt displays charging station records from third-party charging datasets, including connector types, power output, and operator information when those details are available.' },
  { q: 'What connector types can I filter by?', a: 'FueVolt supports filtering by Type 2, CCS2, CHAdeMO, and Tesla connectors. You can also filter by charging speed.' },
  { q: 'Is the EV charging data available across all of Australia?', a: 'EV charging station data covers locations across Australia, including regional and remote areas. Coverage and record completeness vary, with the strongest coverage generally in metropolitan areas and along major highways.' },
  { q: 'How does the trip planner work?', a: 'Enter your start and end destinations, and FueVolt calculates a route. The planner shows total distance, estimated drive time, and searches for fuel stations or EV chargers along the route.' },
  { q: 'How does the EV battery forecast work?', a: 'The EV battery forecast uses the route distance plus your entered battery capacity, current charge level, and energy consumption rate to estimate energy use and remaining charge. Suggested stops are based on your entered range and nearby charger data. It does not model temperature, terrain, speed, towing, or driving style.' },
  { q: 'Can I use the trip planner for both fuel and electric vehicles?', a: 'Yes. Fuel mode searches for petrol stations along the route. Electric Vehicle mode searches for charging stations and provides estimated battery usage and suggested stops based on the range you enter.' },
  { q: 'Is FueVolt affiliated with any fuel company or EV charging network?', a: 'No. FueVolt is an independent service and is not affiliated with a fuel company, petrol station chain, or EV charging network.' },
  { q: 'Does FueVolt work on mobile phones?', a: 'Yes. FueVolt is a Progressive Web App (PWA) designed to work on devices with a web browser. On mobile, you can add FueVolt to your home screen for quick access.' },
  { q: 'Does FueVolt track my location?', a: 'FueVolt only accesses your location if you grant permission, and it is used to find nearby fuel stations and EV chargers. You can search by suburb or postcode instead of sharing your location.' },
  { q: 'How can I contact FueVolt?', a: 'You can reach us through our Contact page. We welcome feedback, feature suggestions, and bug reports.' },
  { q: 'What is the fuel price cycle?', a: 'In many Australian cities, fuel prices rise sharply and then gradually fall over the following days or weeks. Comparing current station prices can help you avoid paying more than nearby alternatives, but cycle timing varies and cannot be predicted with certainty.' },
  { q: 'Can I save favourite stations?', a: 'Yes. Tap the star icon on a fuel station or EV charger card to save it as a favourite. Favourites are stored locally in the same browser on your device, and the star remains highlighted when you revisit that station.' },
  { q: 'How does the EV vs Fuel calculator work?', a: 'The basic calculator uses your weekly fuel spend and a disclosed indicative assumption. The advanced calculator uses your weekly distance, vehicle type, fuel price, electricity prices, and home-versus-public charging split. Results are estimates; default prices are indicative rather than live.' },
];

// ── AdSense in-article ad unit ──────────────────────────────────────────
const AD_UNIT_HTML = `
<div style="margin:24px 0;text-align:center;min-height:90px">
<ins class="adsbygoogle" style="display:block;text-align:center" data-ad-layout="in-article" data-ad-format="fluid" data-ad-client="${ADSENSE_PUB_ID}" data-ad-slot="auto"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>`;

function insertAdsInArticle(html) {
  // Insert an ad after every 2nd <h2> section
  const sections = html.split(/<h2/i);
  if (sections.length <= 2) return html;
  const result = [sections[0]];
  for (let i = 1; i < sections.length; i++) {
    result.push('<h2' + sections[i]);
    if (i % 2 === 0 && i < sections.length - 1) {
      result.push(AD_UNIT_HTML);
    }
  }
  return result.join('');
}

// ── Helper: generate page HTML ──────────────────────────────────────────
function generatePage({ urlPath, title, description, h1, content }) {
  let html = template;

  // Replace <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escHtml(title)}</title>`);

  // Replace or add canonical
  if (html.includes('<link rel="canonical"')) {
    html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${BASE_URL}${urlPath}" />`);
  } else {
    html = html.replace('</head>', `  <link rel="canonical" href="${BASE_URL}${urlPath}" />\n  </head>`);
  }

  // Replace meta description
  html = html.replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${escAttr(description)}" />`
  );

  // Replace social metadata
  html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${escAttr(title)}" />`);
  html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${escAttr(description)}" />`);
  html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${BASE_URL}${urlPath}" />`);
  html = html.replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${escAttr(title)}" />`);
  html = html.replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${escAttr(description)}" />`);

  // Replace the seo-fallback content
  const seoStart = html.indexOf('<div id="seo-fallback"');
  const seoEndMarker = '<!-- end seo-fallback -->';
  let seoEnd = html.indexOf(seoEndMarker);
  if (seoEnd === -1) {
    // Find the closing </div> before the script tags
    const scriptTag = html.indexOf('<script>document.getElementById');
    const rootClose = html.lastIndexOf('</div>', scriptTag);
    const rootClose2 = html.lastIndexOf('</div>', rootClose - 1);
    seoEnd = rootClose2;
  }

  if (seoStart !== -1) {
    // Replace everything from seo-fallback div to end marker with our content
    const beforeSeo = html.substring(0, seoStart);
    const afterSeoEnd = seoEnd !== -1 ? html.substring(seoEnd) : html.substring(html.indexOf('</div>\n    </div>\n    <script>'));
    
    const pageContent = `<div id="seo-fallback" style="max-width:900px;margin:0 auto;padding:40px 20px;font-family:Inter,system-ui,sans-serif;color:#0D2B5E">
        <h1 style="font-size:2rem;font-weight:900;margin-bottom:16px">${h1}</h1>
        ${content}
        <footer style="margin-top:32px;padding-top:16px;border-top:1px solid #E5E7EB;font-size:0.85rem;color:#9CA3AF">
          <p>&copy; 2026 FueVolt — Australian EV &amp; Fuel Price Finder</p>
          <p style="margin-top:8px"><a href="/about">About</a> · <a href="/faq">FAQ</a> · <a href="/contact">Contact</a> · <a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a> · <a href="/guides">Guides</a></p>
        </footer>
      </div>`;

    html = beforeSeo + pageContent + afterSeoEnd;
  }

  return html;
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function writePage(urlPath, html) {
  const dir = path.join(DIST, urlPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
  console.log(`  ✓ ${urlPath}`);
}

// ── Collect all URLs for sitemap ────────────────────────────────────────
const sitemapUrls = ['/'];

// ── Generate guide pages ────────────────────────────────────────────────
console.log('Pre-rendering guide pages...');
for (const article of articles) {
  const md = readArticleMarkdown(article.slug);
  if (!md) {
    console.warn(`  ⚠ No markdown found for ${article.slug}`);
    continue;
  }
  let articleHtml = markdownToHtml(md);
  articleHtml = insertAdsInArticle(articleHtml);

  const urlPath = `/guides/${article.slug}`;
  const content = `
        <p style="font-size:0.85rem;color:#6B7280;margin-bottom:4px">${escHtml(article.category)} · ${escHtml(article.readTime)}</p>
        <p style="font-size:0.95rem;color:#4B5563;margin-bottom:24px">${escHtml(article.description)}</p>
        <article style="line-height:1.8;font-size:0.95rem">${articleHtml}</article>
        <p style="margin-top:24px"><a href="/guides">← Back to all guides</a></p>`;

  const html = generatePage({
    urlPath,
    title: `${article.title} | FueVolt`,
    description: article.description,
    h1: escHtml(article.title),
    content,
  });
  writePage(urlPath, html);
  sitemapUrls.push(urlPath);
}

// ── Generate guides index page ──────────────────────────────────────────
console.log('Pre-rendering guides index...');
{
  const guideList = articles
    .map(
      (a) =>
        `<div style="margin-bottom:16px;padding:16px;border:1px solid #E5E7EB;border-radius:12px">
          <h2 style="font-size:1.1rem;margin-bottom:4px"><a href="/guides/${a.slug}" style="color:#C8971F;text-decoration:none">${escHtml(a.title)}</a></h2>
          <p style="font-size:0.85rem;color:#6B7280">${escHtml(a.category)} · ${escHtml(a.readTime)}</p>
          <p style="font-size:0.9rem;color:#4B5563;margin-top:8px">${escHtml(a.description)}</p>
        </div>`
    )
    .join('\n');

  const html = generatePage({
    urlPath: '/guides',
    title: 'Guides & Articles — Fuel, EV Charging & Driving Tips | FueVolt',
    description:
      'Expert guides on fuel types, EV charging connectors, octane ratings, saving money on fuel, road trip planning, and electric vehicle tips for Australian drivers.',
    h1: 'Guides &amp; Articles',
    content: `<p style="font-size:0.95rem;color:#4B5563;margin-bottom:24px">Expert guides on fuel types, EV charging, saving money, and driving in Australia.</p>${guideList}`,
  });
  writePage('/guides', html);
  sitemapUrls.push('/guides');
}

// ── Generate fuel city pages ────────────────────────────────────────────
console.log('Pre-rendering fuel city pages...');
for (const city of FUEL_CITIES) {
  const cityData = FUEL_CITY_CONTENT[city.slug] || {};
  const intro = cityData.intro || `Compare real-time fuel prices in ${city.name} and surrounding areas.`;
  const suburbs = cityData.suburbs || '';
  const trends = cityData.trends || '';
  const tips = cityData.tips || '';
  const urlPath = `/fuel-prices/${city.slug}`;
  const content = `
        <p style="font-size:0.95rem;color:#4B5563;margin-bottom:16px">${escHtml(intro)}</p>
        ${suburbs ? `<h2 style="font-size:1.3rem;margin:20px 0 12px">Suburbs &amp; Areas Covered</h2><p style="font-size:0.9rem;color:#4B5563;margin-bottom:16px">${escHtml(suburbs)}</p>` : ''}
        <h2 style="font-size:1.3rem;margin:20px 0 12px">Fuel Types Available in ${escHtml(city.name)}</h2>
        <ul style="margin-bottom:16px;padding-left:20px;line-height:2">
          <li><strong>E10 (Ethanol Blend)</strong> — typically the cheapest option, suitable for most cars manufactured after 2000</li>
          <li><strong>Unleaded 91 (U91)</strong> — standard unleaded petrol, the baseline grade</li>
          <li><strong>Premium 95 (U95)</strong> — recommended for many modern and European engines</li>
          <li><strong>Premium 98 (U98)</strong> — highest octane for performance and turbocharged vehicles</li>
          <li><strong>Diesel</strong> — for diesel engines, SUVs, utes and trucks</li>
          <li><strong>LPG</strong> — liquefied petroleum gas, cheapest per litre but limited availability</li>
        </ul>
        ${trends ? `<h2 style="font-size:1.3rem;margin:20px 0 12px">Price Trends in ${escHtml(city.name)}</h2><p style="font-size:0.9rem;color:#4B5563;margin-bottom:16px">${escHtml(trends)}</p>` : ''}
        ${tips ? `<h2 style="font-size:1.3rem;margin:20px 0 12px">Tips to Save on Fuel in ${escHtml(city.name)}</h2><p style="font-size:0.9rem;color:#4B5563;margin-bottom:16px">${escHtml(tips)}</p>` : ''}
        <p style="margin-top:16px"><a href="/fuel-prices">← Compare fuel prices in all cities</a></p>`;

  const html = generatePage({
    urlPath,
    title: `Fuel Prices in ${city.name} — Compare Petrol & Diesel | FueVolt`,
    description: `Compare real-time fuel prices in ${city.name}. Find the cheapest E10, Unleaded 91, Premium 95, Premium 98, Diesel and LPG near you with FueVolt.`,
    h1: `Fuel Prices in ${escHtml(city.name)}`,
    content,
  });
  writePage(urlPath, html);
  sitemapUrls.push(urlPath);
}

// ── Generate EV city pages ──────────────────────────────────────────────
console.log('Pre-rendering EV charging city pages...');
for (const city of EV_CITIES) {
  const intro = EV_CITY_INTROS[city.slug] || `Find EV charging stations in ${city.name} and surrounding areas.`;
  const urlPath = `/ev-charging/${city.slug}`;
  const content = `
        <p style="font-size:0.95rem;color:#4B5563;margin-bottom:16px">${escHtml(intro)}</p>
        <h2 style="font-size:1.3rem;margin-bottom:12px">Connector Types in ${escHtml(city.name)}</h2>
        <ul style="margin-bottom:16px;padding-left:20px;line-height:2">
          <li>Type 2 — most common AC connector in Australia, used for destination and home charging (up to 22kW)</li>
          <li>CCS2 (Combined Charging System) — the standard for DC fast charging (50kW to 350kW)</li>
          <li>CHAdeMO — older DC fast charging standard, used by Nissan Leaf and some Mitsubishi models</li>
          <li>Tesla — Tesla's proprietary connector, available at Tesla Supercharger and Destination locations</li>
        </ul>
        <h2 style="font-size:1.3rem;margin-bottom:12px">Charging Speeds</h2>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px">Filter ${escHtml(city.name)} chargers by speed: <strong>Slow</strong> (up to 7kW, ideal for overnight charging), <strong>Fast</strong> (7-50kW, adds range in 1-2 hours), or <strong>Ultra-Rapid</strong> (50kW+, 80% charge in 20-40 minutes).</p>
        <p style="margin-top:16px"><a href="/ev-charging">← Find EV chargers in all cities</a></p>`;

  const html = generatePage({
    urlPath,
    title: `EV Charging Stations in ${city.name} — Find Chargers | FueVolt`,
    description: `Find EV charging stations in ${city.name}. Filter by connector type (Type 2, CCS2, CHAdeMO, Tesla) and charging speed. Charger finder for Australian EV drivers.`,
    h1: `EV Charging Stations in ${escHtml(city.name)}`,
    content,
  });
  writePage(urlPath, html);
  sitemapUrls.push(urlPath);
}

// ── Generate static pages ───────────────────────────────────────────────
console.log('Pre-rendering static pages...');

// About
writePage('/about', generatePage({
  urlPath: '/about',
  title: 'About FueVolt — Australian Fuel & EV Comparison Service',
  description: 'Learn about FueVolt, our mission to help Australian drivers save on fuel, and how we compare fuel prices and EV charging stations across Australia.',
  h1: 'About FueVolt',
  content: `
        <p style="font-size:0.95rem;color:#4B5563;margin-bottom:16px">FueVolt is an Australian service that helps drivers find the cheapest fuel and locate EV charging stations across the country. We compare real-time petrol, diesel, and LPG prices from official government sources across New South Wales, Victoria, Queensland, and Western Australia.</p>
        <h2 style="font-size:1.3rem;margin-bottom:12px">What We Do</h2>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px"><strong>Real-Time Fuel Prices:</strong> Live fuel prices updated throughout the day from official Australian government sources. Compare E10, Unleaded 91, Premium 95, Premium 98, Diesel, and LPG across thousands of stations.</p>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px"><strong>EV Charging Finder:</strong> Find thousands of EV charging stations across all of Australia. Filter by connector type (Type 2, CCS2, CHAdeMO, Tesla) and charging speed (slow, fast, ultra-rapid).</p>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px"><strong>Trip Planner:</strong> Plan road trips with fuel stops and EV chargers along your route. For electric vehicles, get battery forecasts and recommended charging stops based on your vehicle's range.</p>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px"><strong>EV vs Fuel Calculator:</strong> Estimate how much you could save by switching to an electric vehicle based on your driving habits and electricity costs.</p>
        <h2 style="font-size:1.3rem;margin:20px 0 12px">Coverage</h2>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px">Fuel price coverage: New South Wales, Victoria, Queensland, and Western Australia. EV charging data covers all of Australia. We are working to expand fuel price coverage to South Australia, Tasmania, the Northern Territory, and the ACT.</p>
        <h2 style="font-size:1.3rem;margin:20px 0 12px">Independent</h2>
        <p style="font-size:0.9rem;color:#4B5563">FueVolt is an independent service and not affiliated with any fuel company, petrol station chain, or EV charging network. We provide unbiased information to help Australians make informed decisions.</p>
        <p style="margin-top:16px"><strong>Contact:</strong> Have feedback or a question? Use our <a href="/contact">contact form</a> to get in touch.</p>`,
}));
sitemapUrls.push('/about');

// Contact
writePage('/contact', generatePage({
  urlPath: '/contact',
  title: 'Contact & Feedback — FueVolt',
  description: 'Get in touch with FueVolt. Send feedback, feature requests, or report an issue using our contact form.',
  h1: 'Contact Us',
  content: `
        <p style="font-size:0.95rem;color:#4B5563;margin-bottom:16px">Have feedback, a feature request, or found an issue? We would love to hear from you. Fill in the form on this page and we will take a look.</p>
        <p style="font-size:0.9rem;color:#4B5563">Enter your name, an optional email address so we can reply, and your message. Once you submit, you will see a confirmation that your feedback has been received.</p>`,
}));
sitemapUrls.push('/contact');

// FAQ (19 entries)
const faqHtml = FAQ_ENTRIES.map(
  (faq) =>
    `<div style="margin-bottom:12px;padding:12px 16px;border:1px solid #E5E7EB;border-radius:8px">
          <h3 style="font-size:0.95rem;font-weight:600;margin-bottom:6px">${escHtml(faq.q)}</h3>
          <p style="font-size:0.9rem;color:#4B5563">${escHtml(faq.a)}</p>
        </div>`
).join('\n');

writePage('/faq', generatePage({
  urlPath: '/faq',
  title: 'Frequently Asked Questions — FueVolt',
  description: 'Common questions about FueVolt — fuel prices, EV charging, trip planner, and how to save money on fuel in Australia.',
  h1: 'Frequently Asked Questions',
  content: `<p style="font-size:0.95rem;color:#4B5563;margin-bottom:24px">Everything you need to know about using FueVolt to find cheap fuel and EV chargers in Australia.</p>${faqHtml}<p style="margin-top:24px">Still have questions? Use our <a href="/contact">contact form</a> to get in touch.</p>`,
}));
sitemapUrls.push('/faq');

// Privacy
writePage('/privacy', generatePage({
  urlPath: '/privacy',
  title: 'Privacy Policy | FueVolt',
  description: 'FueVolt Privacy Policy — how we handle your data, location information, and what third-party services we use.',
  h1: 'Privacy Policy',
  content: `
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px"><strong>Last updated:</strong> June 2026</p>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px">FueVolt ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our website and services.</p>
        <h2 style="font-size:1.2rem;margin:20px 0 8px">Information We Collect</h2>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:8px"><strong>Location Data:</strong> Only when you grant permission. Used solely to find nearby fuel stations and EV chargers. Never stored, sold, or shared.</p>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:8px"><strong>Usage Data:</strong> Anonymous analytics to improve the service. No personal accounts or login required.</p>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:8px"><strong>Local Storage:</strong> Favourites, preferences, and geofence alerts stored locally on your device only.</p>
        <h2 style="font-size:1.2rem;margin:20px 0 8px">Third-Party Services</h2>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:8px">FueVolt uses third-party APIs and services to provide its functionality. For full details, please review the complete Privacy Policy on this page.</p>
        <h2 style="font-size:1.2rem;margin:20px 0 8px">Contact</h2>
        <p style="font-size:0.9rem;color:#4B5563">For privacy enquiries, please use our <a href="/contact">contact form</a>.</p>`,
}));
sitemapUrls.push('/privacy');

// Terms
writePage('/terms', generatePage({
  urlPath: '/terms',
  title: 'Terms of Service | FueVolt',
  description: 'Terms of Service for using FueVolt — Australian fuel price comparison and EV charging station finder.',
  h1: 'Terms of Service',
  content: `
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px"><strong>Last updated:</strong> June 2026</p>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px">By using FueVolt ("the Service"), you agree to these Terms of Service. FueVolt is a fuel price comparison and EV charging station finder for Australian drivers.</p>
        <h2 style="font-size:1.2rem;margin:20px 0 8px">Use of Service</h2>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:8px">FueVolt provides fuel price data from official Australian government sources and EV charging station data. Prices and station information are provided as-is and may not reflect real-time conditions at every station.</p>
        <h2 style="font-size:1.2rem;margin:20px 0 8px">Accuracy Disclaimer</h2>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:8px">While we strive for accuracy, fuel prices can change at any time. Always verify the price at the pump. FueVolt is not liable for discrepancies between displayed prices and actual prices.</p>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:8px">For full Terms of Service, please review the complete terms on this page.</p>
        <h2 style="font-size:1.2rem;margin:20px 0 8px">Contact</h2>
        <p style="font-size:0.9rem;color:#4B5563">For enquiries, please use our <a href="/contact">contact form</a>.</p>`,
}));
sitemapUrls.push('/terms');

// Fuel prices index
writePage('/fuel-prices', generatePage({
  urlPath: '/fuel-prices',
  title: 'Fuel Prices Near Me — Compare Petrol, Diesel & LPG | FueVolt',
  description: 'Compare real-time E10, U91, U95, U98, diesel and LPG prices from official Australian government sources. Find the cheapest fuel station near you.',
  h1: 'Compare Fuel Prices Across Australia',
  content: `
        <p style="font-size:0.95rem;color:#4B5563;margin-bottom:16px">Search by suburb, city or postcode to find fuel prices near you — or tap Use My Location. FueVolt compares real-time fuel prices from official government sources across NSW, VIC, QLD, and WA.</p>
        <h2 style="font-size:1.3rem;margin-bottom:12px">Fuel Prices by City</h2>
        <ul style="padding-left:20px;line-height:2.2">${FUEL_CITIES.map(c => `<li><a href="/fuel-prices/${c.slug}">${c.name} Fuel Prices</a></li>`).join('')}</ul>`,
}));
sitemapUrls.push('/fuel-prices');

// EV charging index
writePage('/ev-charging', generatePage({
  urlPath: '/ev-charging',
  title: 'EV Charging Stations Near Me — Find Fast Chargers | FueVolt',
  description: 'Locate EV charging stations across Australia. Filter by connector type (Type 2, CCS, CHAdeMO, Tesla) and charging speed.',
  h1: 'EV Charging Stations Across Australia',
  content: `
        <p style="font-size:0.95rem;color:#4B5563;margin-bottom:16px">Find EV charging stations near you. Filter by connector type and charging speed. Coverage and record completeness vary by location.</p>
        <h2 style="font-size:1.3rem;margin-bottom:12px">EV Chargers by City</h2>
        <ul style="padding-left:20px;line-height:2.2">${EV_CITIES.map(c => `<li><a href="/ev-charging/${c.slug}">${c.name} EV Chargers</a></li>`).join('')}</ul>`,
}));
sitemapUrls.push('/ev-charging');

// EV vs Fuel calculator
writePage('/ev-vs-fuel', generatePage({
  urlPath: '/ev-vs-fuel',
  title: 'EV vs Fuel Calculator — Compare Running Costs | FueVolt',
  description: 'Calculate how much you could save by switching from petrol or diesel to an electric vehicle. Compare weekly and annual fuel vs EV charging costs.',
  h1: 'EV vs Fuel Cost Calculator',
  content: `
        <p style="font-size:0.95rem;color:#4B5563;margin-bottom:16px">Compare the running costs of petrol/diesel vehicles against electric vehicles. Enter your weekly fuel spend or driving distance to see potential savings.</p>
        <h2 style="font-size:1.3rem;margin-bottom:12px">How It Works</h2>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px"><strong>Basic Mode:</strong> Enter your weekly fuel spend and see an instant estimate of EV savings.</p>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px"><strong>Advanced Mode:</strong> Enter your weekly driving distance, vehicle type (small car, sedan, SUV, ute), fuel type, electricity cost per kWh, and home vs public charging percentage for a more accurate estimate.</p>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px">The calculator shows estimated weekly savings, annual savings, and CO2 reduction. Note: these are estimates based on average consumption figures and may vary based on your specific vehicle and driving conditions.</p>`,
}));
sitemapUrls.push('/ev-vs-fuel');

// Trip planner
writePage('/trip-planner', generatePage({
  urlPath: '/trip-planner',
  title: 'Trip Planner — Route with Fuel Stops & EV Chargers | FueVolt',
  description: 'Plan your Australian road trip with fuel stops and EV charging stations along the route. Get drive time estimates and EV battery forecasts.',
  h1: 'Trip Planner',
  content: `
        <p style="font-size:0.95rem;color:#4B5563;margin-bottom:16px">Plan your road trip with fuel stations and EV chargers along your route. Enter your start and destination to calculate the best route with estimated drive time, distance, and recommended stops.</p>
        <h2 style="font-size:1.3rem;margin-bottom:12px">Features</h2>
        <ul style="padding-left:20px;line-height:2">
          <li><strong>Fuel Mode:</strong> Find petrol stations along your route with current prices</li>
          <li><strong>EV Mode:</strong> Find charging stations with battery forecast and recommended charging stops</li>
          <li><strong>Battery Forecast:</strong> See estimated battery level at each waypoint based on your EV's range</li>
          <li><strong>Drive Time:</strong> Real-time drive time estimates including traffic conditions</li>
        </ul>`,
}));
sitemapUrls.push('/trip-planner');

// Alerts / Notifications
writePage('/alerts', generatePage({
  urlPath: '/alerts',
  title: 'Fuel & EV Alerts — Price Drops & Nearby Stations | FueVolt',
  description: 'Set alerts for fuel stations and EV chargers. Get notified when you are near a saved station.',
  h1: 'Alerts &amp; Notifications',
  content: `
        <p style="font-size:0.95rem;color:#4B5563;margin-bottom:16px">Set up proximity alerts for your favourite fuel stations and EV chargers. FueVolt can notify you when you are near a saved station.</p>`,
}));
sitemapUrls.push('/alerts');

// ── Generate sitemap.xml ────────────────────────────────────────────────
console.log('Generating sitemap.xml...');
const today = new Date().toISOString().split('T')[0];
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls
  .map(
    (url) =>
      `  <url>
    <loc>${BASE_URL}${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url === '/' ? 'daily' : url.startsWith('/guides/') ? 'monthly' : 'weekly'}</changefreq>
    <priority>${url === '/' ? '1.0' : url.startsWith('/fuel-prices/') || url.startsWith('/ev-charging/') ? '0.8' : url.startsWith('/guides/') ? '0.7' : '0.6'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemapXml, 'utf-8');
console.log(`  ✓ sitemap.xml (${sitemapUrls.length} URLs)`);

// ── Generate robots.txt ─────────────────────────────────────────────────
console.log('Generating robots.txt...');
const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
fs.writeFileSync(path.join(DIST, 'robots.txt'), robotsTxt, 'utf-8');
console.log('  ✓ robots.txt');

console.log(`\nPre-rendering complete! ${sitemapUrls.length} pages generated.`);
