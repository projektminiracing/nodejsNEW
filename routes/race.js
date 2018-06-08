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

router.get('/simulate', function(req, res){
	var customID = "5b0f1cc53316e51f0c1fee49"; //tu bomo spreminjali
	var userdriverID = "5b12934f186da53b3cb23be6";
	var _track;
	var _drivers;
	var _vehicles;
	var _userDriver;
	Driver.findOne({user_id : userdriverID },function(err,user_driver){
		if(err){
			res.status(500).send({error: err});
		}
		else{
		_userDriver = user_driver;
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
								var st_odsekov = 8;
								var RaceSimulation = new Race({
									sections: new Array(st_odsekov),
									track: _track,
									drivers: _drivers,
									vehicles: _vehicles
								});
								for(j = 0; j < st_odsekov; j++){ //gre skozi odseke 
									RaceSimulation["sections"][j] = new Array(3);
									for(i = 0; i < 3; i++){ //gre skozi igralce
										var imeVoznika = _drivers[i]['name'];
										var ocenaVoznika;
										var ocenaVozila;
										var skupnaOcena;
										var overall = _drivers[i]['overall']; //overall voznika
						
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
						
										//random - lahko se zgodi da pobere battery powerup -> + bencin
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
										//VERJETNOST ZA POWERUP BATTERY
										if(Math.random() < moznostPowerupa){ //če bo random št. med 0 in 1 v območju moznostPowerup
											_vehicles[i]['batteryLeft'] += 5; //bencin
										}
										_vehicles[i]['batteryLeft'] -= elevation; //večji naklon odseka povzroči večjo porabo goriva
						
										var pospesek = _vehicles[i]['acceleration'];
										var najvecjaHitrost = _vehicles[i]['topSpeed'];
										var teza = _vehicles[i]['weight'];
										var motorKonji = _vehicles[i]['engine']['horsePower'];      
										var dolzinaOdseka = _track['sections'][j]['length'];
										var kot = _track['sections'][j]['angle'];
										var faktorKota = kot / 90; //90 najvecji ovinek
									
										var overtaking = _drivers[i]['overtaking'] / 100;
						
										var hitrostModifier = faktorMateriala * faktorKota * (pospesek/10  * motorKonji/100 * overall/100);
										var casVoznika = dolzinaOdseka / (najvecjaHitrost * hitrostModifier);
										RaceSimulation["sections"][j][i] = casVoznika;
										if(Math.random() > overtaking){ //je prehitel nekoga
											RaceSimulation["sections"][j][i] -= (dolzinaOdseka/najvecjaHitrost)/2;
										}
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
	}});
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