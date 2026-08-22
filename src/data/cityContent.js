// Shared per-city content — single source of truth for both scripts/prerender.js
// (static HTML for non-JS crawlers) and the live React pages (FuelPricePage,
// EVChargingPage), so the rich content Google indexes is the same content
// real visitors actually see after hydration.
//
// Every claim here is either a well-documented, publicly verifiable fact
// (a named government pricing scheme, a real geographic/market
// characteristic) or a general statement true of fuel/EV markets broadly.
// Nothing here is a specific invented statistic, a claim about a named
// business, or a per-city "cheapest day" — those require real data, which
// is what the live snapshot block (station counts, price ranges) sourced
// from scripts/fetch-city-stats.mjs provides instead.

export const FUEL_CITY_CONTENT = {
  sydney: {
    intro: 'Sydney fuel prices are reported in real time through the NSW Government\'s FuelCheck scheme, which requires every station in the state to publish its prices. Prices vary between suburbs, and comparing before you fill up is the most reliable way to avoid overpaying.',
    suburbs: 'FueVolt compares prices across the Greater Sydney area including Parramatta, Penrith, Liverpool, Blacktown, Campbelltown, Bankstown, Hornsby, Chatswood, Bondi, Manly, the Northern Beaches, Canterbury, Sutherland, Cronulla, and the Hills District.',
    trends: 'Like most Australian capital cities, Sydney fuel prices move in cycles — the ACCC publishes ongoing analysis of these cycles for Sydney and the other largest cities. Rather than guessing where the current cycle sits, check FueVolt for today\'s reported prices, or see FueVolt\'s price-history and best-time-to-fill-up tools on each station\'s page.',
    tips: 'Compare prices across nearby suburbs before you fill up — Sydney\'s size means a short drive can lead to a meaningfully cheaper station. Stations directly on major motorways and near the airport are generally more expensive than suburban alternatives just a few minutes away, which is a common pattern at busy, high-traffic locations everywhere.',
  },
  melbourne: {
    intro: 'Melbourne fuel prices are reported through Victoria\'s government fuel price data service. As with other Australian capitals, prices move in cycles rather than staying flat, so checking current prices before you fill up is worth the minute it takes.',
    suburbs: 'FueVolt tracks prices across Melbourne suburbs including Dandenong, Footscray, Werribee, Ringwood, Frankston, Cranbourne, Broadmeadows, Sunshine, Essendon, Brunswick, Preston, Box Hill, Glen Waverley, Mornington, Geelong Road corridor, and the outer growth suburbs of Craigieburn and Pakenham.',
    trends: 'Melbourne is one of the cities the ACCC tracks for its ongoing petrol price cycle analysis, confirming that prices rise and fall in a repeating pattern rather than staying static. See each station\'s page on FueVolt for its own price history and the best-time-to-fill-up estimate, built from that documented cycle pattern.',
    tips: 'Compare prices between suburbs rather than filling up at the first station you pass — outer and industrial-area stations are often cheaper than inner-city ones. As with most cities, inner-CBD stations tend to carry a premium over suburban alternatives just a short drive away.',
  },
  brisbane: {
    intro: 'Queensland operates a government-mandated fuel price transparency scheme, requiring every station to report its prices, which is the same official data FueVolt displays for Brisbane. This makes price comparison across Greater Brisbane straightforward and reliable.',
    suburbs: 'FueVolt shows real-time pricing for every servo in the region, from the Brisbane CBD to Ipswich, Logan, Redlands, Moreton Bay, Caboolture, Redcliffe, Chermside, Mt Gravatt, Carindale, Wynnum, and Springfield. Outer suburbs like Beaudesert, Jimboomba, and Samford also covered.',
    trends: 'Brisbane fuel prices, like other Australian capitals, follow a cycle of gradual declines punctuated by sharp increases, though Queensland does not operate a fixed weekly pattern the way Western Australia\'s regulated system does. Checking FueVolt regularly is the most reliable way to catch prices near the bottom of the current cycle.',
    tips: 'Compare prices before you fill up — the price difference between nearby stations can be significant. Stations directly on motorway service centres (the Ipswich and Logan Motorways, for example) tend to charge more than suburban stations just off the highway, a pattern common to motorway services generally.',
  },
  perth: {
    intro: 'Perth uses a distinctive government-regulated system called FuelWatch. Stations are required to lock in their next day\'s price by 2pm the day before, so tomorrow\'s prices are published today — making Perth one of the more predictable Australian cities for planning a fill-up in advance.',
    suburbs: 'Compare prices across Perth from Joondalup to Rockingham, Midland to Fremantle, Armadale to Scarborough, Wanneroo, Morley, Cannington, Victoria Park, Osborne Park, Balcatta, Canning Vale, and the outer suburbs of Mandurah, Ellenbrook, and Butler.',
    trends: 'Because FuelWatch requires stations to set tomorrow\'s price by 2pm today, Perth\'s pricing is unusually predictable compared to other Australian capitals — you can check FueVolt this evening to see tomorrow\'s prices already locked in, rather than waiting to find out at the pump.',
    tips: 'Check FueVolt the evening before you plan to fill up, since Perth\'s FuelWatch prices for the next day are already set by 2pm today. As in most cities, highway service stations tend to sit above suburban prices, so a short detour off the freeway is often worth it.',
  },
  adelaide: {
    intro: 'FueVolt does not yet have a live government fuel-pricing feed for South Australia, so Adelaide station listings currently rely on location data rather than real-time prices. We\'re working to add a live SA price source as one becomes available through FueVolt\'s existing integrations.',
    suburbs: 'FueVolt coverage is expanding across Adelaide including the CBD, North Adelaide, Port Adelaide, Glenelg, Marion, Salisbury, Elizabeth, Modbury, Norwood, Unley, Prospect, Reynella, Morphett Vale, and Mount Barker.',
    trends: 'Without a live SA government price feed, FueVolt can\'t yet show Adelaide\'s current price cycle position the way it can for NSW, VIC, QLD and WA. In the meantime, comparing prices at the pump across a few nearby stations remains the most reliable way to find the cheapest option.',
    tips: 'Until live SA pricing is available on FueVolt, compare prices visually across a few nearby stations before filling up. As in other cities, stations in high-traffic tourist or event precincts tend to charge more than suburban alternatives.',
  },
  'gold-coast': {
    intro: 'The Gold Coast is covered by Queensland\'s government fuel price transparency scheme, the same official data source FueVolt uses across South East Queensland. As a major tourist destination, prices at beachfront and tourist-strip stations can differ noticeably from suburban ones further inland.',
    suburbs: 'Compare prices from Coolangatta to Helensvale, Surfers Paradise to Robina, Broadbeach, Southport, Burleigh Heads, Palm Beach, Nerang, Mudgeeraba, Coomera, Oxenford, Varsity Lakes, and Tweed Heads just across the NSW border.',
    trends: 'Gold Coast prices generally follow the same cycle pattern seen across South East Queensland. Tourist-strip stations near major attractions and the beachfront tend to sit above suburban prices further inland, which is typical of tourist-destination fuel markets generally.',
    tips: 'If you\'re visiting the Gold Coast, comparing prices on FueVolt before you arrive can help you avoid overpaying at tourist-strip stations. For locals, suburban stations further from the beachfront and major attractions are generally more competitively priced.',
  },
  canberra: {
    intro: 'Canberra has fewer fuel stations than comparably sized Australian cities, which can mean less price competition. FueVolt is expanding live ACT price coverage; in the meantime, nearby NSW border stations with real-time FuelCheck pricing are already available.',
    suburbs: 'ACT coverage is expanding on FueVolt. Nearby NSW stations with live pricing are already available, including Queanbeyan, Fyshwick, Belconnen, Woden, Tuggeranong, Gungahlin, Mitchell, Hume, Kingston, and Majura Park.',
    trends: 'With a smaller number of stations than larger cities, Canberra\'s fuel market can behave differently to the sharp cycles seen in Sydney or Melbourne. Comparing prices across suburbs — including nearby Queanbeyan — is the most reliable way to find the best price.',
    tips: 'Compare Canberra prices against nearby Queanbeyan, since cross-border price differences do occur. Checking FueVolt before you fill up is worthwhile in any market with fewer competing stations.',
  },
  newcastle: {
    intro: 'Newcastle and the Hunter Valley are covered by the NSW Government\'s FuelCheck scheme, the same real-time official data source used across NSW. As a major regional centre, Newcastle has a reasonable number of competing fuel retailers.',
    suburbs: 'Compare prices across Charlestown, Maitland, Lake Macquarie, Cessnock, Raymond Terrace, Nelson Bay, Toronto, Warners Bay, Adamstown, Hamilton, Wallsend, Mayfield, Merewether, Lambton, Jesmond, and the broader Hunter Valley region.',
    trends: 'Newcastle sits within the same NSW-wide FuelCheck network as Sydney, so the same cycle-tracking approach applies — check FueVolt regularly rather than assuming a fixed weekly pattern, since cycles shift over time.',
    tips: 'Compare prices across Newcastle and the wider Hunter before you fill up. Tourist-area stations, such as those near the Hunter Valley wine region, tend to charge more than stations in Newcastle\'s main suburbs — a pattern typical of tourist destinations generally.',
  },
  wollongong: {
    intro: 'Wollongong and the Illawarra region are covered by the NSW Government\'s FuelCheck scheme. As a compact regional city with several competing stations, comparing prices before you fill up is worthwhile.',
    suburbs: 'Find cheap petrol from Helensburgh to Kiama, including Wollongong CBD, Shellharbour, Warrawong, Dapto, Unanderra, Corrimal, Thirroul, Fairy Meadow, Figtree, Berkeley, Albion Park, Gerringong, and the Shoalhaven region down to Nowra.',
    trends: 'Wollongong sits within the same NSW-wide FuelCheck network as Sydney, so prices are reported in real time across the region. Check FueVolt regularly to see where current prices sit, rather than relying on a fixed pattern.',
    tips: 'Compare prices along your regular route before filling up. As station density drops heading further south toward Kiama and the Shoalhaven, it\'s worth topping up in Wollongong or Shellharbour before a longer trip south.',
  },
  hobart: {
    intro: 'Hobart is covered on FueVolt via the same NSW-linked government pricing network that also carries Tasmanian data. Tasmania\'s fuel typically costs somewhat more than mainland capitals, reflecting the added cost of shipping fuel to the island.',
    suburbs: 'FueVolt covers Hobart including the CBD, Sandy Bay, Glenorchy, Moonah, Kingston, Bellerive, Rosny Park, Claremont, New Town, Lindisfarne, and surrounding areas. Regional Tasmanian towns including Launceston, Devonport, Burnie, and Ulverstone are also covered.',
    trends: 'Hobart\'s smaller fuel market, with fewer competing stations than mainland capitals, tends to see less dramatic price swings than cities like Sydney or Melbourne. Comparing prices across nearby suburbs remains the most reliable way to find the best price.',
    tips: 'Compare prices before filling up, even in a smaller market like Hobart — some price variation between stations is still common. For trips around Tasmania, fill up in major towns where competition keeps prices more reasonable, since smaller rural stations can charge more.',
  },
  darwin: {
    intro: 'Darwin does not yet have a live government fuel-pricing feed on FueVolt, so listings currently rely on location data rather than real-time prices. Fuel prices in the Northern Territory are generally higher than in southern capitals, reflecting the cost of supplying a remote, sparsely populated region.',
    suburbs: 'FueVolt is expanding coverage across Darwin including the CBD, Stuart Park, Fannie Bay, Parap, Winnellie, Berrimah, Palmerston, Howard Springs, Humpty Doo, and the rural areas along the Stuart Highway.',
    trends: 'Without a live NT government price feed, FueVolt can\'t yet show Darwin\'s current price cycle position. Comparing prices at the pump across Darwin and Palmerston remains the most reliable way to find the cheapest option in the meantime.',
    tips: 'Compare prices where you can before filling up in Darwin. If you\'re heading south along the Stuart Highway, fill up in Darwin or Palmerston first, since remote regional stations along the route typically charge a premium reflecting their higher supply costs.',
  },
  geelong: {
    intro: 'Geelong is covered by Victoria\'s government fuel price data service, the same source FueVolt uses across the state. As Victoria\'s second-largest city, Geelong has a reasonable number of competing fuel retailers.',
    suburbs: 'Compare prices across Geelong, Bellarine Peninsula, the Surf Coast, Lara, Corio, Norlane, North Geelong, Newtown, Highton, Waurn Ponds, Leopold, Ocean Grove, Queenscliff, Torquay, and the surrounding Barwon region.',
    trends: 'Geelong sits within the same Victoria-wide pricing network as Melbourne, so prices move in the cycles the ACCC documents for Victorian capitals. Check FueVolt regularly to see current prices rather than assuming a fixed pattern.',
    tips: 'Compare prices before filling up, particularly around the Bellarine Peninsula and Surf Coast, where tourist-area stations near Torquay and Queenscliff tend to charge more than stations in central Geelong — a pattern typical of coastal tourist strips generally.',
  },
  toowoomba: {
    intro: 'Toowoomba is covered by Queensland\'s government fuel price transparency scheme. As the Darling Downs\' major centre, Toowoomba serves as a refuelling stop for regional drivers travelling across south-western Queensland.',
    suburbs: 'Find the cheapest fuel across Toowoomba including the CBD, Highfields, Rangeville, Newtown, Darling Heights, Harristown, Wilsonton, Kearneys Spring, Drayton, and surrounding rural areas including Gatton, Laidley, and Dalby.',
    trends: 'Regional Queensland fuel prices tend to run somewhat higher than Brisbane, reflecting the added cost of transport to inland centres. Comparing prices before you fill up remains worthwhile even in a smaller regional market.',
    tips: 'If you\'re heading further west into rural Queensland, fill up in Toowoomba first — regional stations further from major centres typically charge more, reflecting lower competition and higher supply costs, a pattern common to remote fuel markets generally.',
  },
  cairns: {
    intro: 'Cairns and Far North Queensland are covered by Queensland\'s government fuel price transparency scheme. As a regional centre and major tourist destination, comparing prices before you fill up is worthwhile, particularly around tourist precincts.',
    suburbs: 'Compare prices from Smithfield to Edmonton, Palm Cove to Gordonvale, Cairns CBD, Manunda, Manoora, Parramatta Park, Earlville, Woree, White Rock, Mount Sheridan, Trinity Beach, and surrounding areas including Atherton Tablelands, Innisfail, and Port Douglas.',
    trends: 'Far North Queensland fuel prices tend to run higher than Brisbane, reflecting transport distance. Tourist-area stations, particularly around the Cairns Esplanade and Port Douglas, tend to charge more than suburban alternatives, which is typical of major tourist destinations.',
    tips: 'If you\'re heading to Port Douglas or other tourist areas, fill up in Cairns\' suburban stations first where competition tends to be stronger. For trips to the Atherton Tablelands, compare prices on FueVolt before setting off.',
  },
  ballarat: {
    intro: 'Ballarat is covered by Victoria\'s government fuel price data service. As one of Victoria\'s larger regional cities, Ballarat has a reasonable number of competing fuel retailers.',
    suburbs: 'Compare petrol and diesel across the Ballarat region, including the CBD, Wendouree, Delacombe, Buninyong, Sebastopol, Alfredton, Lucas, Canadian, Mount Helen, Creswick, Daylesford, and surrounding Goldfields communities.',
    trends: 'Ballarat sits within the same Victoria-wide pricing network as Melbourne. Regional Victorian prices generally run a little higher than Melbourne\'s, reflecting transport distance, though the pattern varies over time — check FueVolt for current prices rather than a fixed assumption.',
    tips: 'Compare prices across Ballarat before filling up. Tourist-area stations around Daylesford and Hepburn Springs tend to charge more, particularly on weekends, which is typical of small tourist towns generally.',
  },
  bendigo: {
    intro: 'Bendigo is covered by Victoria\'s government fuel price data service, giving drivers across Greater Bendigo and the Goldfields region access to live pricing data.',
    suburbs: 'Find cheap fuel across Greater Bendigo including the CBD, Kangaroo Flat, Eaglehawk, Strathfieldsaye, Epsom, Huntly, Golden Square, Long Gully, Maiden Gully, and surrounding towns including Castlemaine, Kyneton, and Heathcote.',
    trends: 'Bendigo sits within the same Victoria-wide pricing network as Melbourne. As with other regional Victorian centres, prices can run a little higher than Melbourne\'s — check FueVolt for current prices in your area rather than a fixed assumption.',
    tips: 'Compare prices across Bendigo before filling up. Smaller surrounding towns like Castlemaine and Heathcote generally have less station competition than Bendigo itself, so it\'s often worth filling up in the city before a trip to the smaller surrounding towns.',
  },
  launceston: {
    intro: 'Launceston is covered on FueVolt via the same government pricing network that also carries NSW data. Northern Tasmania, like Hobart, typically sees somewhat higher prices than mainland capitals, reflecting the cost of shipping fuel to the island.',
    suburbs: 'FueVolt covers Launceston including the CBD, Mowbray, Kings Meadows, Riverside, Prospect, Newstead, Invermay, South Launceston, Youngtown, and surrounding areas including Longford, Perth (TAS), and George Town.',
    trends: 'Launceston\'s fuel market is smaller than Hobart\'s, with fewer competing stations. Comparing prices across nearby suburbs remains the most reliable way to find the best price in a smaller regional market.',
    tips: 'Fill up in Launceston before heading into rural northern Tasmania, where stations are more sparsely spread and typically charge more — a pattern common to remote regional areas generally.',
  },
  'sunshine-coast': {
    intro: 'The Sunshine Coast is covered by Queensland\'s government fuel price transparency scheme, the same official data source used across South East Queensland. As a popular tourist destination, prices can vary between tourist-strip and suburban stations.',
    suburbs: 'Compare prices from Caloundra to Noosa, Maroochydore to Nambour, Mooloolaba, Buderim, Kawana Waters, Sippy Downs, Palmwoods, Eumundi, Coolum Beach, Bli Bli, Beerwah, Glass House Mountains, and Maleny.',
    trends: 'Sunshine Coast prices generally follow the same cycle pattern seen across South East Queensland. Tourist-strip stations in beachfront precincts like Noosa and Mooloolaba tend to charge more than stations further inland — typical of coastal tourist destinations generally.',
    tips: 'Compare prices before heading to the beach — beachside stations in tourist precincts tend to charge more than suburban alternatives just inland. Checking FueVolt before you set off can help you avoid the premium.',
  },
  parramatta: {
    intro: 'Parramatta and Western Sydney are covered by the NSW Government\'s FuelCheck scheme, the same real-time official data source used across NSW. As one of Sydney\'s most populated commuter regions, Western Sydney has a large number of competing fuel retailers.',
    suburbs: 'Find the cheapest petrol across Western Sydney including Parramatta CBD, Blacktown, Penrith, Liverpool, Fairfield, Auburn, Granville, Merrylands, Seven Hills, Castle Hill, Rouse Hill, Marsden Park, St Marys, Mount Druitt, Wetherill Park, and Campbelltown.',
    trends: 'Western Sydney sits within the same NSW-wide FuelCheck network as the rest of Sydney, so prices move in the cycles the ACCC documents for Sydney. Check FueVolt regularly to see current prices across Western Sydney suburbs.',
    tips: 'Compare prices across Western Sydney suburbs before filling up — with a large number of competing stations, there\'s often a meaningfully cheaper option nearby. Motorway service centres (the M4 and M7, for example) tend to charge more than suburban stations just off the highway.',
  },
  townsville: {
    intro: 'Townsville and North Queensland are covered by Queensland\'s government fuel price transparency scheme. As the largest city in northern Australia, Townsville serves as a refuelling hub for travellers heading further north or into the outback.',
    suburbs: 'Compare prices across Townsville including the CBD, North Ward, South Townsville, Aitkenvale, Cranbrook, Thuringowa, Kirwan, Bohle, Bushland Beach, Deeragun, and surrounding areas including Ayr, Home Hill, and Ingham.',
    trends: 'North Queensland prices tend to run higher than Brisbane, reflecting the distance from major fuel supply hubs. Comparing prices across Townsville\'s suburbs before you fill up remains worthwhile.',
    tips: 'Before heading to Magnetic Island or further afield, fill up in Townsville — smaller and more remote locations typically charge more, reflecting lower competition and higher supply costs, a pattern common to regional and remote fuel markets generally.',
  },
};

