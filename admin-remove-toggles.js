import { get, post, del } from "k6/http";
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

    // delete 100 toggles
    for(let i=0;i<100; i++) {
        del(`${apiUrl}/api/admin/projects/default/features/k6.test.${i}`, {
            headers: {
              'Cookie': cookie,
            }
        });
        del(`${apiUrl}/api/admin/archive/k6.test.${i}`, {
            headers: {
                'Cookie': cookie,
              }
        });
    }
}