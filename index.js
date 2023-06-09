import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import fs from "fs";
import Handlebars from "handlebars";
import { pool } from './db.js';
import { Novu } from "@novu/node"; 
import axios from "axios";
import bodyParser from "body-parser";
import fetch from 'node-fetch';
import request from "request";

const app = express();

const apiKey = 'd7037e08c0f2ffaa6603c4ea56a8fd28';
const NOVU_API_BASE_URL = 'https://api.novu.co';
const novu = new Novu('d7037e08c0f2ffaa6603c4ea56a8fd28');
const topicKey = 'email-notification-topic';

// novu.trigger('email-notification-template', {
//     to: {
//       subscriberId: '6461142bd6925ea19b96cc06'
//     },
//     payload: {
//         customVariables: 'Hello'
//     }
//   });

//Using Middlewares
app.use(cors());
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//Setting up View Engine
app.set("view engine", "ejs");

// create subscriber API
app.post('/subscribers', async (req, res) => {
  const { subscriberId, email, firstName, lastName } = req.body;
  
  try {
    const response = await axios.post('https://api.novu.co/v1/subscribers', {
      subscriberId,
      email,
      firstName,
      lastName
    }, {
      headers: {
        Authorization : `ApiKey ${apiKey}`,
        'Content-Type' : 'application/json'
      }
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error(error.response.data);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// delete subscriber API
app.delete("/subscribers/:id", async function(req, res){
  const { id } = req.params;

  try {
    const response = await axios.delete(`https://api.novu.co/v1/subscribers/${id}`, {
      headers: {
        Authorization: `ApiKey ${apiKey}`,
        'Content-Type': 'application/json'
      },
    });
    res.status(200).send(`Subscriber with ID ${id} has been deleted successfully.`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting subscriber.');
  }
});

// get all subscribers list API
app.get('/subscribers', async (req, res) => {
  try {
    const response = await axios.get('https://api.novu.co/v1/subscribers', {
      headers: {
        Authorization : `ApiKey ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// get subscriber API
app.get('/subscribers/:id', (req, res) => {
  const options = {
    method: 'GET',
    url: `https://api.novu.co/v1/subscribers/${req.params.id}`,
    headers: {
      Authorization: `ApiKey ${apiKey}`,
      'Content-Type': 'application/json'
    }
  };

  // Make a GET request to the Novu API using the Request library
  request(options, (error, response, body) => {
    if (error) {
      console.error(error);
      res.status(500).send('An error occurred while retrieving data from the Novu API.');
    } else {
      const subscriberData = JSON.parse(body);
      res.send(subscriberData);
    }
  });
});

// creating a topic to send notifications API
app.post('/topics', async (req, res) => {
  try {
    const { key , name } = req.body;
    const response = await axios.post(
      'https://api.novu.co/v1/topics',
      {
        key,
        name,
      },
      {
        headers: {
          Authorization: `ApiKey ${apiKey}`,
          'Content-Type': 'application/json'
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating topic' });
  }
});

// Filler topics API - returns a list of topics
app.get('/topics', async (req, res) => {
  try {
    const response = await axios.get('https://api.novu.co/v1/topics', {
      headers: {
        Authorization : `ApiKey ${apiKey}`,
        'Content-Type' : 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Subscribers addition API
app.post('/topics/:topicKey/subscribers', async (req, res) => {
  const { subscribers } = req.body;
  const { topicKey } = req.params;
  
  try {
    const response = await axios.post(`https://api.novu.co/v1/topics/${topicKey}/subscribers`, {subscribers}, {
      headers: {
        Authorization : `ApiKey ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    res.send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while adding the subscribers to the topic');
  }
});

// delete topic API
app.delete('/topics/:topicKey', async (req, res) => {
  const { topicKey } = req.params;

  try {
    const response = await axios.delete(`https://api.novu.co/v1/topics/${topicKey}`,{
      headers: {
        Authorization : `ApiKey ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })
    res.status(200).send(`Topic with key ${topicKey} has been deleted successfully.`);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occured while deleting a Topic')
  }
})

// subscribers removal API
app.post('/topics/:topicKey/subscribers/removal', async (req, res) => {
  const { subscribers } = req.body;
  const { topicKey } = req.params;
  
  try {
    const response = await axios.post(`https://api.novu.co/v1/topics/${topicKey}/subscribers/removal`, {subscribers}, {
      headers: {
        Authorization : `ApiKey ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).send(` Mentioned Subscribers from Topic with topicKey ${topicKey} has been deleted successfully.`);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while removing subscribers from topic');
  }
});

// const emailTemplate = fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'templates/index.handlebars'), 'utf-8');

// const template = Handlebars.compile(emailTemplate);


//Start the Express server
app.listen(3000, function(){
console.log("server is working");
});

// const isAuthenticated = function(req, res, next){
//     const { token } = req.cookies;
//     if(token){
//         next();
//     } else{
//         res.render("login");
//     }
// };