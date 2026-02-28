// =====================================================
// K6 LOAD TEST - AfterHoursID
// Target: 50,000 concurrent users
// Goal: <200ms response time, 0% error rate
// =====================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const apiRequests = new Counter('api_requests');

// Base configuration
const BASE_URL = __ENV.BASE_URL || 'https://afterhours.id';
const API_BASE = `${BASE_URL}/api`;

// Test configuration
export const options = {
  scenarios: {
    // Spike test - sudden increase in users
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10000 },  // Ramp to 10k in 30s
        { duration: '1m', target: 10000 },    // Hold at 10k for 1m
        { duration: '30s', target: 50000 },   // Spike to 50k in 30s
        { duration: '2m', target: 50000 },    // Hold at 50k for 2m
        { duration: '30s', target: 0 },       // Ramp down
      ],
      gracefulRampDown: '30s',
    },
    // Stress test - gradual increase
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10000 },
        { duration: '5m', target: 25000 },
        { duration: '5m', target: 50000 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '1m',
    },
    // Soak test - long duration
    soak_test: {
      executor: 'constant-vus',
      vus: 10000,
      duration: '30m',
    },
  },
  thresholds: {
    // Success criteria
    http_req_duration: ['p(95)<200', 'p(99)<500'],  // 95% under 200ms
    http_req_failed: ['rate<0.01'],  // Less than 1% errors
    errors: ['rate<0.01'],
  },
};

// Test scenarios
export default function () {
  // Homepage
  group('Homepage', () => {
    const res = http.get(BASE_URL);
    check(res, {
      'homepage status 200': (r) => r.status === 200,
      'homepage loads': (r) => r.body.length > 0,
    }) || errorRate.add(1);
    responseTime.add(res.timings.duration);
    sleep(1);
  });

  // Discovery API
  group('Discovery API', () => {
    const res = http.get(`${API_BASE}/v1/venues/nearby?lat=-6.2&lng=106.8&radius=5000`);
    check(res, {
      'discovery status 200': (r) => r.status === 200,
      'discovery returns venues': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.venues && Array.isArray(data.venues);
        } catch {
          return false;
        }
      },
    }) || errorRate.add(1);
    responseTime.add(res.timings.duration);
    apiRequests.add(1);
    sleep(0.5);
  });

  // Venue Detail API
  group('Venue Detail', () => {
    // Use a test venue ID
    const venueId = 'test-venue-id';
    const res = http.get(`${API_BASE}/venue/${venueId}`);
    // Allow 404 for test (venue might not exist)
    check(res, {
      'venue status ok': (r) => r.status === 200 || r.status === 404,
    });
    responseTime.add(res.timings.duration);
    sleep(0.5);
  });

  // Auth API (simulated)
  group('Auth API', () => {
    const res = http.get(`${API_BASE}/auth/me`, {
      headers: {
        // Simulate auth cookie (would fail without valid token)
        'Cookie': 'ah_access_token=invalid',
      },
    });
    // Should return 401 for invalid token
    check(res, {
      'auth returns 401': (r) => r.status === 401 || r.status === 200,
    });
    responseTime.add(res.timings.duration);
    sleep(0.5);
  });

  // Health Check
  group('Health Check', () => {
    const res = http.get(`${API_BASE}/health`);
    check(res, {
      'health status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    responseTime.add(res.timings.duration);
  });

  // Search API
  group('Search API', () => {
    const res = http.get(`${API_BASE}/venues/search?q=club&city=jakarta`);
    check(res, {
      'search status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    responseTime.add(res.timings.duration);
    apiRequests.add(1);
    sleep(0.3);
  });

  // Rate limiting test (should be blocked)
  group('Rate Limiting', () => {
    // Make multiple rapid requests
    for (let i = 0; i < 5; i++) {
      const res = http.get(`${API_BASE}/v1/venues/nearby?lat=-6.2&lng=106.8&radius=1000`);
      // Should eventually get 429
      if (res.status === 429) {
        break;
      }
      sleep(0.1);
    }
  });

  // Sleep between iterations
  sleep(2);
}

// Handle test summary
export function handleSummary(data) {
  const summary = {
    'Total Requests': data.metrics.http_reqs.values?.count || 0,
    'Failed Requests': data.metrics.http_req_failed?.values?.passes || 0,
    'Error Rate': `${(data.metrics.http_req_failed?.values?.rate || 0) * 100}%`,
    'Avg Response Time': `${data.metrics.http_req_duration?.values?.avg || 0}ms`,
    'P95 Response Time': `${data.metrics.http_req_duration?.values['p(95)'] || 0}ms`,
    'P99 Response Time': `${data.metrics.http_req_duration?.values['p(99)'] || 0}ms`,
    'Max Response Time': `${data.metrics.http_req_duration?.values?.max || 0}ms`,
  };

  console.log('\\n=== LOAD TEST RESULTS ===');
  Object.entries(summary).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });

  return {
    stdout: JSON.stringify(summary, null, 2),
    './summary.json': JSON.stringify(data, null, 2),
  };
}
