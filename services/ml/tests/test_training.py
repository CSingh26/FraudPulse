import json
import tempfile
import unittest
from pathlib import Path
from app.training import train_model


class TrainingTests(unittest.TestCase):
    def test_demo_artifact_documents_chronological_holdout(self):
        with tempfile.TemporaryDirectory() as directory:
            metadata = train_model(None, 300, Path(directory), .7)
            self.assertEqual(metadata.get('split_method'), 'chronological 80/20')
            self.assertEqual(metadata.get('source'), 'DEMO DATA')
            self.assertIn('average_precision', metadata['metrics'])
            self.assertTrue(metadata['model_version'].startswith('demo-'))
            self.assertEqual(json.loads((Path(directory) / 'metadata.json').read_text())['source'], 'DEMO DATA')
