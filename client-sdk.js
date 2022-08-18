import http from 'k6/http';
import { group, check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const sdkInstances = __ENV.sdks || 100;
const durMax = __ENV.durMax || '60s';

const apiUrl = __ENV.UNLEASH_URL || 'http://localhost:4242/api';
const apiToken = __ENV.UNLEASH_API_TOKEN || '*:development.ba79eb8e9e2c44b9d4a870e539f882c9f62a133acf90d8ca78a2dc14'


export let options = {
  noConnectionReuse: false,
  stages: [
    { duration: '30s', target: sdkInstances || 100 }, // use 30s to scale up to connected instances
    { duration: durMax, target: sdkInstances || 100 }, // stay at max for 60s
  ],
};

const clientFeatures = new Trend('client/features');
const clientMetrics = new Trend('client/metrics');
const registerMetrics = new Trend('client/register');

export default function () {
  
  const callFeatures = (etag) => {
    const params = {
      headers: {
        Authorization: apiToken,
        'If-None-Match': etag,
      }
    }
    const response = http.get(`${apiUrl}/client/features`, params);
    check(response, {
        "status code should be 200 or 304": res => [200, 304].includes(res.status),
    });
    clientFeatures.add(response.timings.waiting);
    return response.headers.Etag;
  }

  const register = () => {
    const registration = {
      "appName": "k6-test",
      "instanceId": "instanceId",
      "sdkVersion": "unleash-client-java:2.2.0",
      "strategies": ["default", "some-strategy-1"],
      "started": "2016-11-03T07:16:43.572Z",
      "interval": 10000
    };
    const params = {
      headers: {
        Authorization: apiToken,
        'Content-Type': 'application/json',
      }
    }
    const response = http.post(`${apiUrl}/client/register`, JSON.stringify(registration), params);
    check(response, {
        "Register status code should be 202": res => res.status === 202
    });
    registerMetrics.add(response.timings.waiting);
  }

  const metrics = {
    appName: "k6-test",
    instanceId: "instanceId",
    bucket: {
      start: new Date(),
      stop: new Date(),
      toggles: {},
    }
  };
  for(let i=0; i < 100; i++) {
    let name = `k6.test.${i}`;
    metrics.bucket.toggles[name] = {yes: 1, no: i};
  }

  const sendMetrics = () => {
    
    const params = {
      headers: {
        Authorization: apiToken,
        'Content-Type': 'application/json',
      }
    }
    const response = http.post(`${apiUrl}/client/metrics`, JSON.stringify(metrics), params);
    check(response, {
        "Metrics status code should be 202": res => res.status === 202
    });
    clientMetrics.add(response.timings.waiting);
  }

  group('client/features', () => {
    register();
    sleep(0.1);
    let etag = callFeatures();
    sleep(10);
    callFeatures(etag);
    sleep(10);
    callFeatures(etag);
    sleep(10);
    sendMetrics();
    callFeatures(etag);
    sleep(10);
    callFeatures(etag);
    sleep(10);
    callFeatures(etag);
  });
}
