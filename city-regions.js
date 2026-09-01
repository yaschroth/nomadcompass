// Region mapping (city.id -> region slug). Single source of truth shared by the
// homepage and the /cities browse filters. Extracted from the old homepage explorer.
const CITY_REGIONS = {
        // Europe
        lisbon: 'europe', porto: 'europe', budapest: 'europe', tallinn: 'europe',
        split: 'europe', belgrade: 'europe', laspalmas: 'europe', barcelona: 'europe',
        berlin: 'europe', prague: 'europe', amsterdam: 'europe', vienna: 'europe',
        zurich: 'europe', geneva: 'europe', dublin: 'europe', london: 'europe',
        manchester: 'europe', edinburgh: 'europe', paris: 'europe', lyon: 'europe',
        nice: 'europe', milan: 'europe', rome: 'europe', florence: 'europe',
        palermo: 'europe', madrid: 'europe', valencia: 'europe', seville: 'europe',
        malaga: 'europe', tenerife: 'europe', athens: 'europe', thessaloniki: 'europe',
        crete: 'europe', malta: 'europe', cyprus: 'europe', warsaw: 'europe',
        krakow: 'europe', bucharest: 'europe', clujnapoca: 'europe', sofia: 'europe',
        riga: 'europe', vilnius: 'europe', podgorica: 'europe', tirana: 'europe',
        sarajevo: 'europe', skopje: 'europe',
        // Europe - missing cities
        annecy: 'europe', brussels: 'europe', cologne: 'europe', frankfurt: 'europe',
        gijon: 'europe', gothenburg: 'europe', granadaspain: 'europe', hamburg: 'europe',
        heidelberg: 'europe', marbella: 'europe', munich: 'europe', piran: 'europe',
        sarande: 'europe', zagreb: 'europe',
        // Europe - new cities
        lecce: 'europe', trieste: 'europe', genoa: 'europe', sansebastian: 'europe',
        alicante: 'europe', zaragoza: 'europe', oxford: 'europe', cambridge: 'europe',
        york: 'europe', bath: 'europe', trondheim: 'europe', tromso: 'europe',
        turku: 'europe', oulu: 'europe', groningen: 'europe', thehague: 'europe',
        leuven: 'europe', luxembourg: 'europe', nuremberg: 'europe', stuttgart: 'europe',
        dusseldorf: 'europe', freiburg: 'europe', strasbourg: 'europe', grenoble: 'europe',
        aixenprovence: 'europe', bordeaux: 'europe', nantes: 'europe', montpellier: 'europe',
        toulouse: 'europe', marseille: 'europe', antwerp: 'europe', bruges: 'europe',
        ghent: 'europe', rotterdam: 'europe', utrecht: 'europe', eindhoven: 'europe',
        maastricht: 'europe', bremen: 'europe', hannover: 'europe', dortmund: 'europe',
        essen: 'europe', bremen: 'europe', leipzig: 'europe', dresden: 'europe',
        salzburg: 'europe', innsbruck: 'europe', graz: 'europe', linz: 'europe',
        basel: 'europe', bern: 'europe', lucerne: 'europe', lausanne: 'europe',
        oslo: 'europe', bergen: 'europe', stavanger: 'europe', goteborg: 'europe',
        malmo: 'europe', stockholm: 'europe', helsinki: 'europe', tampere: 'europe',
        copenhagen: 'europe', aarhus: 'europe', reykjavik: 'europe', galway: 'europe',
        cork: 'europe', limerick: 'europe', belfast: 'europe', glasgow: 'europe',
        brighton: 'europe', bristol: 'europe', cardiff: 'europe', liverpool: 'europe',
        leeds: 'europe', birmingham: 'europe', newcastle: 'europe', nottingham: 'europe',
        sheffield: 'europe', naples: 'europe', bologna: 'europe', turin: 'europe',
        verona: 'europe', bari: 'europe', catania: 'europe', bilbao: 'europe',
        granada: 'latam', cordoba: 'europe', cadiz: 'europe', tarifa: 'europe',
        girona: 'europe', palma: 'europe', ibiza: 'europe', fuerteventura: 'europe',
        rhodes: 'europe', santorini: 'europe', chania: 'europe', zakynthos: 'europe',
        kotor: 'europe', dubrovnik: 'europe', zadar: 'europe', pula: 'europe',
        ljubljana: 'europe', bled: 'europe', bratislava: 'europe', brno: 'europe',
        kosice: 'europe', plovdiv: 'europe', varna: 'europe', constanta: 'europe',
        brasov: 'europe', sibiu: 'europe', timisoara: 'europe', iasi: 'europe',
        kaunas: 'europe', tartu: 'europe', klaipeda: 'europe', gdansk: 'europe',
        poznan: 'europe', wroclaw: 'europe', lodz: 'europe', porto: 'europe',
        faro: 'europe', funchal: 'europe', pontadelgada: 'europe', cascais: 'europe',
        coimbra: 'europe', ericeira: 'europe', valletta: 'europe', paphos: 'europe',
        ohrid: 'europe', prizren: 'europe', mostar: 'europe', novisad: 'europe',

        // Asia
        chiangmai: 'asia', bali: 'asia', kualalumpur: 'asia', hochiminhcity: 'asia',
        penang: 'asia', tbilisi: 'asia', bangkok: 'asia', tokyo: 'asia',
        seoul: 'asia', singapore: 'asia', hanoi: 'asia', danang: 'asia',
        taipei: 'asia', manila: 'asia', cebu: 'asia', siemreap: 'asia',
        phnompenh: 'asia', kathmandu: 'asia', pokhara: 'asia', mumbai: 'asia',
        bangalore: 'asia', goa: 'asia', colombo: 'asia', phuket: 'asia',
        kohphangan: 'asia', ubud: 'asia', hongkong: 'asia', yerevan: 'asia',
        baku: 'asia', batumi: 'asia',
        // Asia - new cities
        chiangrai: 'asia', pattaya: 'asia', khaolak: 'asia', kanchanaburi: 'asia',
        sanur: 'asia', solo: 'asia', medan: 'asia', makassar: 'asia',
        kuching: 'asia', johorbahru: 'asia', baguio: 'asia', davao: 'asia',
        iloilo: 'asia', cantho: 'asia', hue: 'asia', ninhbinh: 'asia',
        vangvieng: 'asia', sihanoukville: 'asia', battambang: 'asia', nagoya: 'asia',
        hiroshima: 'asia', kanazawa: 'asia', kaohsiung: 'asia', tainan: 'asia',
        gwangju: 'asia', daegu: 'asia', jaipur: 'asia', kochi: 'asia', udaipur: 'asia',
        kyoto: 'asia', osaka: 'asia', fukuoka: 'asia', sapporo: 'asia',
        busan: 'asia', jeju: 'asia', huahin: 'asia', krabi: 'asia',
        kohsamui: 'asia', pai: 'asia', hoian: 'asia', dalat: 'asia',
        nhatrang: 'asia', quynnhon: 'asia', sapa: 'asia', luangprabang: 'asia',
        vientiane: 'asia', kampot: 'asia', canggu: 'asia', lombok: 'asia',
        nusapenida: 'asia', bandung: 'asia', yogyakarta: 'asia', surabaya: 'asia',
        semarang: 'asia', malang: 'asia', langkawi: 'asia', ipoh: 'asia',
        malacca: 'asia', kotakinabalu: 'asia', dumaguete: 'asia', boracay: 'asia',
        siargao: 'asia', palawan: 'asia', elnido: 'asia', pune: 'asia',
        shenzhen: 'asia', gyumri: 'asia', kutaisi: 'asia',
        phuquoc: 'asia', quynhon: 'asia', weligama: 'asia',

        // Latin America
        medellin: 'latam', mexicocity: 'northamerica', buenosaires: 'latam', playadelcarmen: 'northamerica',
        oaxaca: 'northamerica', montevideo: 'latam', lima: 'latam', cusco: 'latam',
        bogota: 'latam', cartagena: 'latam', santiago: 'latam', valparaiso: 'latam',
        quito: 'latam', sanjuan: 'northamerica', santacruz: 'latam', lapaz: 'latam',
        asuncion: 'latam', guadalajara: 'northamerica', puertovallarta: 'northamerica', sanjosecr: 'latam',
        tamarindo: 'latam', panama: 'latam', antigua: 'latam', sanmigueldeallende: 'northamerica',
        merida: 'northamerica',
        // Latin America - new cities
        cancun: 'northamerica', queretaro: 'northamerica', mazatlan: 'northamerica', leon: 'northamerica',
        manizales: 'latam', pereira: 'latam', barranquilla: 'latam', cali: 'latam',
        guayaquil: 'latam', trujillo: 'latam', cochabamba: 'latam', sucre: 'latam',
        rosario: 'latam', mardelplata: 'latam', cordoba: 'latam', mendoza: 'latam',
        bariloche: 'latam', recife: 'latam', fortaleza: 'latam', salvador: 'latam',
        florianopolis: 'latam', saopaulo: 'latam', riodejaneiro: 'latam', brasilia: 'latam',
        boquete: 'latam', lakeatitlan: 'latam', tulum: 'northamerica', sayulita: 'northamerica',
        puertoescondido: 'northamerica', guanajuato: 'northamerica', huanchaco: 'latam', mancora: 'latam',
        montanita: 'latam', vilcabamba: 'latam', cuenca: 'latam', arequipa: 'latam',
        santodomingo: 'northamerica', puntacana: 'northamerica', havana: 'northamerica', santamarta: 'latam',
        puertorico: 'latam',

        // North America
        austin: 'northamerica', miami: 'northamerica', vancouver: 'northamerica',
        // North America - new cities
        sanfrancisco: 'northamerica', sandiego: 'northamerica', losangeles: 'northamerica',
        newyork: 'northamerica', chicago: 'northamerica', boston: 'northamerica',
        nashville: 'northamerica', denver: 'northamerica', seattle: 'northamerica',
        portland: 'northamerica', calgary: 'northamerica', victoria: 'northamerica',
        ottawa: 'northamerica', montreal: 'northamerica', toronto: 'northamerica',

        // Africa
        capetown: 'africa', cairo: 'africa', marrakech: 'africa', casablanca: 'africa',
        accra: 'africa', nairobi: 'africa', kigali: 'africa', lagos: 'africa',
        // Africa - new cities
        luxor: 'africa', alexandria: 'africa', capeverde: 'africa', windhoek: 'africa',
        kampala: 'africa', maputo: 'africa', arusha: 'africa', addisababa: 'africa',
        dakar: 'africa', tunis: 'africa', rabat: 'africa', essaouira: 'africa',
        chefchaouen: 'africa', taghazout: 'africa', zanzibar: 'africa', mombasa: 'africa',
        daressalaam: 'africa', johannesburg: 'africa', durban: 'africa',

        // Middle East
        dubai: 'middleeast', telaviv: 'middleeast', antalya: 'middleeast', istanbul: 'middleeast',
        // Middle East - new cities
        salalah: 'middleeast', bahrain: 'middleeast', riyadh: 'middleeast', jeddah: 'middleeast',
        kuwait: 'middleeast', ramallah: 'middleeast', yazd: 'middleeast', amman: 'middleeast',
        aqaba: 'middleeast', beirut: 'middleeast', muscat: 'middleeast', doha: 'middleeast',
        abudhabi: 'middleeast', haifa: 'middleeast', eilat: 'middleeast', bodrum: 'middleeast',
        fethiye: 'middleeast', izmir: 'middleeast', cappadocia: 'middleeast',
        manama: 'middleeast',

        // Oceania
        sydney: 'oceania', melbourne: 'oceania', auckland: 'oceania',
        // Oceania - new cities
        darwin: 'oceania', canberra: 'oceania', wellington: 'oceania', suva: 'oceania',
        noumea: 'oceania', brisbane: 'oceania', perth: 'oceania', adelaide: 'oceania',
        goldcoast: 'oceania', cairns: 'oceania', hobart: 'oceania', byronbay: 'oceania',
        christchurch: 'oceania', queenstown: 'oceania', mauritius: 'oceania',

        // --- Auto-filled from country (regions previously missing) ---
        // Europe
        albarracin: 'europe', alberobello: 'europe', assisi: 'europe', aveiro: 'europe',
        avignon: 'europe', bamberg: 'europe', berat: 'europe', bergamo: 'europe',
        besalu: 'europe', bitola: 'europe', braga: 'europe', budva: 'europe',
        caceres: 'europe', ceskykrumlov: 'europe', chamonix: 'europe', civitadibagnoregio: 'europe',
        colmar: 'europe', corfu: 'europe', cudillero: 'europe', delft: 'europe',
        eze: 'europe', geiranger: 'europe', giethoorn: 'europe', gjirokaster: 'europe',
        gordes: 'europe', guimaraes: 'europe', hallstatt: 'europe', hvar: 'europe',
        kruja: 'europe', ksamil: 'europe', lauterbrunnen: 'europe', lucca: 'europe', manarola: 'europe', marvao: 'europe', matera: 'europe',
        meteora: 'europe', monemvasia: 'europe', monsaraz: 'europe', nafplio: 'europe',
        nazare: 'europe', obidos: 'europe', perast: 'europe', perugia: 'europe',
        pitigliano: 'europe', plitvice: 'europe', positano: 'europe', regensburg: 'europe',
        reine: 'europe', riquewihr: 'europe', rocamadour: 'europe', ronda: 'europe',
        rothenburg: 'europe', rovinj: 'europe', salamanca: 'europe', santiagodecompostela: 'europe',
        segovia: 'europe', shkoder: 'europe', sibenik: 'europe', siena: 'europe',
        sighisoara: 'europe', sintra: 'europe', taormina: 'europe', telc: 'europe',
        toledo: 'europe', torun: 'europe', trakai: 'europe', trogir: 'europe',
        tropea: 'europe', velikotarnovo: 'europe', vernazza: 'europe', zermatt: 'europe',

        // Asia
        alappuzha: 'asia', almaty: 'asia', amritsar: 'asia', andong: 'asia',
        ayutthaya: 'asia', bagan: 'asia', banaue: 'asia', bandipur: 'asia',
        batad: 'asia', bhaktapur: 'asia', bishkek: 'asia', bukhara: 'asia',
        bukittinggi: 'asia', coron: 'asia', dali: 'asia', dharamshala: 'asia',
        ella: 'asia', fenghuang: 'asia', galle: 'asia', gokarna: 'asia',
        gorkha: 'asia', gyeongju: 'asia', hagiang: 'asia', hakone: 'asia',
        halong: 'asia', hampi: 'asia', "hpa-an": 'asia', hsipaw: 'asia',
        jaisalmer: 'asia', jakarta: 'asia', jeonju: 'asia', jodhpur: 'asia',
        kamakura: 'asia', kandy: 'asia', kep: 'asia', khiva: 'asia',
        kobe: 'asia', koyasan: 'asia', kurashiki: 'asia', kutalombok: 'asia',
        labuanbajo: 'asia', leh: 'asia', lijiang: 'asia', mahabalipuram: 'asia',
        matsue: 'asia', matsumoto: 'asia', mestia: 'asia', mirissa: 'asia',
        munnar: 'asia', mysore: 'asia', naha: 'asia', nara: 'asia',
        nikko: 'asia', nongkhiaw: 'asia', nuwaraeliya: 'asia', orchha: 'asia',
        phongnha: 'asia', pingyao: 'asia', pondicherry: 'asia', pushkar: 'asia',
        rishikesh: 'asia', sagada: 'asia', samarkand: 'asia', shakhrisabz: 'asia',
        shirakawago: 'asia', sighnaghi: 'asia', sigiriya: 'asia', stepantsminda: 'asia',
        takayama: 'asia', tanatoraja: 'asia', varanasi: 'asia', vigan: 'asia',
        wuzhen: 'asia', yangshuo: 'asia', zhangjiajie: 'asia',

        // Middle East
        amasya: 'middleeast', byblos: 'middleeast', goreme: 'middleeast', kas: 'middleeast',
        mardin: 'middleeast', nizwa: 'middleeast', oludeniz: 'middleeast', pamukkale: 'middleeast',
        petra: 'middleeast', safranbolu: 'middleeast', wadimusa: 'middleeast', wadirum: 'middleeast',

        // Africa
        aitbenhaddou: 'africa', aswan: 'africa', dahab: 'africa', fez: 'africa',
        gondar: 'africa', harar: 'africa', kairouan: 'africa', lalibela: 'africa',
        lamu: 'africa', livingstone: 'africa', meknes: 'africa', merzouga: 'africa',
        moshi: 'africa', musanze: 'africa', ouarzazate: 'africa', sidibousaid: 'africa',
        stellenbosch: 'africa', stonetown: 'africa', swakopmund: 'africa', tangier: 'africa',
        tetouan: 'africa', tozeur: 'africa',

        // North America
        bacalar: 'northamerica', campeche: 'northamerica', holbox: 'northamerica', izamal: 'northamerica',
        patzcuaro: 'northamerica', puebla: 'northamerica', sancristobal: 'northamerica', taxco: 'northamerica',
        tepoztlan: 'northamerica', trinidad: 'northamerica', vinales: 'northamerica', zacatecas: 'northamerica',

        // Latin America
        banos: 'latam', barichara: 'latam', bocasdeltoro: 'latam', chachapoyas: 'latam',
        colonia: 'latam', copacabana: 'latam', coroico: 'latam',
        diamantina: 'latam', elcalafate: 'latam', elchalten: 'latam', elzonte: 'latam',
        filandia: 'latam', flores: 'latam', gramado: 'latam',
        guatape: 'latam', huacachina: 'latam', huaraz: 'latam', jardin: 'latam',
        jericoacoara: 'latam', lencois: 'latam', mompox: 'latam', monteverde: 'latam',
        olinda: 'latam', ometepe: 'latam', otavalo: 'latam', ouropreto: 'latam',
        paraty: 'latam', pisac: 'latam', popayan: 'latam', potosi: 'latam',
        pucon: 'latam', puno: 'latam', puntadeleste: 'latam', purmamarca: 'latam',
        rio: 'latam', salento: 'latam', salta: 'latam', samaipata: 'latam',
        sanpedrodeatacama: 'latam', santateresa: 'latam', suchitoto: 'latam', tarapoto: 'latam',
        tiradentes: 'latam', uyuni: 'latam', villadeleyva: 'latam',

        // Oceania
        wanaka: 'oceania',

        // Batch 1 of the 650 -> 1000 expansion (2026-08-05)
        neworleans: 'northamerica', washingtondc: 'northamerica', philadelphia: 'northamerica',
        atlanta: 'northamerica', honolulu: 'northamerica', lasvegas: 'northamerica',
        phoenix: 'northamerica', minneapolis: 'northamerica', asheville: 'northamerica',
        quebeccity: 'northamerica', halifax: 'northamerica',
        chengdu: 'asia', xian: 'asia', hangzhou: 'asia', guangzhou: 'asia', kunming: 'asia',
        kolkata: 'asia', chennai: 'asia', hyderabad: 'asia', ahmedabad: 'asia',
        tashkent: 'asia', sendai: 'asia',
        curitiba: 'latam', belohorizonte: 'latam',

        // Batch 2 of the 650 -> 1000 expansion (2026-08-06)
        beijing: 'asia', shanghai: 'asia', xiamen: 'asia', guilin: 'asia',
        newdelhi: 'asia', dhaka: 'asia', islamabad: 'asia', male: 'asia',
        yangon: 'asia', ulaanbaatar: 'asia', kohtao: 'asia', haiphong: 'asia',
        vungtau: 'asia', bohol: 'asia',
        dunedin: 'oceania',
        isfahan: 'middleeast',
        abidjan: 'africa', agadir: 'africa', algiers: 'africa',
        monterrey: 'northamerica', houston: 'northamerica', tampa: 'northamerica',
        dallas: 'northamerica', saltlakecity: 'northamerica', montegobay: 'northamerica',
        manaus: 'latam', portoalegre: 'latam',

        // Batch 32, 2026-09-01
        lublin: 'europe', katowice: 'europe', zakopane: 'europe', plzen: 'europe',
        karlovyvary: 'europe', debrecen: 'europe', nis: 'europe', burgas: 'europe',
        paros: 'europe', patras: 'europe', trento: 'europe', ravenna: 'europe',
        santander: 'europe', setubal: 'europe', munster: 'europe', erfurt: 'europe',
        rennes: 'europe', biarritz: 'europe', trabzon: 'middleeast', marmaris: 'middleeast',
        okayama: 'asia', nagasaki: 'asia', daejeon: 'asia', udonthani: 'asia',
        padang: 'asia', bacolod: 'asia', coorg: 'asia', natal: 'latam',
        xalapa: 'latam', ushuaia: 'latam', hermanus: 'africa',

        // Batch 31, 2026-08-29
        bansko: 'europe', jerusalem: 'middleeast', ankara: 'middleeast', olomouc: 'europe',
        pecs: 'europe', rijeka: 'europe', ioannina: 'europe', naxos: 'europe',
        alanya: 'middleeast', constanta: 'europe', iasi: 'europe', vlore: 'europe',
        hercegnovi: 'europe', taichung: 'asia', hualien: 'asia', cameronhighlands: 'asia',
        quetzaltenango: 'latam', puertoviejo: 'latam', lafortuna: 'latam', durban: 'africa',
        knysna: 'africa', puertovaras: 'latam', vinadelmar: 'latam', arugambay: 'asia',
        dianibeach: 'africa', hurghada: 'africa', mindo: 'latam', sokcho: 'asia',
        trincomalee: 'asia', siwa: 'africa'

      };

if (typeof module !== 'undefined' && module.exports) module.exports = CITY_REGIONS;
