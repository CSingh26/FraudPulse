import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.research import demo_csv


class ResearchApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_demo_and_user_import_workflow(self):
        demo = self.client.get('/research/demo')
        self.assertEqual(demo.status_code, 200)
        self.assertIn('transaction_id', demo.text)
        response = self.client.post('/research/analyze', json={'csv': demo.text})
        self.assertEqual(response.status_code, 200, response.text)
        result = response.json()
        self.assertEqual(result['metadata']['source'], 'USER CSV')
        self.assertEqual(result['metadata']['rows'], 500)
        self.assertEqual(len(result['transactions']), 100)
        self.assertIn('pr_auc', result['test'])
        explicit_demo = self.client.post('/research/demo', json={})
        self.assertEqual(explicit_demo.status_code, 200)
        self.assertEqual(explicit_demo.json()['metadata']['source'], 'DEMO DATA — synthetic seed 42')

    def test_invalid_upload_does_not_fallback(self):
        response = self.client.post('/research/analyze', json={'csv': 'not,the,schema\n1,2,3'})
        self.assertEqual(response.status_code, 422)
        self.assertIn('Missing columns', response.json()['detail'])
        self.assertEqual(self.client.post('/research/analyze', json={'csv': demo_csv(), 'review_cost': -1}).status_code, 422)
        self.assertEqual(self.client.post('/research/analyze', json={'csv': 'x' * 2000001}).status_code, 422)
