import { get, post } from "k6/http";
import { group, check, sleep } from 'k6';

const username = 'admin';
const password = 'unleash4all';

const apiUrl = __ENV.UNLEASH_URL || 'http://localhost:4242';

export default function() {
    const params = {
        headers: {
          'Content-Type': 'application/json',
        }
    };
    const r1 = post(`${apiUrl}/auth/simple/login`, JSON.stringify({ username, password }), params);
    const cookie = r1.headers['Set-Cookie'];

    check(r1, {
        "Login is 200": res => res.status === 200
    });

    const r2 = get(`${apiUrl}/admin/user`, {
        headers: {
          'Cookie': cookie,
        }
    });

    check(r2, {
        "Get user profile is 200": res => res.status === 200
    });

    const p1 = {
        headers: {
          'Cookie': cookie,
          'Content-Type': 'application/json'
        }
    };

    // create 100 toggles
    for(let i=0;i<100; i++) {
        post(`${apiUrl}/api/admin/projects/default/features`, JSON.stringify({
            "type": "release",
            "name": `k6.test.${i}`,
            "description": "",
            "impressionData": false
        }), p1);
        post(`${apiUrl}/api/admin/projects/default/features/k6.test.${i}/environments/development/strategies`, JSON.stringify({
            "name": "default",
            "constraints": [],
            "parameters": {}
        }), p1);
        post(`${apiUrl}/api/admin/projects/default/features/k6.test.${i}/environments/development/on`)
    }
}