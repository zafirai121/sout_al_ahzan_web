import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bucketKeyOf, playlistAfter, sameRecording, secondsOf } from '../../cloudflare/recordings.js';

test('lengthsReadAsStored', () => {
  assert.equal(secondsOf('11:19'), 679);
  assert.equal(secondsOf('1:02:03'), 3723);
  assert.equal(secondsOf(''), null);
});

test('sameRecordingWithinFiveSecondsOrThreePercent', () => {
  assert.equal(sameRecording('11:19', '11:19'), true);
  assert.equal(sameRecording('16:48', '16:47'), true);
  assert.equal(sameRecording('4:00', '4:10'), false);
  assert.equal(sameRecording('60:00', '61:30'), true);
  assert.equal(sameRecording('0:00', '0:00'), false);
  assert.equal(sameRecording(null, '4:00'), false);
});

test('playlistTakesTheKeptOneInItsPlace', () => {
  assert.deepEqual(playlistAfter(['cloud_1', 'cloud_2'], 1, 3), ['cloud_3', 'cloud_2']);
  assert.deepEqual(playlistAfter([2, '1'], 1, 3), [2, '3']);
  // The kept one is there already: the copy just leaves
  assert.deepEqual(playlistAfter(['cloud_1', 'cloud_3'], 1, 3), ['cloud_3']);
  assert.equal(playlistAfter(['cloud_2'], 1, 3), null);
});

test('bucketKeyFromOurLinksOnly', () => {
  assert.equal(bucketKeyOf('https://soutalahzan.com/Muslim_Al_Waeli/%D8%AA.mp3'), 'Muslim_Al_Waeli/ت.mp3');
  assert.equal(bucketKeyOf('https://example.com/a.mp3'), null);
  assert.equal(bucketKeyOf(null), null);
});
