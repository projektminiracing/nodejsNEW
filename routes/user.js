var express = require('express'); 

var router = express.Router();   //mini aplikacija za delo s progami
var ObjectId=require('mongodb').ObjectID;
var User=require('../models/user');
var Driver=require('../models/driver');
var Vehicle=require('../models/vehicle');

router.post('/register', function(req, res) {
    User.findOne({username : req.body.username } || {email:req.body.email}, function(err,user){
        if(user != null){
            res.status(501).send({error : "Uporabniško ime ali email že obstaja!"});
        }
    });
    var user = new User({
        username : req.body.username,
        email : req.body.email,
        password : req.body.password,
        firstname : req.body.firstname,
        lastname : req.body.lastname,
        birthday : req.body.birthday
    });
   	//shranimo nov objekt v bazo
   	user.save(function(err,user) {
        if (err)
            res.status(500).send({ error: err }) //ob napaki vrnemo error 500 in opis napake
       // else
            //res.json(user); //ob uspešnem shranjevanju izpišemo celoten objekt
    });

    var user_driver;
    var user_vehicle;
    Driver.find({user_id : null}, function(err,bots){
        if(err)
            res.status(500).send({ error: err });
        else{
            user_driver = new Driver(JSON.parse(JSON.stringify(bots[Math.floor(Math.random() * Math.floor(bots.length))])));

            Vehicle.find({user_id : null},function(err,vehicles){   
                if(err)
                    res.status(501).send({error: "There is no such vehicle!"});
                else
                    user_vehicle = new Vehicle(JSON.parse(JSON.stringify(vehicles[Math.floor(Math.random() * Math.floor(vehicles.length))])));
                    if(user_vehicle != null){
                        user_vehicle._id = new ObjectId();
                        user_vehicle.user_id = user._id;
                        user_vehicle.save(function(err,user_vehicle){
                            if(err) res.status(502).send({error: "User vehicle save failed!"})
                        });
                    }
                    else{
                        console.log("user_vehicle = null");
                    }
            });

            if(user_driver != null){
                user_driver._id = new ObjectId();
                user_driver.user_id = user._id;
                user_driver.save(function(err,user_driver){
                    if(err) res.status(502).send({error: "User driver save failed!"})
                });
            }
            else{
                console.log("user = null");
            }
        }
    });
});	

router.post('/login', function(req, res) {
    User.authenticate(req.body.username, req.body.password, function (error, user) {
        if (error || !user) {
          var err = new Error('Wrong username or password.');
          err.status = 401;
          return next(err);
        } 
        else {
          req.session.userId = user._id;
          req.session.userName = user.username;
          res.json(user);
        }
    });
});	

router.post('/logout', function(req, res, next) {
    if (req.session) {
        // delete session object
        req.session.destroy(function (err) {
            if (err) {
                return next(err);
            } 
            else {
                return res.redirect('/');
            }
        });
    }
});	

router.get('/', function(req, res) {
	//funkcija find brez parametra vrne vse objekte, ki ustrezajo shemi
    User.find(function(err, d) {
            if (err)
                res.status(500).send({ error: err })
			else
                res.json(d); //v p imamo array vseh prog
    });
});

router.get('/:id',function(req, res) {
	//findbyid nam vrne točno tisti objekt, ki ima predpisan id
    User.findById(req.params.id, function(err, d) {
        if (err)
            res.status(500).send({ error: err })
        else
            res.json(d);
    });
});

router.delete('/:id', function(req,res){   
	//preverimo če proga z idjem obstaja
	User.findById(req.params.id,function(err, d) {
    if (err) //splošna napaka
        res.status(500).send({ error: err })
	else if(!d) { //če ne najdemo proge, potem vrnemo napako
		res.status(500).send({ error: "User ne obstaja"});
	}
	else{ //če ja, pa jo zbrišemo in vrnemo sporočilo ok	
		d.remove(function(err){	
			if (err)
				res.status(500).send({ error: err })
			else {
				res.json({msg:"user " + req.params.id + " uspešno izbrisan!"});
			}
		});
	}
	});
});

router.put('/:id', function(req,res){
    User.findByIdAndUpdate({_id: req.params.id}, req.body, function(err, d) {
        if (err)
            res.status(500).send({ error: err })
        else {
            res.json({msg:"User " + req.params.id + " uspešno posodlbjen!"});
        }
    });
});

module.exports=router;