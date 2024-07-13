import http from 'k6/http';
import { sleep, check } from 'k6';
import { SharedArray } from 'k6/data';

// Generate a list of URLs to use for redirection
const urls = new SharedArray('urls', function() {
  const urls = [];
  for (let i = 0; i < 1000; i++) {
    urls.push(`http://example.com/${i}`);
  }
  return urls;
});

export const options = {
  scenarios: {
    create_links: {
      exec: 'createLinks',
      executor: 'constant-arrival-rate',
      rate: 40, // 40 URL creation requests per second
      timeUnit: '1s',
      duration: '1m', // Run the test for 1 minute
      preAllocatedVUs: 100,
      maxVUs: 500,
    },
    redirect_links: {
      exec: 'redirectLinks',
      executor: 'constant-arrival-rate',
      rate: 2000, // 8000 URL redirection requests per second
      timeUnit: '1s',
      startTime: '0s',
      duration: '1m', // Run the test for 1 minute
      preAllocatedVUs: 200,
      maxVUs: 6000,
    },
  },
};

const urlToShorten = 'http://example.com';

export function createLinks() {
    let createRes = http.get(`http://localhost:3000/create/?url=${urlToShorten}`);
    check(createRes, {
      'create status was 200': (r) => r.status === 200,
      'create response has short_url': (r) => r.body.includes('shortend_url'),
    });
    sleep(1);
}

export function redirectLinks() {
    // const randomUrl = urls[Math.floor(Math.random() * urls.length)];
    const randomUrl = Math.floor(Math.random());

    let shortUrlRes = http.get(`http://localhost:3000/${randomUrl}`);
    check(shortUrlRes, {
      'short_url status was 200': (r) => r.status === 200,
    });
    sleep(1);
    // console.log(`Redirecting to short url ${randomUrl}`);
}

// export default function () {
//   const scenario = __ENV.K6_SCENARIO;
//     console.log(`Scenario: ${scenario} ${__ENV.K6_SCENARIO}`);
//   if (scenario === 'create_links') {
//     // Test /create/?url=url endpoint
    
//     console.log(`Create Link Response: ${createRes.status} ${createRes.body}`);
//   } else if (scenario === 'redirect_links') {
//     // Test /short_url endpoint with one of the shortened URLs
//     const randomUrl = urls[Math.floor(Math.random() * urls.length)];
//     let shortUrlRes = http.get(`http://localhost:3000/${randomUrl}`);
//     check(shortUrlRes, {
//       'short_url status was 200': (r) => r.status === 200,
//     });
//   }

//   sleep(0.06);
// }
