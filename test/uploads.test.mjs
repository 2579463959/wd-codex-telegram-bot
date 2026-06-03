import test from "node:test";
import assert from "node:assert/strict";
import {
  buildUploadCleanupPlan,
  deleteUploadCandidates,
  selectUploadCleanupCandidates,
  shouldRunUploadCleanup
} from "../src/uploads.js";

const now = new Date("2026-06-03T00:00:00.000Z");

function upload(name, ageDays, bytes) {
  return {
    path: `/uploads/${name}`,
    bytes,
    mtimeMs: now.getTime() - ageDays * 86_400_000
  };
}

test("old upload files become cleanup candidates", () => {
  const result = selectUploadCleanupCandidates([upload("old.jpg", 8, 100)], {
    now,
    retentionDays: 7,
    maxBytes: 0
  });
  assert.deepEqual(result.candidates.map((item) => item.path), ["/uploads/old.jpg"]);
});

test("recent upload files are preserved", () => {
  const result = selectUploadCleanupCandidates([upload("recent.jpg", 2, 100)], {
    now,
    retentionDays: 7,
    maxBytes: 0
  });
  assert.deepEqual(result.candidates, []);
  assert.deepEqual(result.preserved.map((item) => item.path), ["/uploads/recent.jpg"]);
});

test("max byte pressure selects oldest uploads first", () => {
  const result = selectUploadCleanupCandidates([
    upload("new.jpg", 1, 600),
    upload("old.jpg", 3, 600),
    upload("older.jpg", 5, 600)
  ], {
    now,
    retentionDays: 30,
    maxBytes: 1000
  });
  assert.deepEqual(result.candidates.map((item) => item.path), ["/uploads/older.jpg", "/uploads/old.jpg"]);
});

test("dry-run upload cleanup plan summarizes candidates without deleting", () => {
  const plan = buildUploadCleanupPlan([upload("old.jpg", 8, 100)], {
    now,
    retentionDays: 7,
    maxBytes: 0,
    dryRun: true
  });
  assert.equal(plan.dryRun, true);
  assert.equal(plan.candidates.length, 1);
  assert.equal(plan.candidateBytes, 100);
});

test("deleteUploadCandidates does not remove files in dry-run mode", async () => {
  const removed = [];
  const result = await deleteUploadCandidates([{ path: "/uploads/old.jpg", bytes: 100 }], {
    dryRun: true,
    removeFile: async (file) => removed.push(file)
  });
  assert.deepEqual(removed, []);
  assert.equal(result.deleted, 0);
  assert.equal(result.skipped, 1);
});

test("deleteUploadCandidates rejects candidates outside the upload directory", async () => {
  const removed = [];
  const result = await deleteUploadCandidates([{ path: "/etc/passwd", bytes: 100 }], {
    dryRun: false,
    rootDir: "/uploads",
    removeFile: async (file) => removed.push(file)
  });
  assert.deepEqual(removed, []);
  assert.equal(result.deleted, 0);
  assert.equal(result.skipped, 1);
  assert.equal(result.errors[0].message, "upload cleanup candidate is outside upload directory");
});

test("upload cleanup scheduler requires both cleanup and upload cleanup enabled", () => {
  assert.equal(shouldRunUploadCleanup({ cleanupEnabled: true, uploadCleanupEnabled: true }), true);
  assert.equal(shouldRunUploadCleanup({ cleanupEnabled: false, uploadCleanupEnabled: true }), false);
  assert.equal(shouldRunUploadCleanup({ cleanupEnabled: true, uploadCleanupEnabled: false }), false);
});
