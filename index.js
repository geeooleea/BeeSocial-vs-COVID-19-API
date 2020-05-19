require('dotenv').config();

var express = require('express');
var app = express();

var http = require('http').createServer(app);
var io = require('socket.io')(http);

// var Dao = require('./dao.js');
// var dao = new Dao();

var PG = require('./pg.js');
var dao = new PG();

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});

app.use(express.static(__dirname + '/assets'));

http.listen(process.env.PORT, function () {
    console.log('listening on *:' + process.env.PORT);
    //dao.connect();
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback'
    },
    function (accessToken, refreshToken, profile, done) {
        dao.findOrCreateUser(profile._json, (err, user) => {
            return done(err, user);
        });
    }
));

app.get('/auth/google',
    passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/userinfo.email'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: 'beesocial://' }),
    (req, res) => {
        res.redirect('beesocial://activities');
    });

app.get('/auth-success', (req, res) => {
    res.redirect();
});

io.on('connection', function (socket) {
    socket.on('chat message', function (msg) {
        io.emit('chat message', msg);
    });
});

// GET the list of all activities
app.get('/activities', (req, res) => {
    dao.getActivities((results) => {
        res.json(results.rows);
    });
});

/*
// GET a specific shared activity by its id
app.get('/shared_activity/:id', function (req, res) {
    db.get(req.params.id, (err,reply) => {
        res.send(reply);
    });
});

app.post('/user', async (req,res) => {
    var user = req.body;
    await db.incr('user_key', (err,reply) => {
        if (err) throw err;
        var key = 'user:'+reply;
        user.id = key;
        db.set(key, JSON.stringify(user), (err,reply) => {
            if (err) throw err;
            res.send(user);
        });
    });
});

// Create a new shared activity: { id: "id of the activity to start", user: "user that intiates the activity" }
app.post('/shared_activity/', function (req,res) {
    var activity = req.body;
    db.get(activity.id, (err,reply) => {
        if (err) res.send(err);
        else if (!reply) res.status(404).send("No activity with this ID found!");
        else {
            var key = 'shared_activity:'+(activity.id.split(':')[1])+':'+activity.user.split(':')[1];
            var shared = { id: key, activity : activity.id, users : [ activity.user ], matched : false };
            db.set(key, JSON.stringify(shared), () => {
                res.json(shared);
            });
        }
    });
});

app.delete('/shared_activity/:id', function (req,res) {
    console.log('Deleting activity' + req.params.id);
    db.del(req.params.id, (err,reply) => {
        if (err) res.status(404).send('Shared activity not found');
        else res.status(200).send();
    });
});

// GET the checklist for an activity given its id
app.get('/step_by_step/:activity', function (req, res) {
    res.status(501).send('Our code monkeys are still working on this.');
});

// Fetch if there is an active buddy for the given shared activity
app.get('/buddy/:shared_activity_id', function (req, res) {
    var id = req.params.shared_activity_id;
    db.get(id, (err,shared_activity)  => {
        shared_activity = JSON.parse(shared_activity);
        if (err) throw err;
        else if (shared_activity.matched) res.json(shared_activity);
        else db.scan('0','MATCH',id.split(':')[0]+':'+id.split(':')[1]+':*', 'COUNT', '1000', async function(err, reply){
            if(err) throw err;

            cursor = reply[0];
            var user = id.split(':')[2];
            console.log(reply[1]);
            if(cursor === '0'){ // Then we are done
                if (reply[1].length > 0)
                    db.mget(reply[1], async (err,reply) => {
                        if (err) throw err;

                        console.log(reply);
                        var matched = false;
                        for (let i = 0; i < reply.length; i++) {
                            reply[i] = JSON.parse(reply[i]);
                            if (reply[i].matched === false && reply[i].users[0] != 'user:'+user) {
                                reply[i].users.push('user:'+user);
                                reply[i].matched = true;
                                shared_activity.users.push(reply[i].users[0]);
                                shared_activity.matched = true;
                                await db.set(reply[i].id, JSON.stringify(reply[i]));
                                await db.set(id, JSON.stringify(shared_activity));
                                res.json(shared_activity);
                                matched = true;
                                break;
                            }
                        }
                        if (!matched) res.sendStatus(404);
                    });
                else res.sendStatus(404);
            } else {
                console.log('How could this happen???');
                // SHOULD NOT HAPPEN IN PROTOTYPE
            }
        });
    });
});

// GET a list of all activities for this user
app.get('/buddy/:user_id/shared_activity', function (req, res) {
    res.status(501).send('Our code monkeys are still working on this.');
});
*/