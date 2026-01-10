import unittest

from app.scoring import score_transaction


class TestScoring(unittest.TestCase):
  def test_score_output_shape(self):
    result = score_transaction(
      amount=1200.5,
      channel='ECOM',
      entry_mode='MANUAL',
      card_country='US',
      ip_country='NG',
      merchant_country='GB',
      merchant_category='electronics',
      threshold=0.7,
    )

    self.assertGreaterEqual(result.score, 0)
    self.assertLessEqual(result.score, 1)
    self.assertIn(result.label, ['FRAUD', 'LEGIT'])
    self.assertIsInstance(result.top_features, list)
    self.assertGreaterEqual(len(result.top_features), 1)
    self.assertIsInstance(result.recommended_action, str)


if __name__ == '__main__':
  unittest.main()
