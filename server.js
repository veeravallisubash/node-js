const express = require('express');
const app = express();
const request = require('request');
const bodyparser = require('body-parser');
const admin = require('firebase-admin');

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();
const port = process.env.PORT || 2000;

app.set('view engine', 'ejs');

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.get('/signin', (req, res) => {
    res.render('signin');
});

app.post('/signin', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
        console.log('Email or password is missing');
        return res.status(400).send('Email and password are required');
    }

    db.collection('users')
        .where('email', '==', email)
        .where('password', '==', password)
        .get()
        .then((docs) => {
            if (docs.size > 0) {
                docs.forEach(doc => {
                    res.redirect('/home');
                });
            } else {
                res.send('Invalid email or password');
            }
        })
        .catch(error => {
            console.error('Error querying Firestore:', error);
            res.status(500).send('Internal server error');
        });
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
        console.log('Email or password is missing');
        return res.status(400).send('Email and password are required');
    }

    db.collection('users').add({
        email: email,
        password: password
    }).then(() => {
        res.render('signin');
    }).catch(error => {
        console.error('Error adding document to Firestore:', error);
        res.status(500).send('Internal server error');
    });
});

app.get('/home', (req, res) => {
    res.render('home');
});

app.post('/animaldata', (req, res) => {
    const name = req.body.animalname;

    if (!name) {
        console.log('Animal name is missing');
        return res.status(400).send('Animal name is required');
    }

    request.get({
        url: 'https://api.api-ninjas.com/v1/animals?name=' + name,
        headers: {
            'X-Api-Key': 'Wipv9dCCD8gldZMaCAyPSrXEMfenCNa8VCdQZFc1'
        },
    }, function (error, response, body) {
        if (error) {
            console.error('Request failed:', error);
            res.status(500).send('Request failed');
        } else if (response.statusCode != 200) {
            console.error('Error:', response.statusCode, body.toString('utf8'));
            res.status(response.statusCode).send('Error: ' + response.statusCode);
        } else {
            const obj = JSON.parse(body);
            if (obj && obj.length > 0) {
                const animal = obj[0];
                res.render('animal', {
                    name: animal.name,
                    location: animal.locations.join(', '),
                    diet: animal.characteristics.diet,
                    color: animal.characteristics.color,
                    weight: animal.characteristics.weight,
                    height: animal.characteristics.height,
                    lifespan: animal.characteristics.lifespan
                });
            } else {
                res.send('No animal found');
            }
        }
    });
});

app.listen(port, () => {
    console.log(Listening on port ${port});
});
