var express = require('express'); 

var router = express.Router(); //mini aplikacija za delo s progami

//model za shranjevanje proge
var Race=require('../models/race.js');
var Track=require('../models/track.js');
var Driver=require('../models/driver.js');
var Vehicle=require('../models/vehicle.js');

// testni vhod v api, da lahko izvajamo testiranje z brskanika na http://localhost/proga/testnoDodajanje
router.get('/testnoDodajanje', function(req, res) {
	//napolnimo shemo s podatki
	var PROGA = new Track({
		name: 'Testna proga',
		location: 'Kopalnica',
		description: 'Pozor! Spolzka tla.',
		difficulty: 7,
		length: 500,
		laps: 3,
		sections: [{
			direction: 'Left',
			angle: 30,
			elevation: 15,
			length: 5,
			material: 'Wood',
			powerups: [{
				name: 'Battery',
				description: 'Refill your electricity'
			},
			{
				name: 'Trap',
				description: 'Trap your enemies',
				duration: 5
			}],
			obstacles: [{
				name: 'Spoon',
				height: 5,
				width: 5,
				length: 10
				},
				{
				name: 'Fork',
				height: 5,
				width: 5,
				length: 10
			}],
		},
		{
			direction: 'Straight',
			angle: 0,
			elevation: 5,
			length: 15,
			material: 'Stone'
		}]
	});
    var PROGA = new Race(
		{
		sections: [{
			driver: "Štef",
			time: 420,
			position: 3	
		},
		{
			driver: "Joža",
			time: 330,
			position: 2
		},
		{
			driver: "Matevž",
			time: 125,
			position: 1
		}],
		track: PROGA
	});

   	//shranimo nov objekt v bazo
   	PROGA.save(function(err,p) {
		if (err){
			res.status(500).send({ error: err }) //ob napaki vrnemo error 500 in opis napake
		}
		else{
			res.json(p); //ob uspešnem shranjevanju izpišemo celoten objekt
		}
	});
});	

//dodajanje, na vhodu pričakujemo json objekt v obliki proga sheme
router.post('/',function(req,res){
	//v req.body nam body-parser ustvari json objekt
	var r = new Race(req.body);
	p.save(function(err,p) {
		if (err){
			res.status(500).send({ error: err }) //ob napaki vrnemo error 500 in opis napake
		}
		else{
			res.json(p); //ob uspešnem shranjevanju izpišemo celoten objekt
		}
	});
});

