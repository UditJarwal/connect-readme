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
import { title } from "process";
import NewsAPI from "newsapi";
import https from "https";

const app = express();

const newApiKey = 'eecd5afa7e9b46ff97605a96fa5362d2';
const novuApiKey = 'd7037e08c0f2ffaa6603c4ea56a8fd28';
const NOVU_API_BASE_URL = 'https://api.novu.co';
const novu = new Novu('d7037e08c0f2ffaa6603c4ea56a8fd28');
const topicKey = 'email-notification-topic';
const newsapi = new NewsAPI('eecd5afa7e9b46ff97605a96fa5362d2');
const country = 'in';
var num = 0; 


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
        Authorization : `ApiKey ${novuApiKey}`,
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
        Authorization: `ApiKey ${novuApiKey}`,
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
        Authorization : `ApiKey ${novuApiKey}`,
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
      Authorization: `ApiKey ${novuApiKey}`,
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
          Authorization: `ApiKey ${novuApiKey}`,
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
        Authorization : `ApiKey ${novuApiKey}`,
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
        Authorization : `ApiKey ${novuApiKey}`,
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
        Authorization : `ApiKey ${novuApiKey}`,
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
        Authorization : `ApiKey ${novuApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).send(` Mentioned Subscribers from Topic with topicKey ${topicKey} has been deleted successfully.`);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while removing subscribers from topic');
  }
});


const emailTemplate = fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'templates/index.handlebars'), 'utf-8');

const template = Handlebars.compile(emailTemplate);

let bodyMessage
// Fetch top headlines
axios.get(`https://newsapi.org/v2/top-headlines?country=${country}&novuApiKey=${novuApiKey}`,{
  headers: {
    Authorization : `Bearer ${newApiKey}`
  }
})
  .then(response => {
    const article = response.data.articles[num];
    num++;
    const bodyMessage = template({
      title: article.title,
      description: article.description,
      url: article.url,
    })
  })
  .catch(error => {
    console.log('Error fetching Top Headlines:', error.message);
  });


app.post('/trigger-event', async (req, res) => {
  const { name, payload } = req.body;
if (!name || typeof name !== 'string') {
  return res.status(400).send({ statusCode: 400, message: 'Invalid name field' });
}
  const data = {
    name: bodyMessage,
    payload,
    to: [{ type: 'Topic', topicKey : topicKey}],
  };

  try {
    const response = await axios.post('https://api.novu.co/v1/events/trigger', data,{
      headers: {
        Authorization : `ApiKey ${novuApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    res.status(response.status).send(response.data);
    console.log("success!")
  } catch (error) {
    console.error(error);
    res.status(error.response.status).send(error.response.data);
  }
});


//   app.post('/trigger-event', async (req, res) => {
// 	try {
// 		// Get the user input from the form.
// 		const { name, payload, to } = req.body;

// 		// Trigger the event using Novu's API.
// 		await axios.post(`https://api.novu.co/v1/events/${EVENT_ID}/trigger`, {
// 			name,
// 			email,
// 			api_key: API_KEY
// 		});

// 		res.send('Event triggered successfully!');
// 	} catch (error) {
// 		res.status(500).send(error.message);
// 	}
// });
// // Set up the event data
// const eventPayload = {
//   to: [{ type: 'Topic', topicKey: topicKey }],
//   payload: {
//     htmlTemplate: bodyMessage,
//   }
// };

// // Define the function to execute the API request
// function triggerEvent() {
//   const options = {
//     hostname: 'api.novu.co',
//     path: '/v1/events/trigger',
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization : `ApiKey ${novuApiKey}`
//     }
//   };

//   const req = https.request(options, res => {
//     console.log(`API response status code: ${res.statusCode}`);
//     // Handle the API response here
//   });

//   req.on('error', error => {
//     console.error(`Error sending API request: ${error}`);
//   });

//   req.write(JSON.stringify(eventPayload));
//   req.end();
// }

// // Trigger the event every 8 hours
// setInterval(triggerEvent);

// novu.trigger('email-notification-template', {
//     to: [{ type: 'Topic', topicKey: topicKey }],
//     payload: {
//       bodyMessage: bodyMessage,
//     }
//   });


// All options passed to topHeadlines are optional, but you need to include at least one of them
// newsapi.v2.topHeadlines({
//   language: 'en',
//   country: 'in'
// }).then(response => {
//   console.log(response);
  /*
    {
      status: "ok",
      articles: [...]
    }
  */
// });




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