export const EV_CITY_CONTENT = {
  sydney: {
    intro: 'Sydney has the largest concentration of public EV chargers in NSW, spanning shopping centres, council-operated street chargers, and highway-adjacent fast-charging hubs. Availability still varies between suburbs, so it\'s worth checking before you drive to a specific charger.',
    coverage: 'FueVolt tracks charging locations across Greater Sydney, from the CBD and Eastern Suburbs to Parramatta, the Inner West, the Northern Beaches, the Hills District, and South Western Sydney. Shopping centre car parks, council-operated street chargers, and highway-adjacent fast-charging hubs make up the bulk of the network, alongside a growing number of destination chargers at hotels and cafes.',
    tips: 'Ultra-rapid chargers are typically found at motorway service centres and large shopping centres, and are the fastest option for a top-up during a longer trip. For everyday charging, workplace and shopping centre chargers are often free or low-cost, while destination chargers at hotels and attractions suit longer stays. Check connector type and power output on FueVolt before you drive to a charger, since availability and speed vary between operators.',
  },
  melbourne: {
    intro: 'Melbourne\'s EV charging infrastructure spans the CBD, inner suburbs, and an expanding network of fast chargers along major arterials and regional routes like the Great Ocean Road and the Hume Freeway.',
    coverage: 'FueVolt lists chargers across inner Melbourne, the eastern and south-eastern suburbs, the western suburbs including Werribee and Sunshine, and outer growth corridors like Cranbourne and Craigieburn. Shopping centres, council car parks, and highway service centres each contribute to the network, with regional Victoria increasingly connected via fast-charging corridors.',
    tips: 'For trips out of Melbourne, plan charging stops along known fast-charging corridors before you set off, since regional coverage is thinner than in the metro area. Within the city, workplace and retail chargers are convenient for topping up during the day, while ultra-rapid chargers near major shopping strips suit a quick top-up between errands.',
  },
  brisbane: {
    intro: 'Brisbane sits at the southern end of Queensland\'s Electric Super Highway, a state-government-backed network of fast chargers spaced along major highways connecting the capital to Cairns and beyond. Within the city, charging infrastructure is concentrated around the CBD, inner suburbs, and major shopping precincts.',
    coverage: 'FueVolt tracks chargers from the Brisbane CBD to Ipswich, Logan, Redlands, Moreton Bay, and the northern and southern suburbs, complementing the Electric Super Highway\'s role as the state\'s long-distance backbone.',
    tips: 'If you\'re planning a trip up the Queensland coast, the Electric Super Highway chargers are spaced for interstate and regional travel — check spacing and availability on FueVolt before departing. Around Brisbane itself, shopping centre and council car park chargers are generally the most convenient for day-to-day top-ups.',
  },
  perth: {
    intro: 'Western Australia\'s large distances make EV charging infrastructure especially important for long-distance travel, and the state has invested in fast-charging corridors connecting Perth to regional centres. Within the metro area, charging points are concentrated in the inner city and along key arterial roads.',
    coverage: 'FueVolt lists chargers from Joondalup to Rockingham, Fremantle to Midland, and across Perth\'s northern and southern corridors. Regional WA routes, including those heading south toward Margaret River and north toward Geraldton, are gradually being connected by fast-charging stops, though spacing between chargers can still be significant outside the metro area.',
    tips: 'Because of WA\'s distances, always check charger spacing and your vehicle\'s range before a regional trip — a missed charging stop can mean a long detour. In Perth itself, shopping centre and civic car park chargers are widely available for everyday charging.',
  },
  adelaide: {
    intro: 'South Australia has one of the highest rates of household rooftop solar in the country, which makes home EV charging during daylight hours particularly cost-effective for Adelaide drivers with solar. The city\'s public charging network continues to grow, with fast chargers at shopping centres and along key travel corridors.',
    coverage: 'FueVolt\'s Adelaide coverage spans the CBD, North Adelaide, and surrounding suburbs including Glenelg, Marion, and Salisbury, with charging points also appearing along routes into the Adelaide Hills and toward the Fleurieu Peninsula.',
    tips: 'If you have rooftop solar, home charging during daylight hours is usually the cheapest option in Adelaide. For trips into the Adelaide Hills or beyond, check charger availability on FueVolt in advance, as regional coverage is still developing.',
  },
  'gold-coast': {
    intro: 'The Gold Coast\'s mix of dense tourist strips and residential suburbs means charging options range from hotel and resort chargers aimed at visitors to shopping centre and street chargers used by locals. Queensland\'s Electric Super Highway also passes near the Gold Coast, linking it to Brisbane and northern NSW.',
    coverage: 'FueVolt tracks chargers from Coolangatta to Helensvale, and Surfers Paradise to Robina, including hotel, shopping centre, and highway-adjacent locations.',
    tips: 'If you\'re visiting the Gold Coast, many hotels and resorts offer destination charging — check with your accommodation and confirm on FueVolt before you arrive. Locals heading to Brisbane or northern NSW can use the Electric Super Highway chargers for a top-up along the way.',
  },
  canberra: {
    intro: 'The ACT has consistently reported one of the higher rates of EV adoption among Australian jurisdictions, and Canberra\'s charging infrastructure reflects that, with coverage spread across government precincts, shopping centres, and residential areas.',
    coverage: 'FueVolt lists charging locations across central Canberra, Belconnen, Woden, Tuggeranong, and Gungahlin, with additional coverage extending toward Queanbeyan just across the NSW border.',
    tips: 'Canberra\'s compact layout means most chargers are within a short drive of the city centre, making day-to-day charging straightforward. For trips toward the NSW coast or south to the Snowy Mountains, plan charging stops in advance since coverage thins out once you leave the ACT.',
  },
  hobart: {
    intro: 'Tasmania\'s EV charging network is expanding, with key routes around the island being progressively equipped with fast chargers to support both local drivers and visitors touring the state. Hobart, as the state\'s capital, has the most concentrated charging coverage.',
    coverage: 'FueVolt tracks chargers across the Hobart CBD, Sandy Bay, Glenorchy, and surrounding suburbs, with additional coverage extending along major routes toward Launceston and the state\'s regional attractions.',
    tips: 'If you\'re planning to tour Tasmania by EV, check charger spacing on FueVolt before setting off, since some regional routes still have limited coverage. Within Hobart, shopping centre and civic car park chargers are the most convenient for regular top-ups.',
  },
  darwin: {
    intro: 'Darwin\'s EV charging network is still developing, reflecting the Northern Territory\'s small population and large distances. Chargers are concentrated in the CBD and surrounding suburbs, with the Northern Territory government working to extend coverage along the Stuart Highway to support long-distance travel.',
    coverage: 'FueVolt lists charging locations across the Darwin CBD, Stuart Park, Fannie Bay, Parap, and Palmerston, with limited coverage currently extending further south along the Stuart Highway toward Alice Springs.',
    tips: 'Given the NT\'s distances and limited charger density outside Darwin, plan any regional trip carefully and check charger availability on FueVolt well in advance. Within Darwin itself, charging is generally straightforward given the city\'s compact size.',
  },
  newcastle: {
    intro: 'Newcastle and the Hunter Valley have a growing EV charging network, benefiting from the region\'s proximity to Sydney and its position along the NSW coastal corridor. Chargers are found at shopping centres, along the Pacific Highway, and increasingly in the Hunter Valley wine region.',
    coverage: 'FueVolt tracks chargers across Newcastle, Charlestown, Maitland, and Lake Macquarie, with coverage extending into the Hunter Valley toward Cessnock and Pokolbin for those visiting the wine region.',
    tips: 'If you\'re driving between Sydney and Newcastle, fast chargers along the Pacific Highway corridor make the trip straightforward — check availability on FueVolt before you leave. For a Hunter Valley day trip, confirm charger locations near your destination winery in advance, as coverage is less dense than in Newcastle itself.',
  },
};

// The five mainland state capitals are the highest-population cities in both the
// fuel and EV-charging sets, so they stay indexed. The rest of the templated city
// pages (built from the same intro/suburbs/trends/tips structure above) stay live
// and fully functional but are marked noindex — keeps them useful for direct
// navigation without tripping ad networks' near-duplicate-content limits.
export const INDEXED_CITY_SLUGS = ['sydney', 'melbourne', 'brisbane', 'perth', 'adelaide'];