router.get('/simulate/:track_id/:user_id', function(req, res){
	var customID = req.params.track_id;
	var user_ID = req.params.user_id;
	var _track;
	var _drivers;
	var _vehicles;
	var _userDriver;
	var _userVehicle;
	Driver.findOne({user_id : user_ID },function(err,user_driver){
		if(err){
			res.status(500).send({error: err});
		}
		else{
		_userDriver = user_driver;
		Vehicle.findOne({user_id: user_ID},function(err,user_vehicle){
			if(err)
				res.status(500).send({error: err});
			else{
				_userVehicle = user_vehicle;
				Track.findOne({_id: customID}, function(err, t){
					if (err){
						res.status(500).send({ error: err })
					}
					else{
						_track = t;
						Driver.find({overall:{$lt:user_driver.overall+10}},function(err, d) {
							if (err){
								res.status(500).send({ error: err })
							}
							else{
								_drivers = d;
								Vehicle.find(function(err, v) {
									if (err){
										res.status(500).send({ error: err })
									}
									else{
										_vehicles = v;
										var st_odsekov = _track.sections.length;
										var RaceSimulation = new Race({
											sections: new Array(st_odsekov),
											track: _track,
											drivers: _drivers,
											vehicles: _vehicles
										});

										for(j = 0; j < st_odsekov; j++){ //gre skozi odseke 
											RaceSimulation["sections"][j] = new Array(_drivers.length);

											var material = _track['sections'][j]['material'];
											var elevation = _track['sections'][j]['elevation'];
											var faktorMateriala; //večji kot je faktor materiala, dlje rabi voznik da prevozi odsek
											if(material == "Stone"){
												faktorMateriala = 1.0; //najmanj spolzko
											}
											else if(material == "Wood"){
												faktorMateriala = 0.8; //srednje spolzko
											}
											else if(material == "Glass"){ 
												faktorMateriala = 0.6; //najbolj spolzko
											}

											var moznostPowerupa;
											var tezavnostProge = _track['difficulty']; //integer od 1 do 10
											if (tezavnostProge <= 3) { //najlažja proga
												moznostPowerupa = 0.6;
											}
											if (tezavnostProge > 3 && tezavnostProge <= 6) { //srednjetežka proga
												moznostPowerupa = 0.3;
											}
											if (tezavnostProge > 6) { //težka proga
												moznostPowerupa = 0.1;
											}
											//TRACK
											var dolzinaOdseka = _track['sections'][j]['length'];
											var kot = _track['sections'][j]['angle'];
											var faktorKota = kot / 90; //90 najvecji ovinek
											//VOZILO
											var casVoznika;
											var pospesek;
											var najvecjaHitrost;
											var teza;
											var motorKonji;
											//DRIVER
											var overtaking;
											var blocking;
											var bad_weather;
											var reaction_time;
											var concentration;
											var patience;
											var aggresiveness;
											var will;
											var intelligence;
											var fitness;
											var injuries;
											var overall;
											//TIME
											var hitrostModifier;
											for(i = 0; i < _drivers.length; i++){ //gre skozi igralce

												if(Math.random() < moznostPowerupa){ //če bo random št. med 0 in 1 v območju moznostPowerup
													_vehicles[i]['batteryLeft'] += 5; //bencin
												}

												pospesek = _vehicles[i]['acceleration'] / 10;
												najvecjaHitrost = _vehicles[i]['topSpeed'];
												teza = _vehicles[i]['weight'];
												motorKonji = _vehicles[i]['engine']['horsePower'] / 100;   

												overtaking = _drivers[i]['overtaking'] / 100;
												blocking = _drivers[i]['blocking'] / 100;
												bad_weather = _drivers[i]['bad_weather'] / 100;
												reaction_time = _drivers[i]['reaction_time'] / 100;
												//concentration = _drivers[i]['concentration'] / 100;
												patience = _drivers[i]['patience'] / 100;
												aggresiveness = _drivers[i]['aggresiveness'] / 100;
												will = _drivers[i]['will'] / 100;
												intelligence = _drivers[i]['intelligence'] / 100;
												fitness = _drivers[i]['fitness'] / 100;
												overall = _drivers[i]['overall'] / 100;

												hitrostModifier = faktorMateriala * faktorKota * (pospesek + motorKonji) *overall;
										//	* blocking * bad_weather * reaction_time * patience * aggresiveness * will * intelligence * 
												casVoznika = dolzinaOdseka / (najvecjaHitrost * hitrostModifier);

												RaceSimulation["sections"][j][i] = casVoznika;
												if(Math.random() > overtaking){ //je prehitel nekoga
													RaceSimulation["sections"][j][i] -= (dolzinaOdseka/najvecjaHitrost)/2;
												}
											}

											//VOZILO
											pospesek = user_vehicle['acceleration'];
											najvecjaHitrost = user_vehicle['topSpeed'];
											teza = user_vehicle['weight'];
											motorKonji = user_vehicle['engine']['horsePower'];   
											//DRIVER   
											overtaking = user_driver['overtaking'] / 100;
											blocking = user_driver['blocking'] / 100;
											bad_weather = user_driver['bad_weather'] / 100;
											reaction_time = user_driver['reaction_time'] / 100;
											concentration = user_driver['concentration'] / 100;
											patience = user_driver['patience'] / 100;
											aggresiveness = user_driver['aggresiveness'] / 100;
											will = user_driver['will'] / 100;
											intelligence = user_driver['intelligence'] / 100;
											fitness = user_driver['fitness'] / 100;
											overall = user_driver['overall'] / 100;

											hitrostModifier = faktorMateriala * faktorKota * (pospesek  * motorKonji) *(overtaking * blocking * bad_weather * reaction_time * concentration * patience * aggresiveness * will * intelligence * overall);
											casVoznika = dolzinaOdseka / (najvecjaHitrost * hitrostModifier);
										
											RaceSimulation["sections"][j][_drivers.length] = casVoznika;
											if(Math.random() > overtaking){ //je prehitel nekoga
												RaceSimulation["sections"][j][_drivers.length] -= (dolzinaOdseka/najvecjaHitrost)/2;
											}
											
										}
										RaceSimulation.save();
										res.json(RaceSimulation);
									}
								});
							}
						});
					}
				});
			}
		}).limit(5);
	}}).limit(5);;
});

//vrni vse simulacije dirk
router.get('/', function(req, res) {
	//funkcija find brez parametra vrne vse objekte, ki ustrezajo shemi
   Race.find(function(err, p) {
		if (err){
			res.status(500).send({ error: err })
		}
		else{
			res.json(p); //v p imamo array vseh prog
		}
	});
});

module.exports=router;