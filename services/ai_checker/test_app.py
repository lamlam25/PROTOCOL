import unittest

from app import classify_scores


class ClassifyScoresTests(unittest.TestCase):
    def test_likely_ai(self):
        status, ai_score, real_score = classify_scores(
            [
                {"label": "FAKE", "score": 0.93},
                {"label": "REAL", "score": 0.07},
            ]
        )
        self.assertEqual(status, "likely_ai")
        self.assertEqual(ai_score, 0.93)
        self.assertEqual(real_score, 0.07)

    def test_likely_real(self):
        status, _, _ = classify_scores(
            [
                {"label": "FAKE", "score": 0.04},
                {"label": "REAL", "score": 0.96},
            ]
        )
        self.assertEqual(status, "likely_real")

    def test_inconclusive(self):
        status, _, _ = classify_scores(
            [
                {"label": "artificial", "score": 0.52},
                {"label": "human", "score": 0.48},
            ]
        )
        self.assertEqual(status, "inconclusive")


if __name__ == "__main__":
    unittest.main()
